import { useEffect } from 'react';
import useSubeStore from '../store/subeStore';
import useAuthStore from '../store/auth.store';

export default function SubeSecici() {
    const kullanici = useAuthStore(s => s.kullanici);
    const { subeler, seciliSubeId, subeleriYukle, subeSecAlt } = useSubeStore();

    useEffect(() => {
        // Sadece TENANT_ADMIN için şubeleri yükle
        // Diğer roller zaten kendi şubelerine kilitli (backend hallediyor)
        if (kullanici?.rol === 'TENANT_ADMIN') {
            subeleriYukle();
        }
    }, [kullanici]);

    // TENANT_ADMIN değilse hiç gösterme
    if (kullanici?.rol !== 'TENANT_ADMIN') return null;

    // Tek şube varsa da gösterme
    if (subeler.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 mb-5">
            <span className="text-zinc-500 text-xs shrink-0">Şube:</span>
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => subeSecAlt(null)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${seciliSubeId === null
                            ? 'bg-lime-400/10 border-lime-400/40 text-lime-400 font-semibold'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                        }`}
                >
                    Tüm Şubeler
                </button>
                {subeler.map(sube => (
                    <button
                        key={sube.id}
                        onClick={() => subeSecAlt(sube.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${seciliSubeId === sube.id
                                ? 'bg-lime-400/10 border-lime-400/40 text-lime-400 font-semibold'
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                            }`}
                    >
                        {sube.ad}
                    </button>
                ))}
            </div>
        </div>
    );
}