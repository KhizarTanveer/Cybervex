// Exports the site's MongoDB data (jobs, projects + uploaded images, applications + resumes,
// contact messages, settings) to one file, for moving it to the VPS with import-data.mjs.
//   node deploy/export-data.mjs [output file]        (default: cybervex-data.json)
// Uses MONGODB_URI / MONGODB_DB like the server (defaults: local MongoDB, database "cybervex").
// The file contains applicants' personal data — keep it private and delete it after importing.
import fs from 'node:fs';
import { BSON, MongoClient } from 'mongodb';

const { EJSON } = BSON;

const { MONGODB_URI = 'mongodb://localhost:27017', MONGODB_DB = 'cybervex' } = process.env;
const out = process.argv[2] || 'cybervex-data.json';

const client = await MongoClient.connect(MONGODB_URI);
const db = client.db(MONGODB_DB);
const data = {};
for (const { name } of await db.listCollections().toArray()) {
  if (name.startsWith('system.')) continue;
  data[name] = await db.collection(name).find().toArray();
  console.log(`${name}: ${data[name].length}`);
}
await client.close();

// Extended JSON keeps ObjectIds, dates and binary file data exactly as they are
fs.writeFileSync(out, EJSON.stringify(data, { relaxed: false }));
console.log(`\nSaved ${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB to ${out}`);
