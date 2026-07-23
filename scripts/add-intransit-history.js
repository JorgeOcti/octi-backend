// =============================================================================
// SCRIPT: Agregar history "inTransit" a los cars de una Company manejados por otra
// Ejecutar en MongoDB Compass (Mongosh)
// =============================================================================
//
// Para cada car cuyo handlerCompany == Company A (la que gestiona) y
// company == Company B (la dueña/cliente), crea un History con status
// "inTransit" (module "form") y lo deja como el estado ACTUAL del car:
//   - inserta el nuevo history con current:true
//   - pone current:false en los demás history del car
//   - apunta car.event al nuevo history
//
// ======================= CONFIGURACIÓN - MODIFICAR AQUÍ =======================

// Company A: la empresa que GESTIONA los cars (handlerCompany)
const handlerCompanyId = ObjectId("67aac64a94ed0a1f9da3478c");

// Company B: la empresa DUEÑA de los cars (company)
const ownerCompanyId = ObjectId("67e7079514e1e510f8c9fe4e");

// Fecha del evento (por defecto ahora). Cambiar si se quiere una fecha específica.
const executedAt = new Date();

// Usuario que "ejecuta" el cambio (opcional). null = sin createdBy.
const createdById = null; // p.ej. ObjectId("....")

// DRY RUN: true = solo muestra qué haría, NO escribe. Poner false para aplicar.
const DRY_RUN = true;

// ==============================================================================
// NO MODIFICAR DEBAJO DE ESTA LÍNEA (a menos que sepas lo que haces)
// ==============================================================================

const HISTORY_STATUS = "inTransit";
const HISTORY_MODULE = "form";

// Devuelve el inventoryCar más reciente del car que tenga venue (o venueFound),
// para asociarlo al history. La vista /desconsolidated/unit/ lee
// history.inventoryCar.venue, así evitamos que quede sin venue.
function findInventoryCarWithVenue(carId) {
  const found = db.inventorycars
    .find(
      {
        car: carId,
        $or: [
          { venue: { $exists: true, $ne: null } },
          { venueFound: { $exists: true, $ne: null } }
        ]
      },
      { _id: 1, venue: 1, venueFound: 1 }
    )
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  return found.length ? found[0] : null;
}

// 1. Validar companies
const handlerCompany = db.companies.findOne({ _id: handlerCompanyId });
const ownerCompany = db.companies.findOne({ _id: ownerCompanyId });

if (!handlerCompany) {
  throw new Error("❌ No se encontró la Handler Company con ID: " + handlerCompanyId);
}
if (!ownerCompany) {
  throw new Error("❌ No se encontró la Owner Company con ID: " + ownerCompanyId);
}

print("✅ Handler Company (gestiona): " + handlerCompany.name + " (" + handlerCompanyId + ")");
print("✅ Owner Company (dueña):      " + ownerCompany.name + " (" + ownerCompanyId + ")");

// 2. Buscar los cars objetivo
const carFilter = {
  handlerCompany: handlerCompanyId,
  company: ownerCompanyId
};

const totalCars = db.cars.countDocuments(carFilter);
print("");
print("🚗 Cars que coinciden (handlerCompany=A, company=B): " + totalCars);

if (totalCars === 0) {
  print("ℹ️  No hay cars que actualizar. Fin.");
} else if (DRY_RUN) {
  print("");
  print("🟡 DRY_RUN activo: NO se escribirá nada. Vista previa (hasta 10 cars):");
  let withVenue = 0;
  let withoutVenue = 0;
  db.cars.find(carFilter, { _id: 1, vin: 1, internalNumber: 1, status: 1, event: 1 })
    .forEach(function (c) {
      const invCar = findInventoryCarWithVenue(c._id);
      if (invCar) { withVenue++; } else { withoutVenue++; }
      if (withVenue + withoutVenue <= 10) {
        print("   - " + c._id + " | vin: " + (c.vin || "-") +
          " | interno: " + (c.internalNumber || "-") +
          " | status: " + c.status +
          " | event actual: " + (c.event || "null") +
          " | inventoryCar c/venue: " + (invCar ? invCar._id : "NINGUNO"));
      }
    });
  print("");
  print("👉 Se crearían " + totalCars + " history '" + HISTORY_STATUS +
    "' (module '" + HISTORY_MODULE + "') y se actualizaría car.event en cada uno.");
  print("   • Cars con inventoryCar (con venue) para asociar: " + withVenue);
  print("   • Cars SIN inventoryCar con venue (history quedará sin inventoryCar): " + withoutVenue);
  print("👉 Poné DRY_RUN = false para aplicar los cambios.");
} else {
  print("");
  print("🟢 Aplicando cambios...");

  let processed = 0;
  let historiesCreated = 0;
  let withoutInventoryCar = 0;

  db.cars.find(carFilter, { _id: 1, team: 1, company: 1, handlerCompany: 1 }).forEach(function (car) {
    // 2.1 Buscar un inventoryCar con venue para asociar (evita que la vista
    //     /desconsolidated/unit/ quede sin venue en este history).
    const invCar = findInventoryCarWithVenue(car._id);
    if (!invCar) {
      withoutInventoryCar++;
    }

    // 2.2 Crear el nuevo history como actual
    const history = {
      car: car._id,
      team: car.team || null,
      company: car.company || ownerCompanyId,
      handlerCompany: car.handlerCompany || handlerCompanyId,
      status: HISTORY_STATUS,
      module: HISTORY_MODULE,
      current: true,
      changeLocation: false,
      alert: {},
      alerts: [],
      executedAt: executedAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (invCar) {
      history.inventoryCar = invCar._id;
    }
    if (createdById) {
      history.createdBy = createdById;
    }

    const insertRes = db.histories.insertOne(history);
    const newHistoryId = insertRes.insertedId;
    historiesCreated++;

    // 2.3 Marcar los history anteriores del car como no-actuales
    db.histories.updateMany(
      { car: car._id, _id: { $ne: newHistoryId } },
      { $set: { current: false } }
    );

    // 2.4 Apuntar el car al nuevo history actual
    db.cars.updateOne(
      { _id: car._id },
      { $set: { event: newHistoryId, updatedAt: new Date() } }
    );

    processed++;
    if (processed % 100 === 0) {
      print("   ... " + processed + "/" + totalCars + " cars procesados");
    }
  });

  print("");
  print("✅ Listo. Cars procesados: " + processed + " | History inTransit creados: " + historiesCreated);
  if (withoutInventoryCar > 0) {
    print("⚠️  " + withoutInventoryCar + " history quedaron SIN inventoryCar (no se halló uno con venue). " +
      "El fix del front (optional chaining) cubre estos casos en /desconsolidated/unit/.");
  }
}

// 3. Resumen
print("");
print("========================================");
print("           RESUMEN DE OPERACIÓN         ");
print("========================================");
print("Handler Company: " + handlerCompany.name);
print("Owner Company:   " + ownerCompany.name);
print("Cars coincidentes: " + totalCars);
print("Status history:  " + HISTORY_STATUS);
print("Module:          " + HISTORY_MODULE);
print("executedAt:      " + executedAt);
print("Modo:            " + (DRY_RUN ? "DRY_RUN (sin escribir)" : "APLICADO"));
print("========================================");
