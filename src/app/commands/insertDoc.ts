import * as mongoose from 'mongoose';
import * as bluebird from "bluebird";
import InvoiceTeamBilling from "../../billing/models/invoiceTeamBilling.module";

const MONGODB_URI: string = '';


async function insertDoc() {

  (mongoose as any).Promise = bluebird;
  await mongoose.connect(MONGODB_URI, {  });
  mongoose.set('strictQuery', true);
  mongoose.set('debug', true);

  // _id: new mongoose.Types.ObjectId("65132c4d8446fd4d71a4b28d")
  // updatedAt: new Date("2023-09-26T19:55:19.615Z"),
  const doc = {};
  // Insert doc in collection named invoiceteambillings

  await InvoiceTeamBilling.create(doc);

  console.log("Done")
}

insertDoc();
