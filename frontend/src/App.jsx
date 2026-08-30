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
import KarZarar from './pages/raporlar/KarZarar';
import Subeler from './pages/tanimlamalar/Subeler';
import Kullanicilar from './pages/personel/Kullanicilar';
import SuperAdmin from './pages/SuperAdmin';
import Yardim from './pages/Yardim';
import Abonelik from './pages/Abonelik';
import Profil from './pages/Profil';
import Yetkisiz from './pages/Yetkisiz';
import SifremiUnuttum from './pages/SifremiUnuttum';
import SifreSifirla from './pages/SifreSifirla';
import AuditLog from './pages/AuditLog';
import Transfer from './pages/Transfer';
import SubeDetay from './pages/tanimlamalar/SubeDetay';
import { PaketProvider } from './components/PlanKilidi';
import MerkezDepo from './pages/MerkezDepo';
import PlanliTransfer from './pages/PlanliTransfer';

// ─── Rol Grupları ─────────────────────────────────────────────────────────────
const R = {
  STOK: ['TENANT_ADMIN', 'MUDUR', 'DEPO'],
  SATIS: ['TENANT_ADMIN', 'MUDUR', 'KASA'],
  YONETIM: ['TENANT_ADMIN', 'MUDUR'],
  ADMIN: ['TENANT_ADMIN'],
  PERSONEL: ['TENANT_ADMIN', 'MUDUR', 'PERSONEL'],
  HERKES: ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'],
};

// Lisans dolduğunda erişime açık kalan sayfalar
const LISANS_SERBEST = ['/abonelik', '/profil', '/yardim'];

// ─── PrivateRoute ─────────────────────────────────────────────────────────────
// ÖNEMLİ DEĞİŞİKLİK: Daha önce, plan bir özelliği kapsamıyorsa sayfa
// TAMAMEN <PlanKilidi> ile değiştiriliyordu — kullanıcı deneme sırasında
// girdiği verilere (personel listesi, cari kartlar, transfer geçmişi vb.)
// artık hiç erişemiyordu ("trial cliff"). Bu, "elimden bir şey alındı"
// hissi yaratıyordu.
//
// Artık sayfa HER ZAMAN render ediliyor. planOzellik verilmişse, sayfa
// <PaketProvider> ile sarmalanıyor; sayfa içindeki bileşenler
// `usePaketDurumu()` hook'u ile "tamErisim" bilgisini okuyup kendi yazma
// butonlarını (Yeni Ekle/Düzenle/Sil) buna göre gösterip gizliyor, ayrıca
// `<SaltOkunurUyari />` ile üstte bir bilgilendirme şeridi gösterebiliyor.
// Backend tarafında da paketKontrol middleware'i artık sadece yazma
// isteklerini (POST/PUT/PATCH/DELETE) engelliyor, GET her zaman serbest —
// yani veri hiçbir zaman "kaybolmuş" gibi görünmüyor.
function PrivateRoute({ children, roller, planOzellik }) {
  const kullanici = useAuthStore((s) => s.kullanici);

  if (!kullanici) return <Navigate to="/giris" replace />;

  if (kullanici.rol === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  if (roller && !roller.includes(kullanici.rol)) {
    return <Navigate to="/yetkisiz" replace />;
  }

  // Lisans dolmuşsa sadece serbest sayfalara izin ver
  if (kullanici.lisansDoldu) {
    const mevcutPath = window.location.pathname;
    const serbest = LISANS_SERBEST.some(p => mevcutPath.startsWith(p));
    if (!serbest) return <Navigate to="/abonelik" replace />;
  }

  if (planOzellik) {
    return (
      <Layout>
        <PaketProvider ozellik={planOzellik} plan={kullanici.plan} denemede={kullanici.denemede}>
          {children}
        </PaketProvider>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

// ─── SuperAdminRoute ──────────────────────────────────────────────────────────
function SuperAdminRoute({ children }) {
  const kullanici = useAuthStore((s) => s.kullanici);
  if (!kullanici) return <Navigate to="/giris" replace />;
  if (kullanici.rol !== 'SUPER_ADMIN') return <Navigate to="/yetkisiz" replace />;
  return children;
}

export default function App() {
  const { baslat, yukleniyor } = useAuthStore();
  useEffect(() => { baslat(); }, []);
  if (yukleniyor) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          error: {
            duration: 6000,
          },
          success: {
            duration: 3000,
          },
        }}
      />
      <Routes>

        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/giris" element={<Login />} />
        <Route path="/kayit" element={<KayitFirma />} />
        <Route path="/sifremi-unuttum" element={<SifremiUnuttum />} />
        <Route path="/sifre-sifirla" element={<SifreSifirla />} />
        <Route path="/yetkisiz" element={<Yetkisiz />} />

        {/* ── Süper Admin ─────────────────────────────────────────────── */}
        <Route path="/super-admin" element={
          <SuperAdminRoute><SuperAdmin /></SuperAdminRoute>
        } />

        {/* ── Dashboard ───────────────────────────────────────────────── */}
        <Route path="/" element={<PrivateRoute roller={R.HERKES}><Dashboard /></PrivateRoute>} />

        {/* ── Stok — tüm planlarda açık ───────────────────────────────── */}
        <Route path="/stok/durum" element={<PrivateRoute roller={R.STOK}><StokDurumu /></PrivateRoute>} />
        <Route path="/stok/giris-faturasi" element={<PrivateRoute roller={R.STOK}><GirisFaturasi /></PrivateRoute>} />
        <Route path="/stok/iade-faturasi" element={<PrivateRoute roller={R.STOK}><IadeFaturasi /></PrivateRoute>} />
        <Route path="/stok/zayi" element={<PrivateRoute roller={R.STOK}><ZayiGideri /></PrivateRoute>} />
        <Route path="/stok/tuketim" element={<PrivateRoute roller={R.STOK}><TuketimGideri /></PrivateRoute>} />
        <Route path="/stok/ay-sonu-sayim" element={<PrivateRoute roller={R.STOK}><AySonuSayim /></PrivateRoute>} />

        {/* ── Transfer — Profesyonel+ (deneme bitince salt okunur) ─────── */}
        <Route path="/stok/transfer" element={<PrivateRoute roller={R.YONETIM} planOzellik="transfer"><Transfer /></PrivateRoute>} />

        {/* ── Satış — tüm planlarda açık ──────────────────────────────── */}
        <Route path="/satislar" element={<PrivateRoute roller={R.SATIS}><Satislar /></PrivateRoute>} />

        {/* ── Reçete — tüm planlarda açık ─────────────────────────────── */}
        <Route path="/receteler" element={<PrivateRoute roller={R.YONETIM}><Receteler /></PrivateRoute>} />

        {/* ── Cari — Profesyonel+ (deneme bitince salt okunur) ─────────── */}
        <Route path="/cari-hesap" element={<PrivateRoute roller={R.YONETIM} planOzellik="cari"><CariHesap /></PrivateRoute>} />

        {/* ── Raporlar — temel hepse açık, gelişmiş Profesyonel+ ──────── */}
        <Route path="/raporlar" element={<PrivateRoute roller={R.YONETIM}><Raporlar /></PrivateRoute>} />
        <Route path="/raporlar/kar-zarar" element={<PrivateRoute roller={R.YONETIM}><KarZarar /></PrivateRoute>} />

        {/* ── Personel — Profesyonel+ (deneme bitince salt okunur) ─────── */}
        <Route path="/personel" element={<PrivateRoute roller={R.PERSONEL} planOzellik="personel"><Personel /></PrivateRoute>} />
        <Route path="/personel/kullanicilar" element={<PrivateRoute roller={R.ADMIN}><Kullanicilar /></PrivateRoute>} />
        <Route path="/merkezdepo" element={<PrivateRoute roller={['TENANT_ADMIN', 'MUDUR']} planOzellik="merkezDepo"><MerkezDepo /></PrivateRoute>} />
        <Route path="/stok/planli-transfer" element={<PrivateRoute roller={R.YONETIM} planOzellik="planliTransfer"><PlanliTransfer /></PrivateRoute>} />


        {/* ── Tanımlamalar ────────────────────────────────────────────── */}
        <Route path="/tanimlamalar/kategoriler" element={<PrivateRoute roller={R.STOK}><Kategoriler /></PrivateRoute>} />
        <Route path="/tanimlamalar/olcu-birimleri" element={<PrivateRoute roller={R.STOK}><OlcuBirimleri /></PrivateRoute>} />
        <Route path="/tanimlamalar/stok-kartlari" element={<PrivateRoute roller={R.STOK}><StokKartlari /></PrivateRoute>} />
        <Route path="/tanimlamalar/cari-kartlar" element={<PrivateRoute roller={R.YONETIM} planOzellik="cari"><CariKartlar /></PrivateRoute>} />
        <Route path="/tanimlamalar/subeler" element={<PrivateRoute roller={R.ADMIN}><Subeler /></PrivateRoute>} />
        <Route path="/tanimlamalar/subeler/:id" element={<PrivateRoute roller={R.ADMIN}><SubeDetay /></PrivateRoute>} />

        {/* ── Diğer ───────────────────────────────────────────────────── */}

        <Route path="/yardim" element={<PrivateRoute roller={R.HERKES}><Yardim /></PrivateRoute>} />
        <Route path="/abonelik" element={<PrivateRoute roller={R.HERKES}><Abonelik /></PrivateRoute>} />
        <Route path="/profil" element={<PrivateRoute roller={R.HERKES}><Profil /></PrivateRoute>} />
        <Route path="/islem-gecmisi" element={<PrivateRoute><AuditLog /></PrivateRoute>} />

      </Routes>
    </BrowserRouter>
  );
}