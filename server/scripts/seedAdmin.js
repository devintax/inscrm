import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from '../db/connectdb';
import User from '../model/User';

dotenv.config();

const required = ['MONGODB_URI', 'MONGODB_DATABASE', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  throw new Error(`Missing required variables: ${missing.join(', ')}`);
}

const seed = async () => {
  await connectDB(process.env.MONGODB_URI, process.env.MONGODB_DATABASE);
  const existing = await User.findOne({ emailAddress: process.env.ADMIN_EMAIL });
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  const values = {
    firstName: process.env.ADMIN_FIRST_NAME || 'System',
    lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
    emailAddress: process.env.ADMIN_EMAIL,
    password,
    role: 'admin',
    deleted: false,
  };

  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: values });
    console.log('Admin user updated');
  } else {
    await User.create(values);
    console.log('Admin user created');
  }

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
