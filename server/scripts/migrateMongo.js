import { MongoClient } from 'mongodb';

const required = ['SOURCE_MONGODB_URI', 'SOURCE_MONGODB_DATABASE', 'MONGODB_URI', 'MONGODB_DATABASE'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing migration configuration: ${missing.join(', ')}`);
}

if (process.env.MIGRATION_ALLOW_TARGET_REPLACE !== 'true') {
  throw new Error('Set MIGRATION_ALLOW_TARGET_REPLACE=true to authorize replacing target collections');
}

const source = new MongoClient(process.env.SOURCE_MONGODB_URI);
const target = new MongoClient(process.env.MONGODB_URI);

try {
  await Promise.all([source.connect(), target.connect()]);
  const sourceDb = source.db(process.env.SOURCE_MONGODB_DATABASE);
  const targetDb = target.db(process.env.MONGODB_DATABASE);
  const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();

  for (const { name } of collections) {
    const sourceCollection = sourceDb.collection(name);
    const targetCollection = targetDb.collection(name);
    const documents = await sourceCollection.find({}).toArray();
    const indexes = await sourceCollection.indexes();

    await targetCollection.deleteMany({});
    if (documents.length) await targetCollection.insertMany(documents, { ordered: false });

    for (const index of indexes.filter((entry) => entry.name !== '_id_')) {
      const { key, name: indexName, unique, sparse, expireAfterSeconds } = index;
      await targetCollection.createIndex(key, {
        name: indexName,
        ...(unique !== undefined && { unique }),
        ...(sparse !== undefined && { sparse }),
        ...(expireAfterSeconds !== undefined && { expireAfterSeconds }),
      });
    }

    console.log(`Migrated ${name}: ${documents.length}`);
  }
} finally {
  await Promise.allSettled([source.close(), target.close()]);
}
