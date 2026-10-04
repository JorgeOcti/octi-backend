# App móvil — Envío de unidades (Fase 2)

Acompaña a [`01-prd.md`](./01-prd.md) y [`02-technical-plan.md`](./02-technical-plan.md).

**Decisión:** este flujo **no es offline-first**. Lo que sigue explica por qué, y
cómo hacerlo igual usable en un patio con mala señal.

---

## 1. Por qué offline no sirve acá

Las reglas R2 y R3 del PRD son reglas de **exclusión mutua**:

- R2 — una patente abierta pertenece a una sola company cliente.
- R3 — una unidad no puede estar en dos envíos abiertos.

Un dispositivo sin conexión **no puede decidir eso**. No sabe qué cargó el
operario de al lado hace dos minutos. Si lo dejamos resolver localmente, la app
le dice "cargada" al operario y el servidor la rechaza más tarde — con el camión
posiblemente ya en la ruta. Eso es peor que pedir señal: convierte un error
inmediato y corregible en un problema de inventario.

Hay un segundo motivo, igual de concreto: **cambiar el esquema de Realm borra los
formularios offline de los usuarios**, y el codegen de retrofit está roto (hay que
editar el `.g.dart` a mano). Meter este flujo en Realm cuesta caro y arriesga datos
que no tienen nada que ver con esta feature.

**Precedente en la app:** escanear un VIN ya es online hoy —
`@POST("/api/v1/check-vin/")` en `remote_client.dart`. Pedir red para identificar
una unidad no es un comportamiento nuevo.

## 2. La idea: separar por necesidad de consistencia

No todas las operaciones necesitan la misma garantía. Las que tienen contención
son chicas; las pesadas no tienen contención.

| Paso | ¿Contención? | Payload | Modo |
|---|---|---|---|
| Abrir / unirse a una patente | Sí (R2) | ~200 B | **Online, bloqueante** |
| Reclamar un VIN para la patente | Sí (R3) | ~200 B | **Online, bloqueante** |
| Responder el formulario de la unidad + fotos | **No** | MBs | **Encolado, reintentable** |
| Responder el formulario de salida + fotos | **No** | MBs | **Encolado, reintentable** |
| Registrar la salida | Sí | ~200 B | **Online, bloqueante** |

La clave está en la tercera fila. Una vez que el servidor confirmó el reclamo del
VIN, **esa unidad ya es de este envío**: nadie más la puede tomar. Entonces las
respuestas y las fotos pueden subir después, con reintentos, sin riesgo de
conflicto.

Esto encaja con cómo falla la red en el patio: el backend responde en menos de un
segundo; lo que falla son las fotos de varios MB. Separarlas significa que el
operario sólo necesita señal para el "clic" chico, no para la parte pesada.

### Consecuencia práctica

Sin señal, el operario **no puede agregar unidades nuevas** — y la app lo dice
así, sin rodeos. Pero **sí puede seguir trabajando** sobre las unidades que ya
reclamó: completar formularios, sacar fotos, revisar. Eso se encola y sube solo.

## 3. El caso que ya nos mordió: respuesta perdida

En producción vimos exactamente esto en otro flujo: el backend respondió **200 en
706 ms**, guardó todo correctamente, y la app igual mostró *"Error al enviar el
formulario"* porque no llegó a ver la respuesta.

Si eso pasa al reclamar un VIN y el operario reintenta, sin protección recibiría
un **409 "unidad ya cargada"** — por él mismo. Confuso y bloqueante.

**Solución, sin infraestructura nueva:** el 409 incluye quién y dónde.

```json
{ "code": "UNIT_ALREADY_LOADED",
  "shipmentId": "...", "plate": "ABCD12",
  "loadedBy": { "_id": "...", "name": "..." } }
```

La app compara: si `shipmentId` es el envío en el que está y `loadedBy` es el
usuario actual, **lo trata como éxito** y sigue. Si no, muestra el conflicto real
("ya la cargó Pedro en la patente XYZ99").

Con eso un reintento después de un timeout ambiguo es seguro e idempotente, sin
necesitar claves de idempotencia ni estado extra en el servidor.

## 4. El servidor manda el estado completo

Cada respuesta de reclamo devuelve **el estado actual del envío**, no sólo la
unidad agregada: patente, company cliente, y la lista de unidades cargadas con
quién las cargó.

Así el dispositivo se autocorrige. Si otro operario cargó cinco unidades mientras
éste no miraba, aparecen solas en la próxima respuesta. La app no tiene que
reconciliar nada: pinta lo que le llegó.

## 5. Pantallas

> Detalle completo, con el mapeo contra el flujo de desconsolidado:
> [`04-pantallas-app.md`](./04-pantallas-app.md).

1. **Ingresar patente + cliente** — `GET /api/v1/shipments/by-plate/:plate`.
   - Si el envío existe: muestra cliente y lo ya cargado, y entra.
   - Si no existe: pide **company cliente** y datos del camión, y crea con
     `POST /api/v1/shipments`.
   - La lista de clientes **ya viene en el login** (`company.clientCompanies`);
     no hace falta endpoint nuevo. Ver §6 para el ajuste pendiente en Dart.
2. **Envío abierto** — cabecera con patente / cliente / transportista, contador de
   unidades, y la lista de lo cargado (con quién cargó cada una).
   - Botón **Agregar unidad** (requiere señal).
   - Botón **Registrar salida** (requiere señal).
3. **Agregar unidad** — escanear/escribir VIN → `POST /shipments/:id/items`
   reclama la unidad (llamada chica, online) → si sale bien, entra al formulario.
4. **Formulario de la unidad** — reutiliza el motor existente
   (`presentation/views/form/`) y el endpoint existente
   `POST /api/v1/forms/:unitForm` con `shipmentItem` en el body. Encolado.
5. **Registrar salida** — responde el **formulario de salida**
   (`departureForm`, configurable desde el admin) y confirma.
   - El cierre va por `POST /shipments/:id/depart` (chico, online).
   - Las respuestas del formulario de salida van por
     `POST /api/v1/forms/:departureForm` con `shipment` en el body. Encolado.

### Indicadores que no pueden faltar

- Estado de conexión visible mientras se carga.
- Por unidad: *reclamada* · *subiendo* · *lista* · *falló (reintentar)*.
- Contador de pendientes de subida, y aviso claro si se intenta registrar la
  salida con subidas pendientes.

## 6. Qué tocar en el código

| Archivo | Cambio |
|---|---|
| `lib/src/data/remote/remote_client.dart` | 5 endpoints nuevos (by-plate, crear, detalle, reclamar, salida). Las respuestas de formularios reutilizan `answerForm`. **Ojo: el codegen está roto — hay que editar `remote_client.g.dart` a mano.** |
| `lib/src/domain/models/entities/user.dart` | **`user.company` es un `Generic`** (`id`, `name`, `file`, `comment`, `hasDamage`): `clientCompanies` llega del backend pero se descarta al deserializar. Hay que extender el tipo o la app no puede ofrecer el selector de cliente. |
| `lib/src/domain/models/entities/` | Entidades `Shipment`, `ShipmentItem`. |
| `lib/src/presentation/views/shipment/` | Las pantallas de §5 (carpeta nueva). |
| `lib/src/presentation/views/form/` | Sin cambios: se reutiliza tal cual. |
| `lib/src/data/local/models/schemas.dart` | **Sin cambios.** Es deliberado: tocar el esquema Realm borra los formularios offline de los usuarios. |

Para la cola de subida de formularios: usar el mecanismo que ya tiene la app para
reintentar envíos, no inventar uno nuevo. Hay que mapearlo antes de estimar —
está en §8.

## 7. Qué se gana con esto

- **No hay reconciliación.** Era el punto más riesgoso del PRD y desaparece: el
  servidor decide siempre, en el momento, y el operario se entera en el acto.
- **No se toca Realm.** Cero riesgo para los formularios offline existentes.
- **Fase 2 se achica bastante**: pantallas + cliente HTTP, sin motor de sync.
- La parte pesada (fotos) sigue siendo tolerante a la red, que es donde la red
  realmente falla.

## 8. Lo que falta definir

1. **~~¿Existe cola de subida reutilizable?~~ Resuelto:** sí. `complete()` ya
   acepta `transmittalItem` / `transmittal` como contexto y asocia el participant;
   se agregan `shipmentItem` / `shipment` igual. La app usa su `answerForm` de
   siempre, con su subida de fotos y reintentos. **No hay que construir cola nueva.**
2. **¿Qué pasa si el operario abandona un envío abierto?** Las unidades reclamadas
   quedan tomadas. ¿Hay un "quitar unidad"? ¿Un vencimiento? (Es la pregunta
   abierta 6 del PRD, y acá pega directo.)
3. **¿Se puede registrar la salida con subidas pendientes?** Propuesta: sí, pero
   avisando — la unidad ya está reclamada, las respuestas llegan después. Hay que
   confirmarlo con operaciones.
5. **¿La Tarja necesita las respuestas del formulario de salida?** Si el PDF tiene
   que mostrar, por ejemplo, el número de sello o las fotos del camión, una Tarja
   generada antes de que suba ese formulario saldría incompleta. Si es así, hay
   que bloquear la descarga hasta que el participant de salida exista.
4. **Sin señal en todo el patio:** si no hay red en absoluto, este flujo no se
   puede usar. ¿Es aceptable operativamente, o hace falta un plan B en papel?

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Patio sin señal → no se puede cargar | Payload mínimo en los pasos online; medir cobertura real antes de desplegar |
| Respuesta perdida tras un reclamo exitoso | 409 con `loadedBy` + `shipmentId` (§3) |
| Unidades reclamadas y abandonadas | Pendiente de definir (§8.2) |
| Codegen de retrofit roto | Editar `remote_client.g.dart` a mano, con revisión |
