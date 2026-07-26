import type { TrainingVideo, QuizQuestion, Visitor, SecurityLog } from './types';

export const MOCK_TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: 'TRN-01',
    title: 'Genel Tesis Güvenliği ve İSG Kuralları',
    duration: '02:30',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-engineering-team-working-on-a-blueprint-41556-large.mp4', // Modern mühendislik videosu
    description: 'Tesis içinde uyulması gereken temel güvenlik kuralları, acil durum toplanma alanları ve baret/yelek kullanım standartları.'
  },
  {
    id: 'TRN-02',
    title: 'Taşeron ve Ağır Sanayi Çalışma İzinleri',
    duration: '03:15',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-welder-working-on-a-metal-structure-41558-large.mp4', // Taşeron ve kaynak videosu
    description: 'Yüksekte çalışma, sıcak çalışma (kaynak) ve elektrik müdahalelerinde iş izin formu ve kişisel koruyucu ekipman (KKD) gereklilikleri.'
  },
  {
    id: 'TRN-03',
    title: 'Laboratuvar ve Temiz Oda Protokolleri',
    duration: '01:45',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-scientist-working-in-a-modern-laboratory-41553-large.mp4', // Laboratuvar videosu
    description: 'Kimyasal Ar-Ge tesisleri ve laboratuvar alanlarında önlük, gözlük kullanımı ve atık yönetimi esasları.'
  }
];

export const MOCK_QUIZ_QUESTIONS: Record<string, QuizQuestion[]> = {
  'TRN-01': [
    {
      id: 'Q1-1',
      question: 'Tesislerimizde acil bir siren sesi duyulduğunda yapılması gereken ilk eylem hangisidir?',
      options: [
        'Hemen en yakın acil çıkış yönlendirmelerini takip ederek güvenli toplanma alanına gitmek',
        'Ziyaret ettiğiniz kişiyi arayıp ne olduğunu sormak',
        'Kendi aracınıza koşup tesisten ayrılmaya çalışmak',
        'İşin bitmesini bekleyip normal tempoda devam etmek'
      ],
      correctAnswer: 0
    },
    {
      id: 'Q1-2',
      question: 'Tesis içi yaya yollarında yürürken cep telefonu kullanımıyla ilgili hangi kural geçerlidir?',
      options: [
        'Her alanda serbestçe yürürken telefonla konuşulabilir',
        'Merdiven ve araç yollarında yürürken dikkat dağınıklığını önlemek için telefon kullanılmamalıdır',
        'Yalnızca kulaklıkla konuşmak serbesttir',
        'Herhangi bir kısıtlama yoktur'
      ],
      correctAnswer: 1
    },
    {
      id: 'Q1-3',
      question: 'Üretim veya şantiye sahalarına giriş yapabilmek için asgari hangi ekipmanlar zorunludur?',
      options: [
        'Sadece spor ayakkabı',
        'Herhangi bir koruyucuya gerek yoktur',
        'Çelik burunlu iş ayakkabısı, baret ve yüksek görünürlüklü yelek',
        'Yalnızca maske'
      ],
      correctAnswer: 2
    }
  ],
  'TRN-02': [
    {
      id: 'Q2-1',
      question: 'Taşeron çalışanlarının tesiste yüksekte çalışma yapabilmesi için hangi belge zorunludur?',
      options: [
        'Sadece mesleki yeterlilik belgesi',
        'Yüksekte Çalışabilir Sağlık Raporu ve Yüksekte Çalışma İSG Eğitimi sertifikası',
        'Ehliyet ve nüfus cüzdanı',
        'İşveren yazılı beyanı'
      ],
      correctAnswer: 1
    },
    {
      id: 'Q2-2',
      question: 'Sıcak çalışma (kaynak, kesim vb.) yapılacak bir alanda alınması gereken temel yangın önlemi nedir?',
      options: [
        'Çalışma alanında çalışır durumda yangın tüpü bulundurmak ve yanıcı maddeleri uzaklaştırmak',
        'Camları sonuna kadar açmak',
        'Maske takıp çalışmaya hızlıca başlamak',
        'Su dolu kova bulundurmak yeterlidir'
      ],
      correctAnswer: 0
    },
    {
      id: 'Q2-3',
      question: 'İş izin formu kim tarafından onaylanmalıdır?',
      options: [
        'Taşeronun kendi ustabaşı',
        'Herhangi bir güvenlik görevlisi',
        'İlgili tesis alanı sorumlusu ve İSG uzmanı',
        'Misafir kendisi imzalayabilir'
      ],
      correctAnswer: 2
    }
  ],
  'TRN-03': [
    {
      id: 'Q3-1',
      question: 'Laboratuvar alanına girerken hangi koruyucu ekipmanların kullanılması mecburidir?',
      options: [
        'Önlük ve eldiven gerekmez, sadece maske yeterlidir',
        'Laboratuvar önlüğü, koruyucu gözlük ve çalışılan kimyasala uygun eldiven',
        'İş ayakkabısı yeterlidir',
        'Normal günlük kıyafetler'
      ],
      correctAnswer: 1
    },
    {
      id: 'Q3-2',
      question: 'Laboratuvarda kimyasal dökülmesi durumunda ilk yapılması gereken nedir?',
      options: [
        'Temizlik personeline haber vermek ve beklemek',
        'Olay yerini hemen suyla yıkayıp temizlemek',
        'En yakın acil vücut/göz duşuna yönlenmek, alan sorumlusuna haber vermek ve İSG kurallarına göre tahliye etmek',
        'Kimyasalı koklayarak ne olduğunu anlamaya çalışmak'
      ],
      correctAnswer: 2
    }
  ]
};

export const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'VIS-9481',
    firstName: 'Ahmet',
    lastName: 'Karan',
    phone: '5551234567',
    email: 'ahmet.karan@teknoinsaat.com',
    company: 'Tekno İnşaat Taahhüt A.Ş.',
    hostName: 'Murat Şahin',
    department: 'Yatırımlar ve Altyapı Direktörlüğü',
    visitPurpose: 'Yıllık Bakım ve Kaynak İşleri',
    plannedDate: '2026-07-08',
    plannedTime: '09:30',
    status: 'PENDING_DOCS',
    requiredDocs: ['SGK', 'ISG'],
    uploadedDocs: [],
    trainingId: 'TRN-02',
    trainingWatched: false,
    quizCompleted: false,
    createdAt: '2026-07-06T10:00:00Z'
  },
  {
    id: 'VIS-3209',
    firstName: 'Elif',
    lastName: 'Yılmaz',
    phone: '5449876543',
    email: 'elif.yilmaz@globaldenetim.com',
    company: 'Global Denetim ve Danışmanlık',
    hostName: 'Aylin Çelik',
    department: 'Mali İşler ve Finans',
    visitPurpose: 'Mali Yıl Kapanış Denetimi',
    plannedDate: '2026-07-07',
    plannedTime: '10:00',
    status: 'PENDING_APPROVAL',
    requiredDocs: ['ID_COPY', 'SGK'],
    uploadedDocs: [
      {
        type: 'ID_COPY',
        name: 'kimlik_fotokopisi_elif_yilmaz.pdf',
        status: 'PENDING',
        uploadedAt: '2026-07-06T14:15:00Z',
        fileUrl: 'MOCK_FILE_DATA_ID'
      },
      {
        type: 'SGK',
        name: 'sgk_ise_giris_bildirgesi_elif_yilmaz.pdf',
        status: 'PENDING',
        uploadedAt: '2026-07-06T14:18:00Z',
        fileUrl: 'MOCK_FILE_DATA_SGK'
      }
    ],
    trainingId: 'TRN-01',
    trainingWatched: true,
    quizCompleted: true,
    quizScore: 3,
    createdAt: '2026-07-06T11:20:00Z'
  },
  {
    id: 'VIS-7821',
    firstName: 'Mehmet',
    lastName: 'Demir',
    phone: '5324567890',
    email: 'mehmet.demir@asiasanal.com',
    company: 'Asya Sanayi Otomasyon',
    hostName: 'Serkan Öztürk',
    department: 'Üretim ve Bakım Planlama',
    visitPurpose: 'PLC Yazılım Güncellemesi',
    plannedDate: '2026-07-06',
    plannedTime: '14:00',
    status: 'APPROVED',
    requiredDocs: ['ISG'],
    uploadedDocs: [
      {
        type: 'ISG',
        name: 'isg_egitimi_katilim_belgesi.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-07-05T16:00:00Z',
        fileUrl: 'MOCK_FILE_DATA_ISG'
      }
    ],
    trainingId: 'TRN-01',
    trainingWatched: true,
    quizCompleted: true,
    quizScore: 3,
    qrCodeData: 'VIS-7821-APPROVED',
    createdAt: '2026-07-05T12:00:00Z'
  },
  {
    id: 'VIS-4452',
    firstName: 'Zeynep',
    lastName: 'Kaya',
    phone: '5391112233',
    email: 'zeynep.kaya@biogenlab.com',
    company: 'Biogen Laboratuvar Sistemleri',
    hostName: 'Dr. Burak Aksoy',
    department: 'Ar-Ge ve Kalite Kontrol',
    visitPurpose: 'Kromatografi Cihazı Kalibrasyonu',
    plannedDate: '2026-07-06',
    plannedTime: '08:30',
    status: 'CHECKED_IN',
    requiredDocs: ['ISG', 'ID_COPY'],
    uploadedDocs: [
      {
        type: 'ISG',
        name: 'isg_belgesi_zeynep.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-07-05T09:00:00Z',
        fileUrl: 'MOCK_FILE_DATA_ISG'
      },
      {
        type: 'ID_COPY',
        name: 'kimlik_tarama_zeynep.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-07-05T09:05:00Z',
        fileUrl: 'MOCK_FILE_DATA_ID'
      }
    ],
    trainingId: 'TRN-03',
    trainingWatched: true,
    quizCompleted: true,
    quizScore: 3,
    qrCodeData: 'VIS-4452-APPROVED',
    createdAt: '2026-07-04T15:30:00Z',
    checkInTime: '2026-07-06T08:24:00'
  },
  {
    id: 'VIS-1102',
    firstName: 'Can',
    lastName: 'Yıldız',
    phone: '5426667788',
    email: 'can.yildiz@temizlikhizmetleri.com',
    company: 'Pak Temizlik A.Ş.',
    hostName: 'Merve Doğan',
    department: 'İdari İşler',
    visitPurpose: 'Periyodik Dezenfeksiyon Çalışması',
    plannedDate: '2026-07-05',
    plannedTime: '13:00',
    status: 'CHECKED_OUT',
    requiredDocs: ['SGK'],
    uploadedDocs: [
      {
        type: 'SGK',
        name: 'sgk_ise_giris_can.pdf',
        status: 'APPROVED',
        uploadedAt: '2026-07-04T10:00:00Z',
        fileUrl: 'MOCK_FILE_DATA_SGK'
      }
    ],
    trainingId: 'TRN-01',
    trainingWatched: true,
    quizCompleted: true,
    quizScore: 3,
    qrCodeData: 'VIS-1102-APPROVED',
    createdAt: '2026-07-03T11:00:00Z',
    checkInTime: '2026-07-05T12:55:00',
    checkOutTime: '2026-07-05T17:30:00'
  },
  {
    id: 'VIS-5582',
    firstName: 'Tarık',
    lastName: 'Koç',
    phone: '5359990011',
    email: 'tarik.koc@celikmakine.com',
    company: 'Çelik Makine Parçaları Sanayi',
    hostName: 'Kemal Yılmaz',
    department: 'Bakım Onarım Atölyesi',
    visitPurpose: 'Torna Tezgahı Arıza Tespiti',
    plannedDate: '2026-07-06',
    plannedTime: '11:00',
    status: 'REJECTED',
    requiredDocs: ['ISG'],
    uploadedDocs: [
      {
        type: 'ISG',
        name: 'isg_belgesi_eski_2023.pdf',
        status: 'REJECTED',
        rejectReason: 'Belge süresi dolmuştur. Lütfen son 1 yıla ait geçerli İSG Katılım Belgesi yükleyin.',
        uploadedAt: '2026-07-05T15:30:00Z',
        fileUrl: 'MOCK_FILE_DATA_ISG'
      }
    ],
    trainingId: 'TRN-02',
    trainingWatched: true,
    quizCompleted: true,
    quizScore: 2,
    createdAt: '2026-07-05T14:00:00Z'
  }
];

export const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'LOG-001',
    visitorId: 'VIS-1102',
    visitorName: 'Can Yıldız',
    company: 'Pak Temizlik A.Ş.',
    action: 'IN',
    timestamp: '2026-07-05T12:55:00',
    guardName: 'Ahmet Karahan (Nöbetçi Amiri)'
  },
  {
    id: 'LOG-002',
    visitorId: 'VIS-1102',
    visitorName: 'Can Yıldız',
    company: 'Pak Temizlik A.Ş.',
    action: 'OUT',
    timestamp: '2026-07-05T17:30:00',
    guardName: 'Ahmet Karahan (Nöbetçi Amiri)'
  },
  {
    id: 'LOG-003',
    visitorId: 'VIS-4452',
    visitorName: 'Zeynep Kaya',
    company: 'Biogen Laboratuvar Sistemleri',
    action: 'IN',
    timestamp: '2026-07-06T08:24:00',
    guardName: 'Mustafa Yılmaz (A Kapısı)'
  }
];
