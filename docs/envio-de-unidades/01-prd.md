# PRD — Envío de unidades

**Estado:** borrador para revisión
**Fecha:** 2026-10-04
**Fase 1:** API + web · **Fase 2:** app móvil (andes-offline, Flutter)

---

## 1. Problema

Las companies *handler* (CIS, MEDLOG, …) operan unidades que pertenecen a otras
companies cliente. Hoy existen flujos para **recibir** e **inventariar** esas
unidades, pero no hay un proceso propio para **despacharlas al cliente**: el
patio carga camiones y esa carga no queda registrada como un envío con su
documento asociado.

La consecuencia práctica: el cliente no tiene forma de ver qué salió, en qué
camión y con qué estado, y el handler no tiene un comprobante por camión
equivalente a la Tarja que ya existe para contenedores.

## 2. Qué construimos

Un proceso llamado **Envío de unidades**: el handler carga un camión
(identificado por su **patente**), le asocia unidades por **VIN**, responde un
formulario por cada unidad, y al registrar la salida del camión el envío queda
**despachado**. El resultado es visible en la web para handler y cliente, con un
**PDF tipo Tarja** por camión.

**La carga se hace en la app móvil.** La API y la web muestran el avance y el
resultado.

## 3. Usuarios

| Rol | Qué hace |
|---|---|
| Operario del handler | Carga unidades a una patente desde la app. Varios operarios trabajan en paralelo. |
| Supervisor del handler | Ve los envíos en la web, descarga la Tarja. |
| Usuario de la company cliente | Ve **solo los envíos de su propia company**, descarga la Tarja. |

## 4. Reglas de negocio

Estas son el corazón de la feature. Son también de donde salen los casos
difíciles.

**R1 — El envío se identifica por la patente.** No por el operario ni por el
dispositivo. Si dos operarios cargan la misma patente, suman al **mismo** envío
abierto.

**R2 — Una patente abierta pertenece a una sola company cliente.** Si un operario
intenta cargar a la patente una unidad de otra company cliente, se rechaza con un
error explícito que nombre la company a la que ya está asignado el camión.

**R3 — Una unidad no puede estar en dos envíos abiertos.** Si un operario intenta
cargar un VIN que ya fue cargado (por él o por otro), se rechaza indicando
patente y quién lo cargó.

**R4 — Cada unidad cargada responde un formulario.** Se registra un `Participant`
por unidad, igual que en el resto de los flujos de revisión.

**R4.b — Registrar la salida también responde un formulario.** Hay dos
formularios, ambos **configurables desde el admin** (agregar, editar o quitar
preguntas sin tocar código):

| Formulario | Cuándo | Se asocia a |
|---|---|---|
| De unidad | por cada unidad cargada | el ítem del envío |
| De salida | una vez, al cerrar el camión | el envío |

Es el mismo patrón que ya usa el contenedor (`openForm` / `finishForm` en
`Inventory`).

**R5 — El envío se cierra al registrar la salida del camión.** El cierre es
automático en ese evento, no una acción aparte. Una vez cerrado:
- no se pueden agregar ni quitar unidades,
- las unidades quedan con estado **despachado**,
- se habilita la Tarja.

**R6 — Al cerrarse, cada unidad escribe un `History` con status `inTransit`.** Es
el mismo estado que usan los flujos actuales, de modo que la unidad aparece como
despachada en las pantallas que ya existen (Vista cliente Vehículo) sin tocar
esas consultas.

**R6.b — Al despachar, la unidad deja de estar en manos del handler.** Se limpia
`handlerCompany` y se registra el despacho en `Car.dispatches` (envío, handler,
usuario, fecha). Dos consecuencias:
- la unidad **no se puede volver a despachar** — ya no cumple el criterio de
  elegibilidad;
- el **cliente la sigue viendo** en su Vista cliente Vehículo: hay que ajustar
  tres consultas para que no dependan de que `handlerCompany` exista.

Volver a despacharla requiere que la unidad vuelva a manos del handler, y hoy
eso solo pasa al importarla. Ver el plan técnico §3.c.

**R7 — Se puede bajar una unidad del camión, y queda registrado.** Mientras el
envío está abierto, cualquier usuario del handler puede sacar una unidad de la
carga. Es una **baja lógica**: se guarda quién la bajó y cuándo, y la unidad
queda disponible para cargarse en otro camión. Nunca se borra el registro.

**R8 — Un camión que se queda sin unidades se cancela.** Si se bajan todas las
unidades que alguna vez se cargaron, el envío pasa a **cancelado**: desaparece
del listado de la app y en la web aparece como cancelado, mostrando las unidades
que se bajaron y quién las bajó.

**R9 — Cualquier usuario del handler puede continuar o cerrar un camión.** No hay
dueño: el que llega sigue la carga o registra la salida, aunque la haya empezado
otro.

**R10 — Después de registrar la salida no se modifica nada.** Ni unidades, ni
cliente, ni datos del camión. Por eso el cliente se elige **al principio**, y el
camión solo admite unidades de ese cliente.

## 5. Alcance

### Entra en Fase 1 (API + web)

- Modelo de datos y endpoints para crear/consultar envíos y sus unidades.
- Endpoints que la app móvil va a consumir en Fase 2 (se construyen ahora para
  poder probarlos).
- Pantalla web de envíos: listado con datos del camión, filas expandibles con el
  detalle de la carga.
- PDF tipo Tarja por camión, descargable por handler y cliente.
- Escritura del `History` al cerrar.

### Entra en Fase 2 (app móvil)

- Flujo de carga: patente → datos del camión → agregar unidades por VIN →
  formulario por unidad → registrar salida.
- Manejo de los rechazos R2/R3 con mensajes accionables.
- Cola de subida para formularios y fotos de unidades ya reclamadas (§7).

### No entra

- Recepción de la carga en destino (confirmación por parte del cliente).
- Reapertura de envíos cerrados.
- Integración con el módulo de transmittals / requests existente.
- Notificaciones por email.
- Edición del formulario de unidad después de cerrado el envío.

## 6. Flujos

### 6.1 Carga (app)

1. El operario ingresa la **patente**.
2. Si no hay envío abierto para esa patente, se crea uno y se piden los datos del
   camión (transportista, chofer, …) y la company cliente.
3. Si ya hay uno abierto, se une a ese envío y se muestra qué lleva cargado y
   para qué cliente.
4. Agrega una unidad por **VIN**:
   - se valida R2 (misma company cliente) y R3 (no cargada en otro envío),
   - responde el formulario de la unidad,
   - la unidad queda asociada al envío.
5. Repite 4 hasta terminar.
6. **Registra la salida del camión** → el envío pasa a despachado (R5, R6).

### 6.2 Consulta (web)

1. El usuario entra a *Envíos de unidades*.
2. Ve el listado: patente, transportista, chofer, company cliente, cantidad de
   unidades, estado, fecha de salida.
3. Expande una fila y ve el detalle: VIN, marca/modelo, quién la cargó, cuándo, y
   el resultado del formulario.
4. Descarga el **PDF Tarja** del camión.

## 7. Conectividad (decidido: sin offline)

**Este flujo no es offline-first.** Las reglas R2 y R3 son de exclusión mutua y
un dispositivo sin conexión no puede resolverlas: dos operarios sin señal pueden
cargar el mismo VIN y ninguno puede saberlo. Dejar que el dispositivo lo decida
convierte un error inmediato y corregible en un problema de inventario con el
camión ya en la ruta.

El diseño separa las operaciones por necesidad de consistencia: los pasos con
contención (abrir patente, reclamar VIN, registrar salida) son **online y
chicos**; el formulario y las fotos de una unidad **ya reclamada** se encolan y
reintentan, porque esa unidad ya no la puede tomar nadie más.

Detalle completo en [`03-app-movil.md`](./03-app-movil.md).

## 8. Criterios de aceptación

- [ ] Dos operarios cargando la misma patente suman al mismo envío.
- [ ] Cargar a una patente una unidad de otra company cliente se rechaza, y el
      mensaje nombra la company a la que está asignada la patente.
- [ ] Cargar un VIN ya cargado se rechaza, y el mensaje indica patente y operario.
- [ ] Cada unidad cargada queda con su `Participant` asociado.
- [ ] Registrar la salida responde el formulario de salida y queda asociado al envío.
- [ ] Editar los formularios desde el admin cambia lo que pide la app en el
      siguiente envío, sin desplegar código.
- [ ] Registrar la salida cierra el envío; después de eso no se aceptan cargas.
- [ ] Al cerrar, cada unidad genera un `History` con status `inTransit`.
- [ ] La web lista los envíos con los datos del camión y permite expandir el
      detalle de la carga.
- [ ] Un usuario de una company cliente ve únicamente los envíos de su company.
- [ ] Bajar una unidad la deja disponible para otro camión y registra quién la bajó.
- [ ] Bajar la última unidad cancela el envío: no aparece más en la app y en la web
      figura como cancelado con las unidades que se bajaron.
- [ ] Un operario puede continuar y cerrar un camión empezado por otro.
- [ ] Después de registrar la salida, ningún dato del envío se puede modificar.
- [ ] Una unidad despachada no se puede volver a cargar en otro camión.
- [ ] Una unidad despachada **sigue visible** para el cliente en su Vista cliente
      Vehículo, su resumen y su Excel.
- [ ] Queda registrado quién la despachó, desde qué handler y cuándo.
- [ ] La Tarja se descarga tanto por el handler como por el cliente, y muestra el
      chofer, los daños por unidad y la foto del camión cargado.
- [ ] La Tarja no se puede descargar mientras falte el formulario de salida.
- [ ] El listado y el detalle responden en tiempos razonables con el volumen real
      (ver restricciones de DocDB en el plan técnico).

## 9. Preguntas abiertas

Ordenadas por cuánto cambian el diseño.

1. **Cobertura en el patio:** si no hay señal en algunas zonas, este flujo no se
   puede usar ahí. ¿Es aceptable operativamente o hace falta un plan B?
2. **"Registrar la salida":** ¿es una acción explícita del operario, o se dispara
   al generar la Tarja? ¿Puede hacerlo cualquier operario que haya cargado?
3. **Patente:** ¿texto libre o catálogo? ¿Se valida formato chileno?
4. **Datos del camión:** ¿se reutiliza el modelo `Carrier` existente? ¿El chofer
   es un `User` del sistema o datos sueltos (nombre + RUT)?
5. **~~¿El formulario es configurable?~~ Resuelto:** sí, dos formularios
   configurables por kind (`shipmentUnit`, `shipmentDeparture`), igual que el
   contenedor. Queda por definir si se resuelven por company handler o por team.
6. **~~¿Se puede quitar una unidad?~~ Resuelto:** sí, baja lógica con registro de
   quién la bajó (R7), y si era la última el envío se cancela (R8). Queda por
   definir si la baja pide un motivo.
7. **~~Origen de las unidades~~ Resuelto:** `company = clientCompany` y
   `handlerCompany = company del usuario`. Sin filtro de estado ni sucursal — una
   unidad ya despachada se puede volver a cargar (devoluciones).
8. **~~Tarja~~ Resuelto:** formato propio. Encabezado (patente, camión, handler,
   cliente, responsable, fecha, **chofer**), lista de unidades con sus daños, y
   **foto del camión cargado**. Chofer y foto salen del formulario de salida.
9. **~~Permisos~~ Resuelto:** cualquier usuario de la company handler. Sin permiso
   nuevo.

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Patio sin señal | Alto — no se pueden agregar unidades | Payload mínimo en los pasos online; medir cobertura antes de desplegar (§7) |
| Rendimiento en DocDB | Alto — ya nos pasó en la vista de stock | Índices desde el diseño; paginar antes de hidratar (plan técnico §6) |
| Duplicar el flujo de transmittals | Medio — dos procesos parecidos conviven | Modelo nuevo y separado, decisión tomada; documentar cuándo usar cada uno |
| Carga de un cliente equivocado detectada tarde | Medio | R2 validada en el servidor en cada carga, no solo al cerrar |

---

Plan técnico: [`02-technical-plan.md`](./02-technical-plan.md)
