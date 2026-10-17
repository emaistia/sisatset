import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Data yang Kami Kumpulkan',
    body: [
      'Saat Anda mendaftar, kami menyimpan alamat email Anda untuk keperluan login dan pemulihan akun.',
      'Saat Anda menggunakan aplikasi, kami menyimpan data yang Anda masukkan sendiri, antara lain: nama dan kelas anak, jadwal sekolah, event kalender, tugas/PR, rencana menu makan, catatan, data pengeluaran keuangan, dan daftar belanja.',
      'Jika Anda menyetujui pemasaran email, kami juga menyimpan preferensi persetujuan tersebut. Anda dapat berhenti berlangganan kapan saja.',
      'Kami tidak mengumpulkan data lokasi, kontak, foto, atau data lain dari perangkat Anda tanpa sepengetahuan Anda.',
    ],
  },
  {
    title: 'Bagaimana Kami Menggunakan Data',
    body: [
      'Menyediakan dan menjalankan fitur aplikasi SiSatSet sesuai data yang Anda masukkan.',
      'Menyinkronkan data Anda antara aplikasi web dan aplikasi mobile, sehingga data selalu terbaru di perangkat mana pun Anda masuk.',
      'Mengirim email terkait akun dan, jika Anda menyetujuinya, informasi pemasaran.',
      'Menjaga keamanan akun dan mencegah penyalahgunaan.',
    ],
  },
  {
    title: 'Penyimpanan dan Keamanan Data',
    body: [
      'Data Anda disimpan di server Supabase dengan enkripsi saat transit.',
      'Setiap pengguna hanya dapat mengakses data miliknya sendiri. Data Anda tidak dapat dilihat oleh pengguna lain.',
      'Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan periklanan.',
    ],
  },
  {
    title: 'Penyimpanan Data di Perangkat',
    body: [
      'Aplikasi menggunakan penyimpanan lokal perangkat untuk menyimpan sesi login Anda agar Anda tetap masuk antar kunjungan.',
      'Tidak ada data pribadi yang diakses dari perangkat Anda di luar yang Anda masukkan sendiri ke dalam aplikasi.',
    ],
  },
  {
    title: 'Hak Anda',
    body: [
      'Anda dapat mengedit atau menghapus data Anda sendiri langsung dari dalam aplikasi.',
      'Anda dapat menghubungi kami untuk meminta penghapusan akun beserta seluruh data terkait.',
      'Anda dapat berhenti berlangganan email pemasaran kapan saja melalui tautan berhenti berlangganan di email atau pengaturan aplikasi.',
    ],
  },
  {
    title: 'Perubahan Kebijakan',
    body: [
      'Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.',
    ],
  },
  {
    title: 'Kontak',
    body: [
      'Jika ada pertanyaan tentang kebijakan privasi ini atau ingin meminta penghapusan data, hubungi kami di email yang tercantum di halaman toko aplikasi kami.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Kebijakan Privasi</h1>
          <p className="text-sm text-gray-500 mb-6">Terakhir diperbarui: 17 Oktober 2026</p>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Kami menghargai privasi Anda. Kebijakan ini menjelaskan data apa yang dikumpulkan oleh aplikasi SiSatSet,
            bagaimana kami menggunakannya, dan hak Anda atas data tersebut.
          </p>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="font-semibold text-gray-800 mb-2">{section.title}</h2>
                <ul className="space-y-2">
                  {section.body.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 leading-relaxed flex gap-2">
                      <span className="text-pink-500 mt-0.5">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
