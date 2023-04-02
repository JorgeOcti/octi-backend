import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
// ts-node ./cli.ts up
// ts-node ./cli.ts down -l && ts-node ./cli.ts up

export class integrationConfig1680235154571 implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    // await db.createCollection('integrations');
    const integrations = db.collection('integrations');

    const integrationsData: any[] = [
      {
        updateOne: {
          filter: {
            name: 'IXnet SCHIAPPACASSE' // 'IXnet SCHIAPPACASSE revisiones'
          },
          update: {
            $set: {
              name: 'IXnet SCHIAPPACASSE',
              type: 'ixnet',
              token: '',
              config: {
                username: 'DercoInterfaceUser',
                password: 'Derc@2023intext',
                host: 'https://gpinterfacesexternas.schiappacasse.cl',
                login: '/derco/token',
                type: 'token'
              },
              actions: [
                {
                  name: 'entradas',
                  type: 'get',
                  url: '/derco/api/Interfaz/Entradas?fecha_ini=2010-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
                  //  CD LONQUÉN SCHIAPPACASSE
                  venue: '63977ffc6ea6ad00c32cfc22',
                  // INGRESO LONQUÉN
                  form: '63989dfe0000000000b837fe',
                  // EDUARDO SILVA
                  user: '61c2152bbd455b001337cbf6'
                },
                {
                  name: 'revisiones',
                  type: 'get',
                  url: '/derco/api/Interfaz/Revisiones?fecha_ini=2010-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
                  //  CD LONQUÉN SCHIAPPACASSE
                  venue: '63977ffc6ea6ad00c32cfc22',
                  // ALMACENAMIENTO LONQUÉN
                  form: '642879307e5fda82f6b9d7c8',
                  // EDUARDO SILVA
                  user: '61c2152bbd455b001337cbf6'
                }
              ]
            }
          },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: {
            name: 'IXnet TRANSAUTO' // 'IXnet TRANSAUTO revisiones'
          },
          update: {
            $set: {
              name: 'IXnet TRANSAUTO',
              token: '',
              type: 'ixnet',
              config: {
                username: 'DercoInterfaceUser',
                password: 'Derc@B2023sMintext',
                host: 'http://190.96.89.98:8084',
                login: '/derco/token',
                type: 'token'
              },
              actions: [
                {
                  name: 'entradas',
                  type: 'get',
                  url: '/derco/api/Interfaz/Entradas?fecha_ini=2010-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
                  // CD NOVICIADO TRANSAUTO
                  venue: '639780224e5d4600cc76b563',
                  //INGRESO NOVICIADO
                  form: '63989de20000000000b837a0',
                  // EDUARDO SILVA
                  user: '61c2152bbd455b001337cbf6'
                },
                {
                  name: 'revisiones',
                  type: 'get',
                  url: '/derco/api/Interfaz/Revisiones?fecha_ini=2010-03-01 09:00:00&fecha_fin=2023-03-28 14:00:00',
                  // CD NOVICIADO TRANSAUTO
                  venue: '639780224e5d4600cc76b563',
                  //ALMACENAMIENTO NOVICIADO
                  form: '642879ab7e5fda82f6b9d7c9',
                  // EDUARDO SILVA
                  user: '61c2152bbd455b001337cbf6'
                }
              ]
            }
          },
          upsert: true
        }
      }
    ];

    await integrations.bulkWrite(integrationsData);
  }

  public async down(db: Db): Promise<any> {}
}
