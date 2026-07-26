import { knex, Knex } from 'knex';
import { MongoClient, Db } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

export type DatabaseType = 'local_storage' | 'postgresql' | 'mysql' | 'mssql' | 'mongodb' | 'firebase' | 'generic_api';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface TrainingVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  description: string;
  questions?: QuizQuestion[];
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

export interface SmtpConfig {
  host: string;
  port: number;
  senderEmail: string;
  senderName: string;
  username: string;
  password: string;
  useTls: boolean;
}

export interface TenantConfig {
  appName: string;
  systemCompanyCode?: string;
  logoUrl?: string;
  logoHeight?: number;
  themeMode?: 'dark' | 'light';
  primaryColor: string;
  secondaryColor: string;
  dbType: DatabaseType;
  dbConnectionString: string;
  departments: string[];
  trainingVideos: TrainingVideo[];
  companies?: CompanyTenant[];
  smtpConfig?: SmtpConfig;
  isInstalled?: boolean;
}

export interface UploadedDocument {
  type: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  fileUrl?: string;
  uploadedAt?: string;
}

export interface ContractorCompany {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  username: string;
  password: string;
  status: 'PENDING_DOCS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requiredDocs: string[];
  uploadedDocs: UploadedDocument[];
  createdAt: string;
  tenantCompanyCode?: string;
}

const CONFIG_PATH = path.join(__dirname, '../../data/config.json');
const LOCAL_DB_PATH = path.join(__dirname, '../../data/db_local.json');

// Ensure data folder exists
const dataDir = path.dirname(CONFIG_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default config if none exists
const DEFAULT_CONFIG: TenantConfig = {
  appName: "V-PASS SISTEM",
  primaryColor: "#00d2ff",
  secondaryColor: "#00f5a0",
  dbType: "local_storage",
  dbConnectionString: "",
  logoHeight: 40,
  themeMode: "dark",
  departments: [
    "İSG ve Çevre",
    "Bilgi Teknolojileri",
    "İnsan Kaynakları",
    "Bakım Onarım",
    "Üretim Planlama"
  ],
  trainingVideos: [
    {
      id: "VID-01",
      title: "Genel Tesis Giriş ve İSG Kuralları",
      duration: "1:30",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      description: "Tesis genelinde uyulması zorunlu olan acil durum planı, baret kullanımı ve kişisel koruyucu donanım kurallarını kapsar.",
      questions: [
        {
          id: "Q1",
          question: "Tesis sınırları içerisinde hangi koruyucu ekipmanların giyilmesi zorunludur?",
          options: [
            "Sadece baret ve gözlük",
            "Baret, çelik burunlu iş ayakkabısı ve reflektörlü yelek",
            "Herhangi bir ekipman zorunluluğu yoktur",
            "Sivil kıyafet yeterlidir"
          ],
          correctAnswer: 1
        },
        {
          id: "Q2",
          question: "Acil durum tahliye sireni duyulduğunda yapılması gereken ilk eylem nedir?",
          options: [
            "Çalışmaya sakin bir şekilde devam etmek",
            "Hızlıca kendi aracımıza doğru koşmak",
            "Panik yapmadan en yakın acil toplanma alanına gitmek",
            "Güvenlik kulübesinde toplanmak"
          ],
          correctAnswer: 2
        },
        {
          id: "Q3",
          question: "Tesis içerisinde cep telefonu ile fotoğraf veya video çekilmesi kuralları nelerdir?",
          options: [
            "Her alanda serbestçe çekim yapılabilir",
            "Sadece sosyal medyada paylaşılmayacaksa çekilebilir",
            "Tesis genelinde izinsiz fotoğraf ve video çekimi kesinlikle yasaktır",
            "Sadece öğle yemeği saatinde serbesttir"
          ],
          correctAnswer: 2
        }
      ]
    }
  ],
  companies: [
    {
      code: "ARVATO",
      name: "Arvato Lojistik",
      logoUrl: "/arvato_logo.png",
      primaryColor: "#00d2ff",
      secondaryColor: "#0066ff",
      logoHeight: 40,
      themeMode: "light",
      departments: ["İSG ve Çevre", "IT", "HR", "Lojistik", "Depo Operasyonları"],
      hosts: ["Ahmet Yılmaz", "Canan Demir", "Esra Koç", "Mehmet Öztürk"]
    },
    {
      code: "DANTE",
      name: "Dante Teknoloji",
      logoUrl: "/dante_logo.png",
      primaryColor: "#ff7b00",
      secondaryColor: "#ff3b00",
      logoHeight: 45,
      themeMode: "dark",
      departments: ["Yazılım Geliştirme", "Ar-Ge", "Pazarlama", "Müşteri Destek"],
      hosts: ["Volkan Ak", "Murat Yıldız", "Ebru Kaya", "Hasan Çelik"]
    },
    {
      code: "KARTON",
      name: "Karton A.Ş.",
      logoUrl: "/karton_logo.png",
      primaryColor: "#10b981",
      secondaryColor: "#047857",
      logoHeight: 40,
      themeMode: "dark",
      departments: ["Üretim", "Kalite Kontrol", "Mali İşler", "İSG Departmanı"],
      hosts: ["Fatih Şahin", "Zeynep Aslan", "Kemal Yılmaz"]
    }
  ]
};

// Global connections
let sqlConnection: Knex | null = null;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Multi-tenant Dynamic database connection pools
const dbPools: Record<string, { dbType: DatabaseType; sqlConnection?: Knex; mongoClient?: MongoClient; mongoDb?: Db }> = {};

export function isSystemTenantCode(companyCode?: string): boolean {
  if (!companyCode) return true;
  const config = getStoredConfig();
  const systemCompanyCode = (config.systemCompanyCode || 'SAFEFLOW').toUpperCase();
  const upper = companyCode.toUpperCase();
  return upper === systemCompanyCode || upper === 'SAFEFLOW' || upper === 'ADMIN' || upper === 'SYSTEM';
}

// Helper to get local JSON database file path for a company
export function getTenantLocalDbPath(companyCode?: string): string {
  if (isSystemTenantCode(companyCode)) {
    return LOCAL_DB_PATH;
  }
  const cleanCode = (companyCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return path.join(path.dirname(LOCAL_DB_PATH), `db_${cleanCode}.json`);
}

// Helper to resolve database config for a company
export function getTenantDbConfig(companyCode?: string): { dbType: DatabaseType; dbConnectionString: string } {
  const config = getStoredConfig();
  if (companyCode && !isSystemTenantCode(companyCode)) {
    const matched = (config.companies || []).find(c => c.code.toUpperCase() === companyCode.toUpperCase());
    if (matched && matched.dbType && matched.dbType !== 'local_storage') {
      return {
        dbType: matched.dbType,
        dbConnectionString: matched.dbConnectionString || ''
      };
    }
  }
  return {
    dbType: config.dbType,
    dbConnectionString: config.dbConnectionString
  };
}

// Helper to get or create connection pool for a company
export async function getTenantDbConnection(companyCode?: string): Promise<{ dbType: DatabaseType; sqlConnection?: Knex; mongoDb?: Db }> {
  const dbConfig = getTenantDbConfig(companyCode);
  
  // Decide whether to use the default/system database or a tenant database
  const isSystemTenant = isSystemTenantCode(companyCode);
                          
  if (isSystemTenant || dbConfig.dbType === 'local_storage') {
    const systemConfig = getStoredConfig();
    return {
      dbType: systemConfig.dbType,
      sqlConnection: sqlConnection || undefined,
      mongoDb: mongoDb || undefined
    };
  }

  const key = (companyCode || '').toUpperCase();
  if (dbPools[key]) {
    const cached = dbPools[key];
    return {
      dbType: cached.dbType,
      sqlConnection: cached.sqlConnection,
      mongoDb: cached.mongoDb
    };
  }

  console.log(`[DB Pool] Creating new connection pool for tenant: ${key} (${dbConfig.dbType.toUpperCase()})`);

  if (['postgresql', 'mysql', 'mssql'].includes(dbConfig.dbType)) {
    let client = '';
    if (dbConfig.dbType === 'postgresql') client = 'pg';
    else if (dbConfig.dbType === 'mysql') client = 'mysql2';
    else if (dbConfig.dbType === 'mssql') client = 'mssql';

    const conn = knex({
      client: client,
      connection: dbConfig.dbConnectionString,
      pool: { min: 2, max: 10 },
      useNullAsDefault: true
    });

    // Test connection
    await conn.raw('SELECT 1+1 AS result');

    // Auto-migrate tables for this tenant
    await createSQLSchemas(conn, dbConfig.dbType);

    dbPools[key] = { dbType: dbConfig.dbType, sqlConnection: conn };
    return { dbType: dbConfig.dbType, sqlConnection: conn };
  }

  if (dbConfig.dbType === 'mongodb') {
    const client = new MongoClient(dbConfig.dbConnectionString);
    await client.connect();
    const db = client.db();

    // Check/create collections
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    for (const name of ['visitors', 'security_logs', 'contractors', 'system_users', 'work_permits']) {
      if (!colNames.includes(name)) {
        await db.createCollection(name);
      }
    }

    dbPools[key] = { dbType: 'mongodb', mongoClient: client, mongoDb: db };
    return { dbType: 'mongodb', mongoDb: db };
  }

  throw new Error(`Unsupported database type: ${dbConfig.dbType}`);
}

// Load Tenant Config from local JSON file
export function getStoredConfig(): TenantConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.isInstalled === undefined) {
        parsed.isInstalled = true; // Fallback for existing installations
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load config, using defaults:", err);
  }
  return { ...DEFAULT_CONFIG, isInstalled: false };
}

// Save Tenant Config to local JSON file
export function saveStoredConfig(config: TenantConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// Initialize Active Database Connection based on current config
export async function initDatabase(): Promise<{ success: boolean; message: string }> {
  // Close all cached tenant database connections
  for (const key of Object.keys(dbPools)) {
    const cached = dbPools[key];
    try {
      if (cached.sqlConnection) {
        await cached.sqlConnection.destroy();
      }
      if (cached.mongoClient) {
        await cached.mongoClient.close();
      }
    } catch (err: any) {
      console.error(`Failed to close tenant pool for ${key}:`, err.message);
    }
    delete dbPools[key];
  }

  const config = getStoredConfig();
  
  if (!config.isInstalled) {
    console.log(`[DB Manager] System is not installed yet. Postponing database initialization.`);
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    return { success: true, message: "Kurulum bekleniyor. Geçici dosya veritabanı aktif." };
  }

  // Close existing system connections
  if (sqlConnection) {
    await sqlConnection.destroy();
    sqlConnection = null;
  }
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
  }

  console.log(`[DB Manager] Initializing system database connection for: ${config.dbType.toUpperCase()}`);

  try {
    if (config.dbType === 'local_storage') {
      // Local JSON File DB initialization
      if (!fs.existsSync(LOCAL_DB_PATH)) {
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
      }
      return { success: true, message: "Yerel JSON dosya veritabanı aktif." };
    }

    if (['postgresql', 'mysql', 'mssql'].includes(config.dbType)) {
      let client = '';
      if (config.dbType === 'postgresql') client = 'pg';
      else if (config.dbType === 'mysql') client = 'mysql2';
      else if (config.dbType === 'mssql') client = 'mssql';

      sqlConnection = knex({
        client: client,
        connection: config.dbConnectionString,
        pool: { min: 2, max: 10 },
        useNullAsDefault: true
      });

      // Test connection
      await sqlConnection.raw('SELECT 1+1 AS result');
      
      // Auto-migrate tables
      await createSQLSchemas(sqlConnection, config.dbType);
      
      return { 
        success: true, 
        message: `${config.dbType.toUpperCase()} SQL veritabanı bağlantısı ve şema doğrulaması başarılı.` 
      };
    }

    if (config.dbType === 'mongodb') {
      mongoClient = new MongoClient(config.dbConnectionString);
      await mongoClient.connect();
      mongoDb = mongoClient.db();
      
      // Check/create collections
      const collections = await mongoDb.listCollections().toArray();
      const colNames = collections.map(c => c.name);
      
      if (!colNames.includes('visitors')) {
        await mongoDb.createCollection('visitors');
      }
      if (!colNames.includes('security_logs')) {
        await mongoDb.createCollection('security_logs');
      }
      if (!colNames.includes('contractors')) {
        await mongoDb.createCollection('contractors');
      }
      if (!colNames.includes('work_permits')) {
        await mongoDb.createCollection('work_permits');
      }
      
      return { success: true, message: "MongoDB bağlantısı ve koleksiyon doğrulaması başarılı." };
    }

    // Generic API mode fallback
    return { success: true, message: "Genel API/Webhook yönlendirmesi aktif." };

  } catch (err: any) {
    console.error(`[DB Manager] Connection error on ${config.dbType}:`, err.message);
    return { success: false, message: `Bağlantı Hatası: ${err.message}` };
  }
}

// Create database schemas if they don't exist
async function createSQLSchemas(db: Knex, dbType: string) {
  // Visitors Table
  const hasVisitors = await db.schema.hasTable('visitors');
  if (!hasVisitors) {
    await db.schema.createTable('visitors', table => {
      table.string('id', 50).primary();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('phone', 20).notNullable();
      table.string('email', 150);
      table.string('company', 150);
      table.string('host_name', 150);
      table.string('department', 50);
      table.string('visit_purpose', 255);
      table.string('planned_date', 50);
      table.string('planned_time', 50);
      table.string('status', 30).defaultTo('PENDING_APPROVAL');
      table.string('created_at', 50);
      table.text('required_docs');
      table.text('uploaded_docs'); // JSON stringified array
      table.string('training_id', 50);
      table.boolean('training_watched').defaultTo(false);
      table.boolean('quiz_completed').defaultTo(false);
      table.integer('quiz_score').defaultTo(0);
      table.string('qr_code_data', 255);
      table.string('check_in_time', 50);
      table.string('check_out_time', 50);
      table.string('entry_type', 30).defaultTo('Ziyaret');
      table.text('signed_doc_url');
      table.string('reject_reason', 255);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'visitors' table created successfully in ${dbType}.`);
  } else {
    // Check and add missing columns
    const columnsToEnsure = [
      { name: 'email', type: 'string', length: 150 },
      { name: 'visit_purpose', type: 'string', length: 255 },
      { name: 'planned_date', type: 'string', length: 50 },
      { name: 'planned_time', type: 'string', length: 50 },
      { name: 'required_docs', type: 'text' },
      { name: 'training_id', type: 'string', length: 50 },
      { name: 'quiz_completed', type: 'boolean', default: false },
      { name: 'qr_code_data', type: 'string', length: 255 },
      { name: 'check_in_time', type: 'string', length: 50 },
      { name: 'check_out_time', type: 'string', length: 50 },
      { name: 'entry_type', type: 'string', length: 30, default: 'Ziyaret' },
      { name: 'signed_doc_url', type: 'text' },
      { name: 'tenant_company_code', type: 'string', length: 50 }
    ];

    for (const col of columnsToEnsure) {
      const hasCol = await db.schema.hasColumn('visitors', col.name);
      if (!hasCol) {
        await db.schema.alterTable('visitors', table => {
          if (col.type === 'string') {
            table.string(col.name, col.length);
          } else if (col.type === 'text') {
            table.text(col.name);
          } else if (col.type === 'boolean') {
            table.boolean(col.name).defaultTo(col.default as boolean);
          }
        });
      }
    }
  }

  // Security Logs Table
  const hasLogs = await db.schema.hasTable('security_logs');
  if (!hasLogs) {
    await db.schema.createTable('security_logs', table => {
      table.string('id', 50).primary();
      table.string('visitor_id', 50).notNullable();
      table.string('visitor_name', 200).notNullable();
      table.string('company', 150);
      table.string('action', 10).notNullable(); // IN or OUT
      table.string('timestamp', 50).notNullable();
      table.string('guard_name', 150);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'security_logs' table created successfully in ${dbType}.`);
  } else {
    const hasCompany = await db.schema.hasColumn('security_logs', 'company');
    if (!hasCompany) {
      await db.schema.alterTable('security_logs', table => {
        table.string('company', 150);
      });
    }
    const hasTenantCode = await db.schema.hasColumn('security_logs', 'tenant_company_code');
    if (!hasTenantCode) {
      await db.schema.alterTable('security_logs', table => {
        table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
      });
    }
  }

  // Contractors Table Auto-Migration
  const hasContractors = await db.schema.hasTable('contractors');
  if (!hasContractors) {
    await db.schema.createTable('contractors', table => {
      table.string('id', 50).primary();
      table.string('name', 200).notNullable();
      table.string('contact_name', 150).notNullable();
      table.string('contact_email', 150).notNullable();
      table.string('username', 100).notNullable();
      table.string('password', 100).notNullable();
      table.string('status', 30).defaultTo('PENDING_DOCS');
      table.text('required_docs'); // JSON array of strings
      table.text('uploaded_docs'); // JSON UploadedDocument[]
      table.string('created_at', 50);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'contractors' table created successfully in ${dbType}.`);
  } else {
    const hasTenantCode = await db.schema.hasColumn('contractors', 'tenant_company_code');
    if (!hasTenantCode) {
      await db.schema.alterTable('contractors', table => {
        table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
      });
    }
  }

  // System Users Table Auto-Migration
  const hasUsers = await db.schema.hasTable('system_users');
  if (!hasUsers) {
    await db.schema.createTable('system_users', table => {
      table.string('id', 50).primary();
      table.string('first_name', 100).notNullable();
      table.string('last_name', 100).notNullable();
      table.string('email', 150).notNullable();
      table.string('username', 100).notNullable();
      table.string('password', 100).notNullable();
      table.string('role', 50).notNullable();
      table.string('department', 100);
      table.boolean('is_active').defaultTo(true);
      table.string('created_at', 50);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'system_users' table created successfully in ${dbType}.`);
  } else {
    const hasTenantCode = await db.schema.hasColumn('system_users', 'tenant_company_code');
    if (!hasTenantCode) {
      await db.schema.alterTable('system_users', table => {
        table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
      });
    }
  }

  // Work Permits Table Auto-Migration
  const hasWorkPermits = await db.schema.hasTable('work_permits');
  if (!hasWorkPermits) {
    await db.schema.createTable('work_permits', table => {
      table.string('id', 50).primary();
      table.string('company_id', 50).notNullable();
      table.string('company_name', 200).notNullable();
      table.string('work_type', 100).notNullable();
      table.text('description');
      table.text('assigned_workers'); // JSON array of strings
      table.string('location', 200).notNullable();
      table.string('start_date', 50).notNullable();
      table.string('end_date', 50).notNullable();
      table.text('checklist'); // JSON stringified checklist
      table.string('status', 30).defaultTo('PENDING_APPROVAL');
      table.string('reject_reason', 255);
      table.string('created_at', 50);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'work_permits' table created successfully in ${dbType}.`);
  } else {
    const hasTenantCode = await db.schema.hasColumn('work_permits', 'tenant_company_code');
    if (!hasTenantCode) {
      await db.schema.alterTable('work_permits', table => {
        table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
      });
    }
  }

  // Departments Table Auto-Migration
  const hasDepartments = await db.schema.hasTable('departments');
  if (!hasDepartments) {
    await db.schema.createTable('departments', table => {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.integer('sort_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.string('created_at', 50);
      table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
    });
    console.log(`[DB Manager] 'departments' table created successfully in ${dbType}.`);
  } else {
    const hasTenantCode = await db.schema.hasColumn('departments', 'tenant_company_code');
    if (!hasTenantCode) {
      await db.schema.alterTable('departments', table => {
        table.string('tenant_company_code', 50).defaultTo('SAFEFLOW');
      });
    }
  }

  // Seed default values into SQL if empty
  await seedSQLData(db);
}

// Seed default values into SQL tables if they are empty
async function seedSQLData(db: Knex) {
  try {
    // 1. Seed system_users
    const userCountRow = await db('system_users').count({ count: '*' }).first();
    const userCount = userCountRow ? Number(userCountRow.count || Object.values(userCountRow)[0]) : 0;
    if (userCount === 0) {
      const initialUsers = [
        {
          id: 'USR-1001',
          first_name: 'Sistem',
          last_name: 'Yöneticisi',
          email: 'superadmin@sirket.com',
          username: 'superadmin',
          password: 'Admin12345!',
          role: 'super_admin',
          department: 'IT Yönetim',
          is_active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'USR-1002',
          first_name: 'Ayşe',
          last_name: 'Kaya',
          email: 'ayse.kaya@sirket.com',
          username: 'sekreterya',
          password: 'Sec12345!',
          role: 'admin',
          department: 'İdari İşler',
          is_active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'USR-1003',
          first_name: 'Ahmet',
          last_name: 'Yılmaz',
          email: 'ahmet.yilmaz@sirket.com',
          username: 'guvenlik',
          password: 'Guard12345!',
          role: 'security',
          department: 'Güvenlik Kontrol',
          is_active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'USR-1004',
          first_name: 'Mehmet',
          last_name: 'Aydın',
          email: 'mehmet.aydin@sirket.com',
          username: 'isg',
          password: 'Isg12345!',
          role: 'isg',
          department: 'İSG ve Çevre',
          is_active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: 'USR-1005',
          first_name: 'Can',
          last_name: 'Demir',
          email: 'can.demir@sirket.com',
          username: 'departman',
          password: 'Dept12345!',
          role: 'department',
          department: 'İSG ve Çevre',
          is_active: 1,
          created_at: new Date().toISOString()
        }
      ];
      await db('system_users').insert(initialUsers);
      console.log("[DB Manager] Seeded default system users into MySQL.");
    }

    // 1b. Seed departments
    const deptCountRow = await db('departments').count({ count: '*' }).first();
    const deptCount = deptCountRow ? Number(deptCountRow.count || Object.values(deptCountRow)[0]) : 0;
    if (deptCount === 0) {
      const storedConfig = getStoredConfig();
      const defaultDepts = storedConfig.departments && storedConfig.departments.length > 0
        ? storedConfig.departments
        : ['İSG ve Çevre', 'Bilgi Teknolojileri', 'İnsan Kaynakları', 'Bakım Onarım', 'Üretim Planlama'];
      const deptRows = defaultDepts.map((name, idx) => ({
        name,
        sort_order: idx,
        is_active: true,
        created_at: new Date().toISOString()
      }));
      await db('departments').insert(deptRows);
      console.log("[DB Manager] Seeded default departments into MySQL.");
    }

    // 2. Seed contractors
    const contractorCountRow = await db('contractors').count({ count: '*' }).first();
    const contractorCount = contractorCountRow ? Number(contractorCountRow.count || Object.values(contractorCountRow)[0]) : 0;
    if (contractorCount === 0) {
      const initialContractors = [
        {
          id: 'TAS-289',
          name: 'Vega Insaat A.S.',
          contact_name: 'Selim Vega',
          contact_email: 'selim@vegainssat.com',
          username: 'selim45',
          password: 'DLT5YGVT',
          status: 'APPROVED',
          required_docs: JSON.stringify(['Vergi Levhası', 'İSG Taahhütnamesi']),
          uploaded_docs: JSON.stringify([
            {
              type: 'Vergi Levhası',
              name: 'vergi_levhasi_2025.pdf',
              status: 'APPROVED',
              fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKJd...',
              uploadedAt: '2026-07-06T20:20:26.579Z'
            }
          ]),
          created_at: '2026-07-06T20:20:26.549Z'
        }
      ];
      await db('contractors').insert(initialContractors);
      console.log("[DB Manager] Seeded default contractors into MySQL.");
    }

    // 3. Seed visitors
    const visitorCountRow = await db('visitors').count({ count: '*' }).first();
    const visitorCount = visitorCountRow ? Number(visitorCountRow.count || Object.values(visitorCountRow)[0]) : 0;
    if (visitorCount === 0) {
      const initialVisitors = [
        {
          id: 'VIS-9481',
          first_name: 'Ahmet',
          last_name: 'Karan',
          phone: '5551234567',
          email: 'ahmet.karan@teknoinsaat.com',
          company: 'Tekno İnşaat Taahhüt A.Ş.',
          host_name: 'Murat Şahin',
          department: 'Yatırımlar ve Altyapı Direktörlüğü',
          visit_purpose: 'Yıllık Bakım ve Kaynak İşleri',
          planned_date: '2026-07-08',
          planned_time: '09:30',
          status: 'PENDING_DOCS',
          required_docs: JSON.stringify(['SGK', 'ISG']),
          uploaded_docs: JSON.stringify([]),
          training_id: 'TRN-02',
          training_watched: 0,
          quiz_completed: 0,
          quiz_score: 0,
          created_at: '2026-07-06T10:00:00Z',
          entry_type: 'Çalışma'
        },
        {
          id: 'VIS-3209',
          first_name: 'Elif',
          last_name: 'Yılmaz',
          phone: '5449876543',
          email: 'elif.yilmaz@globaldenetim.com',
          company: 'Global Denetim ve Danışmanlık',
          host_name: 'Aylin Çelik',
          department: 'Mali İşler ve Finans',
          visit_purpose: 'Mali Yıl Kapanış Denetimi',
          planned_date: '2026-07-07',
          planned_time: '10:00',
          status: 'PENDING_APPROVAL',
          required_docs: JSON.stringify(['ID_COPY', 'SGK']),
          uploaded_docs: JSON.stringify([
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
          ]),
          training_id: 'TRN-01',
          training_watched: 1,
          quiz_completed: 1,
          quiz_score: 3,
          created_at: '2026-07-06T11:20:00Z',
          entry_type: 'Ziyaret'
        },
        {
          id: 'VIS-7821',
          first_name: 'Mehmet',
          last_name: 'Demir',
          phone: '5324567890',
          email: 'mehmet.demir@asiasanal.com',
          company: 'Asya Sanayi Otomasyon',
          host_name: 'Serkan Öztürk',
          department: 'Üretim ve Bakım Planlama',
          visit_purpose: 'PLC Yazılım Güncellemesi',
          planned_date: '2026-07-06',
          planned_time: '14:00',
          status: 'APPROVED',
          required_docs: JSON.stringify(['ISG']),
          uploaded_docs: JSON.stringify([
            {
              type: 'ISG',
              name: 'isg_egitimi_katilim_belgesi.pdf',
              status: 'APPROVED',
              uploadedAt: '2026-07-05T16:00:00Z',
              fileUrl: 'MOCK_FILE_DATA_ISG'
            }
          ]),
          training_id: 'TRN-01',
          training_watched: 1,
          quiz_completed: 1,
          quiz_score: 3,
          qr_code_data: 'VIS-7821-APPROVED',
          created_at: '2026-07-05T12:00:00Z',
          entry_type: 'Ziyaret'
        }
      ];
      await db('visitors').insert(initialVisitors);
      console.log("[DB Manager] Seeded default visitors into MySQL.");
    }

    // 4. Seed security_logs
    const logCountRow = await db('security_logs').count({ count: '*' }).first();
    const logCount = logCountRow ? Number(logCountRow.count || Object.values(logCountRow)[0]) : 0;
    if (logCount === 0) {
      const initialLogs = [
        {
          id: 'LOG-001',
          visitor_id: 'VIS-1102',
          visitor_name: 'Can Yıldız',
          company: 'Pak Temizlik A.Ş.',
          action: 'IN',
          timestamp: '2026-07-05T12:55:00',
          guard_name: 'Ahmet Karahan (Nöbetçi Amiri)'
        },
        {
          id: 'LOG-002',
          visitor_id: 'VIS-1102',
          visitor_name: 'Can Yıldız',
          company: 'Pak Temizlik A.Ş.',
          action: 'OUT',
          timestamp: '2026-07-05T17:30:00',
          guard_name: 'Ahmet Karahan (Nöbetçi Amiri)'
        },
        {
          id: 'LOG-003',
          visitor_id: 'VIS-4452',
          visitor_name: 'Zeynep Kaya',
          company: 'Biogen Laboratuvar Sistemleri',
          action: 'IN',
          timestamp: '2026-07-06T08:24:00',
          guard_name: 'Mustafa Yılmaz (A Kapısı)'
        }
      ];
      await db('security_logs').insert(initialLogs);
      console.log("[DB Manager] Seeded default security logs into MySQL.");
    }
  } catch (err: any) {
    console.error("[DB Manager] Seeding failed:", err.message);
  }
}

// Helper methods for reading/writing data with dynamic multi-tenant connections
function getScopeFilter(companyCode?: string) {
  if (isSystemTenantCode(companyCode)) return {};
  return { tenant_company_code: (companyCode || '').toUpperCase() };
}

// 1. Visitors
export async function dbGetVisitors(companyCode?: string): Promise<any[]> {
  const dbConfig = getTenantDbConfig(companyCode);
  
  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.visitors || [];
  }
  
  const tenantDb = await getTenantDbConnection(companyCode);
  
  if (tenantDb.sqlConnection) {
    const query = tenantDb.sqlConnection('visitors').select('*');
    const filter = getScopeFilter(companyCode);
    if (filter.tenant_company_code) {
      query.where({ tenant_company_code: filter.tenant_company_code });
    }
    
    const rows = await query;
    return rows.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      email: r.email,
      company: r.company,
      hostName: r.host_name,
      department: r.department,
      visitPurpose: r.visit_purpose,
      plannedDate: r.planned_date,
      plannedTime: r.planned_time,
      status: r.status,
      requiredDocs: r.required_docs ? JSON.parse(r.required_docs) : [],
      uploadedDocs: r.uploaded_docs ? JSON.parse(r.uploaded_docs) : [],
      trainingId: r.training_id,
      trainingWatched: !!r.training_watched,
      quizCompleted: !!r.quiz_completed,
      quizScore: r.quiz_score,
      qrCodeData: r.qr_code_data,
      createdAt: r.created_at,
      checkInTime: r.check_in_time,
      checkOutTime: r.check_out_time,
      entryType: r.entry_type,
      signedDocUrl: r.signed_doc_url,
      rejectReason: r.reject_reason,
      tenantCompanyCode: r.tenant_company_code
    }));
  }

  if (tenantDb.mongoDb) {
    const filter = getScopeFilter(companyCode);
    const docs = await tenantDb.mongoDb.collection('visitors').find(filter).toArray();
    return docs.map(d => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
      tenantCompanyCode: d.tenantCompanyCode
    }));
  }

  return [];
}

export async function dbSaveVisitors(visitors: any[], companyCode?: string): Promise<void> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    data.visitors = visitors;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  const activeCompanyCode = companyCode && !isSystemTenantCode(companyCode) ? companyCode.toUpperCase() : 'SAFEFLOW';

  if (tenantDb.sqlConnection) {
    for (const v of visitors) {
      const sqlObj = {
        first_name: v.firstName,
        last_name: v.lastName,
        phone: v.phone,
        email: v.email || '',
        company: v.company || '',
        host_name: v.hostName || '',
        department: v.department || '',
        visit_purpose: v.visitPurpose || '',
        planned_date: v.plannedDate || '',
        planned_time: v.plannedTime || '',
        status: v.status,
        required_docs: JSON.stringify(v.requiredDocs || []),
        uploaded_docs: JSON.stringify(v.uploadedDocs || []),
        training_id: v.trainingId || '',
        training_watched: v.trainingWatched ? 1 : 0,
        quiz_completed: v.quizCompleted ? 1 : 0,
        quiz_score: v.quizScore || 0,
        qr_code_data: v.qrCodeData || null,
        created_at: v.createdAt || new Date().toISOString(),
        check_in_time: v.checkInTime || null,
        check_out_time: v.checkOutTime || null,
        entry_type: v.entryType || 'Ziyaret',
        signed_doc_url: v.signedDocUrl || null,
        reject_reason: v.rejectReason || null,
        tenant_company_code: v.tenantCompanyCode || activeCompanyCode
      };

      const existing = await tenantDb.sqlConnection('visitors').where({ id: v.id }).first();
      if (existing) {
        await tenantDb.sqlConnection('visitors').where({ id: v.id }).update(sqlObj);
      } else {
        await tenantDb.sqlConnection('visitors').insert({ id: v.id, ...sqlObj });
      }
    }
    return;
  }

  if (tenantDb.mongoDb) {
    for (const v of visitors) {
      const doc = { ...v, _id: v.id, tenantCompanyCode: v.tenantCompanyCode || activeCompanyCode };
      delete doc.id;
      await tenantDb.mongoDb.collection('visitors').replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }
}

export async function dbGetLogs(companyCode?: string): Promise<any[]> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.logs || [];
  }

  const tenantDb = await getTenantDbConnection(companyCode);

  if (tenantDb.sqlConnection) {
    const query = tenantDb.sqlConnection('security_logs').select('*');
    const filter = getScopeFilter(companyCode);
    if (filter.tenant_company_code) {
      query.where({ tenant_company_code: filter.tenant_company_code });
    }
    
    const rows = await query;
    return rows.map(r => ({
      id: r.id,
      visitorId: r.visitor_id,
      visitorName: r.visitor_name,
      company: r.company,
      action: r.action,
      timestamp: r.timestamp,
      guardName: r.guard_name,
      tenantCompanyCode: r.tenant_company_code
    }));
  }

  if (tenantDb.mongoDb) {
    const filter = getScopeFilter(companyCode);
    const docs = await tenantDb.mongoDb.collection('security_logs').find(filter).toArray();
    return docs.map(d => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
      tenantCompanyCode: d.tenantCompanyCode
    }));
  }

  return [];
}

export async function dbSaveLogs(logs: any[], companyCode?: string): Promise<void> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    data.logs = logs;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  const activeCompanyCode = companyCode && !isSystemTenantCode(companyCode) ? companyCode.toUpperCase() : 'SAFEFLOW';

  if (tenantDb.sqlConnection) {
    for (const l of logs) {
      const sqlObj = {
        visitor_id: l.visitorId,
        visitor_name: l.visitorName,
        company: l.company || '',
        action: l.action,
        timestamp: l.timestamp,
        guard_name: l.guardName,
        tenant_company_code: l.tenantCompanyCode || activeCompanyCode
      };
      const existing = await tenantDb.sqlConnection('security_logs').where({ id: l.id }).first();
      if (!existing) {
        await tenantDb.sqlConnection('security_logs').insert({ id: l.id, ...sqlObj });
      }
    }
    return;
  }

  if (tenantDb.mongoDb) {
    for (const l of logs) {
      const doc = { ...l, _id: l.id, tenantCompanyCode: l.tenantCompanyCode || activeCompanyCode };
      delete doc.id;
      await tenantDb.mongoDb.collection('security_logs').replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }
}

export async function dbGetContractors(companyCode?: string): Promise<any[]> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.contractors || [];
  }

  const tenantDb = await getTenantDbConnection(companyCode);

  if (tenantDb.sqlConnection) {
    const query = tenantDb.sqlConnection('contractors').select('*');
    const filter = getScopeFilter(companyCode);
    if (filter.tenant_company_code) {
      query.where({ tenant_company_code: filter.tenant_company_code });
    }

    const rows = await query;
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      contactName: r.contact_name,
      contactEmail: r.contact_email,
      username: r.username,
      password: r.password,
      status: r.status,
      requiredDocs: r.required_docs ? JSON.parse(r.required_docs) : [],
      uploadedDocs: r.uploaded_docs ? JSON.parse(r.uploaded_docs) : [],
      createdAt: r.created_at,
      tenantCompanyCode: r.tenant_company_code
    }));
  }

  if (tenantDb.mongoDb) {
    const filter = getScopeFilter(companyCode);
    const docs = await tenantDb.mongoDb.collection('contractors').find(filter).toArray();
    return docs.map(d => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
      tenantCompanyCode: d.tenantCompanyCode
    })) as any[];
  }

  return [];
}

export async function dbSaveContractors(contractors: any[], companyCode?: string): Promise<void> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    data.contractors = contractors;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  const activeCompanyCode = companyCode && !isSystemTenantCode(companyCode) ? companyCode.toUpperCase() : 'SAFEFLOW';

  if (tenantDb.sqlConnection) {
    for (const c of contractors) {
      const sqlObj = {
        name: c.name,
        contact_name: c.contactName,
        contact_email: c.contactEmail,
        username: c.username,
        password: c.password,
        status: c.status,
        required_docs: JSON.stringify(c.requiredDocs || []),
        uploaded_docs: JSON.stringify(c.uploadedDocs || []),
        created_at: c.createdAt,
        tenant_company_code: c.tenantCompanyCode || activeCompanyCode
      };

      const existing = await tenantDb.sqlConnection('contractors').where({ id: c.id }).first();
      if (existing) {
        await tenantDb.sqlConnection('contractors').where({ id: c.id }).update(sqlObj);
      } else {
        await tenantDb.sqlConnection('contractors').insert({ id: c.id, ...sqlObj });
      }
    }
    return;
  }

  if (tenantDb.mongoDb) {
    for (const c of contractors) {
      const doc = { ...c, _id: c.id, tenantCompanyCode: c.tenantCompanyCode || activeCompanyCode };
      delete (doc as any).id;
      await tenantDb.mongoDb.collection('contractors').replaceOne({ _id: doc._id as any }, doc as any, { upsert: true });
    }
  }
}

// ============ System Users CRUD ============

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: 'department' | 'admin' | 'isg' | 'security' | 'super_admin';
  department: string;
  isActive: boolean;
  createdAt: string;
  companyCode?: string;
  tenantCompanyCode?: string;
}

export async function dbGetUsers(companyCode?: string): Promise<SystemUser[]> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.users || [];
  }

  const tenantDb = await getTenantDbConnection(companyCode);

  if (tenantDb.sqlConnection) {
    const query = tenantDb.sqlConnection('system_users').select('*');
    const filter = getScopeFilter(companyCode);
    if (filter.tenant_company_code) {
      query.where({ tenant_company_code: filter.tenant_company_code });
    }

    const rows = await query;
    return rows.map((r: any) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      username: r.username,
      password: r.password,
      role: r.role,
      department: r.department,
      isActive: r.is_active === 1 || r.is_active === true,
      createdAt: r.created_at,
      companyCode: r.tenant_company_code,
      tenantCompanyCode: r.tenant_company_code
    }));
  }

  if (tenantDb.mongoDb) {
    const filter = getScopeFilter(companyCode);
    const docs = await tenantDb.mongoDb.collection('system_users').find(filter).toArray();
    return docs.map((d: any) => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
      companyCode: d.tenantCompanyCode,
      tenantCompanyCode: d.tenantCompanyCode
    })) as any[];
  }

  return [];
}

export async function dbSaveUsers(users: SystemUser[], companyCode?: string): Promise<void> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    data.users = users;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  const activeCompanyCode = companyCode && !isSystemTenantCode(companyCode) ? companyCode.toUpperCase() : 'SAFEFLOW';

  if (tenantDb.sqlConnection) {
    for (const u of users) {
      const sqlObj = {
        first_name: u.firstName,
        last_name: u.lastName,
        email: u.email,
        username: u.username,
        password: u.password,
        role: u.role,
        department: u.department,
        is_active: u.isActive ? 1 : 0,
        created_at: u.createdAt,
        tenant_company_code: u.companyCode || u.tenantCompanyCode || activeCompanyCode
      };
      const existing = await tenantDb.sqlConnection('system_users').where({ id: u.id }).first();
      if (existing) {
        await tenantDb.sqlConnection('system_users').where({ id: u.id }).update(sqlObj);
      } else {
        await tenantDb.sqlConnection('system_users').insert({ id: u.id, ...sqlObj });
      }
    }
    return;
  }

  if (tenantDb.mongoDb) {
    for (const u of users) {
      const doc = { ...u, _id: u.id, tenantCompanyCode: u.companyCode || u.tenantCompanyCode || activeCompanyCode };
      delete (doc as any).id;
      await tenantDb.mongoDb.collection('system_users').replaceOne({ _id: doc._id as any }, doc as any, { upsert: true });
    }
  }
}

// ============ Work Permits CRUD ============

export async function dbGetWorkPermits(companyCode?: string): Promise<any[]> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.workPermits || [];
  }

  const tenantDb = await getTenantDbConnection(companyCode);

  if (tenantDb.sqlConnection) {
    const query = tenantDb.sqlConnection('work_permits').select('*');
    const filter = getScopeFilter(companyCode);
    if (filter.tenant_company_code) {
      query.where({ tenant_company_code: filter.tenant_company_code });
    }

    const rows = await query;
    return rows.map(r => ({
      id: r.id,
      companyId: r.company_id,
      companyName: r.company_name,
      workType: r.work_type,
      description: r.description,
      assignedWorkers: r.assigned_workers ? JSON.parse(r.assigned_workers) : [],
      location: r.location,
      startDate: r.start_date,
      endDate: r.end_date,
      checklist: r.checklist ? JSON.parse(r.checklist) : {},
      status: r.status,
      rejectReason: r.reject_reason,
      createdAt: r.created_at,
      tenantCompanyCode: r.tenant_company_code
    }));
  }

  if (tenantDb.mongoDb) {
    const filter = getScopeFilter(companyCode);
    const docs = await tenantDb.mongoDb.collection('work_permits').find(filter).toArray();
    return docs.map(d => ({
      ...d,
      id: d._id.toString(),
      _id: undefined,
      tenantCompanyCode: d.tenantCompanyCode
    })) as any[];
  }

  return [];
}

export async function dbSaveWorkPermits(permits: any[], companyCode?: string): Promise<void> {
  const dbConfig = getTenantDbConfig(companyCode);

  if (dbConfig.dbType === 'local_storage' || dbConfig.dbType === 'generic_api') {
    const filePath = getTenantLocalDbPath(companyCode);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ visitors: [], logs: [], contractors: [], users: [], workPermits: [] }, null, 2));
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    data.workPermits = permits;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  const activeCompanyCode = companyCode && !isSystemTenantCode(companyCode) ? companyCode.toUpperCase() : 'SAFEFLOW';

  if (tenantDb.sqlConnection) {
    for (const p of permits) {
      const sqlObj = {
        company_id: p.companyId,
        company_name: p.companyName,
        work_type: p.workType,
        description: p.description || '',
        assigned_workers: JSON.stringify(p.assignedWorkers || []),
        location: p.location,
        start_date: p.startDate,
        end_date: p.endDate,
        checklist: JSON.stringify(p.checklist || {}),
        status: p.status,
        reject_reason: p.rejectReason || null,
        created_at: p.createdAt,
        tenant_company_code: p.tenantCompanyCode || activeCompanyCode
      };

      const existing = await tenantDb.sqlConnection('work_permits').where({ id: p.id }).first();
      if (existing) {
        await tenantDb.sqlConnection('work_permits').where({ id: p.id }).update(sqlObj);
      } else {
        await tenantDb.sqlConnection('work_permits').insert({ id: p.id, ...sqlObj });
      }
    }
    return;
  }

  if (tenantDb.mongoDb) {
    for (const p of permits) {
      const doc = { ...p, _id: p.id, tenantCompanyCode: p.tenantCompanyCode || activeCompanyCode };
      delete doc.id;
      await tenantDb.mongoDb.collection('work_permits').replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }
}

// ─── DEPARTMENTS DB FUNCTIONS ────────────────────────────────────────────────

export async function dbGetDepartments(companyCode?: string): Promise<string[]> {
  const config = getStoredConfig();
  const dbType = config.dbType;

  // local_storage fallback: read from config JSON
  if (dbType === 'local_storage' || dbType === 'generic_api') {
    return config.departments || [];
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  if (tenantDb.sqlConnection) {
    try {
      const rows = await tenantDb.sqlConnection('departments')
        .where({ is_active: true })
        .orderBy('sort_order', 'asc')
        .select('name');
      return rows.map((r: any) => r.name as string);
    } catch (err) {
      // Table may not exist yet, fallback
      return config.departments || [];
    }
  }

  if (tenantDb.mongoDb) {
    const docs = await tenantDb.mongoDb.collection('departments')
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .toArray();
    return docs.map((d: any) => d.name as string);
  }

  return config.departments || [];
}

export async function dbSaveDepartments(departments: string[], companyCode?: string): Promise<void> {
  const config = getStoredConfig();
  const dbType = config.dbType;

  // local_storage: update config JSON
  if (dbType === 'local_storage' || dbType === 'generic_api') {
    config.departments = departments;
    saveStoredConfig(config);
    return;
  }

  const tenantDb = await getTenantDbConnection(companyCode);
  if (tenantDb.sqlConnection) {
    const db = tenantDb.sqlConnection;

    // Get existing active names
    const existing = await db('departments').where({ is_active: true }).select('name');
    const existingNames = existing.map((r: any) => r.name as string);

    // Add new
    const toAdd = departments.filter(d => !existingNames.includes(d));
    if (toAdd.length > 0) {
      await db('departments').insert(toAdd.map((name) => ({
        name,
        sort_order: departments.indexOf(name),
        is_active: true,
        created_at: new Date().toISOString()
      })));
    }

    // Deactivate removed
    const toRemove = existingNames.filter(n => !departments.includes(n));
    if (toRemove.length > 0) {
      await db('departments').whereIn('name', toRemove).update({ is_active: false });
    }

    // Update sort orders
    for (const name of departments) {
      await db('departments').where({ name, is_active: true }).update({ sort_order: departments.indexOf(name) });
    }
    return;
  }

  if (tenantDb.mongoDb) {
    const col = tenantDb.mongoDb.collection('departments');
    const existing = await col.find({ isActive: true }).toArray();
    const existingNames = existing.map((d: any) => d.name as string);

    const toAdd = departments.filter(d => !existingNames.includes(d));
    for (const name of toAdd) {
      await col.insertOne({ name, sortOrder: departments.indexOf(name), isActive: true, createdAt: new Date().toISOString() });
    }
    const toRemove = existingNames.filter(n => !departments.includes(n));
    if (toRemove.length > 0) {
      await col.updateMany({ name: { $in: toRemove } }, { $set: { isActive: false } });
    }
    for (const name of departments) {
      await col.updateOne({ name, isActive: true }, { $set: { sortOrder: departments.indexOf(name) } });
    }
  }
}
