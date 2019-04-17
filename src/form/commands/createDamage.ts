import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
// import Damages from '../models/damages.model';
import Kind from '../models/kind.model';
import Part from '../models/part.model';
import Position from '../models/position.model';

async function createDamage() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  mongoose.set('debug', true);
  console.log('create parts');
  const team = '5bedd18038e3505bbda8f865';
  const parts = ['CAPOT', 'COMPUERTA DE MALETERO', 'PARACHOQUE DELANTERO', 'PARACHOQUE TRASERO', 'REJILLA DE PARACHOQUE DELANTERO', 'GUARDABARRO DELANTERO', 'GUARDABARRO TRASERO', 'PUERTA DELANTERA', 'PUERTA TRASERA', 'MARCO DE PUERTA DELANTERA', 'MARCO DE PUERTA TRASERA', 'MOLDURA DE PUERTA DELANTERA', 'MOLDURA DE PUERTA TRASERA', 'TECHO', 'ZOCALO DE PUERTA DELANTERA', 'ZOCALO DE PUERTA TRASERA', 'PARABRISAS DELANTERO', 'PARABRISAS TRASERO', 'CARCASA DE RETROVISOR', 'ESPEJO RETROVISOR', 'PORTA PARRILLA', 'VIDRIO PUERTA DELANTERA', 'VIDRIO PUERTA TRASERA', 'VIDRIO DE TRINGULO PUERTA TRASERA', 'MARCO VENTANA TRASERA', 'MARCO VENTANA DELANTERA', 'ALOJENO', 'STOP TRASERA EXTERNO', 'STOP TRASERA INTERNO', 'FAROL', 'ARO DELANTERO', 'ARO TRASERO', 'LLANTA DE AUXILIO', 'COLA DE PATO', 'EMBLEMA TRASERO', 'EMBLEMA DELANTERO', 'GANCHO DE REMOLQUE', 'PECHERA', 'BARRA ANTIVUELQUE', 'JALADOR DE PUERTA TRASERO', 'JALADOR DE PUERTA DELANTERO', 'BASE DE ANTENA', 'COBERTOR LLANTA DE AUXILIO', 'GUIÑADOR DE GUARDABARRO', 'GUIÑADOR DE RETROVISOR', 'REFLECTOR OJO DE GATO', 'TAPA DE REMOLQUE', 'CROMADO DELANTERO', 'CROMADO TRASERO', 'TORPEDO', 'MANUBRIO', 'PALANCA', 'MOLDURA INTERNA DE PUERTA DELANTERO', 'MOLDURA INTERNA DE PUERTA TRASERO', 'CONSOLA CENTRAL', 'ASIENTO DELANTERO', 'ASIENTO TRASERO', 'TECHO INTERIOR', 'INTERIOR MALETERO', 'COBERTOR MALETERO', 'INTERIOR MOTOR', 'CARROCERIA', 'COBERTOR DE CARROCERIA']
  for (const name of parts) {
    if (!await Part.findOne({team, name})) {
      console.log(`created.`);
      await new Part({
        team,
        name
      }).save();
    }
  }
  console.log('create kinds');
  const kinds = ['ABOLLADO / SUMIDO', 'RAYADO', 'RASPADO', 'FROTADO', 'PIQUETE', 'QUEBRADO'];
  for (const name of kinds) {
    if (!await Kind.findOne({team, name})) {
      console.log(`created.`);
      await new Kind({
        team,
        name
      }).save();
    }
  }
  console.log('create positions');
  const positions = ['IZQUIERDA', 'DERECHA', 'ARRIBA', 'ABAJO'];
  for (const name of positions) {
    if (!await Position.findOne({team, name})) {
      console.log(`created.`);
      await new Position({
        team,
        name
      }).save();
    }
  }
  // const damages = new Damages({
  //   name: 'Prueba',
  //   team,
  //   parts: await Part.find({team}, {_id: true}),
  //   kinds: await Kind.find({team}, {_id: true}),
  //   positions: await Position.find({team}, {_id: true})
  // });
  // await damages.save();
  process.exit(1);
}

createDamage();
