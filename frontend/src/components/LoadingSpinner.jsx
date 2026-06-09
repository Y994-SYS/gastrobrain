export default function LoadingSpinner() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-sm">Yükleniyor...</p>
            </div>
        </div>
    );
}