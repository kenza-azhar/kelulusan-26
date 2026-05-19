import { sql } from './db';
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string; fullname: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const settings = await sql`SELECT * FROM settings ORDER BY id DESC LIMIT 1`;
      
      if (settings.length === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }

      return res.status(200).json({
        success: true,
        settings: settings[0]
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const user = authenticateToken(req);
      
      if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const {
        nama_madrasah,
        tahun_ajaran,
        logo_madrasah,
        alamat,
        kota,
        id_folder_drive,
        countdown_time
      } = req.body;

      if (!nama_madrasah || !tahun_ajaran || !alamat || !kota || !countdown_time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingSettings = await sql`SELECT id FROM settings ORDER BY id DESC LIMIT 1`;
      
      let result;
      if (existingSettings.length > 0) {
        result = await sql`
          UPDATE settings SET
            nama_madrasah = ${nama_madrasah},
            tahun_ajaran = ${tahun_ajaran},
            logo_madrasah = ${logo_madrasah},
            alamat = ${alamat},
            kota = ${kota},
            id_folder_drive = ${id_folder_drive || null},
            countdown_time = ${countdown_time},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingSettings[0].id}
          RETURNING *
        `;
      } else {
        result = await sql`
          INSERT INTO settings (
            nama_madrasah, tahun_ajaran, logo_madrasah, alamat, kota,
            id_folder_drive, countdown_time
          ) VALUES (
            ${nama_madrasah}, ${tahun_ajaran}, ${logo_madrasah}, ${alamat}, ${kota},
            ${id_folder_drive || null}, ${countdown_time}
          )
          RETURNING *
        `;
      }

      return res.status(200).json({
        success: true,
        settings: result[0]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
