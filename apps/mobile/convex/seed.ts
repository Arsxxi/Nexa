import { mutation } from './_generated/server';

const quizPool: Record<string, Array<{ question: string; options: string[]; correctIndex: number }>> = {
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
    title: 'Belajar React Native untuk Pemula',
    description: 'Pelajari dasar-dasar pengembangan aplikasi mobile dengan React Native dari nol.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    category: 'Teknologi',
    type: 'free' as const,
    price: 0,
    coinReward: 50,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'react',
    lessons: [
      { title: 'Pengenalan React Native', videoUrl: 'https://www.youtube.com/watch?v=1GJwUgTqPmE', duration: 600 },
      { title: 'Komponen & Props', videoUrl: 'https://www.youtube.com/watch?v=SBwm9F0nT1g', duration: 720 },
      { title: 'State & Hook', videoUrl: 'https://www.youtube.com/watch?v=O6P86uw5R0s', duration: 840 },
    ],
  },
  {
    title: 'TypeScript Dasar hingga Mahir',
    description: 'Kuasai TypeScript untuk menulis kode yang lebih aman dan maintainable.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
    category: 'Teknologi',
    type: 'free' as const,
    price: 0,
    coinReward: 60,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'typescript',
    lessons: [
      { title: 'Apa itu TypeScript?', videoUrl: 'https://www.youtube.com/watch?v=ahCwqrYpIuM', duration: 480 },
      { title: 'Tipe Data & Interface', videoUrl: 'https://www.youtube.com/watch?v=9sHfUdDqKWA', duration: 600 },
      { title: 'Generics & Utility Types', videoUrl: 'https://www.youtube.com/watch?v=PJjeHzvi_VQ', duration: 720 },
    ],
  },
  {
    title: 'Expo Router: Navigasi Modern',
    description: 'Pelajari file-based routing dengan Expo Router untuk aplikasi React Native.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
    category: 'Teknologi',
    type: 'free' as const,
    price: 0,
    coinReward: 45,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'expo',
    lessons: [
      { title: 'Setup Expo Router', videoUrl: 'https://www.youtube.com/watch?v=doQt8ZUB-FE', duration: 540 },
      { title: 'Stack & Tab Navigation', videoUrl: 'https://www.youtube.com/watch?v=3q9-6M_xN0E', duration: 660 },
      { title: 'Dynamic Routes & Layouts', videoUrl: 'https://www.youtube.com/watch?v=4d2rXjJjMjE', duration: 780 },
    ],
  },
  {
    title: 'Desain UI/UX dengan Figma',
    description: 'Panduan lengkap mendesain antarmuka aplikasi menggunakan Figma.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    category: 'Desain',
    type: 'free' as const,
    price: 0,
    coinReward: 40,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'figma',
    lessons: [
      { title: 'Mengenal Interface Figma', videoUrl: 'https://www.youtube.com/watch?v=Cx2dkpBxstY', duration: 500 },
      { title: 'Membuat Wireframe', videoUrl: 'https://www.youtube.com/watch?v=fjV6uoKzEaE', duration: 620 },
      { title: 'Prototype & Handoff', videoUrl: 'https://www.youtube.com/watch?v=MBzMDzVpjhs', duration: 740 },
    ],
  },
  {
    title: 'Dasar-Dasar Digital Marketing',
    description: 'Pelajari strategi pemasaran digital untuk mengembangkan bisnis online.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    category: 'Bisnis',
    type: 'free' as const,
    price: 0,
    coinReward: 35,
    totalLessons: 3,
    isPublished: true,
    quizKey: 'marketing',
    lessons: [
      { title: 'Apa itu Digital Marketing?', videoUrl: 'https://www.youtube.com/watch?v=KFMF2FJkXjE', duration: 450 },
      { title: 'SEO & Content Marketing', videoUrl: 'https://www.youtube.com/watch?v=MYC7RwQLzEo', duration: 570 },
      { title: 'Social Media Strategy', videoUrl: 'https://www.youtube.com/watch?v=4M6RGXGjJjE', duration: 690 },
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
        const lesson = lessons[i];
        await ctx.db.insert('lessons', {
          courseId: courseId as any,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          order: i + 1,
          quizQuestions: quizPool[quizKey],
        });
      }

      courseIds.push(courseId);
    }

    return { message: 'Seeded successfully', courses: courseIds.length };
  },
});
