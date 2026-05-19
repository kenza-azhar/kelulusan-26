import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  settings: any;
}

export function LandingPage({ settings }: LandingPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    generateCaptcha();
    if (settings?.countdown_time) {
      const parsedTime = new Date(settings.countdown_time);
      const targetDate = Number.isNaN(parsedTime.getTime())
        ? new Date(`${settings.countdown_time}Z`)
        : parsedTime;

      const updateCountdown = () => {
        const now = new Date();
        const distance = targetDate.getTime() - now.getTime();

        if (distance <= 0) {
          setIsOpen(true);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [settings]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ question: `${num1} + ${num2} =`, answer: num1 + num2 });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseInt(captchaAnswer) !== captcha.answer) {
      alert('Jawaban verifikasi (Captcha) salah!');
      generateCaptcha();
      setCaptchaAnswer('');
      return;
    }

    try {
      await login(username, password);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Login gagal');
      generateCaptcha();
      setCaptchaAnswer('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <img 
              src={settings?.logo_madrasah || 'https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg'} 
              alt="Logo" 
              className="w-12 h-12"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-800">{settings?.nama_madrasah || 'MAN 1 Ciamis'}</h1>
              <p className="text-sm text-slate-600">Tahun Ajaran {settings?.tahun_ajaran || '2025/2026'}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Pengumuman Kelulusan</h2>
            <h3 className="text-2xl font-semibold text-blue-600 mb-1">{settings?.nama_madrasah || 'MAN 1 Ciamis'}</h3>
            <p className="text-slate-600">Tahun Ajaran {settings?.tahun_ajaran || '2025/2026'}</p>
          </div>

          {!isOpen ? (
            <div className="mb-8">
              <p className="text-center text-slate-600 mb-6">Akses kelulusan akan dibuka dalam:</p>
              <div className="flex justify-center gap-4">
                <div className="bg-blue-600 text-white rounded-lg p-4 text-center min-w-20 shadow-lg">
                  <div className="text-2xl font-bold">{timeLeft.days}</div>
                  <div className="text-xs uppercase tracking-wider">Hari</div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-4 text-center min-w-20 shadow-lg">
                  <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-xs uppercase tracking-wider">Jam</div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-4 text-center min-w-20 shadow-lg">
                  <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-xs uppercase tracking-wider">Menit</div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-4 text-center min-w-20 shadow-lg">
                  <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-xs uppercase tracking-wider">Detik</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">PENGUMUMAN TELAH DIBUKA</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Cek Kelulusan</h3>
              <p className="text-slate-600 text-sm">Silakan login untuk melihat hasil</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">NISN / Username Admin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan NISN"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.956 9.956 0 012.608-4.046M9.88 9.88a3 3 0 104.24 4.24" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.228 6.228A9.955 9.955 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.99 9.99 0 01-4.132 5.411M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Verifikasi Keamanan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold">{captcha.question}</span>
                  </div>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="w-full pl-20 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hasil Penjumlahan"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Masuk Aplikasi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-bold text-slate-800 mb-2">{settings?.nama_madrasah || 'MAN 1 Ciamis'}</h3>
          <p className="text-slate-600 text-sm mb-3">
            <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {settings?.alamat || 'Jl. Veteran No. 38'}, {settings?.kota || 'Ciamis'}
          </p>
          <p className="text-slate-500 text-xs">
            by <a href="https://min1ciamis.sch.id" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">Agus Arifien</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
