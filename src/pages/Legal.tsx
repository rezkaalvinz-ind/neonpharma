import { Link } from 'react-router-dom'

const content = {
  privacy: {
    title: 'Kebijakan Privasi',
    updated: '1 November 2026',
    sections: [
      {
        heading: 'Data yang kami kumpulkan',
        body: 'Kami mengumpulkan nama, alamat email, nomor telepon, alamat pengiriman, dan riwayat pesanan yang diperlukan untuk memproses pembelian. Untuk produk yang memerlukan resep, kami menyimpan dokumen resep yang kamu unggah guna keperluan verifikasi apoteker.',
      },
      {
        heading: 'Cara data digunakan',
        body: 'Data digunakan untuk memproses pesanan, memverifikasi resep, memberikan layanan pelanggan, dan mengirim pembaruan status pesanan. Kami tidak menjual data pribadi kepada pihak ketiga.',
      },
      {
        heading: 'Penyimpanan dan keamanan',
        body: 'Data disimpan pada basis data dengan kontrol akses berbasis peran. Kata sandi disimpan dalam bentuk hash, dan akses dokumen resep dibatasi pada apoteker serta admin yang berwenang.',
      },
      {
        heading: 'Hak pengguna',
        body: 'Kamu dapat memperbarui profil dan alamat kapan saja melalui halaman akun. Untuk permintaan penghapusan data, hubungi halo@neonpharma.id dan kami akan menindaklanjuti dalam 14 hari kerja.',
      },
      {
        heading: 'Cookie dan penyimpanan lokal',
        body: 'Aplikasi ini menggunakan penyimpanan lokal browser untuk menjaga sesi masuk, keranjang, dan preferensi tampilan. Kamu dapat menghapusnya kapan saja melalui pengaturan browser.',
      },
    ],
  },
  terms: {
    title: 'Syarat & Ketentuan',
    updated: '1 November 2026',
    sections: [
      {
        heading: 'Penggunaan layanan',
        body: 'NEON PHARMA menyediakan layanan pembelian produk kesehatan secara daring. Pengguna wajib memberikan data yang benar dan hanya memesan produk sesuai kebutuhan pribadi atau keluarga.',
      },
      {
        heading: 'Produk yang memerlukan resep',
        body: 'Obat keras hanya dapat diproses setelah resep diverifikasi oleh apoteker berlisensi. Kami berhak menolak pesanan apabila resep tidak jelas, tidak sesuai, atau kedaluwarsa.',
      },
      {
        heading: 'Harga dan pembayaran',
        body: 'Seluruh harga ditampilkan dalam Rupiah dan sudah termasuk PPN. Pesanan diproses setelah pembayaran dikonfirmasi, kecuali untuk metode bayar di tempat.',
      },
      {
        heading: 'Pengiriman',
        body: 'Estimasi pengiriman bergantung pada lokasi dan jasa kirim. Gratis ongkir berlaku untuk belanja minimal Rp150.000 sebelum biaya lain.',
      },
      {
        heading: 'Pembatalan dan pengembalian',
        body: 'Pesanan dapat dibatalkan sebelum dikirim. Produk obat dan suplemen yang telah dibuka tidak dapat dikembalikan kecuali terdapat kerusakan atau kesalahan pengiriman.',
      },
      {
        heading: 'Batasan tanggung jawab',
        body: 'Informasi produk bersifat edukatif dan bukan pengganti konsultasi medis. Untuk keluhan serius, segera hubungi dokter atau fasilitas kesehatan terdekat.',
      },
    ],
  },
}

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const doc = content[kind]
  return (
    <div className="page-container pt-8 sm:pt-12">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link to="/" className="hover:text-primary-dark">Beranda</Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-ink">{doc.title}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted">Terakhir diperbarui: {doc.updated}</p>

        <div className="mt-6 space-y-3">
          {doc.sections.map((section) => (
            <section key={section.heading} className="clay p-5 sm:p-6">
              <h2 className="font-display text-base font-bold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="clay-inset mt-6 rounded-3xl p-5 text-sm text-muted">
          Ada pertanyaan mengenai dokumen ini? Hubungi kami di{' '}
          <a href="mailto:halo@neonpharma.id" className="font-semibold text-primary hover:underline">
            halo@neonpharma.id
          </a>
          .
        </div>
      </div>
    </div>
  )
}
