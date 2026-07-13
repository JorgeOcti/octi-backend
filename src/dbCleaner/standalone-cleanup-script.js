#!/usr/bin/env node

// Script independiente de limpieza de datos para Andes Backend
// No requiere el proyecto completo, solo Node.js y acceso a MongoDB

const mongoose = require('mongoose');
const readline = require('readline');

// Configuración
const CONFIG = {
  // Cambiar esta URL por tu conexión a MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://osacontrol:osacontrol@localhost:27017/osaAndesDev?authSource=admin',
  DRY_RUN: false, // Cambiar a false para ejecución real
  // AUTO_CONFIRM=true responde "sí" a todas las confirmaciones (ejecución
  // desatendida). Sólo tiene efecto cuando DRY_RUN es false.
  AUTO_CONFIRM: process.env.AUTO_CONFIRM === 'true',

  // Filtros (opcional) - IMPORTANTE: Los IDs aquí serán MANTENIDOS (no eliminados)
  // Se eliminarán TODAS las demás companies que NO estén en esta lista
  //   COMPANY_FILTER: ['5b590abca9683b0413293aa1', '67aac64a94ed0a1f9da3478c', '5bc88d87a9683ba58c197c24'], // IDs a MANTENER

  COMPANY_FILTER: ['5b590abca9683b0413293aa1', '67aac64a94ed0a1f9da3478c', '695e91e069b679429eb335f8'], // IDs a MANTENER
  TEAM_FILTER: []     // IDs a MANTENER (opcional)
};

// Definición de schemas básicos (solo lo necesario para las operaciones)
const companySchema = new mongoose.Schema({}, { collection: 'companies', strict: false });
const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const carSchema = new mongoose.Schema({}, { collection: 'cars', strict: false });
const venueSchema = new mongoose.Schema({}, { collection: 'venues', strict: false });
const historySchema = new mongoose.Schema({}, { collection: 'histories', strict: false });
const participantSchema = new mongoose.Schema({}, { collection: 'participants', strict: false });
const participantFileSchema = new mongoose.Schema({}, { collection: 'participantfiles', strict: false });
const draftSchema = new mongoose.Schema({}, { collection: 'drafts', strict: false });
const gpsPositionSchema = new mongoose.Schema({}, { collection: 'gpspositions', strict: false });
const inventorySchema = new mongoose.Schema({}, { collection: 'inventories', strict: false });
const inventoryCarSchema = new mongoose.Schema({}, { collection: 'inventorycars', strict: false });
const inventoryFileSchema = new mongoose.Schema({}, { collection: 'inventoryfiles', strict: false });
const stockSchema = new mongoose.Schema({}, { collection: 'stocks', strict: false });
const stockCarSchema = new mongoose.Schema({}, { collection: 'stockcars', strict: false });
const requestSchema = new mongoose.Schema({}, { collection: 'requests', strict: false });
const requestItemSchema = new mongoose.Schema({}, { collection: 'requestitems', strict: false });
const requestFileSchema = new mongoose.Schema({}, { collection: 'requestfiles', strict: false });
const activityHistorySchema = new mongoose.Schema({}, { collection: 'activityhistories', strict: false });
const planningSchema = new mongoose.Schema({}, { collection: 'plannings', strict: false });

// Nuevos modelos agregados
const teamSchema = new mongoose.Schema({}, { collection: 'teams', strict: false });
const venueDaySchema = new mongoose.Schema({}, { collection: 'venuedays', strict: false });
const alertSchema = new mongoose.Schema({}, { collection: 'alerts', strict: false });
const borderSchema = new mongoose.Schema({}, { collection: 'borders', strict: false });
const brandSchema = new mongoose.Schema({}, { collection: 'brands', strict: false });
const carrierSchema = new mongoose.Schema({}, { collection: 'carriers', strict: false });
const colorSchema = new mongoose.Schema({}, { collection: 'colors', strict: false });
const groupSchema = new mongoose.Schema({}, { collection: 'regions', strict: false });
const regionSchema = new mongoose.Schema({}, { collection: 'regions', strict: false });
const samlConfigSchema = new mongoose.Schema({}, { collection: 'samlconfigs', strict: false });
const teamSettingSchema = new mongoose.Schema({}, { collection: 'teamsettings', strict: false });
const versionSchema = new mongoose.Schema({}, { collection: 'versions', strict: false });
const recoverFileSchema = new mongoose.Schema({}, { collection: 'recoverfiles', strict: false });
const invoiceSchema = new mongoose.Schema({}, { collection: 'invoices', strict: false });
const permissionSchema = new mongoose.Schema({}, { collection: 'permissions', strict: false });
const submoduleSchema = new mongoose.Schema({}, { collection: 'submodules', strict: false });
const teamBillingSchema = new mongoose.Schema({}, { collection: 'teambillings', strict: false });
const moduleSchema = new mongoose.Schema({}, { collection: 'modules', strict: false });
const studioSchema = new mongoose.Schema({}, { collection: 'studios', strict: false });
const inventoryLabelSchema = new mongoose.Schema({}, { collection: 'inventorylabels', strict: false });
const virtualInventorySchema = new mongoose.Schema({}, { collection: 'virtualinventories', strict: false });
const integrationSchema = new mongoose.Schema({}, { collection: 'integrations', strict: false });
const paymentMethodSchema = new mongoose.Schema({}, { collection: 'paymentmethods', strict: false });
const requestItemStatusSchema = new mongoose.Schema({}, { collection: 'requestitemstatuses', strict: false });
const reasonSchema = new mongoose.Schema({}, { collection: 'reasons', strict: false });
const operationTypeSchema = new mongoose.Schema({}, { collection: 'operationtypes', strict: false });
const formSchema = new mongoose.Schema({}, { collection: 'forms', strict: false });
const formTriggerSchema = new mongoose.Schema({}, { collection: 'formtriggers', strict: false });
const questionTriggerSchema = new mongoose.Schema({}, { collection: 'questiontriggers', strict: false });
const damageSchema = new mongoose.Schema({}, { collection: 'damages', strict: false });
const kindSchema = new mongoose.Schema({}, { collection: 'kinds', strict: false });
const partSchema = new mongoose.Schema({}, { collection: 'parts', strict: false });
const positionSchema = new mongoose.Schema({}, { collection: 'positions', strict: false });
const scaleSchema = new mongoose.Schema({}, { collection: 'scales', strict: false });

// Adicionales (nuevos)
const salesChannelSchema = new mongoose.Schema({}, { collection: 'saleschannels', strict: false });
const requestStatusSchema = new mongoose.Schema({}, { collection: 'requeststatuses', strict: false });
const accesorySchema = new mongoose.Schema({}, { collection: 'accesories', strict: false });
const milestoneTypeSchema = new mongoose.Schema({}, { collection: 'milestonetypes', strict: false });
const milestoneSchema = new mongoose.Schema({}, { collection: 'milestones', strict: false });
const transmittalSchema = new mongoose.Schema({}, { collection: 'transmittals', strict: false });
const transmittalItemSchema = new mongoose.Schema({}, { collection: 'transmittalitems', strict: false });
const transmittalFileSchema = new mongoose.Schema({}, { collection: 'transmittalfiles', strict: false });

// Modelos
const Company = mongoose.model('Company', companySchema);
const User = mongoose.model('User', userSchema);
const Car = mongoose.model('Car', carSchema);
const Venue = mongoose.model('Venue', venueSchema);
const History = mongoose.model('History', historySchema);
const Participant = mongoose.model('Participant', participantSchema);
const ParticipantFile = mongoose.model('ParticipantFile', participantFileSchema);
const Draft = mongoose.model('Draft', draftSchema);
const GPSPosition = mongoose.model('GPSPosition', gpsPositionSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryCar = mongoose.model('InventoryCar', inventoryCarSchema);
const InventoryFile = mongoose.model('InventoryFile', inventoryFileSchema);
const Stock = mongoose.model('Stock', stockSchema);
const StockCar = mongoose.model('StockCar', stockCarSchema);
const Request = mongoose.model('Request', requestSchema);
const RequestItem = mongoose.model('RequestItem', requestItemSchema);
const RequestFile = mongoose.model('RequestFile', requestFileSchema);
const ActivityHistory = mongoose.model('ActivityHistory', activityHistorySchema);
const Planning = mongoose.model('Planning', planningSchema);

// Nuevos modelos agregados
const Team = mongoose.model('Team', teamSchema);
const VenueDay = mongoose.model('VenueDay', venueDaySchema);
const Alert = mongoose.model('Alert', alertSchema);
const Border = mongoose.model('Border', borderSchema);
const Brand = mongoose.model('Brand', brandSchema);
const Carrier = mongoose.model('Carrier', carrierSchema);
const Color = mongoose.model('Color', colorSchema);
const Group = mongoose.model('Group', groupSchema);
const Region = mongoose.model('Region', regionSchema);
const SamlConfig = mongoose.model('SamlConfig', samlConfigSchema);
const TeamSetting = mongoose.model('TeamSetting', teamSettingSchema);
const Version = mongoose.model('Version', versionSchema);
const RecoverFile = mongoose.model('RecoverFile', recoverFileSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Permission = mongoose.model('Permission', permissionSchema);
const Submodule = mongoose.model('Submodule', submoduleSchema);
const TeamBilling = mongoose.model('TeamBilling', teamBillingSchema);
const Module = mongoose.model('Module', moduleSchema);
const Studio = mongoose.model('Studio', studioSchema);
const InventoryLabel = mongoose.model('InventoryLabel', inventoryLabelSchema);
const VirtualInventory = mongoose.model('VirtualInventory', virtualInventorySchema);
const Integration = mongoose.model('Integration', integrationSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const RequestItemStatus = mongoose.model('RequestItemStatus', requestItemStatusSchema);
const Reason = mongoose.model('Reason', reasonSchema);
const OperationType = mongoose.model('OperationType', operationTypeSchema);
const Form = mongoose.model('Form', formSchema);
const FormTrigger = mongoose.model('FormTrigger', formTriggerSchema);
const QuestionTrigger = mongoose.model('QuestionTrigger', questionTriggerSchema);
const Damage = mongoose.model('Damage', damageSchema);
const Kind = mongoose.model('Kind', kindSchema);
const Part = mongoose.model('Part', partSchema);
const Position = mongoose.model('Position', positionSchema);
const Scale = mongoose.model('Scale', scaleSchema);

// Nuevos modelos agregados
const SalesChannel = mongoose.model('SalesChannel', salesChannelSchema);
const RequestStatus = mongoose.model('RequestStatus', requestStatusSchema);
const Accesory = mongoose.model('Accesory', accesorySchema);
const MilestoneType = mongoose.model('MilestoneType', milestoneTypeSchema);
const Milestone = mongoose.model('Milestone', milestoneSchema);
const Transmittal = mongoose.model('Transmittal', transmittalSchema);
const TransmittalItem = mongoose.model('TransmittalItem', transmittalItemSchema);
const TransmittalFile = mongoose.model('TransmittalFile', transmittalFileSchema);

class StandaloneDataCleanup {
  constructor() {
    this.stats = [];
    this.companyFilter = {};
    this.teamFilter = {};
    this.setupFilters();
  }

  setupFilters() {
    if (CONFIG.COMPANY_FILTER.length > 0) {
      this.companyFilter = {
        company: { $nin: CONFIG.COMPANY_FILTER.map(id => new mongoose.Types.ObjectId(id)) }
      };
      console.log(`🔍 Filtro: MANTENER SOLO companies: ${CONFIG.COMPANY_FILTER.join(', ')}`);
      console.log(`🔍 Filtro: ELIMINAR todas las demás companies`);
    }

    if (CONFIG.TEAM_FILTER.length > 0) {
      this.teamFilter = {
        team: { $nin: CONFIG.TEAM_FILTER.map(id => new mongoose.Types.ObjectId(id)) }
      };
      console.log(`🔍 Filtro: MANTENER SOLO teams: ${CONFIG.TEAM_FILTER.join(', ')}`);
      console.log(`🔍 Filtro: ELIMINAR todos los demás teams`);
    }
  }

  async connect() {
    try {
      await mongoose.connect(CONFIG.MONGODB_URI);
      console.log('✅ Conectado a MongoDB:', CONFIG.MONGODB_URI);

      // Expandir companies preservadas con clientCompanies y handlerCompanies
      if (CONFIG.COMPANY_FILTER.length > 0) {
        const baseIds = CONFIG.COMPANY_FILTER.map(id => new mongoose.Types.ObjectId(id));
        try {
          const related = await Company.find({ _id: { $in: baseIds } })
            .select({ clientCompanies: 1, handlerCompanies: 1 })
            .lean();

          const extraIds = [];
          for (const c of related) {
            if (Array.isArray(c.clientCompanies)) extraIds.push(...c.clientCompanies);
            if (Array.isArray(c.handlerCompanies)) extraIds.push(...c.handlerCompanies);
          }

          const allIds = [...baseIds, ...extraIds];
          const uniqueIdStrings = Array.from(new Set(allIds.map(id => id.toString())));
          this.keepCompanyIds = uniqueIdStrings.map(id => new mongoose.Types.ObjectId(id));

          // Actualizar el filtro principal de company con la lista expandida
          this.companyFilter = { company: { $nin: this.keepCompanyIds } };

          console.log(`🔐 Companies protegidas (base + relacionadas): ${this.keepCompanyIds.length}`);

          // Derivar teams a partir de las companies protegidas y fusionar con TEAM_FILTER (si existe)
          const teamsFromCompanies = await Company.find({ _id: { $in: this.keepCompanyIds } }).distinct('team');
          const configTeamIds = (CONFIG.TEAM_FILTER || []).map(id => new mongoose.Types.ObjectId(id));
          const allTeamIds = [...teamsFromCompanies, ...configTeamIds].filter(Boolean);
          const uniqueTeamStrings = Array.from(new Set(allTeamIds.map(id => id.toString())));
          this.keepTeamIds = uniqueTeamStrings.map(id => new mongoose.Types.ObjectId(id));

          if (this.keepTeamIds.length > 0) {
            this.teamFilter = { team: { $nin: this.keepTeamIds } };
            console.log(`🔐 Teams protegidos derivados de companies/config: ${this.keepTeamIds.length}`);
          }
        } catch (e) {
          console.warn('⚠️ No se pudo expandir client/handler companies:', e.message);
          this.keepCompanyIds = baseIds;
        }
      }
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }

  async getCompanyStats() {
    console.log('\n📊 ESTADÍSTICAS DE COMPANIES:');
    try {
      // Mostrar todas las companies primero
      const allCompanies = await Company.find({});
      console.log(`Total de companies en la BD: ${allCompanies.length}`);

      if (CONFIG.COMPANY_FILTER.length > 0) {
        // Usar la lista expandida (base + clientCompanies + handlerCompanies) si está disponible
        const keepCompanyIds = (this.keepCompanyIds && this.keepCompanyIds.length)
          ? this.keepCompanyIds
          : CONFIG.COMPANY_FILTER.map(id => new mongoose.Types.ObjectId(id));

        const companiesToKeep = await Company.find({ _id: { $in: keepCompanyIds } });
        console.log(`\n🛡️  COMPANIES QUE SE MANTENDRÁN (${companiesToKeep.length}):`);

        for (const company of companiesToKeep) {
          const users = await User.countDocuments({ company: company._id });
          const cars = await Car.countDocuments({ company: company._id });
          const inventories = await Inventory.countDocuments({ company: company._id });
          const participants = await Participant.countDocuments({ company: company._id });

          console.log(`📁 ${company.name || 'Sin nombre'} (${company._id})${company.team ? ` - team: ${company.team}` : ''}:`);
          console.log(`   - Usuarios: ${users}`);
          console.log(`   - Vehículos: ${cars}`);
          console.log(`   - Inventarios: ${inventories}`);
          console.log(`   - Participantes: ${participants}`);
        }

        // Teams protegidos (derivados de companies + configurados)
        let keepTeamIds = (this.keepTeamIds && this.keepTeamIds.length) ? this.keepTeamIds : [];
        if (!keepTeamIds.length) {
          const teamsFromCompanies = await Company.find({ _id: { $in: keepCompanyIds } }).distinct('team');
          const configTeamIds = (CONFIG.TEAM_FILTER || []).map(id => new mongoose.Types.ObjectId(id));
          const allTeamIds = [...teamsFromCompanies, ...configTeamIds].filter(Boolean);
          const uniqueTeamStrings = Array.from(new Set(allTeamIds.map(id => id.toString())));
          keepTeamIds = uniqueTeamStrings.map(id => new mongoose.Types.ObjectId(id));
        }

        if (keepTeamIds.length > 0) {
          const teams = await Team.find({ _id: { $in: keepTeamIds } }).select('name');
          console.log(`\n🛡️  TEAMS QUE SE MANTENDRÁN (${teams.length}):`);
          for (const t of teams) {
            console.log(`🏷️  ${t.name || 'Sin nombre'} (${t._id})`);
          }
        }

        console.log(`\n⚠️  Se eliminarán ${allCompanies.length - companiesToKeep.length} companies y todos sus datos relacionados`);
      } else {
        // Sin filtro de companies, pero puede haber filtro de teams para referencia
        if (CONFIG.TEAM_FILTER.length > 0 || (this.keepTeamIds && this.keepTeamIds.length)) {
          const keepTeamIds = (this.keepTeamIds && this.keepTeamIds.length)
            ? this.keepTeamIds
            : (CONFIG.TEAM_FILTER || []).map(id => new mongoose.Types.ObjectId(id));
          const teams = await Team.find({ _id: { $in: keepTeamIds } }).select('name');
          console.log(`\n🛡️  TEAMS QUE SE MANTENDRÁN (${teams.length}):`);
          for (const t of teams) {
            console.log(`🏷️  ${t.name || 'Sin nombre'} (${t._id})`);
          }
        }
        console.log('\n⚠️  NO hay filtros de companies - Se procesarían TODAS las companies');
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
    }
  }

  async askConfirmation(question) {
    if (CONFIG.DRY_RUN) return false;

    if (CONFIG.AUTO_CONFIRM) {
      console.log(`${question}→ AUTO_CONFIRM=true → sí`);
      return true;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async cleanupModel(model, modelName, filter = {}) {
    console.log(`\n🧹 Procesando modelo: ${modelName}`);

    const mergedFilter = { ...filter, ...this.companyFilter, ...this.teamFilter };

    try {
      const totalDocuments = await model.countDocuments({});
      const documentsToDelete = await model.countDocuments(mergedFilter);

      console.log(`   📄 Total documentos: ${totalDocuments}`);
      console.log(`   🎯 Documentos a eliminar: ${documentsToDelete}`);

      let deletedDocuments = 0;
      let errors = 0;

      if (documentsToDelete > 0) {
        if (CONFIG.DRY_RUN) {
          console.log(`   🔍 DRY RUN: Se eliminarían ${documentsToDelete} documentos`);
          deletedDocuments = documentsToDelete; // Para estadísticas
        } else {
          const confirmation = await this.askConfirmation(
            `¿Eliminar ${documentsToDelete} documentos de ${modelName}? (y/N): `
          );

          if (confirmation) {
            try {
              const result = await model.deleteMany(mergedFilter);
              deletedDocuments = result.deletedCount;
              console.log(`   ✅ Eliminados: ${deletedDocuments} documentos`);
            } catch (error) {
              console.error(`   ❌ Error eliminando documentos: ${error.message}`);
              errors = 1;
            }
          } else {
            console.log(`   ⏭️  Omitiendo eliminación de ${modelName}`);
          }
        }
      } else {
        console.log(`   ℹ️  No hay documentos para eliminar`);
      }

      this.stats.push({
        modelName,
        totalDocuments,
        documentsToDelete,
        deletedDocuments,
        errors
      });

    } catch (error) {
      console.error(`❌ Error procesando ${modelName}:`, error.message);
      this.stats.push({
        modelName,
        totalDocuments: 0,
        documentsToDelete: 0,
        deletedDocuments: 0,
        errors: 1
      });
    }
  }

  async cleanupDirectCompanyRelations() {
    console.log('\n🎯 LIMPIEZA DE MODELOS CON RELACIÓN DIRECTA A COMPANY:');

    await this.cleanupModel(User, 'Users');
    await this.cleanupModel(Car, 'Cars');
    await this.cleanupModel(Venue, 'Venues');
    // Nuevos modelos con relación directa
    await this.cleanupModel(Alert, 'Alerts');
    await this.cleanupModel(Border, 'Borders');
    await this.cleanupModel(RecoverFile, 'RecoverFiles');

    await this.cleanupModel(History, 'History');
    await this.cleanupModel(Participant, 'Participants');
    await this.cleanupModel(ParticipantFile, 'ParticipantFiles');
    await this.cleanupModel(GPSPosition, 'GPSPositions');
    await this.cleanupModel(Inventory, 'Inventories');
    await this.cleanupModel(InventoryFile, 'InventoryFiles');

    // Modelos solo por team: correr solo si hay filtro por team
    if (CONFIG.TEAM_FILTER.length > 0) {
      await this.cleanupModel(InventoryLabel, 'InventoryLabels');
      // Directos adicionales (Request config por team)
      await this.cleanupModel(SalesChannel, 'SalesChannels');
      await this.cleanupModel(RequestStatus, 'RequestStatuses');
      await this.cleanupModel(PaymentMethod, 'PaymentMethods');
      await this.cleanupModel(Reason, 'Reasons');
      await this.cleanupModel(OperationType, 'OperationTypes');
    }

    // Nuevos modelos con relación directa
    await this.cleanupModel(VirtualInventory, 'VirtualInventories');

    await this.cleanupModel(Stock, 'Stock');
    await this.cleanupModel(Request, 'Requests');
    await this.cleanupModel(RequestItem, 'RequestItems');
    await this.cleanupModel(ActivityHistory, 'ActivityHistory');
    await this.cleanupModel(Planning, 'Planning');
    // Nuevos modelos con relación directa
    await this.cleanupModel(Invoice, 'Invoices');
    await this.cleanupModel(Form, 'Forms');
    await this.cleanupModel(Scale, 'Scales');
  }

  // Lista de companies protegidas (base + client/handler expandidas).
  keepCompanyIdList() {
    return (this.keepCompanyIds && this.keepCompanyIds.length)
      ? this.keepCompanyIds
      : CONFIG.COMPANY_FILTER.map(id => new mongoose.Types.ObjectId(id));
  }

  // Elimina los documentos de `model` cuyo `field` NO esté en `keepIds`.
  // Trabaja con el conjunto "a mantener" (pequeño) en lugar del "a eliminar"
  // (millones), para no exceder el tope de 16MB del comando distinct.
  // GUARDA: si keepIds viene vacío se OMITE, para que un $nin:[] no borre la
  // colección completa por accidente.
  async cleanupChildrenNotIn(model, modelName, field, keepIds) {
    if (!keepIds || keepIds.length === 0) {
      console.log(`\n🧹 ${modelName}: sin padres a mantener → se OMITE por seguridad (evita borrar toda la colección)`);
      this.stats.push({
        modelName,
        totalDocuments: await model.countDocuments({}),
        documentsToDelete: 0,
        deletedDocuments: 0,
        errors: 0
      });
      return;
    }
    await this.cleanupModel(model, modelName, { [field]: { $nin: keepIds } });
  }

  async cleanupIndirectRelations() {
    console.log('\n🔗 LIMPIEZA DE MODELOS CON RELACIÓN INDIRECTA:');

    try {
      const keepCompanyIn = { $in: this.keepCompanyIdList() };

      // Padres A MANTENER (conjuntos pequeños). Se eliminan los hijos cuyo
      // padre NO esté aquí: cubre tanto los hijos de padres eliminados como los
      // huérfanos (padre inexistente), sin materializar millones de _id.
      const keptCarIds = await Car.find({ company: keepCompanyIn }).distinct('_id');
      const keptParticipantIds = await Participant.find({ company: keepCompanyIn }).distinct('_id');
      const keptInventoryIds = await Inventory.find({ company: keepCompanyIn }).distinct('_id');
      const keptRequestIds = await Request.find({ company: keepCompanyIn }).distinct('_id');
      const keptUserIds = await User.find({ company: keepCompanyIn }).distinct('_id');

      console.log(`   ℹ️  Padres a mantener → cars:${keptCarIds.length} participants:${keptParticipantIds.length} inventories:${keptInventoryIds.length} requests:${keptRequestIds.length} users:${keptUserIds.length}`);

      await this.cleanupChildrenNotIn(InventoryCar, 'InventoryCars (by car)', 'car', keptCarIds);
      await this.cleanupChildrenNotIn(StockCar, 'StockCars (by car)', 'car', keptCarIds);
      await this.cleanupChildrenNotIn(ParticipantFile, 'ParticipantFiles (by participant)', 'participant', keptParticipantIds);
      await this.cleanupChildrenNotIn(InventoryCar, 'InventoryCars (by inventory)', 'inventory', keptInventoryIds);
      await this.cleanupChildrenNotIn(InventoryFile, 'InventoryFiles (by inventory)', 'inventory', keptInventoryIds);
      await this.cleanupChildrenNotIn(RequestFile, 'RequestFiles (by request)', 'request', keptRequestIds);
      await this.cleanupChildrenNotIn(Draft, 'Drafts (by user)', 'user', keptUserIds);

      // Transmittals: mantener sólo los relacionados a requests/cars mantenidos.
      const keptTransmittalFilter = {
        $or: [{ request: { $in: keptRequestIds } }, { car: { $in: keptCarIds } }]
      };
      const keptTransmittalItemIds = await TransmittalItem.find(keptTransmittalFilter).distinct('_id');
      const keptTransmittalIds = await TransmittalItem.find(keptTransmittalFilter).distinct('transmittal');

      await this.cleanupChildrenNotIn(TransmittalItem, 'TransmittalItems (by request/car)', '_id', keptTransmittalItemIds);
      await this.cleanupChildrenNotIn(TransmittalFile, 'TransmittalFiles (by transmittal)', 'transmittal', keptTransmittalIds);
      await this.cleanupChildrenNotIn(Transmittal, 'Transmittals (by items)', '_id', keptTransmittalIds);
    } catch (error) {
      console.error('❌ Error en limpieza indirecta:', error.message);
    }
  }

  async cleanupOrphanedDocuments() {
    console.log('\n🧽 LIMPIEZA DE DOCUMENTOS HUÉRFANOS:');

    try {
      const keepCompanyIn = { $in: this.keepCompanyIdList() };
      const keptParticipantIds = await Participant.find({ company: keepCompanyIn }).distinct('_id');
      const keptCarIds = await Car.find({ company: keepCompanyIn }).distinct('_id');
      const keptInventoryIds = await Inventory.find({ company: keepCompanyIn }).distinct('_id');

      await this.cleanupChildrenNotIn(ParticipantFile, 'Orphaned ParticipantFiles', 'participant', keptParticipantIds);
      await this.cleanupChildrenNotIn(InventoryCar, 'Orphaned InventoryCars', 'car', keptCarIds);
      await this.cleanupChildrenNotIn(InventoryFile, 'Orphaned InventoryFiles', 'inventory', keptInventoryIds);
    } catch (error) {
      console.error('❌ Error en limpieza de huérfanos:', error.message);
    }
  }

  printSummary() {
    console.log('\n📋 RESUMEN DE LIMPIEZA:');
    console.log('═'.repeat(80));
    console.log('📊 Modelo'.padEnd(25) + '📄 Total'.padEnd(10) + '🎯 A Eliminar'.padEnd(15) + '✅ Eliminados'.padEnd(15) + '❌ Errores');
    console.log('─'.repeat(80));

    let totalDocuments = 0;
    let totalToDelete = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    for (const stat of this.stats) {
      console.log(
        `${stat.modelName.padEnd(25)}${stat.totalDocuments.toString().padEnd(10)}${stat.documentsToDelete.toString().padEnd(15)}${stat.deletedDocuments.toString().padEnd(15)}${stat.errors.toString()}`
      );

      totalDocuments += stat.totalDocuments;
      totalToDelete += stat.documentsToDelete;
      totalDeleted += stat.deletedDocuments;
      totalErrors += stat.errors;
    }

    console.log('─'.repeat(80));
    console.log(
      `${'TOTAL'.padEnd(25)}${totalDocuments.toString().padEnd(10)}${totalToDelete.toString().padEnd(15)}${totalDeleted.toString().padEnd(15)}${totalErrors.toString()}`
    );
    console.log('═'.repeat(80));

    if (CONFIG.DRY_RUN) {
      console.log('\n⚠️  MODO DRY RUN - No se eliminaron documentos realmente');
      console.log('💡 Para ejecutar la limpieza real, cambiar DRY_RUN: false en la configuración');
    }
  }
}

// Función principal
async function main() {
  console.log('🚀 SCRIPT DE LIMPIEZA INDEPENDIENTE - ANDES BACKEND');
  console.log('═'.repeat(60));
  console.log(`📂 Base de datos: ${CONFIG.MONGODB_URI}`);
  console.log(`🔧 Modo: ${CONFIG.DRY_RUN ? 'DRY RUN (seguro)' : 'EJECUCIÓN REAL'}`);
  console.log('═'.repeat(60));

  const cleanup = new StandaloneDataCleanup();

  try {
    await cleanup.connect();

    // Mostrar estadísticas iniciales
    await cleanup.getCompanyStats();

    // Ejecutar limpieza
    await cleanup.cleanupDirectCompanyRelations();
    await cleanup.cleanupIndirectRelations();
    await cleanup.cleanupOrphanedDocuments();

    // Mostrar resumen
    cleanup.printSummary();

  } catch (error) {
    console.error('❌ Error en el proceso de limpieza:', error.message);
    process.exit(1);
  } finally {
    await cleanup.disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = StandaloneDataCleanup;
