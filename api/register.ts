import { sql } from './db';
import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nisn, nama, password } = req.body as { nisn?: string; nama?: string; password?: string };

    if (!nisn || !nama || !password) {
      return res.status(400).json({ error: 'NISN, nama, dan password wajib diisi.' });
    }

    const existing = await sql`SELECT id FROM students WHERE nisn = ${nisn}`;
    if (existing.length > 0) {
      return res.status(400).json({ error: 'NISN sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO students (nisn, nama, password_hash, status_kelulusan)
      VALUES (${nisn}, ${nama}, ${passwordHash}, 'TIDAK LULUS')
    `;

    return res.status(201).json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
