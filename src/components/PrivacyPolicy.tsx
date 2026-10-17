import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Pendahuluan',
    body: [
      'SiSatSet Moms ("aplikasi") adalah aplikasi untuk membantu ibu-ibu mengatur jadwal sekolah anak, tugas/PR, rencana menu makan, keuangan rumah tangga, catatan, dan daftar belanja.',
      'Kebijakan privasi ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dengan siapa kami membagikannya, dan hak Anda atas data tersebut. Dengan menggunakan aplikasi, Anda menyetujui kebijakan ini.',
    ],
  },
  {
    title: 'Data yang Kami Kumpulkan',
    items: [
      'Data akun: alamat email dan kata sandi (kata sandi disimpan dalam bentuk terenkripsi, kami tidak dapat melihatnya).',
      'Data yang Anda masukkan sendiri: nama dan kelas anak, jadwal sekolah, event kalender, tugas/PR, rencana menu dan resep, catatan, data pengeluaran dan anggaran keuangan, serta daftar belanja.',
      'Preferensi persetujuan pemasaran email, jika Anda memilih menyetujuinya.',
      'Data teknis minimal yang diperlukan agar aplikasi berfungsi, seperti sesi login perangkat.',
      'Kami TIDAK mengumpulkan data lokasi, kontak, foto, IMEI/identitas perangkat, atau data lain dari perangkat Anda di luar yang Anda masukkan sendiri ke dalam aplikasi.',
    ],
  },
  {
    title: 'Bagaimana Kami Menggunakan Data',
    items: [
      'Menyediakan dan menjalankan fitur aplikasi sesuai data yang Anda masukkan.',
      'Menyinkronkan data Anda antara aplikasi web dan aplikasi mobile agar selalu terbaru di perangkat mana pun Anda masuk.',
      'Mengirim email terkait akun dan, jika Anda menyetujuinya, informasi pemasaran.',
      'Menjaga keamanan akun, mencegah penyalahgunaan, dan memenuhi kewajiban hukum.',
      'Kami tidak menjual data pribadi Anda dan tidak menggunakannya untuk iklan pihak ketiga.',
    ],
  },
  {
    title: 'Berbagi Data dengan Pihak Ketiga',
    items: [
      'Supabase (supabase.com) - penyedia penyimpanan database dan autentikasi. Data Anda disimpan di server mereka.',
      'Penyedia layanan hosting aplikasi web, agar aplikasi dapat diakses melalui internet.',
      'Pihak ketiga di atas hanya memproses data untuk menjalankan layanan kami dan terikat kewajiban menjaga kerahasiaan data.',
      'Kami dapat mengungkap data jika diwajibkan oleh hukum yang berlaku.',
      'Selain itu, kami tidak membagikan data pribadi Anda kepada siapa pun.',
    ],
  },
  {
    title: 'Keamanan Data',
    items: [
      'Data dikirim dan disimpan dengan enkripsi (HTTPS/TLS).',
      'Setiap pengguna hanya dapat mengakses data miliknya sendiri; data Anda tidak dapat dilihat oleh pengguna lain.',
      'Akses kami ke data produksi dibatasi hanya untuk keperluan pemeliharaan layanan.',
    ],
  },
  {
    title: 'Retensi dan Penghapusan Data',
    items: [
      'Data Anda disimpan selama akun Anda aktif.',
      'Anda dapat menghapus masing-masing data (catatan, jadwal, pengeluaran, dan lainnya) langsung dari dalam aplikasi kapan saja.',
      'Anda dapat meminta penghapusan akun beserta seluruh data terkait melalui kontak di bawah. Kami akan menghapus data Anda dalam waktu maksimal 30 hari sejak permintaan dikonfirmasi.',
      'Jika Anda menghapus aplikasi, data tetap tersimpan di akun Anda sampai Anda meminta penghapusan akun.',
    ],
  },
  {
    title: 'Data Anak',
    items: [
      'Aplikasi ini ditujukan untuk orang tua (ibu-ibu) yang mengatur kegiatan rumah tangga dan sekolah anaknya, bukan untuk anak-anak.',
      'Data anak yang masuk (nama dan kelas) diisi oleh orang tua sendiri dan hanya digunakan untuk menampilkan fitur jadwal dan tugas di dalam aplikasi.',
      'Aplikasi ini tidak dirancang untuk mengumpulkan data dari anak di bawah 13 tahun sebagai pengguna.',
    ],
  },
  {
    title: 'Hak Anda',
    items: [
      'Mengakses, memperbarui, dan menghapus data Anda sendiri langsung dari dalam aplikasi.',
      'Berhenti berlangganan email pemasaran kapan saja melalui tautan berhenti berlangganan di email atau pengaturan aplikasi.',
      'Meminta salinan, perbaikan, atau penghapusan seluruh data akun Anda melalui kontak di bawah.',
    ],
  },
  {
    title: 'Perubahan Kebijakan',
    items: [
      'Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan dipublikasikan di halaman ini dengan tanggal pembaruan terbaru. Perubahan penting akan kami informasikan melalui aplikasi atau email.',
    ],
  },
  {
    title: 'Kontak',
    items: [
      'Untuk pertanyaan tentang kebijakan privasi ini, atau untuk meminta salinan/perbaikan/penghapusan data Anda, hubungi kami di: sisatset.app@gmail.com',
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
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Kebijakan Privasi SiSatSet Moms</h1>
          <p className="text-sm text-gray-500 mb-6">Terakhir diperbarui: 17 Oktober 2026</p>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Kami menghargai privasi Anda. Kebijakan ini menjelaskan data apa yang dikumpulkan oleh aplikasi
            SiSatSet Moms, bagaimana kami menggunakannya, dengan siapa kami membagikannya, dan hak Anda atas
            data tersebut.
          </p>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="font-semibold text-gray-800 mb-2">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
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
