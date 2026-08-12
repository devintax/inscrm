import mongoose from "mongoose";
const connectDB = async (DATABASE_URL,DB_NAME) => {
	const DB_OPTIONS = { dbName: DB_NAME };
	mongoose.set("strictQuery", false);
	await mongoose.connect(DATABASE_URL, DB_OPTIONS);
	console.log("Database connected successfully");
}

export default connectDB;
