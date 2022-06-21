import * as bluebird from 'bluebird';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import * as path from 'path';
import Request from '../../models/request.model';

async function migrateSalfa() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.set('debug', true);
  try {
    const data = {"cars":[{"key":"541aa6ef-bd74-41d9-a337-2f97b0ec7961","reason":"5fe0930aa9683b0f8a6e0e42","brand":"chevrolet","denomination":"ONIX","material":"962910","answersbkp":[],"answers":[],"files":[],"color":"AZUL"}],"channel":"607505c4c959ac0011fd41ca","venue":"5e480500dd83df26d119e306","sellerText":"Edgard Matías Martínez","advancePaymentInformation":{"method":"622a0f2a3712d900109e69e5","number":"5215036","files":[{"url":"https://media-andes-stage.s3-sa-east-1.amazonaws.com/request/files/5bf2de35caf8ef7096105cdd/6b792580-bcca-11ec-baf1-ffefd7aea480-9b2ac343-9f83-4303-9399-b5d453372408.pdf","tmpID":"901d13a7-34b0-4755-b186-c6a9c20617f1","progress":100,"isImage":false,"status":"complete","_id":"62598493a39378001135e05b"}],"letters":[{"url":"https://media-andes-stage.s3-sa-east-1.amazonaws.com/request/files/5bf2de35caf8ef7096105cdd/70d6e530-bcca-11ec-ae59-ed28be528183-carta%20firmada.pdf","tmpID":"07a083d4-a6b8-4cd6-89aa-5469cd41ecea","progress":100,"isImage":false,"status":"complete","_id":"6259849c0359320013f76990"}]},"customerInformation":{"rut":"5270628-9","name":"ROMELIO DEL CARMEN QUILODRAN RIQUELME","email":"Tatyquilodran@gmail.com"},"deliveryVenue":"5e480500dd83df26d119e306","deliveryAddress":"HUANHUALI #191","conectaID":"91494"};
    await Request.findOneAndUpdate({ number: 14983, team: '5bf2de35caf8ef7096105cdd' }, {
      $set: {
        advancePaymentInformation:{
          method: data.advancePaymentInformation.method,
          otherMethod: '',
          letters: [data.advancePaymentInformation.letters[0]._id],
          files: [data.advancePaymentInformation.files[0]._id],
          number: data.advancePaymentInformation.number
        },
        customerInformation: {
          rut: data.customerInformation.rut,
          name: data.customerInformation.name,
          email: data.customerInformation.email,
          phone: ''
        }
      }
    });
  } catch (e) {
    console.log('Ha ocurrido un error en migrateSalfa');
    console.log('error:', e);
  }
  await process.exit(1);
}

migrateSalfa();
