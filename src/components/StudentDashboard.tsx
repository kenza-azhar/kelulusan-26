import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface StudentResult {
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
}

interface StudentDashboardProps {
  settings: Settings | null;
}

export function StudentDashboard({ settings }: StudentDashboardProps) {
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Siswa') {
      navigate('/');
      return;
    }

    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    const token = localStorage.getItem('token');

    if (token === 'demo-token') {
      const demoStudents = JSON.parse(localStorage.getItem('demoStudents') || '[]') as StudentResult[];
      const demoStudent = demoStudents.find((student) => student.nisn === user?.username);
      setResult(
        demoStudent || {
          nisn: user?.username || '1234567890',
          nama: user?.fullname || 'Siswa Demo',
          status_kelulusan: 'LULUS',
          keterangan: 'Lulus dengan predikat sangat baik.',
          link_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.students.length > 0) {
        const student = data.students[0];
        setResult({
          nisn: student.nisn,
          nama: student.nama,
          status_kelulusan: student.status_kelulusan,
          keterangan: student.keterangan,
          link_pdf: student.link_pdf
        });
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      setResult({
        nisn: user?.username || '1234567890',
        nama: user?.fullname || 'Siswa Demo',
        status_kelulusan: 'LULUS',
        keterangan: 'Mode demo aktif. Data diambil dari simulasi.',
        link_pdf: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (result?.link_pdf) {
      window.open(result.link_pdf, '_blank');
    } else {
      alert('Dokumen Surat Kelulusan Anda belum tersedia. Silakan hubungi panitia sekolah.');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

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

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-slate-600">Memuat data...</p>
            </div>
          </div>
        ) : !result ? (
          <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Data Tidak Ditemukan</h3>
                <p className="text-yellow-700">Data kelulusan Anda tidak ditemukan. Silakan hubungi panitia.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
              result.status_kelulusan === 'LULUS' ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'
            }`}>
              <div className="p-8">
                <div className="text-center mb-6">
                  {result.status_kelulusan === 'LULUS' ? (
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <h2 className="text-2xl font-bold mb-2">
                    {result.status_kelulusan === 'LULUS' ? 'SELAMAT!' : 'MOHON MAAF'}
                  </h2>
                  <p className="text-slate-600 mb-4">
                    {result.status_kelulusan === 'LULUS' 
                      ? 'Anda dinyatakan memenuhi kriteria kelulusan.' 
                      : 'Anda dinyatakan belum memenuhi kriteria kelulusan.'}
                  </p>
                  <span className={`inline-block px-6 py-2 rounded-full font-bold text-white ${
                    result.status_kelulusan === 'LULUS' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {result.status_kelulusan}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">NISN</span>
                      <span className="font-bold text-slate-800">{result.nisn}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">Nama Siswa</span>
                      <span className="font-bold text-slate-800">{result.nama}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-600">Keterangan</span>
                      <span className="text-slate-800">{result.keterangan || '-'}</span>
                    </div>
                  </div>
                </div>

                {result.status_kelulusan === 'LULUS' && (
                  <button
                    onClick={downloadPDF}
                    disabled={!result.link_pdf}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition ${
                      result.link_pdf 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {result.link_pdf ? (
                      <>
                        <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Unduh Surat Kelulusan
                      </>
                    ) : (
                      <>
                        <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Dokumen Belum Tersedia
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
