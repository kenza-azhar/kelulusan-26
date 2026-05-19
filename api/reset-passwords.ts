import { sql } from './db.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string; fullname: string };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = authenticateToken(req);
  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }

  const { target, newPassword, studentId, nisn } = req.body as {
    target?: 'admin' | 'students' | 'student';
    newPassword?: string;
    studentId?: number;
    nisn?: string;
  };

  if (!target) {
    return res.status(400).json({ error: 'Target is required' });
  }

  const password = newPassword?.trim() || 'Min1ciamis!';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (target === 'admin') {
      await sql`
        UPDATE admins
        SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      `;

      return res.status(200).json({ success: true, message: 'Password admin berhasil direset.' });
    }

    if (target === 'students') {
      await sql`
        UPDATE students
        SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
      `;

      return res.status(200).json({ success: true, message: 'Password semua siswa berhasil direset.' });
    }

    if (target === 'student') {
      if (!studentId && !nisn) {
        return res.status(400).json({ error: 'studentId atau nisn wajib diisi' });
      }

      const result = studentId
        ? await sql`
            UPDATE students
            SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${studentId}
            RETURNING id
          `
        : await sql`
            UPDATE students
            SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
            WHERE nisn = ${nisn}
            RETURNING id
          `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Siswa tidak ditemukan' });
      }

      return res.status(200).json({ success: true, message: 'Password siswa berhasil direset.' });
    }

    return res.status(400).json({ error: 'Target tidak valid' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
