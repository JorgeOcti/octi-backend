import getModels from './migrationModels';
/*
 * Migration: integration-configs
 * npm exec migrate up integration-configs
 * npm exec migrate down integration-configs
 * */

// Make any changes you need to make to the database here
export async function up() {
  const { Integration } = await getModels();
  //   new Integration();
  // }
  // await this.connect(mongoose);
  const integrations: any[] = [
    {
      updateOne: {
        filter: {
          name: 'IXnet SCHIAPPACASSE' // 'IXnet SCHIAPPACASSE revisiones'
        },

        update: {
          name: 'IXnet SCHIAPPACASSE',
          config: {
            username: 'DercoInterfaceUser',
            password: 'Derc@2023intext',
            host: 'https://gpinterfacesexternas.schiappacasse.cl',
            login: '/derco/token',
            type: 'token'
          },
          action: [
            {
              name: 'entradas',
              type: 'get',
              url: '/derco/api/Interfaz/Entradas?fecha_ini=2023-02-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
              venue: '5f9f1b0b0e1b9c0004e1b0a1',
              form: '5f9f1b0b0e1b9c0004e1b0a2',
              user: '5f9f1b0b0e1b9c0004e1b0a3'
            },
            {
              name: 'revisiones',
              type: 'get',
              url: '/derco/api/Interfaz/Revisiones?fecha_ini=2023-02-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
              venue: '5f9f1b0b0e1b9c0004e1b0a1',
              form: '5f9f1b0b0e1b9c0004e1b0a2',
              user: '5f9f1b0b0e1b9c0004e1b0a3'
            }
          ]
        },
        upsert: true
      }
    },
    {
      updateOne: {
        filter: {
          name: 'IXnet SCHIAPPACASSE' // 'IXnet SCHIAPPACASSE revisiones'
        },
        update: {
          name: 'IXnet SCHIAPPACASSE',
          config: {
            username: 'DercoInterfaceUser',
            password: 'Derc@B2023sMintext',
            host: 'http://190.96.89.98:8084',
            login: '/derco/token',
            type: 'token'
          },
          action: [
            {
              type: 'entradas',
              url: '/derco/api/Interfaz/Entradas?fecha_ini=2010-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
              venue: '5f9f1b0b0e1b9c0004e1b0a1',
              form: '5f9f1b0b0e1b9c0004e1b0a2',
              user: '5f9f1b0b0e1b9c0004e1b0a3'
            },
            {
              type: 'revisiones',
              url: '/derco/api/Interfaz/Revisiones?fecha_ini=2020-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
              venue: '5f9f1b0b0e1b9c0004e1b0a1',
              form: '5f9f1b0b0e1b9c0004e1b0a2',
              user: '5f9f1b0b0e1b9c0004e1b0a3'
            }
          ]
        },
        upsert: true
      }
    }
  ];
  await Integration.bulkWrite(integrations);
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  // await this.connect(mongoose);
}
