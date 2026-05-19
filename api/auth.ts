import { sql } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const students = await sql`
      SELECT id, nisn, nama, password_hash, status_kelulusan, keterangan, link_pdf
      FROM students WHERE nisn = ${username}
    `;

    if (students.length > 0) {
      const student = students[0];
      const isValidPassword = await bcrypt.compare(password, student.password_hash);

      if (isValidPassword) {
        const token = jwt.sign(
          { id: student.id, username: student.nisn, role: 'Siswa', fullname: student.nama },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          success: true,
          token,
          user: {
            id: student.id,
            username: student.nisn,
            fullname: student.nama,
            role: 'Siswa'
          },
          result: {
            nisn: student.nisn,
            nama: student.nama,
            status_kelulusan: student.status_kelulusan,
            keterangan: student.keterangan,
            link_pdf: student.link_pdf
          }
        });
      }
    }

    const admins = await sql`
      SELECT id, username, password_hash, fullname, role
      FROM admins WHERE username = ${username}
    `;

    if (admins.length > 0) {
      const admin = admins[0];
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (isValidPassword) {
        const token = jwt.sign(
          { id: admin.id, username: admin.username, role: admin.role, fullname: admin.fullname },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          success: true,
          token,
          user: {
            id: admin.id,
            username: admin.username,
            fullname: admin.fullname,
            role: admin.role
          }
        });
      }
    }

    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
