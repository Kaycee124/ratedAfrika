import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.prod' });

const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }, // Add this for Render
});

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect...');
    console.log('Host:', process.env.DATABASE_HOST);
    console.log('Port:', process.env.DATABASE_PORT);
    console.log('User:', process.env.DATABASE_USER);
    console.log('Database:', process.env.DATABASE_NAME);

    await client.connect();
    console.log('✅ Connection successful!');

    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);

    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
  }
}

testConnection();
