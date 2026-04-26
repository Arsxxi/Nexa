import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const setAdminRole = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query('users').collect();
    const user = allUsers.find(u => u.email === args.email);
    if (!user) throw new Error(`User with email ${args.email} not found`);
    await ctx.db.patch(user._id, { role: 'admin' });
    return { message: `${args.email} is now admin`, userId: user._id };
  },
});

const quizPool: Record<string, Array<{ question: string; options: string[]; correctIndex: number }>> = {
  // === HEALTH COURSES ===
  health_cpr: [
    { question: 'Apa yang terjadi saat cardiac arrest?', options: ['Otak berhenti', 'Paru-paru berhenti', 'Jantung berhenti memompa darah', 'Tulang patah'], correctIndex: 2 },
    { question: 'Berapa rasio CPR untuk orang dewasa?', options: ['10:2', '20:2', '30:2', '40:2'], correctIndex: 2 },
    { question: 'Kedalaman kompresi dada pada orang dewasa adalah?', options: ['2–3 cm', '3–4 cm', '5–6 cm', '7–8 cm'], correctIndex: 2 },
    { question: 'Kecepatan kompresi CPR yang benar adalah?', options: ['50–60 per menit', '70–80 per menit', '100–120 per menit', '150–200 per menit'], correctIndex: 2 },
    { question: 'Apa yang harus dilakukan jika tidak ingin memberi napas buatan?', options: ['Berhenti', 'Tunggu bantuan', 'Hanya lakukan kompresi dada terus-menerus', 'Pindahkan pasien'], correctIndex: 2 },
    { question: 'Apa langkah pertama dalam "chain of survival"?', options: ['CPR', 'AED', 'Panggil bantuan dan kenali kondisi', 'Rumah sakit'], correctIndex: 2 },
    { question: 'Kenapa CPR pada anak dimulai dengan 5 napas awal?', options: ['Karena lebih kuat', 'Karena masalah utama biasanya pernapasan', 'Karena jantung lebih besar', 'Supaya cepat selesai'], correctIndex: 1 },
  ],
  health_burns: [
    { question: 'Apa tiga faktor untuk menentukan tingkat keparahan luka bakar?', options: ['Warna, bau, suhu', 'Kedalaman, ukuran, lokasi', 'Waktu, tempat, usia', 'Air, api, listrik'], correctIndex: 1 },
    { question: 'Berapa persen luas telapak tangan dibanding tubuh?', options: ['5%', '10%', '1%', '20%'], correctIndex: 2 },
    { question: 'Apa ciri luka bakar full thickness?', options: ['Merah saja', 'Lepuh kecil', 'Kulit hangus/pucat dan bisa mati rasa', 'Berdarah banyak'], correctIndex: 2 },
    { question: 'Apa yang harus dilakukan pada luka bakar kimia berbentuk bubuk?', options: ['Langsung siram air', 'Ditiup', 'Disikat/dibersihkan dulu', 'Ditutup'], correctIndex: 2 },
    { question: 'Apa tindakan utama setelah luka bakar?', options: ['Oles krim', 'Dinginkan dengan air 20 menit', 'Tutup langsung', 'Diamkan'], correctIndex: 1 },
    { question: 'Kenapa perhiasan harus dilepas?', options: ['Supaya tidak hilang', 'Supaya ringan', 'Karena pembengkakan bisa mengganggu sirkulasi', 'Tidak penting'], correctIndex: 2 },
    { question: 'Apa yang tidak boleh dilakukan pada luka bakar?', options: ['Dinginkan dengan air', 'Tutup dengan plastik', 'Oles minyak/krim', 'Lepas cincin'], correctIndex: 2 },
  ],
  health_aed: [
    { question: 'Kapan AED digunakan?', options: ['Saat korban sadar', 'Saat korban tidak bernapas normal', 'Saat luka ringan', 'Saat pingsan sebentar'], correctIndex: 1 },
    { question: 'Apa fungsi utama AED?', options: ['Memberi oksigen', 'Menghentikan pendarahan', 'Menganalisis dan memberi shock pada jantung', 'Mengukur tekanan darah'], correctIndex: 2 },
    { question: 'Apa yang harus dilakukan sebelum AED datang?', options: ['Menunggu', 'CPR', 'Memberi air', 'Memindahkan korban'], correctIndex: 1 },
    { question: 'Di mana posisi pad AED pada orang dewasa?', options: ['Kedua tangan', 'Kepala', 'Dada kanan atas & sisi kiri', 'Kaki'], correctIndex: 2 },
    { question: 'Apa yang harus dilakukan saat AED menganalisis atau memberi shock?', options: ['Tetap menyentuh korban', 'Menekan dada', 'Tidak menyentuh korban', 'Memberi napas'], correctIndex: 2 },
    { question: 'Apa yang dilakukan jika dada korban basah?', options: ['Abaikan', 'Tutup', 'Keringkan', 'Siram air'], correctIndex: 2 },
    { question: 'Berapa lama AED akan menganalisis ulang kondisi jantung?', options: ['30 detik', '1 menit', '2 menit', '5 menit'], correctIndex: 2 },
  ],
  // === INFORMATICS COURSES ===
  informatics_js1: [
    { question: 'Apa arti dari coding?', options: ['Menggambar website', 'Menulis bahasa pemrograman', 'Mengedit video', 'Menghafal komputer'], correctIndex: 1 },
    { question: 'Apa fungsi utama JavaScript pada website?', options: ['Menentukan warna', 'Membuat konten', 'Membuat interaksi', 'Menyimpan data'], correctIndex: 2 },
    { question: 'Apa peran HTML dalam website?', options: ['Styling', 'Interaksi', 'Konten', 'Database'], correctIndex: 2 },
    { question: 'Apa itu JavaScript runtime?', options: ['Software untuk desain', 'Tempat menyimpan data', 'Lingkungan untuk menjalankan JavaScript', 'Bahasa pemrograman baru'], correctIndex: 2 },
    { question: 'Apa fungsi Node.js?', options: ['Membuat HTML', 'Menjalankan JavaScript di luar browser', 'Mendesain website', 'Mengedit CSS'], correctIndex: 1 },
    { question: 'Apa perbedaan front end dan back end?', options: ['Sama saja', 'Front end hanya database', 'Front end tampilan, back end sistem/server', 'Back end hanya desain'], correctIndex: 2 },
    { question: 'Kenapa JavaScript direkomendasikan untuk pemula?', options: ['Paling sulit', 'Hanya untuk website', 'Bisa digunakan di banyak bidang (web, mobile, dll)', 'Tidak butuh belajar'], correctIndex: 2 },
  ],
  informatics_js2: [
    { question: 'Apa aturan pertama yang ditekankan dalam belajar coding di materi ini?', options: ['Harus cepat', 'Gunakan AI sebanyak mungkin', 'Jangan bergantung pada AI', 'Harus ikut kursus'], correctIndex: 2 },
    { question: 'Kenapa pemula tidak disarankan menggunakan AI untuk menulis kode?', options: ['AI mahal', 'AI tidak akurat', 'Tidak membuat kita benar-benar belajar', 'AI sulit digunakan'], correctIndex: 2 },
    { question: 'Kenapa tidak boleh copy-paste kode?', options: ['Memakan waktu', 'Tidak efisien', 'Tidak membantu pemahaman', 'Tidak bisa dijalankan'], correctIndex: 2 },
    { question: 'Apa fungsi Node.js?', options: ['Mendesain tampilan', 'Menjalankan JavaScript', 'Menyimpan file', 'Membuat HTML'], correctIndex: 1 },
    { question: 'Apa itu VS Code?', options: ['Browser', 'Database', 'IDE (Integrated Development Environment)', 'Bahasa pemrograman'], correctIndex: 2 },
    { question: 'Apa saja 3 komponen utama dalam coding yang disebutkan?', options: ['Browser, server, database', 'File explorer, text editor, terminal', 'HTML, CSS, JS', 'Mouse, keyboard, monitor'], correctIndex: 1 },
    { question: 'Apa keuntungan menggunakan IDE seperti VS Code?', options: ['Lebih mahal', 'Semua tools jadi satu aplikasi', 'Tidak perlu coding', 'Hanya untuk profesional'], correctIndex: 1 },
  ],
  informatics_js3: [
    { question: 'Apa itu data types dalam JavaScript?', options: ['Software coding', 'Jenis-jenis data dasar', 'Bahasa pemrograman', 'Tools coding'], correctIndex: 1 },
    { question: 'Berapa jumlah data types fundamental di JavaScript?', options: ['3', '5', '7', '10'], correctIndex: 2 },
    { question: 'Apa itu string?', options: ['Angka', 'Teks', 'Fungsi', 'Variabel'], correctIndex: 1 },
    { question: 'Bagaimana cara menulis string di JavaScript?', options: ['Tanpa simbol', 'Dengan tanda kutip', 'Dengan angka', 'Dengan kurung'], correctIndex: 1 },
    { question: 'Apa fungsi titik koma (;) di JavaScript?', options: ['Menjalankan program', 'Mengakhiri statement', 'Membuat variabel', 'Menghapus kode'], correctIndex: 1 },
    { question: 'Apa fungsi console.log()?', options: ['Menyimpan data', 'Menjalankan program', 'Menampilkan output ke terminal', 'Membuat fungsi'], correctIndex: 2 },
    { question: 'Bagaimana cara menjalankan file JavaScript dengan Node.js?', options: ['Klik dua kali', 'node nama_file.js', 'run program', 'buka browser'], correctIndex: 1 },
  ],
  // === BAHASA COURSES ===
  bahasa_part1: [
    { question: 'Apa inti utama dari metode belajar bahasa dalam materi ini?', options: ['Belajar cepat 7 hari jadi fasih', 'Fokus grammar saja', 'Menggunakan pendekatan realistis dan bertahap', 'Menghafal kamus'], correctIndex: 2 },
    { question: 'Kenapa belajar bahasa sering terasa membebankan?', options: ['Terlalu mudah', 'Terlalu banyak guru', 'Ekspektasi terlalu tinggi', 'Kurang buku'], correctIndex: 2 },
    { question: 'Apa fokus utama hari pertama belajar?', options: ['Menulis esai', 'Mendengar native speaker', 'Ujian', 'Diskusi'], correctIndex: 1 },
    { question: 'Apa itu "comprehensible input"?', options: ['Latihan berbicara', 'Input yang tidak dipahami', 'Input yang bisa dipahami otak', 'Menghafal kosakata'], correctIndex: 2 },
    { question: 'Apa yang dilakukan saat menemukan kosakata baru?', options: ['Langsung dihafal semua', 'Dicatat lalu dipelajari setelah selesai', 'Dilewati saja', 'Diterjemahkan terus'], correctIndex: 1 },
    { question: 'Kenapa kesalahan harus "dirayakan"?', options: ['Supaya terlihat pintar', 'Karena tidak penting', 'Untuk mengetahui kekurangan dan belajar', 'Agar cepat selesai'], correctIndex: 2 },
    { question: 'Apa fungsi refleksi di hari ke-7?', options: ['Mengulang dari awal', 'Menilai progres dan memperbaiki metode', 'Berhenti belajar', 'Menghafal ulang'], correctIndex: 1 },
  ],
  bahasa_part2: [
    { question: 'Apa kunci utama agar belajar bahasa bisa konsisten tanpa burnout?', options: ['Menghafal setiap hari', 'Ikut banyak kursus', 'Ketertarikan terhadap bahasa', 'Belajar cepat'], correctIndex: 2 },
    { question: 'Kenapa kursus formal kadang kurang efektif bagi pembelajar mandiri?', options: ['Terlalu mahal', 'Tidak ada guru', 'Kurang personal dan tidak sesuai minat', 'Terlalu cepat'], correctIndex: 2 },
    { question: 'Apa langkah pertama dalam blueprint belajar bahasa?', options: ['Menghafal grammar', 'Memilih bahasa yang menarik dan relevan', 'Langsung praktik', 'Ujian'], correctIndex: 1 },
    { question: 'Apa yang dimaksud dengan "input" dalam belajar bahasa?', options: ['Berbicara', 'Menulis', 'Mendengar dan membaca', 'Menghafal'], correctIndex: 2 },
    { question: 'Kenapa hanya menonton dengan subtitle tidak cukup efektif?', options: ['Terlalu cepat', 'Tidak ada suara', 'Tidak ada usaha memahami pola bahasa', 'Terlalu sulit'], correctIndex: 2 },
    { question: 'Kapan waktu yang tepat mulai latihan berbicara (output)?', options: ['Hari pertama', 'Setelah paham dasar bahasa', 'Setelah 1 minggu', 'Tidak perlu'], correctIndex: 1 },
    { question: 'Apa keuntungan belajar banyak bahasa sekaligus dalam jangka panjang?', options: ['Lebih sulit', 'Membingungkan', 'Semakin mudah belajar bahasa baru', 'Tidak ada manfaat'], correctIndex: 2 },
  ],
  react: [
    { question: 'Apa itu React?', options: ['Library UI', 'Database', 'Bahasa pemrograman', 'Framework backend'], correctIndex: 0 },
    { question: 'Hook untuk state di React?', options: ['useEffect', 'useState', 'useContext', 'useRef'], correctIndex: 1 },
    { question: 'Apa itu JSX?', options: ['CSS extension', 'Syntax JS + XML', 'Bahasa baru', 'Database query'], correctIndex: 1 },
    { question: 'Virtual DOM berfungsi untuk?', options: ['Menyimpan data', 'Optimasi render', 'Routing', 'Styling'], correctIndex: 1 },
  ],
  typescript: [
    { question: 'TypeScript adalah superset dari?', options: ['Python', 'Java', 'JavaScript', 'C++'], correctIndex: 2 },
    { question: 'Keyword untuk mendefinisikan tipe?', options: ['var', 'let', 'type', 'define'], correctIndex: 2 },
    { question: 'Apa itu interface di TS?', options: ['Fungsi', 'Kontrak tipe', 'Variabel', 'Class'], correctIndex: 1 },
    { question: 'Union type menggunakan simbol?', options: ['&', '|', '#', '@'], correctIndex: 1 },
  ],
  expo: [
    { question: 'Expo digunakan untuk?', options: ['Web dev', 'Mobile dev', 'Backend dev', 'Database'], correctIndex: 1 },
    { question: 'File konfigurasi utama Expo?', options: ['package.json', 'app.json', 'expo.config', 'metro.config'], correctIndex: 1 },
    { question: 'Expo Router menggunakan pendekatan?', options: ['Config-based', 'File-based routing', 'Code-based', 'API-based'], correctIndex: 1 },
    { question: 'Library navigasi default Expo?', options: ['React Navigation', 'Vue Router', 'React Router', 'Navigator'], correctIndex: 0 },
  ],
  figma: [
    { question: 'Figma adalah tools untuk?', options: ['Coding', 'Desain UI/UX', 'Database', 'Testing'], correctIndex: 1 },
    { question: 'Fitur kolaborasi Figma bersifat?', options: ['Offline', 'Real-time', 'Batch', 'Delayed'], correctIndex: 1 },
    { question: 'Apa itu component di Figma?', options: ['Kode', 'Elemen reusable', 'Database', 'API'], correctIndex: 1 },
    { question: 'Auto Layout di Figma mirip dengan?', options: ['SQL', 'Flexbox CSS', 'HTML table', 'Git'], correctIndex: 1 },
  ],
  canva: [
    { question: 'Canva主要用于?', options: ['Desain grafis', 'Coding', 'Database', 'Networking'], correctIndex: 0 },
    { question: 'Format export utama Canva?', options: ['.exe', 'PNG/PDF', '.sql', '.py'], correctIndex: 1 },
    { question: 'Template di Canva bersifat?', options: ['Berbayar semua', 'Gratis & berbayar', 'Hanya premium', 'Tidak ada'], correctIndex: 1 },
    { question: 'Canva bisa digunakan di?', options: ['Hanya desktop', 'Browser & mobile', 'Hanya mobile', 'Server'], correctIndex: 1 },
  ],
  marketing: [
    { question: 'Digital marketing mencakup?', options: ['Hanya SEO', 'Hanya iklan TV', 'SEM, SEO, Sosial Media', 'Hanya email'], correctIndex: 2 },
    { question: 'CTR singkatan dari?', options: ['Click Time Rate', 'Click Through Rate', 'Cost To Run', 'Customer Trust Rate'], correctIndex: 1 },
    { question: 'ROI mengukur?', options: ['Kecepatan', 'Return on Investment', 'Jumlah klik', 'Engagement'], correctIndex: 1 },
    { question: 'Content marketing fokus pada?', options: ['Iklan berbayar', 'Konten bernilai', 'Spam', 'Cold calling'], correctIndex: 1 },
  ],
  bisnis: [
    { question: 'Business model canvas punya berapa blok?', options: ['5', '7', '9', '11'], correctIndex: 2 },
    { question: 'MVP singkatan dari?', options: ['Most Valuable Player', 'Minimum Viable Product', 'Maximum Value Plan', 'Minimum Value Product'], correctIndex: 1 },
    { question: 'B2B artinya?', options: ['Business to Buyer', 'Business to Business', 'Buyer to Business', 'Brand to Brand'], correctIndex: 1 },
    { question: 'Revenue stream adalah?', options: ['Biaya operasional', 'Sumber pendapatan', 'Jumlah karyawan', 'Target pasar'], correctIndex: 1 },
  ],
  ui: [
    { question: 'Prinsip UI yang baik?', options: ['Rumit', 'Konsisten & jelas', 'Banyak animasi', 'Warna-warni'], correctIndex: 1 },
    { question: 'Whitespace dalam desain berfungsi untuk?', options: ['Membuang ruang', 'Memberi napas visual', 'Menambah elemen', 'Mengurangi ukuran'], correctIndex: 1 },
    { question: 'Typography hierarchy mengatur?', options: ['Warna', 'Urutan kepentingan teks', 'Ukuran gambar', 'Posisi tombol'], correctIndex: 1 },
    { question: 'Color contrast penting untuk?', options: ['Estetika saja', 'Aksesibilitas', 'Ukuran file', 'Loading speed'], correctIndex: 1 },
  ],
};

const freeCourses = [
  {
    title: 'Simple Health Education',
    description: 'How To Perform CPR',
    thumbnailUrl: 'https://res.cloudinary.com/dotnuriq8/image/upload/q_auto/f_auto/v1777146684/ewdKM9NYo1A-HD_xvtciv.jpg',
    category: 'Kesehatan',
    type: 'free' as const,
    price: 0,
    coinReward: 50,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'health_cpr',
    lessons: [
      { title: 'How To Perform A CPR', description: 'Teknik CPR yang benar untuk menyelamatkan korban henti jantung. Pelajari rasio kompresi 30:2, posisi tangan yang tepat, dan cara memberikan napas buatan dengan efektif.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/v1776663247/Part_1_How_To_Perform_CPR_A_Step_By_Step_Guide_Resuscitation_CPR_First_Aid_Training_-_Get_Licensed_-_Frontline_Security_720p_h264_u8etq6.mp4', duration: 600, lessonQuizKey: 'health_cpr' },
      { title: 'How To Treat Burns', description: 'Cara menangani luka bakar dari ringan hingga parah. Pelajari cara mendinginkan luka bakar, kapan harus ke rumah sakit, dan menghindari kesalahan umum yang sering dilakukan.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/v1776662752/Part_2_How_to_Treat_Burns_and_Scalds_Essential_First_Aid_Tips_bjp8kw.mp4', duration: 720, lessonQuizKey: 'health_burns' },
      { title: 'Basic First Aid: How to Use an AED', description: 'Panduan lengkap menggunakan AED (Automated External Defibrillator). Pelajari kapan dan bagaimana menggunakan perangkat penyelamat nyawa ini dengan aman dan efektif.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/v1776662754/Part_3_Learn_Basic_First_Aid_How_to_Use_an_AED_Step-by-Step_Guide_pvxbhm.mp4', duration: 840, lessonQuizKey: 'health_aed' },
    ],
  },
  {
    title: 'Course Informatics',
    description: 'Coding Basic with agung hapsah',
    thumbnailUrl: 'https://res.cloudinary.com/dotnuriq8/image/upload/q_auto/f_auto/v1777138984/unxpUD9Xd_c-HD_gjlkov.jpg',
    category: 'Teknologi',
    type: 'free' as const,
    price: 0,
    coinReward: 60,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'informatics_js1',
    lessons: [
      { title: 'Belajar Coding Dari 0', description: 'Memulai perjalanan coding dari awal. Pahami apa itu programming, bagaimana komputer bekerja, dan bahasa yang digunakan developer profesional.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776662820/Part_1_Belajar_coding_dari_0_zuxllk.mp4', duration: 613, lessonQuizKey: 'informatics_js1' },
      { title: 'Development ENV', description: 'Setup environment pengembangan dengan VS Code. Pelajari cara mengelola file, menggunakan terminal, dan menulis code dengan efisien seperti programmer sungguhan.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776662818/Part_2_Development_environment_Belajar_coding_dari_0_aesdjf.mp4', duration: 286, lessonQuizKey: 'informatics_js2' },
      { title: 'String', description: 'Memahami konsep string dalam JavaScript. Cara menulis, memanipulasi, dan menggunakan string untuk berbagai keperluan program.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776662820/Part_3_String_Belajar_coding_dari_0_uilqno.mp4', duration: 286, lessonQuizKey: 'informatics_js3' },
    ],
  },
  {
    title: 'Course Bahasa',
    description: 'Dasar Belajar Bahasa Inggris',
    thumbnailUrl: 'https://res.cloudinary.com/dotnuriq8/image/upload/q_auto/f_auto/v1777138923/owC80a8xHT4-HD_ljgcce.jpg',
    category: 'Teknologi',
    type: 'free' as const,
    price: 0,
    coinReward: 45,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'bahasa_part1',
    lessons: [
      { title: 'Cara Belajar Bahasa Inggris pt 1', description: 'Metode realistis untuk belajar bahasa Inggris tanpa burnout. Fokus pada input yang bisa dipahami dan menghindari ekspektasi terlalu tinggi yang sering membuat pemula menyerah.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776640386/Part_1_Cara_Belajar_Bahasa_Inggris_mv9jio.mp4', duration: 956, lessonQuizKey: 'bahasa_part1' },
      { title: 'Cara Belajar Bahasa Inggris pt 2', description: 'Strategi lanjutan untuk fluency dalam 7 hari. Teknik immersion, manageable expectations, dan cara memanfaatkan kesalahan sebagai alat belajar yang efektif.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776640384/Part_2_Cara_lancar_bahasa_Inggris_dalam_7_hari_z8xkpc.mp4', duration: 600, lessonQuizKey: 'bahasa_part2' },
      { title: 'Cara Belajar Bahasa Apapun Secara otodidak', description: 'Blueprint universal untuk belajar bahasa apapun secara otodidak. Temukan bahasa yang menarik, buat rencana personal, dan konsisten tanpa tekanan.', videoUrl: 'https://res.cloudinary.com/dotnuriq8/video/upload/q_auto/f_auto/v1776640385/Part_3_Cara_Bisa_Belajar_Bahasa_Apapun_otodidak_dari_rumah_whhish.mp4', duration: 1038, lessonQuizKey: 'bahasa_part2' },
    ],
  },
];

const premiumCourses = [
  {
    title: 'Mastering Canva untuk Bisnis',
    description: 'Buat desain profesional untuk bisnis Anda dengan Canva Pro.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    category: 'Desain',
    type: 'premium' as const,
    price: 50000,
    coinReward: 100,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'canva',
    lessons: [
      { title: 'Canva Pro Features', videoUrl: 'https://www.youtube.com/watch?v=dXBo-sqB3VY', duration: 600 },
      { title: 'Brand Kit & Templates', videoUrl: 'https://www.youtube.com/watch?v=K4R3XBo-sqB', duration: 720 },
      { title: 'Social Media Design', videoUrl: 'https://www.youtube.com/watch?v=3VBo-sqB3VY', duration: 840 },
    ],
  },
  {
    title: 'Strategi Bisnis Online 2024',
    description: 'Bangun dan kembangkan bisnis online yang menguntungkan.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    category: 'Bisnis',
    type: 'premium' as const,
    price: 75000,
    coinReward: 150,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'bisnis',
    lessons: [
      { title: 'Business Model Canvas', videoUrl: 'https://www.youtube.com/watch?v=Qb8xRjKqMjE', duration: 540 },
      { title: 'MVP & Validasi Ide', videoUrl: 'https://www.youtube.com/watch?v=9sHfUdDqKWA', duration: 660 },
      { title: 'Scaling & Growth', videoUrl: 'https://www.youtube.com/watch?v=PJjeHzvi_VQ', duration: 780 },
    ],
  },
  {
    title: 'Advanced UI Design System',
    description: 'Buat design system yang scalable dan konsisten untuk produk digital.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400',
    category: 'Desain',
    type: 'premium' as const,
    price: 99000,
    coinReward: 200,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'ui',
    lessons: [
      { title: 'Design Token & Variables', videoUrl: 'https://www.youtube.com/watch?v=Cx2dkpBxstY', duration: 600 },
      { title: 'Component Library', videoUrl: 'https://www.youtube.com/watch?v=fjV6uoKzEaE', duration: 720 },
      { title: 'Documentation & Handoff', videoUrl: 'https://www.youtube.com/watch?v=MBzMDzVpjhs', duration: 840 },
    ],
  },
];

export const seedDatabase = mutation({
  handler: async (ctx) => {
    const existingCourses = await ctx.db.query('courses').collect();
    if (existingCourses.length > 0) {
      return { message: 'Database already seeded', courses: existingCourses.length };
    }

    const allCourses = [...freeCourses, ...premiumCourses];
    const courseIds: string[] = [];

    for (const courseData of allCourses) {
      const { quizKey, lessons, ...courseFields } = courseData;
      const courseId = await ctx.db.insert('courses', courseFields);

      for (let i = 0; i < lessons.length; i++) {
        const { lessonQuizKey, ...lessonFields } = lessons[i] as any;
        const resolvedQuizKey = lessonQuizKey ?? quizKey;
        await ctx.db.insert('lessons', {
          courseId: courseId as any,
          title: lessonFields.title,
          videoUrl: lessonFields.videoUrl,
          duration: lessonFields.duration,
          order: i + 1,
          quizQuestions: quizPool[resolvedQuizKey],
        });
      }

      courseIds.push(courseId);
    }

    return { message: 'Seeded successfully', courses: courseIds.length };
  },
});

export const reseedDatabase = mutation({
  handler: async (ctx) => {
    const existingCourses = await ctx.db.query('courses').collect();

    for (const course of existingCourses) {
      const lessons = await ctx.db.query('lessons').withIndex('by_course', q => q.eq('courseId', course._id)).collect();
      for (const lesson of lessons) {
        await ctx.db.delete(lesson._id);
      }
      await ctx.db.delete(course._id);
    }

    const allCourses = [...freeCourses, ...premiumCourses];
    const courseIds: string[] = [];

    for (const courseData of allCourses) {
      const { quizKey, lessons, ...courseFields } = courseData;
      const courseId = await ctx.db.insert('courses', courseFields);

      for (let i = 0; i < lessons.length; i++) {
        const { lessonQuizKey, description, ...lessonFields } = lessons[i] as any;
        const resolvedQuizKey = lessonQuizKey ?? quizKey;
        const lessonData: Record<string, any> = {
          courseId: courseId as any,
          title: lessonFields.title,
          videoUrl: lessonFields.videoUrl,
          duration: lessonFields.duration,
          order: i + 1,
          quizQuestions: quizPool[resolvedQuizKey],
        };
        
        if (description !== undefined) {
          lessonData.description = description;
        }
        
        await ctx.db.insert('lessons', lessonData);
      }

      courseIds.push(courseId);
    }

    return { message: 'Reseeded successfully', courses: courseIds.length };
  },
});

export const seedTestUserProgress = mutation({
  handler: async (ctx) => {
    const allUsers = await ctx.db.query('users').collect();
    const testUser = allUsers.find(u => u.email === 'pier.testing@gmail.com');
    const adminUser = allUsers.find(u => u.email === 'admin@gmail.com');

    if (!testUser) return { error: 'User pier.testing@gmail.com not found' };
    if (!adminUser) return { error: 'User admin@gmail.com not found' };

    await ctx.db.patch(adminUser._id, { role: 'admin' });

    const allCourses = await ctx.db.query('courses').collect();
    const course1 = allCourses.find(c => c.title === 'Simple Health Education');
    const course2 = allCourses.find(c => c.title === 'TypeScript Dasar hingga Mahir');
    const course3 = allCourses.find(c => c.title === 'Expo Router: Navigasi Modern');

    if (!course1 || !course2 || !course3) return { error: 'Courses not found' };

    await ctx.db.insert('enrollments', { userId: testUser._id, courseId: course1._id, enrolledAt: Date.now(), coinRewarded: true, completedAt: Date.now() });
    await ctx.db.insert('enrollments', { userId: testUser._id, courseId: course2._id, enrolledAt: Date.now(), coinRewarded: false });
    await ctx.db.insert('enrollments', { userId: testUser._id, courseId: course3._id, enrolledAt: Date.now(), coinRewarded: false });

    const lessons1 = await ctx.db.query('lessons').withIndex('by_course', q => q.eq('courseId', course1._id)).collect();
    const lessons2 = await ctx.db.query('lessons').withIndex('by_course', q => q.eq('courseId', course2._id)).collect();
    const lessons3 = await ctx.db.query('lessons').withIndex('by_course', q => q.eq('courseId', course3._id)).collect();

    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons1[0]._id, watchedSeconds: 600, isCompleted: true });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons1[1]._id, watchedSeconds: 720, isCompleted: true });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons1[2]._id, watchedSeconds: 840, isCompleted: true, quizScore: 100 });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons2[0]._id, watchedSeconds: 480, isCompleted: true });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons2[1]._id, watchedSeconds: 300, isCompleted: false });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons2[2]._id, watchedSeconds: 0, isCompleted: false });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons3[0]._id, watchedSeconds: 540, isCompleted: true });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons3[1]._id, watchedSeconds: 660, isCompleted: true });
    await ctx.db.insert('progress', { userId: testUser._id, lessonId: lessons3[2]._id, watchedSeconds: 780, isCompleted: false });

    return { message: 'Progress seeded successfully' };
  },
});