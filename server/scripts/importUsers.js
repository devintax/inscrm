import { MongoClient, ObjectId } from 'mongodb';

const required = ['MONGODB_URI', 'MONGODB_DATABASE', 'USER_MIGRATION_B64'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing user migration configuration: ${missing.join(', ')}`);
}

if (process.env.USER_MIGRATION_ALLOW_INSERT !== 'true') {
  throw new Error('Set USER_MIGRATION_ALLOW_INSERT=true to authorize additive user import');
}

const payload = JSON.parse(Buffer.from(process.env.USER_MIGRATION_B64, 'base64').toString('utf8'));
if (!Array.isArray(payload)) throw new Error('USER_MIGRATION_B64 must contain a JSON array');

const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DATABASE).collection('users');
  let inserted = 0;
  let skipped = 0;

  for (const sourceUser of payload) {
    const emailAddress = String(sourceUser.emailAddress || '').trim().toLowerCase();
    if (!emailAddress || !sourceUser.password || !sourceUser.firstName || !sourceUser.lastName) {
      throw new Error('Source user is missing a required identity or password field');
    }

    const existing = await users.findOne({
      emailAddress: { $regex: `^${emailAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await users.insertOne({
      ...sourceUser,
      _id: sourceUser._id instanceof ObjectId ? sourceUser._id : new ObjectId(sourceUser._id),
      emailAddress,
      deleted: sourceUser.deleted === true,
    });
    inserted += 1;
  }

  console.log(JSON.stringify({ source: payload.length, inserted, skipped }));
} finally {
  await client.close();
}
