import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/auth.store';
import Login from './pages/Login';
import KayitFirma from './pages/KayitFirma';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import Kategoriler from './pages/tanimlamalar/Kategoriler';
import OlcuBirimleri from './pages/tanimlamalar/OlcuBirimleri';
import StokKartlari from './pages/tanimlamalar/StokKartlari';
import CariKartlar from './pages/tanimlamalar/CariKartlar';
import StokDurumu from './pages/stok/StokDurumu';
import GirisFaturasi from './pages/stok/GirisFaturasi';
import IadeFaturasi from './pages/stok/IadeFaturasi';
import ZayiGideri from './pages/stok/ZayiGideri';
import TuketimGideri from './pages/stok/TuketimGideri';
import AySonuSayim from './pages/stok/AySonuSayim';
import Receteler from './pages/recete/Receteler';
import Satislar from './pages/satis/Satislar';
import CariHesap from './pages/cari/CariHesap';
import Personel from './pages/personel/Personel';
import Dashboard from './pages/Dashboard';
import Raporlar from './pages/raporlar/Raporlar';
import Subeler from './pages/tanimlamalar/Subeler';
import Kullanicilar from './pages/tanimlamalar/Kullanicilar';
import SuperAdmin from './pages/SuperAdmin';
import Yardim from './pages/Yardim';
import Abonelik from './pages/Abonelik';
import Profil from './pages/Profil';
import Yetkisiz from './pages/Yetkisiz';
import AuditLog from './pages/AuditLog';

// ─── Rol Grupları ────────────────────────────────────────────────────────────
const R = {
  STOK: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO'],
  SATIS: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'KASA'],
  YONETIM: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR'],
  ADMIN: ['SUPER_ADMIN', 'TENANT_ADMIN'],
  PERSONEL: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'PERSONEL'],
  HERKES: ['SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'],
};

// ─── PrivateRoute ─────────────────────────────────────────────────────────────
// roller prop'u verilirse rol kontrolü de yapar, verilmezse sadece giriş kontrolü
function PrivateRoute({ children, roller }) {
  const kullanici = useAuthStore((s) => s.kullanici);

  if (!kullanici) return <Navigate to="/giris" replace />;

  if (roller && !roller.includes(kullanici.rol)) {
    return <Navigate to="/yetkisiz" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  const { baslat, yukleniyor } = useAuthStore();

  useEffect(() => { baslat(); }, []);

  if (yukleniyor) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>

        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/giris" element={<Login />} />
        <Route path="/kayit" element={<KayitFirma />} />
        <Route path="/yetkisiz" element={<Yetkisiz />} />

        {/* ── Süper Admin (Layout dışında) ────────────────────────────── */}
        <Route path="/super-admin" element={<SuperAdmin />} />

        {/* ── Dashboard — tüm roller ──────────────────────────────────── */}
        <Route path="/" element={<PrivateRoute roller={R.HERKES}><Dashboard /></PrivateRoute>} />

        {/* ── Stok — DEPO dahil ───────────────────────────────────────── */}
        <Route path="/stok/durum" element={<PrivateRoute roller={R.STOK}><StokDurumu /></PrivateRoute>} />
        <Route path="/stok/giris-faturasi" element={<PrivateRoute roller={R.STOK}><GirisFaturasi /></PrivateRoute>} />
        <Route path="/stok/iade-faturasi" element={<PrivateRoute roller={R.STOK}><IadeFaturasi /></PrivateRoute>} />
        <Route path="/stok/zayi" element={<PrivateRoute roller={R.STOK}><ZayiGideri /></PrivateRoute>} />
        <Route path="/stok/tuketim" element={<PrivateRoute roller={R.STOK}><TuketimGideri /></PrivateRoute>} />
        <Route path="/stok/ay-sonu-sayim" element={<PrivateRoute roller={R.STOK}><AySonuSayim /></PrivateRoute>} />

        {/* ── Satış — KASA dahil ──────────────────────────────────────── */}
        <Route path="/satislar" element={<PrivateRoute roller={R.SATIS}><Satislar /></PrivateRoute>} />

        {/* ── Yönetim (Müdür + Admin) ─────────────────────────────────── */}
        <Route path="/receteler" element={<PrivateRoute roller={R.YONETIM}><Receteler /></PrivateRoute>} />
        <Route path="/cari-hesap" element={<PrivateRoute roller={R.YONETIM}><CariHesap /></PrivateRoute>} />
        <Route path="/raporlar" element={<PrivateRoute roller={R.YONETIM}><Raporlar /></PrivateRoute>} />

        {/* ── Personel — PERSONEL kendi bilgisini görebilir ───────────── */}
        <Route path="/personel" element={<PrivateRoute roller={R.PERSONEL}><Personel /></PrivateRoute>} />

        {/* ── Tanımlamalar ────────────────────────────────────────────── */}
        <Route path="/tanimlamalar/kategoriler" element={<PrivateRoute roller={R.STOK}><Kategoriler /></PrivateRoute>} />
        <Route path="/tanimlamalar/olcu-birimleri" element={<PrivateRoute roller={R.STOK}><OlcuBirimleri /></PrivateRoute>} />
        <Route path="/tanimlamalar/stok-kartlari" element={<PrivateRoute roller={R.STOK}><StokKartlari /></PrivateRoute>} />
        <Route path="/tanimlamalar/cari-kartlar" element={<PrivateRoute roller={R.YONETIM}><CariKartlar /></PrivateRoute>} />
        <Route path="/tanimlamalar/subeler" element={<PrivateRoute roller={R.ADMIN}><Subeler /></PrivateRoute>} />
        <Route path="/tanimlamalar/kullanicilar" element={<PrivateRoute roller={R.ADMIN}><Kullanicilar /></PrivateRoute>} />
        <Route path="/audit-log" element={<PrivateRoute roller={R.ADMIN}><AuditLog /></PrivateRoute>} />

        {/* ── Diğer — tüm roller ──────────────────────────────────────── */}
        <Route path="/yardim" element={<PrivateRoute roller={R.HERKES}><Yardim /></PrivateRoute>} />
        <Route path="/abonelik" element={<PrivateRoute roller={R.HERKES}><Abonelik /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute roller={R.HERKES}><Profil /></PrivateRoute>} />

      </Routes>
    </BrowserRouter>
  );
}