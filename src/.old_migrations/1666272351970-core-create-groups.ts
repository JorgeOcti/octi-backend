import * as mongoose from 'mongoose';

mongoose.set('strictQuery', false);
mongoose.set('debug', true);

/*
* Migration: core-create-groups
* npm exec migrate up core-create-groups
* npm exec migrate down core-create-groups
* */

// Make any changes you need to make to the database here
export async function up() {
  await this.connect(mongoose);
}

// Make any changes that UNDO the up function side effects here (if possible)
export async function down() {
  await this.connect(mongoose);
}
