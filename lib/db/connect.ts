import mongoose from "mongoose";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const DATABASE_URL: string = process.env.DATABASE_URL;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cached across hot-reloads in dev so we don't open a new connection per request.
declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(DATABASE_URL, { bufferCommands: false });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
