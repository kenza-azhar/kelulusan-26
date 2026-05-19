import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export const sql = neon(process.env.DATABASE_URL);

export interface Student {
  id: number;
  nisn: string;
  nama: string;
  password_hash: string;
  status_kelulusan: 'LULUS' | 'TIDAK LULUS';
  keterangan?: string;
  link_pdf?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  fullname: string;
  role: 'Admin' | 'Super Admin';
  created_at: Date;
  updated_at: Date;
}

export interface Settings {
  id: number;
  nama_madrasah: string;
  tahun_ajaran: string;
  logo_madrasah: string;
  alamat: string;
  kota: string;
  id_folder_drive?: string;
  countdown_time: Date;
  created_at: Date;
  updated_at: Date;
}

export async function initializeDatabase() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        nama_madrasah VARCHAR(255) NOT NULL DEFAULT 'MAN 1 Ciamis',
        tahun_ajaran VARCHAR(50) NOT NULL DEFAULT '2025/2026',
        logo_madrasah TEXT NOT NULL DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg',
        alamat TEXT NOT NULL DEFAULT 'Jl. Contoh No. 123',
        kota VARCHAR(100) NOT NULL DEFAULT 'Ciamis',
        id_folder_drive VARCHAR(255),
        countdown_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fullname VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        nisn VARCHAR(20) UNIQUE NOT NULL,
        nama VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status_kelulusan VARCHAR(20) NOT NULL DEFAULT 'TIDAK LULUS',
        keterangan TEXT,
        link_pdf TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const adminCount = await sql`SELECT COUNT(*) as count FROM admins`;
    if (adminCount[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Min1ciamis!', 10);
      
      await sql`
        INSERT INTO admins (username, password_hash, fullname, role)
        VALUES ('admin', ${hashedPassword}, 'Super Admin', 'Super Admin')
      `;
    }

    const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
    if (settingsCount[0].count === 0) {
      const defaultCountdown = new Date();
      defaultCountdown.setDate(defaultCountdown.getDate() + 30);
      
      await sql`
        INSERT INTO settings (nama_madrasah, tahun_ajaran, logo_madrasah, alamat, kota, countdown_time)
        VALUES (
          'MAN 1 Ciamis',
          '2025/2026',
          'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg',
          'Jl. Veteran No. 38',
          'Ciamis',
          ${defaultCountdown.toISOString()}
        )
      `;
    }

    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
