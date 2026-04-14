// =============================================================================
// SCRIPT: Crear Team, Venue y Usuario Admin para Company Client
// Ejecutar en MongoDB Compass (Mongosh)
// =============================================================================

// ======================= CONFIGURACIÓN - MODIFICAR AQUÍ =======================

// ID de la Company Handler (la empresa que gestiona)
const companyHandlerId = ObjectId("695e91e069b679429eb335f8"); // <-- Cambiar por el ObjectId real

// ID de la Company Client (la empresa cliente)
const companyClientId = ObjectId("6920575acc0554846f9b4fd7"); // <-- Cambiar por el ObjectId real

// ==============================================================================
// NO MODIFICAR DEBAJO DE ESTA LÍNEA (a menos que sepas lo que haces)
// ==============================================================================

// 1. Obtener las companies
const companyHandler = db.companies.findOne({ _id: companyHandlerId });
const companyClient = db.companies.findOne({ _id: companyClientId });

if (!companyHandler) {
    print("❌ ERROR: No se encontró la Company Handler con ID: " + companyHandlerId);
    throw new Error("Company Handler no encontrada");
}

if (!companyClient) {
    print("❌ ERROR: No se encontró la Company Client con ID: " + companyClientId);
    throw new Error("Company Client no encontrada");
}

print("✅ Company Handler encontrada: " + companyHandler.name);
print("✅ Company Client encontrada: " + companyClient.name);

// 2. Generar email y username
const handlerNameClean = companyHandler.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
const clientNameClean = companyClient.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
const generatedEmail = handlerNameClean + "+" + clientNameClean + "@osacontrol.com";

print("📧 Email a generar: " + generatedEmail);

// 3. Verificar/Crear Team para la Company Client
let teamId = companyClient.team;
let teamCreated = false;

if (teamId) {
    const existingTeam = db.teams.findOne({ _id: teamId });
    if (existingTeam) {
        print("ℹ️  Team ya existe para Company Client: " + existingTeam.name + " (ID: " + teamId + ")");
    } else {
        print("⚠️  Company Client tiene team ID pero el team no existe. Se creará uno nuevo.");
        teamId = null;
    }
}

if (!teamId) {
    const newTeam = {
        name: companyClient.name,
        formsNumber: 0,
        requestNumber: 0,
        transmittalNumber: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const teamResult = db.teams.insertOne(newTeam);
    teamId = teamResult.insertedId;
    teamCreated = true;
    print("✅ Team creado exitosamente con ID: " + teamId);
    
    db.companies.updateOne(
        { _id: companyClientId },
        { $set: { team: teamId, updatedAt: new Date() } }
    );
    print("✅ Company Client actualizada con el nuevo Team");
}

// 4. Verificar/Crear Venue para la Company Client
let venueId = null;
let venueCreated = false;

const existingVenue = db.venues.findOne({ 
    team: teamId, 
    company: companyClientId,
    deleted: { $ne: true }
});

if (existingVenue) {
    venueId = existingVenue._id;
    print("ℹ️  Venue ya existe: " + existingVenue.name + " (ID: " + venueId + ")");
} else {
    const newVenue = {
        name: companyClient.name + " - PRINCIPAL",
        team: teamId,
        company: companyClientId,
        code: clientNameClean.toUpperCase().substring(0, 10),
        abbreviation: clientNameClean.toUpperCase().substring(0, 5),
        lat: 0,
        lng: 0,
        shippingMaxDays: 5,
        type: "receiver",
        sendToDays: [],
        sendTo: [],
        receiveFrom: [],
        receptionCarriers: [],
        shippingCarriers: [],
        responsible: [],
        deleted: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const venueResult = db.venues.insertOne(newVenue);
    venueId = venueResult.insertedId;
    venueCreated = true;
    print("✅ Venue creado exitosamente: " + newVenue.name + " (ID: " + venueId + ")");
}

// 5. Verificar si ya existe el usuario con ese email
const existingUser = db.users.findOne({ email: generatedEmail });

if (existingUser) {
    print("⚠️  Usuario ya existe:");
    print("   - ID: " + existingUser._id);
    print("   - Email: " + existingUser.email);
    print("   - Nombre: " + existingUser.firstName + " " + existingUser.lastName);
    print("");
    print("🔄 No se creará un usuario duplicado.");
} else {
    // 6. Crear el usuario admin usando la plantilla proporcionada
    const newUser = {
        __v: 0,
        active: true,
        companiesAccess: [companyClientId],
        createdAt: new Date(),
        company: companyClientId,
        team: teamId,
        email: generatedEmail,
        username: generatedEmail,
        venue: venueId,
        venuesAccess: [],
        firstName: companyHandler.name.split(' ')[0] || "ADMIN",
        lastName: "USUARIO",
        isAdmin: true,
        isDriver: false,
        password: "$2b$10$DGoFYGrdkmLLid/9.UPFze2MURDI4bL3wQfABwPQm6j/m8/L2bO8e",
        preferred: ObjectId("6058f9e53039dbadeeb7a559"),
        settings: {
            _id: new ObjectId()
        },
        type: "common",
        updatedAt: new Date(),
        userBrands: [],
        userForms: [],
        userPermissions: [
            ObjectId("5b6356d61a3bd4c3827ce53f"),
            ObjectId("5b6356d61a3bd4c3827ce540"),
            ObjectId("67d3544208488f3472e6b388"),
            ObjectId("5b636f53a9683b19d446e021")
        ]
    };
    
    const userResult = db.users.insertOne(newUser);
    print("✅ Usuario admin creado exitosamente:");
    print("   - ID: " + userResult.insertedId);
    print("   - Email: " + generatedEmail);
    print("   - Username: " + generatedEmail);
    print("   - Team: " + teamId);
    print("   - Company: " + companyClientId);
    print("   - Venue: " + venueId);
}

// 7. Resumen final
print("");
print("========================================");
print("           RESUMEN DE OPERACIÓN         ");
print("========================================");
print("Company Handler: " + companyHandler.name);
print("Company Client: " + companyClient.name);
print("Team ID: " + teamId + (teamCreated ? " (NUEVO)" : " (EXISTENTE)"));
print("Venue ID: " + venueId + (venueCreated ? " (NUEVO)" : " (EXISTENTE)"));
print("Email generado: " + generatedEmail);
print("========================================");

// 8. Verificación - mostrar el usuario creado/existente
const finalUser = db.users.findOne({ email: generatedEmail });
if (finalUser) {
    print("");
    print("👤 USUARIO FINAL:");
    printjson({
        _id: finalUser._id,
        username: finalUser.username,
        email: finalUser.email,
        firstName: finalUser.firstName,
        lastName: finalUser.lastName,
        team: finalUser.team,
        company: finalUser.company,
        venue: finalUser.venue,
        isAdmin: finalUser.isAdmin,
        active: finalUser.active
    });
}