export default function Table({ kolonlar, veri, onDüzenle, onSil }) {
    if (!veri || veri.length === 0) {
        return (
            <div className="text-center py-16 text-zinc-500 text-sm">
                Henüz kayıt yok
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-800">
                        {kolonlar.map((k) => (
                            <th key={k.key} className="text-left text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">
                                {k.baslik}
                            </th>
                        ))}
                        <th className="text-right text-xs text-zinc-500 font-semibold uppercase tracking-wider py-3 px-4">
                            İşlem
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {veri.map((satir) => (
                        <tr key={satir.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                            {kolonlar.map((k) => (
                                <td key={k.key} className="py-3 px-4 text-sm text-zinc-300">
                                    {k.render ? k.render(satir) : satir[k.key]}
                                </td>
                            ))}
                            <td className="py-3 px-4 text-right">
                                <button
                                    onClick={() => onDüzenle(satir)}
                                    className="text-xs text-zinc-400 hover:text-lime-400 transition-colors mr-3"
                                >
                                    Düzenle
                                </button>
                                <button
                                    onClick={() => onSil(satir.id)}
                                    className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    Sil
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}