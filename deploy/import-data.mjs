// Loads a file made by export-data.mjs into MongoDB on the VPS.
//   node --env-file=server/.env deploy/import-data.mjs <file> [--replace]
// Collections that already have documents are skipped, so it is safe to run twice;
// --replace empties them first (use it to overwrite the starter jobs/projects).
import fs from 'node:fs';
import { BSON, MongoClient } from 'mongodb';

const { EJSON } = BSON;

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node --env-file=server/.env deploy/import-data.mjs <file> [--replace]');
  process.exit(1);
}
const replace = flag === '--replace';
const { MONGODB_URI = 'mongodb://localhost:27017', MONGODB_DB = 'cybervex' } = process.env;

const data = EJSON.parse(fs.readFileSync(file, 'utf8'), { relaxed: false });
const client = await MongoClient.connect(MONGODB_URI);
const db = client.db(MONGODB_DB);

for (const [name, docs] of Object.entries(data)) {
  const collection = db.collection(name);
  const existing = await collection.countDocuments();
  if (existing && !replace) {
    console.log(`${name}: skipped (already has ${existing}; use --replace to overwrite)`);
    continue;
  }
  if (existing) await collection.deleteMany({});
  if (docs.length) await collection.insertMany(docs, { ordered: false });
  console.log(`${name}: ${docs.length} imported`);
}
await client.close();
console.log('\nDone. Restart the site: systemctl restart cybervex');
