export type VisitorStatus =
  | 'INVITED'            // Davetiye gönderildi, ön kayıt bekleniyor
  | 'PENDING_DOCS'       // Evrak yükleme / Eğitim aşamasında
  | 'PENDING_APPROVAL'   // Evrak yüklendi, sekreterya onayı bekliyor
  | 'APPROVED'           // Onaylandı, QR kod aktif
  | 'REJECTED'           // Evraklar reddedildi
  | 'CHECKED_IN'         // Tesiste (Giriş yaptı)
  | 'CHECKED_OUT';       // Tesisten ayrıldı (Çıkış yaptı)

export type DocumentType = 'SGK' | 'ISG' | 'ID_COPY' | 'OTHER' | string;

export interface UploadedDocument {
  type: DocumentType | string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  fileUrl?: string; // Simüle edilmiş gösterim için veri URL veya base64 mock
  uploadedAt?: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  description: string;
  questions?: QuizQuestion[]; // Videoya bağlı özel sınav soruları
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Doğru şıkkın index'i (0, 1, 2, 3)
}

export interface SmsConfig {
  provider: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
}

export interface AuthConfig {
  type: 'local' | 'ldap' | 'entra_id';
  ldapUrl?: string;
  ldapBaseDn?: string;
  ldapDomainSuffix?: string;
  entraTenantId?: string;
  entraClientId?: string;
  entraClientSecret?: string;
}

export interface CompanyTenant {
  code: string;
  name: string;
  logoUrl?: string;
  logoHeight?: number;
  themeMode?: 'dark' | 'light';
  primaryColor: string;
  secondaryColor: string;
  departments: string[];
  hosts: string[];
  dbType?: DatabaseType;
  dbConnectionString?: string;
  smtpConfig?: SmtpConfig;
  smsConfig?: SmsConfig;
  authConfig?: AuthConfig;
  trainingVideos?: TrainingVideo[];
}

export interface Visitor {
  id: string; // Benzersiz davet / referans kodu (Örn: VIS-1092)
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  hostName: string;
  department: string;
  visitPurpose: string;
  plannedDate: string;
  plannedTime: string;
  status: VisitorStatus;
  requiredDocs: (DocumentType | string)[];
  uploadedDocs: UploadedDocument[];
  trainingId: string; // İlgili eğitim videosunun ID'si
  trainingWatched: boolean;
  quizCompleted: boolean;
  quizScore?: number;
  qrCodeData?: string;
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
  entryType?: 'Ziyaret' | 'Çalışma';
  signedDocUrl?: string;
  rejectReason?: string;
  tenantCompanyCode?: string;
  idNo?: string;
  plateNumber?: string;
  emergencyContact?: string;
  kvkkApproved?: boolean;
}

export interface SecurityLog {
  id: string;
  visitorId: string;
  visitorName: string;
  company: string;
  action: 'IN' | 'OUT';
  timestamp: string;
  guardName: string;
  tenantCompanyCode?: string;
}

export type DatabaseType = 'local_storage' | 'postgresql' | 'mysql' | 'mssql' | 'mongodb' | 'firebase' | 'generic_api';

export interface TenantConfig {
  appName: string;
  systemCompanyCode?: string;
  logoUrl?: string; // base64 görsel veya veri URL'i
  logoHeight?: number; // logo boyutu (yükseklik - px)
  themeMode?: 'dark' | 'light'; // tema modu: dark veya light
  primaryColor: string;
  secondaryColor: string;
  dbType: DatabaseType;
  dbConnectionString: string;
  departments: string[]; // Dinamik departman tanımları
  trainingVideos: TrainingVideo[]; // Dinamik İSG videoları ve soruları
  smtpConfig?: SmtpConfig; // SMTP Mail Sunucu Konfigürasyonu
  companies?: CompanyTenant[]; // Multi-tenant registered companies list
}

export interface ContractorCompany {
  id: string;               // Otomatik üretilen Şirket Kodu (Örn: TAS-492)
  name: string;             // Firma Adı
  contactName: string;      // İrtibat Kişisi
  contactEmail: string;     // Yetkili E-postası
  username: string;         // Otomatik üretilen Kullanıcı Adı
  password: string;         // Otomatik üretilen Şifre
  status: 'PENDING_DOCS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requiredDocs: string[];   // Talep edilen evraklar (Örn: Vergi Levhası, İSG Taahhütnamesi)
  uploadedDocs: UploadedDocument[];
  createdAt: string;
  tenantCompanyCode?: string;
}

// Sistem kullanıcısı (Süper Yönetici tarafından eklenir)
export type UserRole = 'department' | 'admin' | 'isg' | 'security' | 'super_admin';

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  createdAt: string;
  companyCode?: string; // Scope user to a specific company/tenant e.g. "ARVATO"
}

// SMTP Mail Sunucu Konfigürasyonu
export interface SmtpConfig {
  host: string;
  port: number;
  senderEmail: string;
  senderName: string;
  username: string;
  password: string;
  useTls: boolean;
}


