/**
 * Vercel Serverless API Route — MongoDB Atlas Sync (/api/gym)
 * Reads process.env.MONGODB_URI (auto-injected by Vercel Storage -> MongoDB Atlas).
 * Stores each entity table as its own MongoDB collection:
 *   - membership_plan
 *   - member
 *   - penalty_rule
 *   - fee_due
 *   - payment
 */

import { MongoClient } from 'mongodb';
import { createInitialData } from '../src/js/seed.js';

const COLLECTIONS = [
  'membership_plan',
  'member',
  'penalty_rule',
  'fee_due',
  'payment',
  'attendance'
];

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (!globalThis.__afMongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000
    });
    globalThis.__afMongoClientPromise = client.connect().catch((err) => {
      globalThis.__afMongoClientPromise = null;
      throw err;
    });
  }
  return globalThis.__afMongoClientPromise;
}

function stripMongoId(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const { _id, ...rest } = doc;
  return rest;
}

async function seedIfEmpty(db) {
  const seed = createInitialData({
    graceDays: process.env.VITE_DEFAULT_GRACE_DAYS ?? 5,
    penaltyPerDay: process.env.VITE_DEFAULT_PENALTY_PER_DAY ?? 10,
    maxPenalty: process.env.VITE_DEFAULT_MAX_PENALTY ?? 500
  });

  for (const name of COLLECTIONS) {
    const col = db.collection(name);
    const count = await col.countDocuments();
    if (count === 0) {
      const docs = seed[name];
      if (Array.isArray(docs) && docs.length > 0) {
        await col.insertMany(docs.map((d) => ({ ...d })));
      }
    }
  }
}

async function readAllCollections(db) {
  const result = {};
  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    result[name] = docs.map(stripMongoId);
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const clientPromise = getClientPromise();
  if (!clientPromise) {
    return res.status(503).json({
      connected: false,
      error: 'MONGODB_URI is not configured on the server.'
    });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || 'gym_db';
    const db = client.db(dbName);

    if (req.method === 'GET') {
      await seedIfEmpty(db);
      const data = await readAllCollections(db);
      return res.status(200).json({
        connected: true,
        database: dbName,
        data
      });
    }

    if (req.method === 'PUT') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ ok: false, error: 'Invalid JSON payload.' });
      }

      for (const name of COLLECTIONS) {
        if (!Array.isArray(payload[name])) {
          return res.status(400).json({ ok: false, error: `Missing or invalid collection array: ${name}` });
        }
      }

      for (const name of COLLECTIONS) {
        const col = db.collection(name);
        const docs = payload[name].map(stripMongoId);
        await col.deleteMany({});
        if (docs.length > 0) {
          await col.insertMany(docs);
        }
      }

      return res.status(200).json({
        ok: true,
        database: dbName,
        syncedAt: new Date().toISOString()
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error('MongoDB API error:', err);
    return res.status(500).json({
      connected: false,
      error: err?.message || 'Database operation failed.'
    });
  }
}
