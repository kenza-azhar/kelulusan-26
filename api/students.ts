import { sql } from './db.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const user = authenticateToken(req);
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (user.role === 'Siswa') {
        const students = await sql`
          SELECT id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
          FROM students WHERE nisn = ${user.username}
        `;
        return res.status(200).json({ success: true, students });
      }

      if (user.role === 'Admin' || user.role === 'Super Admin') {
        const { search, page = '1', limit = '50' } = req.query;
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        let students;
        let total;

        if (search) {
          const searchTerm = `%${search}%`;
          students = await sql`
            SELECT id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
            FROM students
            WHERE nisn ILIKE ${searchTerm} OR nama ILIKE ${searchTerm}
            ORDER BY nisn ASC
            LIMIT ${parseInt(limit as string)} OFFSET ${offset}
          `;
          
          const countResult = await sql`
            SELECT COUNT(*) as total
            FROM students
            WHERE nisn ILIKE ${searchTerm} OR nama ILIKE ${searchTerm}
          `;
          total = parseInt(countResult[0].total);
        } else {
          students = await sql`
            SELECT id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
            FROM students
            ORDER BY nisn ASC
            LIMIT ${parseInt(limit as string)} OFFSET ${offset}
          `;
          
          const countResult = await sql`SELECT COUNT(*) as total FROM students`;
          total = parseInt(countResult[0].total);
        }

        return res.status(200).json({
          success: true,
          students,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        });
      }

      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.method === 'POST') {
      const user = authenticateToken(req);
      
      if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const { nisn, nama, password, status_kelulusan, keterangan, link_pdf } = req.body;

      if (!nisn || !nama) {
        return res.status(400).json({ error: 'NISN and nama are required' });
      }

      const existingStudent = await sql`SELECT id, password_hash FROM students WHERE nisn = ${nisn}`;
      if (existingStudent.length > 0) {
        let passwordHash = existingStudent[0].password_hash;
        if (password) {
          passwordHash = await bcrypt.hash(password, 10);
        }

        const result = await sql`
          UPDATE students SET
            nama = ${nama},
            password_hash = ${passwordHash},
            status_kelulusan = ${status_kelulusan || 'TIDAK LULUS'},
            keterangan = ${keterangan || ''},
            link_pdf = ${link_pdf || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingStudent[0].id}
          RETURNING id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
        `;

        return res.status(200).json({
          success: true,
          student: result[0],
          message: 'Student updated'
        });
      }

      if (!password) {
        return res.status(400).json({ error: 'Password is required for new student' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await sql`
        INSERT INTO students (nisn, nama, password_hash, status_kelulusan, keterangan, link_pdf)
        VALUES (${nisn}, ${nama}, ${passwordHash}, ${status_kelulusan || 'TIDAK LULUS'}, ${keterangan || ''}, ${link_pdf || ''})
        RETURNING id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
      `;

      return res.status(201).json({
        success: true,
        student: result[0]
      });
    }

    if (req.method === 'PUT') {
      const user = authenticateToken(req);
      
      if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const { id, nisn, nama, password, status_kelulusan, keterangan, link_pdf } = req.body;

      if (!id || !nisn || !nama) {
        return res.status(400).json({ error: 'ID, NISN, and nama are required' });
      }

      const existingStudent = await sql`SELECT id, password_hash FROM students WHERE id = ${id}`;
      if (existingStudent.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      let passwordHash = existingStudent[0].password_hash;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const result = await sql`
        UPDATE students SET
          nisn = ${nisn},
          nama = ${nama},
          password_hash = ${passwordHash},
          status_kelulusan = ${status_kelulusan || 'TIDAK LULUS'},
          keterangan = ${keterangan || ''},
          link_pdf = ${link_pdf || ''},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, nisn, nama, status_kelulusan, keterangan, link_pdf, created_at, updated_at
      `;

      return res.status(200).json({
        success: true,
        student: result[0]
      });
    }

    if (req.method === 'DELETE') {
      const user = authenticateToken(req);
      
      if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      const existingStudent = await sql`SELECT id FROM students WHERE id = ${parseInt(id as string)}`;
      if (existingStudent.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      await sql`DELETE FROM students WHERE id = ${parseInt(id as string)}`;

      return res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Students API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
