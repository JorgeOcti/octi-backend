import * as bluebird from 'bluebird';
import * as mongoose from 'mongoose';
import * as path from "path";
import * as dotenv from "dotenv";
import FormModel from "../models/form.model";

async function addAccesories() {
  dotenv.config({
    path: path.join(__dirname, '../../../.env')
  });
  const MONGODB_URI: string = process.env.MONGODB_URI || '';
  await mongoose.connect(MONGODB_URI, {useMongoClient: true});
  (mongoose as any).Promise = bluebird;
  // form 5b0487db835536612bab1b61
  // section 5b0487db835536612bab1b65
  // question 5b0487db835536612bab1b66
  const form = await FormModel.findById('5b0487db835536612bab1b61');
  if(form){
    form.sections.forEach((section)=>{
      section.questions.forEach((question)=>{
        if(question._id.toString() === '5b0487db835536612bab1b66'){
          (question as any).accessories = {
            question:'prueba',
            items:[{
              item:'Manual usuario'
            },{
              item:'Póliza de garantía'
            },{
              item:'Copia de llaves (2)'
            },{
              item:'Logo patente'
            },{
              item:'Bolso de herramientas'
            },{
              item:'porta documentos'
            }]
          };
          // question.save();
          console.log('question', JSON.stringify(question));
        }
      })
    });
    form.save();
  }
  process.exit(1);
}

addAccesories();
