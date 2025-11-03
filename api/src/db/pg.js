//Setting up pg connection

import { Pool } from 'pg';
import { env } from '../config/env.js';

export const pg = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  max: 10,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

//helper to run query
export async function query(text, params) {
   try {
    const res = await pg.query(text, params);
    return res.rows;
  } catch (err) {
    console.error("❌  Query failed:", text, "\n📦 Params:", params, "\n🧠 Error:", err.message);
    throw err; // <-- make sure we re-throw so Express can see it
  }
}