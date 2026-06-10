export default function Modal({ baslik, onKapat, children }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-base">{baslik}</h2>
                    <button
                        onClick={onKapat}
                        className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}