# Pantallas de la app — Envío de unidades

Detalle de §5 de [`03-app-movil.md`](./03-app-movil.md).

**Criterio de diseño: espejar el flujo de desconsolidado.** El operario ya lo
conoce, y en el código casi todas las piezas existen — se cambia el padre
(inventario → envío), no la mecánica.

---

## 1. Equivalencias con desconsolidado

| Desconsolidado (hoy) | Envío de unidades |
|---|---|
| Ítem de menú (`selection_menu.dart`) | Nuevo ítem **"Enviar unidades"**, solo si la company es handler |
| `inventory_view.dart` — elegir inventario | Elegir cliente + patente, o retomar una patente abierta |
| `inventory_container_view.dart` — VIN → form → volver | Idéntico: VIN → form → *"Unidad cargada exitosamente"* |
| `UnitsInContainerInfo` / `UnitInContainerTile` | Lista de unidades cargadas al camión, con contador |
| `inventory_container_finish_view.dart` — cierre con form | Registrar salida con el `departureForm` |

En la práctica, Fase 2 es **copiar el flujo de desconsolidado y cambiarle el
padre**. Eso baja bastante el riesgo de la estimación.

## 2. Menú principal

Nuevo ítem **"Enviar unidades"** en `ConcreteSelectionMenu`
(`lib/src/presentation/views/main/selection_menu.dart`), al lado de *Revisión* e
*Hoja de vida*.

**Visible solo si la company del usuario es handler.**

> **Bloqueante:** `user.company` está tipado como `Generic` (`id`, `name`, `file`,
> `comment`, `hasDamage`). **No tiene `handler` ni `clientCompanies`** — ambos
> llegan del backend y se descartan al deserializar. Sin arreglar eso no se puede
> ni mostrar el ítem condicionalmente ni ofrecer el selector de cliente. Es el
> mismo arreglo para las dos cosas.

Hace falta además un ícono (`assets/images/icons/`) y las cadenas en los tres
`.arb` (`app_es`, `app_en`, `app_pt`).

## 3. Pantalla: elegir patente

Lo primero al entrar.

```
┌──────────────────────────────────┐
│  Enviar unidades                 │
│                                  │
│  Cliente    [ ▾ elegir        ]  │  ← user.company.clientCompanies
│  Patente    [ ABCD12          ]  │
│                                  │
│           [ Comenzar carga ]     │
│                                  │
│                        ( 🚚 3 )  │  ← botón flotante: patentes en curso
└──────────────────────────────────┘
```

- **El cliente se elige primero.** El botón flotante muestra solo las patentes en
  curso **de ese cliente, en la sucursal del operario** —
  `GET /api/v1/shipments?status=open&clientCompany=…&venue=…`. Al tocar una, entra
  directo a esa carga, sin tipear la patente.
- Elegir el cliente al principio es lo que hace innecesario corregirlo después:
  el camión solo admite unidades de ese cliente (R10).
- Al confirmar:
  - si la patente ya tiene envío abierto → entra a esa carga (y si el cliente
    elegido no coincide, lo avisa antes de entrar),
  - si no → pide los datos del camión y lo crea.

## 4. Pantalla: carga del camión

El corazón del flujo. Misma mecánica que `inventory_container_view.dart`.

```
┌──────────────────────────────────┐
│  ABCD12 · SAIC MOTOR             │  ← patente · cliente
│                                  │
│      [  Ingresar VIN  ]          │
│                                  │
│  [ 📋 Unidades cargadas  (7) ]   │  ← contador, abre la lista
│                                  │
│  [ Volver ]   [ Finalizar ]      │
└──────────────────────────────────┘
```

**Ciclo de carga** (igual que desconsolidar):

1. Ingresar VIN → `POST /shipments/:id/items` reclama la unidad.
2. Si el reclamo sale bien → formulario de la unidad (`unitForm`).
3. Al terminar → **"Unidad cargada exitosamente"** y vuelve a esta pantalla.
4. El contador sube. Repetir.

**Si el reclamo falla**, el mensaje tiene que ser accionable, no genérico:

| Caso | Mensaje |
|---|---|
| Ya cargada en otra patente | *"Esta unidad ya fue cargada en la patente XYZ99 por Pedro Soto."* |
| Es de otro cliente | *"Esta unidad es de DERCO. El camión está cargando para SAIC MOTOR."* |
| Ya cargada por mí, acá | Se trata como éxito (ver §3 de `03-app-movil.md`) |

**Botón "Unidades cargadas (n)"** — abre la lista de lo que lleva el camión: VIN,
marca/modelo, quién la cargó y el estado de subida de su formulario. Espeja
`UnitsInContainerInfo` / `UnitInContainerTile`.

Cada fila tiene además **"Bajar del camión"** (R7): la unidad sale de la carga y
queda disponible para otro camión, pero el registro queda — quién la bajó y
cuándo. Conviene pedir confirmación, porque si se baja la última el envío se
**cancela** (R8) y el operario vuelve al inicio.

**"Volver"** deja el envío abierto: otro operario puede seguir cargando esa misma
patente. No cierra nada, y el camión sigue apareciendo en el botón flotante.
Cualquier operario puede retomarlo o cerrarlo (R9).

## 5. Pantalla: finalizar / registrar salida

Espeja `inventory_container_finish_view.dart`.

1. Resumen: patente, cliente, cantidad de unidades.
2. Responde el **formulario de salida** (`departureForm`, configurable desde el
   admin).
3. Al confirmar → **"Entrega hecha"** → vuelve al menú principal
   (`Navigator.popUntil`, como hace hoy la vista de cierre de contenedor).

Orden de las llamadas, que importa:

- `POST /shipments/:id/depart` sale **primero** y es chico: cierra el envío de
  forma inmediata y confiable.
- Las respuestas del formulario de salida van por el camino encolado
  (`POST /api/v1/forms/:departureForm` con `shipment`), igual que las fotos.

Así el camión queda cerrado aunque la subida del formulario demore. Ver la
pregunta abierta sobre si la Tarja puede emitirse antes de que ese formulario
llegue.

## 6. Qué hay que construir

| Pieza | Esfuerzo | Nota |
|---|---|---|
| Ítem de menú + ícono + l10n | Chico | Depende del arreglo de `Generic` |
| Pantalla elegir patente + botón flotante | Medio | Sin equivalente directo; lo más nuevo |
| Pantalla de carga | Chico-medio | Copia de `inventory_container_view` |
| Lista de unidades cargadas | Chico | Copia de `UnitsInContainerInfo` |
| Pantalla de finalizar | Chico | Copia de `inventory_container_finish_view` |
| Entidades + endpoints en `remote_client` | Chico | Codegen roto: editar `.g.dart` a mano |
| **Arreglo de `user.company`** | Chico | **Bloquea el menú y el selector de cliente** |

## 7. Preguntas que salen de las pantallas

1. **¿La baja de una unidad pide motivo?** Si se registra quién la bajó, un motivo
   corto puede ahorrar discusiones después.
2. **¿Qué unidades son cargables?** ¿Cualquiera del cliente, o solo las que estén
   en stock en esa sucursal y no despachadas? Define la validación del reclamo.
3. **¿Hace falta ver los envíos ya cerrados desde la app**, o eso es solo web?
4. **¿Qué pasa si vuelve al menú con unidades sin subir?** Propuesta: se sigue
   subiendo en segundo plano y se avisa con un contador de pendientes.
