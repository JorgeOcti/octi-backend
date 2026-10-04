# Plan técnico — Envío de unidades

Acompaña a [`01-prd.md`](./01-prd.md). Fase 1 = API + web.

---

## 1. Decisiones ya tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| Modelo | **Nuevo** (`Shipment` + `ShipmentItem`), espejando `Transmittal` | `Transmittal` está atado a `request`/`requestItem`; el ciclo de vida, el scoping por company cliente y la regla de concurrencia son distintos. Mezclarlos pone en riesgo un flujo que ya está en producción. |
| Estado de la unidad | Escribe `History` con `inTransit` | Es el estado que ya consumen las pantallas actuales (Vista cliente Vehículo). No hay que tocar el enum ni las consultas existentes. |
| Cierre | Automático al registrar la salida del camión | Menos pasos para el operario en patio. |

## 2. Modelo de datos

### `Shipment` (`src/distribution/models/shipment.model.ts`)

```
_id
team                ObjectId → Team          (scoping estándar)
handlerCompany      ObjectId → Company       (quien despacha)
clientCompany       ObjectId → Company       (dueño de las unidades)  [R2]
plate               String                   (patente, normalizada)
transporter { carrier → Carrier, driverName, driverRut, phone }
venue               ObjectId → Venue         (desde dónde sale)
unitForm            ObjectId → Form          (se responde por cada unidad)  [R4]
departureForm       ObjectId → Form          (se responde al registrar salida)
participant         ObjectId → Participant   (respuesta del formulario de salida)
status              'open' | 'shipped' | 'cancelled'
createdBy           ObjectId → User
shippedAt           Date
shippedBy           ObjectId → User
cancelledAt         Date                     (se le sacaron todas las unidades)
itemsEverLoaded     Number                   (cuántas se cargaron alguna vez)
observation         String
timestamps
```

### `ShipmentItem` (`src/distribution/models/shipmentItem.model.ts`)

```
_id
shipment            ObjectId → Shipment
team                ObjectId → Team
car                 ObjectId → Car
participant         ObjectId → Participant   (respuesta del formulario) [R4]
loadedBy            ObjectId → User
loadedAt            Date
status              'loaded' | 'removed' | 'shipped'   (controla el índice único) [R3]
removedAt           Date                     (baja lógica, nunca se borra)
removedBy           ObjectId → User          (queda el registro de quién la bajó)
timestamps
```

### Índices (definirlos **ahora**, no después)

```js
shipmentSchema.index({ team: 1, status: 1, createdAt: -1 });   // listado web
shipmentSchema.index({ clientCompany: 1, createdAt: -1 });     // vista del cliente
shipmentSchema.index({ plate: 1, status: 1 });                 // buscar el envío abierto [R1]
shipmentSchema.index({ clientCompany: 1, venue: 1, status: 1 }); // trucks del cliente en la sucursal
shipmentItemSchema.index({ shipment: 1 });                     // detalle / expandible
shipmentItemSchema.index({ car: 1 });                          // historial de la unidad
shipmentItemSchema.index({ car: 1 }, { unique: true,
  partialFilterExpression: { status: 'loaded' } });            // [R3] verificado en DocDB 5.0.0
```

> Lección de la vista de stock: `{ inventory: 1, car: 1 }` no servía para buscar
> por `car` porque `inventory` es el prefijo. Un índice por cada forma de
> consulta real, no por cada campo.

## 3. Las dos reglas de exclusión (R2 y R3)

Son el punto técnico delicado. **No alcanza con validar y después escribir**:
dos requests simultáneas pasan ambas la validación.

### R3 — una unidad en un solo envío abierto

**Verificado contra DocDB 5.0.0 (cluster `andes-dev-docdb`, 2026-10-04).**
`partialFilterExpression` **sí está soportado y sí se respeta** — no solo se
acepta la opción, el motor la honra. Probado: con
`{ car: 1 } unique partialFilterExpression: { status: 'loaded' }`, insertar el
mismo `car` con otro status pasa, y un segundo `loaded` con el mismo `car` se
bloquea con `code=11000`.

Entonces **no hace falta campo centinela**. Se resuelve con el índice directo:

```js
shipmentItemSchema.index(
  { car: 1 },
  { unique: true, partialFilterExpression: { status: 'loaded' } }
);
```

Con `ShipmentItem.status`:

| status | Cuándo | ¿Bloquea la unidad? |
|---|---|---|
| `loaded` | cargada en un camión abierto | **sí** |
| `removed` | la bajaron del camión (R7) | no — queda libre otra vez |
| `shipped` | el camión salió (R5) | no — el re-envío lo impide `handlerCompany` (§3.c) |

El lock se libera en las dos transiciones, así que una unidad bajada vuelve a
estar disponible al instante y una despachada no queda trabada por este índice.

> **Cuidado con `null`.** También se probó un índice `unique + sparse` sobre un
> campo centinela: funciona, **pero dos documentos con el campo en `null`
> chocan** (`sparse` solo ignora el campo *ausente*, no el `null`). Si alguna vez
> se vuelve a esa variante, liberar siempre con `$unset`, nunca asignando `null`
> — el segundo registro que se libere fallaría con duplicate key.

### R2 — una patente, una company cliente

Se resuelve al **obtener o crear** el envío abierto, de forma atómica:

```js
Shipment.findOneAndUpdate(
  { plate, status: 'open', team },
  { $setOnInsert: { clientCompany, handlerCompany, ... } },
  { upsert: true, new: true }
)
```

Si el documento devuelto tiene un `clientCompany` distinto al que se quiere
cargar → rechazo con el nombre de la company. Nunca se decide en el cliente.

> Requiere índice `{ plate: 1, status: 1 }` (arriba). Sin él el upsert hace
> collection scan en cada carga.

## 3.b Formularios configurables por etapa

Mismo patrón que ya usa el contenedor: `Inventory` tiene `unitForm`,
`contentForm`, `openForm` y `finishForm`, y `KindForm` tiene kinds por etapa
(`openContainer`, `closeGeneralContainer`, …). El envío hace lo mismo con dos:

| Form | Cuándo se responde | Se asocia a |
|---|---|---|
| `unitForm` | por cada unidad cargada | `ShipmentItem.participant` |
| `departureForm` | una vez, al registrar la salida | `Shipment.participant` |

**Kinds nuevos en `KindForm`:** `shipmentUnit` y `shipmentDeparture`.

**Cómo se resuelven:** al crear el envío, por kind — igual que billing resuelve
los aforos (`Form.find({ company, team, kind })`). El admin crea/edita esos
formularios desde el editor de formularios y el cambio toma efecto en los envíos
siguientes, sin tocar código.

> Al agregar los kinds hay que sumarlos también al desplegable del editor de
> formularios superadmin (`views/app/formSuperAdmin.pug`, constante `KIND_FORM`),
> que hoy tiene la lista hardcodeada.

**En `complete()`** ya existe el precedente exacto: acepta `transmittalItem`
(nivel unidad) y `transmittal` (nivel camión). Se agregan `shipmentItem` y
`shipment` de la misma forma — el participant queda asociado y no hace falta
ninguna ruta nueva para responder formularios.

## 3.c Qué unidades se pueden cargar, y cómo se evita el re-envío

Mismo criterio que ya usa la Vista cliente Vehículo para handlers
(`currentCompanyStock`):

```js
{ company: clientCompany, handlerCompany: userCompany }
```

Al despachar, **se limpia `Car.handlerCompany`**: el handler deja de tener la
unidad. Con eso la unidad ya no matchea el filtro y **no se puede volver a
cargar**, sin necesidad de ninguna validación extra.

### `Car.dispatches` — el registro que reemplaza lo que se limpia

Limpiar el campo perdería *qué* handler la tenía. Se guarda en un array, que
además soporta varios ciclos (despacho → devolución → despacho):

```js
dispatches: [{
  shipment:       ObjectId → Shipment,
  handlerCompany: ObjectId → Company,   // quién la tenía al despacharla
  by:             ObjectId → User,
  at:             Date
}]
```

> La trazabilidad no depende solo de esto: `Participant` y `History` guardan cada
> uno su propio `handlerCompany` (`participant.model.ts:431`,
> `history.model.ts:43`), así que los registros históricos conservan el handler
> aunque el campo del Car se limpie.

### Dos mecanismos distintos, no confundirlos

| Qué impide | Mecanismo | Tipo |
|---|---|---|
| Que dos operarios carguen la misma unidad **ahora** | índice único parcial sobre `car` con `status: 'loaded'` | carrera real, la resuelve el motor |
| Que se vuelva a cargar una unidad **ya despachada** | filtro de elegibilidad (handlerCompany limpio) | no hay carrera: el despacho fue hace meses |

### Lo que hay que cambiar al limpiar `handlerCompany`

Barrido completo: 45 referencias en 12 archivos. **Solo 3 se rompen**, las tres
en la rama de *cliente* y todas con `handlerCompany: { $exists: true }`:

| Línea | Función | Qué es |
|---|---|---|
| `inventory.controller.ts:4797` | `currentCompanyStock` | listado de Vista cliente Vehículo |
| `inventory.controller.ts:5175` | `currentCompanyStockSummary` | filtros de naves / viajes / sucursales |
| `inventory.controller.ts:5282` | `currentCompanyStockExport` | Excel |

Sin tocarlas, la unidad despachada **desaparece de la vista del cliente** — justo
cuando más le importa. El filtro pasa a aceptar también las ya despachadas:

```js
{ company: companyId,
  $or: [ { handlerCompany: { $exists: true } },
         { 'dispatches.0': { $exists: true } } ] }
```

**No se rompe nada más:**
- 5 filtros `$or: [{ company }, { handlerCompany }]` siguen matcheando por `company`.
- **Revisión container no se ve afectada**: sus 4 referencias son a
  `req.user.company.handlerCompanies` (relación entre companies), no al campo del Car.
- El resto son definiciones de schema o escrituras en la creación/import.

### Dos cuidados

1. **~~Ese `$or` necesita índice~~ — medido, no hace falta.** Contra DocDB 5.0.0
   con datos reales (SAIC, 4.236 autos de 44.672): el filtro actual y el
   propuesto dan **el mismo plan (IXSCAN) y el mismo tiempo (79 ms)**. El índice
   `company_1` ya acota la consulta, así que el `$or` queda como filtro residual
   sobre un conjunto chico y nunca amplía el scan.
2. **Las devoluciones necesitan un flujo.** Hoy `handlerCompany` solo se setea al
   crear/importar (`car.controller.ts:545`). Si una unidad vuelve y no pasa por
   import, no hay forma de reestablecer la relación y no se puede volver a
   despachar. Confirmar cómo llega una devolución.

## 4. API (Fase 1)

Los endpoints de carga se construyen en Fase 1 aunque la app los consuma en
Fase 2 — así se pueden probar con curl/Postman antes de tocar Flutter.

### Para la app (`/api/v1`, JWT)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/v1/shipments/?status=open&clientCompany=&venue=` | Patentes en curso **del cliente elegido en la sucursal del operario** (botón flotante). |
| `GET` | `/api/v1/shipments/by-plate/:plate` | Busca el envío abierto de una patente. 404 si no hay. **No crea.** [R1] |
| `POST` | `/api/v1/shipments` | Crea el envío: patente + company cliente + datos del camión. Devuelve `unitForm` y `departureForm`. |
| `GET` | `/api/v1/shipments/:id` | Estado actual del envío y sus unidades. |
| `POST` | `/api/v1/shipments/:id/items` | **Solo reclama** la unidad por VIN (payload chico, online). Aplica R2 y R3. Devuelve el item + el auto. |
| `DELETE` | `/api/v1/shipments/:id/items/:itemId` | Quita una unidad de un envío **abierto** (sujeto a pregunta abierta 6). |
| `DELETE` | `/api/v1/shipments/:id/items/:itemId` | **Baja lógica**: `status: 'removed'` + `removedAt`/`removedBy`. Eso libera el índice único y la unidad queda disponible. Si era la última, cancela el envío. [R7][R8] |
| `POST` | `/api/v1/shipments/:id/depart` | Registra la salida → cierra, escribe los `History`. Cualquier usuario del handler puede hacerlo. [R5][R6] |

Las **respuestas de los formularios no tienen endpoint propio**: van por el
`POST /api/v1/forms/:formId` que ya existe, con `shipmentItem` (unidad) o
`shipment` (salida) en el body. Eso reutiliza la subida de fotos y los reintentos
que la app ya tiene.

Códigos de error que la app necesita distinguir (no un 400 genérico):

| Caso | Respuesta |
|---|---|
| Unidad ya cargada en otro envío | `409` + `{ code: 'UNIT_ALREADY_LOADED', plate, loadedBy, shipmentId }` |
| Patente asignada a otro cliente | `409` + `{ code: 'PLATE_OTHER_CLIENT', clientCompany: { _id, name } }` |
| Envío ya cerrado | `409` + `{ code: 'SHIPMENT_CLOSED', shippedAt }` |
| Envío cancelado | `409` + `{ code: 'SHIPMENT_CANCELLED', cancelledAt }` |
| VIN inexistente / de otra company | `404` / `403` |

### Para la web (sesión)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/shipments/` | Listado paginado + filtros (patente, cliente, estado, fechas). |
| `GET` | `/api/shipments/:id/items` | Detalle de la carga (fila expandible). |
| `GET` | `/api/shipments/:id/tarja.pdf` | PDF de la Tarja. |

**Scoping obligatorio en todas:** el handler ve los envíos de su company; el
cliente ve `clientCompany === req.user.company`. Es la misma regla que
`currentCompanyStock` ya aplica — reutilizar ese criterio, no inventar otro.

## 5. Web (React, `public/js/app/`)

El front vive en este mismo repo (`public/js/app/src/components/`), no en un repo
aparte.

**Diseño a copiar: "Revisión container"** —
`components/Inventory/ContainersInventory.tsx`. Ahí el contenedor es la fila y
las unidades de adentro se ven desplegando; acá la fila es la **patente** y las
unidades del camión se ven igual. Usa `react-data-table-component` con
`expandableRows` + `expandableRowsComponent`, que es exactamente el
comportamiento pedido.

- `components/Shipments/ShipmentListView.tsx` — listado + filtros + paginador.
- `ExpandedRowElement` con las unidades, cargadas bajo demanda (no traer todas
  las unidades en el listado).
- Botón de descarga de Tarja por fila, deshabilitado mientras falte el
  formulario de salida.
- Los envíos **cancelados** se muestran acá (en la app no aparecen), con las
  unidades que se bajaron y quién las bajó.

## 5.b Permisos

Abierto a **cualquier usuario de la company handler**: cargar, bajar unidades y
registrar la salida. No se agrega permiso nuevo. El cliente solo lee lo suyo.

## 6. PDF Tarja

Reutilizar el patrón existente: pug + puppeteer, como
`views/container/pdf/coded-items.pug` (`InventoryController.pdf`). Nueva
plantilla `views/shipment/pdf/tarja.pug` + `styles.css`, mismo
`executablePath: '/usr/bin/chromium'`.

### Contenido

| Bloque | Datos | De dónde sale |
|---|---|---|
| Encabezado | patente, datos del camión | `Shipment` |
| | handler, cliente, sucursal | `Shipment` |
| | quién estuvo a cargo, fecha/hora | `shippedBy`, `shippedAt` |
| | **nombre completo del chofer** | **respuesta del `departureForm`** |
| Unidades | VIN, marca, modelo | `Car` vía `ShipmentItem` |
| | si tiene daños + lista de daños | `participant.hasDamages` y `answer.damagesSelected` del formulario de unidad |
| Cierre | **foto del camión cargado** | **respuesta del `departureForm`** |

La extracción de daños ya existe: el export de stock recorre
`participant.sections[].answers[].damagesSelected[]` y arma
`parte-posición-tipo`. Reutilizar esa lógica, no reescribirla.

### Cómo encuentra el PDF los datos del formulario

El `departureForm` es editable desde el admin, así que el PDF **no puede
depender del orden ni del texto de las preguntas**. Se usa `kindUpdate`, que ya
es el mecanismo del sistema para mapear una respuesta a un campo
(`asignClient.ts` lo usa con `participant.clientName`, `participant.clientEmail`…).
Tanto la pregunta como la respuesta guardan `kindUpdate`.

Convención propuesta:

| Pregunta del `departureForm` | `kindUpdate` | Tipo |
|---|---|---|
| Nombre del chofer | `shipment.driverName` | `text` |
| Foto del camión cargado | `shipment.truckPhoto` | `image` |

### Consecuencia: la Tarja depende del formulario de salida

El nombre del chofer y la foto salen de ahí, así que **la Tarja no se puede
emitir antes de que ese formulario llegue**. Como ese envío va por la vía
encolada, hay una ventana en la que el camión está cerrado pero la Tarja todavía
no. La web tiene que mostrar el botón deshabilitado con el motivo, no un PDF
incompleto.

> Ojo: la imagen base pasó a Debian 12 y Chromium 152. Los PDF existentes siguen
> generándose, pero conviene verificar el render de la Tarja nueva en esa imagen.

## 7. Restricciones de DocDB

Ya nos costaron caro dos veces (vista de stock, summaries). Reglas para esta
feature:

1. **Índices desde el día uno** (§2). Un `$in` o un filtro sin índice hace
   collection scan: medimos 99 s en un endpoint por exactamente eso.
2. **Paginar antes de hidratar.** El listado debe resolver qué filas entran y en
   qué orden sobre documentos chicos, y recién después hacer los `$lookup`. Al
   revés, DocDB se queda sin memoria (`Operation terminated due to low available
   memory`, código 39) en `db.t3.medium`.
3. **Nada de `$facet`, `$graphLookup`, `$lookup` correlacionado ni
   `arrayFilters`** — no soportados.
4. **`allowDiskUse` no está disponible**: todo `$sort` bloqueante tiene que caber
   en memoria.
5. **`partialFilterExpression` sí funciona** en DocDB 5.0.0 — verificado, no
   asumido (§3). `sparse` también, pero no ignora los `null`.

## 8. Fases y entregables

### Fase 1 — API + web

1. Modelos `Shipment` / `ShipmentItem` + índices.
2. Mecanismo de exclusión (§3) **verificado contra DocDB real**, no asumido.
3. Endpoints `/api/v1` de carga + cierre.
4. Endpoints web de listado/detalle + scoping.
5. Pantalla de envíos con filas expandibles.
6. Tarja PDF.
7. Escritura de `History` al cerrar.

**Definición de terminado de Fase 1:** se puede ejecutar el flujo completo con
curl contra dev (abrir patente → cargar 2 unidades → intentar cargar una repetida
y recibir 409 → registrar salida), y el resultado se ve en la web con su Tarja.

### Fase 2 — app móvil

1. Pantallas de carga.
2. Modelo Realm + sincronización.
3. Cola de subida para formulario + fotos de unidades ya reclamadas.
4. Manejo de los errores 409 con mensajes accionables (incluido el reintento tras
   respuesta perdida).

> **Sin cambios de esquema Realm.** El flujo es online para los pasos con
> contención, así que no hace falta tocar `schemas.dart` — lo que evita borrar los
> formularios offline de los usuarios. El codegen de retrofit sigue roto: los
> endpoints nuevos requieren editar `remote_client.g.dart` a mano.

Detalle en [`03-app-movil.md`](./03-app-movil.md).

## 9. Riesgos técnicos

| Riesgo | Mitigación |
|---|---|
| `partialFilterExpression` no soportado en DocDB | Probar primero; si no, centinela + sparse unique (§3) |
| Rendimiento del listado con volumen real | Paginar antes de hidratar desde el inicio (§7.2) |
| Carrera entre dos operarios | Exclusión a nivel de motor, no validación en app (§3) |
| Patio sin señal → no se puede cargar | Payload mínimo en los pasos online; medir cobertura antes de desplegar |
| Confusión con transmittals | Documentar en el README cuándo se usa cada proceso |

## 10. Lo que falta decidir antes de empezar

De las preguntas abiertas del PRD, estas **bloquean código**:

- **Pregunta 2** (qué dispara la salida) → define el endpoint `/depart`.
- **Pregunta 4** (datos del camión) → define el schema de `transporter`.
- **Pregunta 5** (formulario configurable o fijo) → define cómo se resuelve el
  `Form` al cargar una unidad.
- **Pregunta 6** (quitar unidades) → define si existe el `DELETE` de items.
- **Pregunta 1** (offline) → bloquea Fase 2, no Fase 1.

Las demás se pueden resolver durante la implementación.
