import type { Metadata } from 'next';
import RehberClient from './rehber-client';

export const metadata: Metadata = {
    title: 'Kullanım Kılavuzu — GastroBrain Restoran Yönetim Sistemi',
    description:
        'GastroBrain stok yönetimi, reçete maliyeti, satış takibi, personel ve şube yönetimi modüllerinin adım adım kullanım kılavuzu.',
    alternates: {
        canonical: 'https://www.gastrobrain.com.tr/rehber',
    },
};

export default function RehberPage() {
    return <RehberClient />;
}