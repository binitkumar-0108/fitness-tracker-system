import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function check() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Using DATABASE_URL:", connectionString ? connectionString.replace(/:[^@]+@/, ':***@') : "None");
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("CONNECTED successfully!");
    const res = await client.query("SELECT * FROM users;");
    console.log("Users:", res.rows);
    const profiles = await client.query("SELECT * FROM health_profiles;");
    console.log("Health Profiles:", profiles.rows);
    await client.end();
  } catch (e) {
    console.error("Error connecting or querying:", e.message);
  }
}

check();
