import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/auth.store';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';

function PrivateRoute({ children }) {
  const kullanici = useAuthStore((s) => s.kullanici);
  return kullanici ? children : <Navigate to="/giris" />;
}

export default function App() {
  const { baslat, yukleniyor } = useAuthStore();

  useEffect(() => {
    baslat();
  }, []);

  if (yukleniyor) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/giris" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-black text-white">
                  Gastro<span className="text-lime-400">IQ</span>
                </h1>
                <p className="text-zinc-500 mt-2">Dashboard yakında geliyor...</p>
              </div>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}