import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { fetchJson } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Student {
  id: number;
  nisn: string;
  nama: string;
  status_kelulusan: 'LULUS' | 'TIDAK LULUS';
  keterangan?: string;
  link_pdf?: string;
}

interface Settings {
  nama_madrasah: string;
  tahun_ajaran: string;
  logo_madrasah: string;
  alamat: string;
  kota: string;
  countdown_time: string;
  id_folder_drive: string;
  theme_color?: string;
}

interface AdminDashboardProps {
  settings: Settings | null;
}

function DashboardHome() {
  const [stats, setStats] = useState({ total: 0, lulus: 0, tidakLulus: 0 });
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchStats();

    const handleUpdate = () => {
      fetchStats();
    };

    window.addEventListener('students-updated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('students-updated', handleUpdate as EventListener);
    };
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');

    if (token === 'demo-token') {
      const stored = localStorage.getItem('demoStudents');
      const demoStudents: Student[] = stored
        ? JSON.parse(stored)
        : [
            { id: 1, nisn: '1234567890', nama: 'Ahmad Siswa', status_kelulusan: 'LULUS', keterangan: 'Sangat baik', link_pdf: '' },
            { id: 2, nisn: '1234567891', nama: 'Siti Nurhaliza', status_kelulusan: 'LULUS', keterangan: 'Baik', link_pdf: '' },
            { id: 3, nisn: '1234567892', nama: 'Budi Santoso', status_kelulusan: 'TIDAK LULUS', keterangan: 'Perlu perbaikan', link_pdf: '' }
          ];
      const lulus = demoStudents.filter((student) => student.status_kelulusan === 'LULUS').length;
      const tidakLulus = demoStudents.length - lulus;
      setRecentStudents(demoStudents.slice(0, 5));
      setStats({ total: demoStudents.length, lulus, tidakLulus });
      return;
    }

    try {
      const { data } = await fetchJson(`${API_URL}/students?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (data && (data as any).success) {
        setRecentStudents((data as any).students);
        
        const allResult = await fetchJson(`${API_URL}/students?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        const allData = allResult.data as any;
        if (allData?.success) {
          const total = allData.pagination.total;
          const lulus = allData.students.filter((s: Student) => s.status_kelulusan === 'LULUS').length;
          const tidakLulus = total - lulus;
          
          setStats({ total, lulus, tidakLulus });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Siswa</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Lulus</p>
              <p className="text-2xl font-bold text-green-600">{stats.lulus}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tidak Lulus</p>
              <p className="text-2xl font-bold text-red-600">{stats.tidakLulus}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Siswa Terbaru</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-600 border-b">
                  <th className="pb-3">NISN</th>
                  <th className="pb-3">Nama</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100">
                    <td className="py-3">{student.nisn}</td>
                    <td className="py-3">{student.nama}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        student.status_kelulusan === 'LULUS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status_kelulusan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSiswa() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [demoData, setDemoData] = useState<Student[]>([
    { id: 1, nisn: '1234567890', nama: 'Ahmad Siswa', status_kelulusan: 'LULUS', keterangan: 'Sangat baik', link_pdf: '' },
    { id: 2, nisn: '1234567891', nama: 'Siti Nurhaliza', status_kelulusan: 'LULUS', keterangan: 'Baik', link_pdf: '' },
    { id: 3, nisn: '1234567892', nama: 'Budi Santoso', status_kelulusan: 'TIDAK LULUS', keterangan: 'Perlu perbaikan', link_pdf: '' }
  ]);
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    password: '',
    status_kelulusan: 'LULUS' as 'LULUS' | 'TIDAK LULUS',
    keterangan: '',
    link_pdf: ''
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notifyStudentsUpdated = () => {
    window.dispatchEvent(new CustomEvent('students-updated'));
  };

  const getDemoPasswords = () => {
    return JSON.parse(localStorage.getItem('demoStudentPasswords') || '{}') as Record<string, string>;
  };

  const setDemoPasswords = (data: Record<string, string>) => {
    localStorage.setItem('demoStudentPasswords', JSON.stringify(data));
  };

  const handleSaveClick = () => {
    const token = localStorage.getItem('token');
    if (token === 'demo-token') {
      localStorage.setItem('demoStudents', JSON.stringify(demoData));
      alert('Data siswa tersimpan (mode demo).');
      return;
    }

    alert('Data siswa sudah tersimpan otomatis di database.');
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        nisn: '1234567890',
        nama: 'Nama Siswa',
        password: 'Min1ciamis!',
        status_kelulusan: 'LULUS',
        keterangan: 'Contoh keterangan',
        link_pdf: 'https://...'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'template-data-siswa.xlsx');
  };

  const handleResetStudentPassword = async (student: Student) => {
    const token = localStorage.getItem('token');
    const newPassword = prompt(`Reset password untuk ${student.nama} (kosongkan = Min1ciamis!)`);

    if (token === 'demo-token') {
      const passwords = getDemoPasswords();
      passwords[student.nisn] = newPassword?.trim() || 'Min1ciamis!';
      setDemoPasswords(passwords);
      alert('Password siswa berhasil direset (mode demo).');
      return;
    }

    try {
      const { data } = await fetchJson(`${API_URL}/reset-passwords`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: 'student', studentId: student.id, newPassword: newPassword || undefined }),
      });

      if (data && (data as any).success) {
        alert((data as any).message || 'Password siswa berhasil direset.');
      } else {
        alert((data as any)?.error || 'Gagal mereset password siswa.');
      }
    } catch (error) {
      console.error('Failed to reset student password:', error);
      alert('Gagal mereset password siswa.');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token === 'demo-token') {
      localStorage.setItem('demoStudents', JSON.stringify(demoData));
    }
  }, [demoData]);

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');

    if (token === 'demo-token') {
      const filtered = demoData.filter((student) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return student.nisn.toLowerCase().includes(term) || student.nama.toLowerCase().includes(term);
      });
      setStudents(filtered);
      return;
    }

    try {
      const { data } = await fetchJson(`${API_URL}/students?search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (data && (data as any).success) {
        setStudents((data as any).students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleExport = () => {
    const exportSource = students.length > 0 ? students : demoData;
    const exportData = exportSource.map((student) => ({
      nisn: student.nisn,
      nama: student.nama,
      password: '',
      status_kelulusan: student.status_kelulusan,
      keterangan: student.keterangan || '',
      link_pdf: student.link_pdf || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');
    XLSX.writeFile(workbook, `data-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const normalizeKey = (key: string) => key.toLowerCase().replace(/\n/g, ' ').trim();

  const mapRow = (row: Record<string, any>) => {
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      normalizedRow[normalizeKey(key)] = row[key];
    });

    return {
      nisn: String(normalizedRow.nisn || normalizedRow['nisn '] || '').trim(),
      nama: String(normalizedRow.nama || normalizedRow['nama siswa'] || '').trim(),
      password: String(normalizedRow.password || '').trim() || 'Min1ciamis!',
      status_kelulusan: String(normalizedRow.status_kelulusan || normalizedRow.status || 'LULUS')
        .toUpperCase()
        .includes('TIDAK')
        ? 'TIDAK LULUS'
        : 'LULUS',
      keterangan: String(normalizedRow.keterangan || '').trim(),
      link_pdf: String(normalizedRow.link_pdf || normalizedRow.link || '').trim()
    };
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    const mappedRows = rows
      .map(mapRow)
      .filter((row) => row.nisn && row.nama);

    if (mappedRows.length === 0) {
      alert('Tidak ada data yang valid untuk diimpor. Pastikan kolom NISN dan Nama terisi.');
      event.target.value = '';
      return;
    }

    const token = localStorage.getItem('token');

    if (token === 'demo-token') {
      const newStudents = mappedRows.map((row, index) => ({
        id: Date.now() + index,
        nisn: row.nisn,
        nama: row.nama,
        status_kelulusan: row.status_kelulusan as Student['status_kelulusan'],
        keterangan: row.keterangan,
        link_pdf: row.link_pdf
      }));
      const nextDemo = [...newStudents, ...demoData];
      const passwords = getDemoPasswords();
      mappedRows.forEach((row) => {
        passwords[row.nisn] = row.password || 'Min1ciamis!';
      });
      setDemoPasswords(passwords);
      setDemoData(nextDemo);
      setStudents(nextDemo);
      notifyStudentsUpdated();
      alert(`Berhasil impor ${mappedRows.length} data siswa (mode demo).`);
      event.target.value = '';
      return;
    }

    try {
      const requests = mappedRows.map(async (row) => {
        const { data } = await fetchJson(`${API_URL}/students`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(row),
        });
        return data as any;
      });

      const results = await Promise.all(requests);
      const successCount = results.filter((res) => res?.success).length;
      const failedCount = results.length - successCount;

      await fetchStudents();
      notifyStudentsUpdated();

      if (failedCount > 0) {
        alert(`Impor selesai. ${successCount} data berhasil disimpan, ${failedCount} gagal.`);
      } else {
        alert(`Impor selesai. ${successCount} data berhasil disimpan.`);
      }
    } catch (error) {
      console.error('Failed to import students:', error);
      alert('Terjadi kesalahan saat impor data. Silakan cek format file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (token === 'demo-token') {
      let nextDemo = [...demoData];
      if (editing) {
        nextDemo = demoData.map((student) =>
          student.id === editing.id
            ? { ...student, ...formData, status_kelulusan: formData.status_kelulusan as Student['status_kelulusan'] }
            : student
        );
      } else {
        const newStudent: Student = {
          id: Date.now(),
          nisn: formData.nisn,
          nama: formData.nama,
          status_kelulusan: formData.status_kelulusan as Student['status_kelulusan'],
          keterangan: formData.keterangan,
          link_pdf: formData.link_pdf
        };
        nextDemo = [newStudent, ...demoData];
      }

      if (formData.password) {
        const passwords = getDemoPasswords();
        passwords[formData.nisn] = formData.password;
        setDemoPasswords(passwords);
      }

      setDemoData(nextDemo);
      setStudents(nextDemo);
      notifyStudentsUpdated();

      setShowForm(false);
      setEditing(null);
      setFormData({
        nisn: '',
        nama: '',
        password: '',
        status_kelulusan: 'LULUS',
        keterangan: '',
        link_pdf: ''
      });
      return;
    }
    
    try {
      const url = `${API_URL}/students`;
      const method = editing ? 'PUT' : 'POST';
      
      const body = editing 
        ? { ...formData, id: editing.id }
        : formData;

      const { data } = await fetchJson(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (data && (data as any).success) {
        setShowForm(false);
        setEditing(null);
        setFormData({
          nisn: '',
          nama: '',
          password: '',
          status_kelulusan: 'LULUS',
          keterangan: '',
          link_pdf: ''
        });
        await fetchStudents();
        notifyStudentsUpdated();
      }
    } catch (error) {
      console.error('Failed to save student:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditing(student);
    setFormData({
      nisn: student.nisn,
      nama: student.nama,
      password: '',
      status_kelulusan: student.status_kelulusan,
      keterangan: student.keterangan || '',
      link_pdf: student.link_pdf || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus siswa ini?')) return;

    const token = localStorage.getItem('token');
    if (token === 'demo-token') {
      const nextDemo = demoData.filter((student) => student.id !== id);
      const passwords = getDemoPasswords();
      const removed = demoData.find((student) => student.id === id);
      if (removed) {
        delete passwords[removed.nisn];
        setDemoPasswords(passwords);
      }
      setDemoData(nextDemo);
      setStudents(nextDemo);
      notifyStudentsUpdated();
      return;
    }
    
    try {
      const { data } = await fetchJson(`${API_URL}/students?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (data && (data as any).success) {
        await fetchStudents();
        notifyStudentsUpdated();
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Data Siswa</h1>
        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={handleExport}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-medium transition"
          >
            Export Excel
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg font-medium transition"
          >
            Template Excel
          </button>
          <button
            onClick={handleImportClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Import Excel
          </button>
          <button
            onClick={handleSaveClick}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Simpan
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            + Tambah Siswa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            placeholder="Cari berdasarkan NISN atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-3 text-xs text-slate-500">
            Format impor: kolom <span className="font-semibold">nisn</span>, <span className="font-semibold">nama</span>, <span className="font-semibold">password</span>, <span className="font-semibold">status_kelulusan</span>, <span className="font-semibold">keterangan</span>, <span className="font-semibold">link_pdf</span>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-600 border-b">
                <th className="p-4">NISN</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dokumen</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">{student.nisn}</td>
                  <td className="p-4">{student.nama}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      student.status_kelulusan === 'LULUS' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.status_kelulusan}
                    </span>
                  </td>
                  <td className="p-4">
                    {student.link_pdf ? (
                      <a href={student.link_pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        Lihat PDF
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetStudentPassword(student)}
                        className="text-amber-600 hover:text-amber-800 text-sm"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Siswa' : 'Tambah Siswa'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NISN</label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editing && '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editing}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Kelulusan</label>
                <select
                  value={formData.status_kelulusan}
                  onChange={(e) => setFormData({ ...formData, status_kelulusan: e.target.value as 'LULUS' | 'TIDAK LULUS' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link PDF (opsional)</label>
                <input
                  type="url"
                  value={formData.link_pdf}
                  onChange={(e) => setFormData({ ...formData, link_pdf: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {editing ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 rounded-lg transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Pengaturan() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    nama_madrasah: '',
    tahun_ajaran: '',
    logo_madrasah: '',
    alamat: '',
    kota: '',
    countdown_time: '',
    id_folder_drive: '',
    theme_color: '#2563eb'
  });

  const toLocalInputValue = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const toIsoString = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const token = localStorage.getItem('token');

    if (token === 'demo-token') {
      const demoSettings = {
        nama_madrasah: 'MAN 1 Ciamis',
        tahun_ajaran: '2025/2026',
        logo_madrasah: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg',
        alamat: 'Jl. Veteran No. 38',
        kota: 'Ciamis',
        countdown_time: new Date().toISOString(),
        id_folder_drive: '',
        theme_color: '#2563eb'
      };
      setSettings(demoSettings as Settings);
      setFormData({
        nama_madrasah: demoSettings.nama_madrasah,
        tahun_ajaran: demoSettings.tahun_ajaran,
        logo_madrasah: demoSettings.logo_madrasah,
        alamat: demoSettings.alamat,
        kota: demoSettings.kota,
        countdown_time: toLocalInputValue(demoSettings.countdown_time),
        id_folder_drive: '',
        theme_color: demoSettings.theme_color || '#2563eb'
      });
      return;
    }

    try {
      const { data } = await fetchJson(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (data && (data as any).success) {
        const settingsData = (data as any).settings;
        setSettings(settingsData);
        setFormData({
          nama_madrasah: settingsData.nama_madrasah,
          tahun_ajaran: settingsData.tahun_ajaran,
          logo_madrasah: settingsData.logo_madrasah,
          alamat: settingsData.alamat,
          kota: settingsData.kota,
          countdown_time: toLocalInputValue(settingsData.countdown_time),
          id_folder_drive: settingsData.id_folder_drive || '',
          theme_color: settingsData.theme_color || '#2563eb'
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (token === 'demo-token') {
      setSettings({
        ...(formData as Settings),
        countdown_time: toIsoString(formData.countdown_time)
      });
      alert('Pengaturan berhasil disimpan! (Mode demo)');
      return;
    }

    const payload = {
      ...formData,
      countdown_time: toIsoString(formData.countdown_time)
    };
    
    try {
      const { data } = await fetchJson(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (data && (data as any).success) {
        setSettings((data as any).settings);
        alert('Pengaturan berhasil disimpan!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetPasswords = async (target: 'admin' | 'students') => {
    const token = localStorage.getItem('token');
    const label = target === 'admin' ? 'admin' : 'siswa';
    const newPassword = prompt(`Masukkan password baru untuk ${label} (kosongkan untuk default: Min1ciamis!)`);

    if (token === 'demo-token') {
      if (target === 'students') {
        localStorage.setItem('demoStudentPasswords', JSON.stringify({}));
      }
      alert(`Password ${label} berhasil direset (mode demo).`);
      return;
    }

    try {
      const { data } = await fetchJson(`${API_URL}/reset-passwords`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, newPassword: newPassword || undefined }),
      });

      if (data && (data as any).success) {
        alert((data as any).message || `Password ${label} berhasil direset.`);
      } else {
        alert((data as any)?.error || 'Gagal mereset password.');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Gagal mereset password.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Reset Password</h2>
          <p className="text-xs text-amber-700 mb-3">
            Gunakan tombol di bawah untuk mereset password admin atau semua siswa. Default password: <span className="font-semibold">Min1ciamis!</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleResetPasswords('admin')}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Reset Password Admin
            </button>
            <button
              type="button"
              onClick={() => handleResetPasswords('students')}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Reset Password Siswa
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Madrasah</label>
            <input
              type="text"
              value={formData.nama_madrasah}
              onChange={(e) => setFormData({ ...formData, nama_madrasah: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              value={formData.tahun_ajaran}
              onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo Madrasah (URL)</label>
            <input
              type="url"
              value={formData.logo_madrasah}
              onChange={(e) => setFormData({ ...formData, logo_madrasah: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Warna Tema</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="h-12 w-14 rounded border border-slate-300 p-1"
              />
              <div className="flex flex-wrap gap-2">
                {['#2563eb', '#16a34a', '#f97316', '#be123c', '#0ea5e9', '#9333ea'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: color })}
                    className="h-9 w-9 rounded-full border border-slate-200 shadow-sm"
                    style={{ backgroundColor: color }}
                    aria-label={`Pilih warna ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kota</label>
            <input
              type="text"
              value={formData.kota}
              onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Pengumuman</label>
            <input
              type="datetime-local"
              value={formData.countdown_time}
              onChange={(e) => setFormData({ ...formData, countdown_time: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID Folder Drive (opsional)</label>
            <input
              type="text"
              value={formData.id_folder_drive}
              onChange={(e) => setFormData({ ...formData, id_folder_drive: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1A2B3C4D5E6F7G8H9I0J"
            />
          </div>
          
          <button
            type="submit"
            className="w-full theme-bg theme-bg-hover text-white font-medium py-2 rounded-lg transition"
          >
            Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboard({ settings }: AdminDashboardProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
      navigate('/');
    }
  }, [user]);

  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={settings?.logo_madrasah || 'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg'} 
                alt="Logo" 
                className="w-9 h-9"
              />
              <div>
                <h1 className="text-lg font-bold text-slate-800">{settings?.nama_madrasah || 'Portal Kelulusan'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-slate-800">{user.fullname}</div>
                <div className="text-xs text-slate-600">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <nav className="space-y-2">
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              
              <Link
                to="/admin/siswa"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Data Siswa
              </Link>
              
              <Link
                to="/admin/pengaturan"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan
              </Link>
            </nav>
          </aside>

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/siswa" element={<DataSiswa />} />
              <Route path="/pengaturan" element={<Pengaturan />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
