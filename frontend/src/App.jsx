import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/auth.store';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import Kategoriler from './pages/tanimlamalar/Kategoriler';
import OlcuBirimleri from './pages/tanimlamalar/OlcuBirimleri';
import StokKartlari from './pages/tanimlamalar/StokKartlari';
import CariKartlar from './pages/tanimlamalar/CariKartlar';

function PrivateRoute({ children }) {
  const kullanici = useAuthStore((s) => s.kullanici);
  return kullanici ? <Layout>{children}</Layout> : <Navigate to="/giris" />;
}

export default function App() {
  const { baslat, yukleniyor } = useAuthStore();

  useEffect(() => { baslat(); }, []);

  if (yukleniyor) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/giris" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h1 className="text-3xl font-black text-white">
                  Gastro<span className="text-lime-400">IQ</span>
                </h1>
                <p className="text-zinc-500 mt-2">Dashboard yakında geliyor...</p>
              </div>
            </div>
          </PrivateRoute>
        } />
        <Route path="/tanimlamalar/kategoriler" element={<PrivateRoute><Kategoriler /></PrivateRoute>} />
        <Route path="/tanimlamalar/olcu-birimleri" element={<PrivateRoute><OlcuBirimleri /></PrivateRoute>} />
        <Route path="/tanimlamalar/stok-kartlari" element={<PrivateRoute><StokKartlari /></PrivateRoute>} />
        <Route path="/tanimlamalar/cari-kartlar" element={<PrivateRoute><CariKartlar /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}