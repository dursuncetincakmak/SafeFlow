import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { 
  getStoredConfig, 
  saveStoredConfig, 
  initDatabase, 
  dbGetVisitors, 
  dbSaveVisitors, 
  dbGetLogs, 
  dbSaveLogs,
  dbGetContractors,
  dbSaveContractors,
  dbGetUsers,
  dbSaveUsers,
  dbGetWorkPermits,
  dbSaveWorkPermits,
  dbGetDepartments,
  dbSaveDepartments,
  DatabaseType,
  ContractorCompany,
  SystemUser
} from '../config/database';
import { authenticateActiveDirectory } from '../services/ldapService';
import { sendEmail, sendSMS } from '../services/notificationService';
import { knex } from 'knex';
import { MongoClient } from 'mongodb';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vpass-super-secret-key-987';

// Helper to resolve companyCode from headers or token
function getRequestCompanyCode(req: Request): string {
  const headerCode = req.headers['x-company-code'];
  if (headerCode && typeof headerCode === 'string' && headerCode.trim() !== '') {
    return headerCode.toUpperCase();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.companyCode) {
        return decoded.companyCode.toUpperCase();
      }
    } catch (err) {}
  }

  return 'SAFEFLOW';
}

// 1. Auth Endpoint: Unified Login (username + password, companyCode optional)
router.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  let { companyCode } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Kullanıcı adı ve şifre zorunludur.' });
    return;
  }

  const config = getStoredConfig();
  if (!companyCode || companyCode.trim() === '') {
    companyCode = config.systemCompanyCode || 'SAFEFLOW';
  }

  const enteredCode = companyCode.toUpperCase();
  const systemCompanyCode = (config.systemCompanyCode || 'SAFEFLOW').toUpperCase();
  const isSystemCode = enteredCode === systemCompanyCode || enteredCode === 'ADMIN' || enteredCode === 'SYSTEM';
  
  // Match the company from tenant database list
  const matchedCompany = (config.companies || []).find(
    c => c.code.toUpperCase() === enteredCode
  ) || (enteredCode === 'KARTON' ? { 
    code: 'KARTON', 
    name: 'Karton A.Ş.', 
    primaryColor: '#10b981', 
    secondaryColor: '#047857', 
    logoHeight: 40,
    themeMode: 'dark' as 'dark' | 'light',
    departments: config.departments,
    hosts: ["Fatih Şahin", "Zeynep Aslan", "Kemal Yılmaz"]
  } : isSystemCode ? {
    code: systemCompanyCode, 
    name: (config.appName || 'SafeFlow') + ' System', 
    primaryColor: config.primaryColor || '#00d2ff', 
    secondaryColor: config.secondaryColor || '#0066ff', 
    logoHeight: config.logoHeight || 40,
    themeMode: config.themeMode || ('dark' as 'dark' | 'light'),
    departments: config.departments,
    hosts: ["Sistem Yöneticisi"]
  } : null);

  try {
    // --- ROUTE 1: Tenant Company Portal login (AD / fallback / dynamic users) ---
    if (matchedCompany) {
      const user = await authenticateActiveDirectory(
        username, 
        password, 
        matchedCompany.code, 
        (matchedCompany as any).authConfig
      );
      if (!user) {
        res.status(401).json({ error: 'Kimlik doğrulaması başarısız. Kullanıcı adı veya şifre hatalı.' });
        return;
      }

      // Check if user has a scoped company code, and enforce it (except super_admin)
      if (user.role !== 'super_admin' && (user as any).companyCode && (user as any).companyCode.toUpperCase() !== matchedCompany.code) {
        res.status(403).json({ error: 'Bu kullanıcı bu firma kodu ile oturum açmaya yetkili değil.' });
        return;
      }

      const token = jwt.sign(
        { companyCode: matchedCompany.code, username: user.username, displayName: user.displayName, role: user.role, department: user.department },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        token,
        user: {
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          companyCode: matchedCompany.code
        },
        companyConfig: matchedCompany
      });
      return;
    }

    // --- ROUTE 2: Contractor Company (TAS-XXX) ---
    if (companyCode.toUpperCase().startsWith('TAS-')) {
      const list = await dbGetContractors();
      const company = list.find(
        (c: ContractorCompany) => c.id.toUpperCase() === companyCode.toUpperCase() && c.username === username && c.password === password
      );

      if (!company) {
        res.status(401).json({ error: 'Taşeron firma kodu, kullanıcı adı veya şifre hatalı.' });
        return;
      }

      const token = jwt.sign(
        { companyCode: company.id, username: company.username, displayName: company.contactName, role: 'contractor', department: company.name },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        token,
        user: {
          username: company.username,
          displayName: company.contactName,
          role: 'contractor',
          department: company.name
        },
        companyData: company
      });
      return;
    }

    // --- ROUTE 3: Visitor (VIS-XXX) ---
    if (companyCode.toUpperCase().startsWith('VIS-')) {
      const visitors = await dbGetVisitors();
      const visitor = visitors.find(
        (v: any) => v.id.toUpperCase() === companyCode.toUpperCase() && v.phone === username && v.phone === password
      );

      if (!visitor) {
        res.status(401).json({ error: 'Ziyaretçi kodu veya telefon numarası hatalı.' });
        return;
      }

      const token = jwt.sign(
        { companyCode: visitor.id, username: visitor.phone, displayName: `${visitor.firstName} ${visitor.lastName}`, role: 'visitor', department: visitor.company },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        success: true,
        token,
        user: {
          username: visitor.phone,
          displayName: `${visitor.firstName} ${visitor.lastName}`,
          role: 'visitor',
          department: visitor.company
        },
        visitorData: visitor
      });
      return;
    }

    // No matching route
    res.status(401).json({ error: 'Geçersiz firma kodu. Lütfen doğru firma kodunu giriniz.' });

  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Giriş işlemi sırasında sunucu hatası oluştu.' });
  }
});

// 2. Visitors API: Fetch and Sync
router.get('/visitors', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const visitors = await dbGetVisitors(companyCode);
    res.json(visitors);
  } catch (err: any) {
    res.status(500).json({ error: `Ziyaretçiler alınamadı: ${err.message}` });
  }
});

router.post('/visitors/sync', async (req: Request, res: Response) => {
  const { visitors } = req.body;
  if (!Array.isArray(visitors)) {
    res.status(400).json({ error: 'Geçersiz veri biçimi.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    await dbSaveVisitors(visitors, companyCode);
    res.json({ success: true, message: 'Ziyaretçiler başarıyla veritabanına senkronize edildi.' });
  } catch (err: any) {
    res.status(500).json({ error: `Senkronizasyon hatası: ${err.message}` });
  }
});

// 3. Security Logs API: Fetch and Sync
router.get('/security-logs', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const logs = await dbGetLogs(companyCode);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: `Loglar alınamadı: ${err.message}` });
  }
});

router.post('/security-logs/sync', async (req: Request, res: Response) => {
  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    res.status(400).json({ error: 'Geçersiz veri biçimi.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    await dbSaveLogs(logs, companyCode);
    res.json({ success: true, message: 'Güvenlik günlükleri veritabanına kaydedildi.' });
  } catch (err: any) {
    res.status(500).json({ error: `Günlük kayıt hatası: ${err.message}` });
  }
});

// 4. White-Label Configuration API
router.get('/config', (req: Request, res: Response) => {
  const config = getStoredConfig();
  res.json(config);
});

router.post('/config/reset', (req: Request, res: Response) => {
  const resetConfig = { ...getStoredConfig(), isInstalled: false };
  saveStoredConfig(resetConfig);
  res.json({ success: true, message: 'Sistem sıfırlandı.' });
});

router.post('/config', async (req: Request, res: Response) => {
  const { appName, logoUrl, logoHeight, themeMode, primaryColor, secondaryColor, dbType, dbConnectionString, departments, trainingVideos } = req.body;

  if (!appName || !primaryColor || !secondaryColor || !dbType) {
    res.status(400).json({ error: 'Eksik konfigürasyon parametreleri.' });
    return;
  }

  try {
    const oldConfig = getStoredConfig();
    const newConfig = {
      ...oldConfig,
      appName,
      logoUrl,
      logoHeight: logoHeight ? Number(logoHeight) : 40,
      themeMode: themeMode || 'dark',
      primaryColor,
      secondaryColor,
      dbType,
      dbConnectionString: dbConnectionString || '',
      departments: departments || [],
      trainingVideos: trainingVideos || [],
      companies: req.body.companies !== undefined ? req.body.companies : oldConfig.companies,
      smtpConfig: req.body.smtpConfig !== undefined ? req.body.smtpConfig : oldConfig.smtpConfig
    };

    // Save configurations
    saveStoredConfig(newConfig);

    // Re-initialize active database connection pool dynamically!
    const dbInit = await initDatabase();
    
    res.json({
      success: true,
      message: 'Yapılandırma başarıyla sunucuya kaydedildi.',
      dbStatus: dbInit
    });

  } catch (err: any) {
    res.status(500).json({ error: `Yapılandırma uygulanamadı: ${err.message}` });
  }
});

// ─── DEPARTMENTS API ────────────────────────────────────────────────────────

// GET /api/departments - List all active departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const depts = await dbGetDepartments(companyCode);
    res.json(depts);
  } catch (err: any) {
    // Fallback: return departments from stored config JSON
    const config = getStoredConfig();
    res.json(config.departments || []);
  }
});

// POST /api/departments/sync - Save full departments list (replaces all)
router.post('/departments/sync', async (req: Request, res: Response) => {
  const { departments } = req.body as { departments: string[] };
  if (!Array.isArray(departments)) {
    res.status(400).json({ error: 'departments dizisi gereklidir.' });
    return;
  }
  try {
    const companyCode = getRequestCompanyCode(req);
    await dbSaveDepartments(departments, companyCode);

    // Also update the stored config JSON so it stays in sync
    const config = getStoredConfig();
    config.departments = departments;
    saveStoredConfig(config);

    res.json({ success: true, message: `${departments.length} departman başarıyla kaydedildi.` });
  } catch (err: any) {
    res.status(500).json({ error: `Departman kayıt hatası: ${err.message}` });
  }
});

// 5. Dynamic Database Connection Verification
router.post('/config/test-db', async (req: Request, res: Response) => {
  const { dbType, dbConnectionString } = req.body as { dbType: DatabaseType, dbConnectionString: string };

  if (!dbType) {
     res.status(400).json({ error: 'Veritabanı tipi belirtilmelidir.' });
     return;
  }

  if (dbType === 'local_storage') {
     res.json({ success: true, message: 'Yerel depolama simülasyonu aktif.' });
     return;
  }

  if (!dbConnectionString) {
     res.status(400).json({ error: 'Bağlantı dizesi boş bırakılamaz.' });
     return;
  }

  console.log(`[Test DB] Testing dynamic connection to: ${dbType}`);

  try {
    if (['postgresql', 'mysql', 'mssql'].includes(dbType)) {
      let client = '';
      if (dbType === 'postgresql') client = 'pg';
      else if (dbType === 'mysql') client = 'mysql2';
      else if (dbType === 'mssql') client = 'mssql';

      const tempConnection = knex({
        client: client,
        connection: dbConnectionString,
        acquireConnectionTimeout: 4000
      });

      // Query verification
      await tempConnection.raw('SELECT 1+1 AS result');
      await tempConnection.destroy(); // close test connection pool

      let driverMsg = '';
      if (dbType === 'postgresql') driverMsg = 'pg-node v8.11.5';
      else if (dbType === 'mysql') driverMsg = 'mysql2 v3.9.7';
      else if (dbType === 'mssql') driverMsg = 'mssql-tedious v10.0.2';

      res.json({
        success: true,
        message: `${dbType.toUpperCase()} veritabanı bağlantısı başarılı! Sürücü: ${driverMsg}. Sorgu testleri onaylandı.`
      });
      return;
    }

    if (dbType === 'mongodb') {
      const client = new MongoClient(dbConnectionString);
      await client.connect();
      await client.db().command({ ping: 1 });
      await client.close();

      res.json({
        success: true,
        message: 'MongoDB Cluster bağlantısı başarılı! Ping testi onaylandı.'
      });
      return;
    }

    // Generic API URL test
    res.json({
      success: true,
      message: 'Genel REST API / Webhook endpoint formatı geçerli.'
    });

  } catch (err: any) {
    console.error(`[Test DB] Connection test failed for ${dbType}:`, err.message);
    res.status(500).json({
      success: false,
      message: `Bağlantı Başarısız: ${err.message}`
    });
  }
});

// 6. Subcontractor (Taşeron) API Endpoints
router.get('/contractors', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetContractors(companyCode);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contractors/register', async (req: Request, res: Response) => {
  const { name, contactName, contactEmail, requiredDocs } = req.body;
  if (!name || !contactName || !contactEmail) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetContractors(companyCode);
    
    // Check if company is already registered by email or name
    const existingCompany = list.find(
      c => c.contactEmail.toLowerCase() === contactEmail.toLowerCase() || 
           c.name.toLowerCase() === name.toLowerCase()
    );

    if (existingCompany) {
      // Simulated already registered email notice
      console.log(`
      ====================================================
      📩 [E-POSTA BİLDİRİMİ] -> ${contactEmail} adresine gönderildi.
      Konu: V-PASS Giriş İşlemleri - Kayıt Bildirimi
      İçerik: Sayın Yetkili, Şirketiniz için daha önce oluşturulmuş olan aktif kayıt bulunmaktadır.
      Giriş bilgileriniz ile sisteme erişebilirsiniz. Giriş yapamadığınız takdirde sistem yöneticisine başvurunuz.
      
      🏢 Şirket Kodu: ${existingCompany.id}
      👤 Kullanıcı Adı: ${existingCompany.username}
      ====================================================
      `);

      res.json({
        success: true,
        alreadyRegistered: true,
        company: existingCompany
      });
      return;
    }

    // Generate credentials for new company
    const id = `TAS-${Math.floor(100 + Math.random() * 900)}`;
    const username = contactEmail.split('@')[0] + Math.floor(10 + Math.random() * 90);
    const password = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newCompany: ContractorCompany = {
      id,
      name,
      contactName,
      contactEmail,
      username,
      password,
      status: 'PENDING_DOCS',
      requiredDocs: requiredDocs || ['Vergi Levhası', 'İSG Taahhütnamesi'],
      uploadedDocs: [],
      createdAt: new Date().toISOString()
    };

    list.push(newCompany);
    await dbSaveContractors(list, companyCode);

    // Simulated email log using tenant custom SMTP settings
    const config = getStoredConfig();
    const companyInfo = (config.companies || []).find((c: any) => c.code === companyCode);
    const smtpHost = companyInfo?.smtpConfig?.host || 'default-smtp.safeflow.com';
    const smtpPort = companyInfo?.smtpConfig?.port || '587';
    const senderEmail = companyInfo?.smtpConfig?.senderEmail || 'info@safeflow.com';
    const smsHeader = companyInfo?.smsConfig?.senderId || 'SAFEFLOW';

    console.log(`
    ====================================================
    📩 [E-POSTA BİLDİRİMİ] -> ${contactEmail} adresine gönderildi.
    Sunucu: SMTP://${smtpHost}:${smtpPort} (Gönderici: ${senderEmail})
    Konu: V-PASS Taşeron Firma Giriş Bilgileri
    İçerik: Sayın Yetkili, Şirketiniz V-PASS Tesis Geçiş Sistemine kaydedilmiştir.
    İlgili bağlantıdan sisteme giriş yaparak İSG evraklarınızı yükleyebilirsiniz.
    
    🔗 Giriş Kartı Bağlantısı: http://localhost:5173/
    🏢 Şirket Kodu: ${id}
    👤 Kullanıcı Adı: ${username}
    🔑 Şifre: ${password}
    
    📱 [SMS BİLDİRİMİ] -> ${contactName} (Gönderici Başlığı: ${smsHeader})
    İçerik: V-PASS sistemine kaydınız gerçekleştirilmiştir. Giriş kodunuz: ${id}
    ====================================================
    `);

    res.json({
      success: true,
      alreadyRegistered: false,
      company: newCompany
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contractors/login', async (req: Request, res: Response) => {
  const { companyCode, username, password } = req.body;
  if (!companyCode || !username || !password) {
    res.status(400).json({ error: 'Eksik kimlik bilgileri.' });
    return;
  }

  try {
    const list = await dbGetContractors(companyCode);
    const company = list.find(c => c.id === companyCode && c.username === username && c.password === password);
    
    if (!company) {
      res.status(401).json({ error: 'Şirket Kodu, Kullanıcı Adı veya Şifre hatalı.' });
      return;
    }

    res.json({
      success: true,
      company
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Subcontractor employees
router.get('/contractors/employees/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetContractors(companyCode);
    const company = list.find(c => c.id === companyId);
    if (!company) {
      res.status(404).json({ error: 'Firma bulunamadı.' });
      return;
    }

    const visitors = await dbGetVisitors(companyCode);
    const companyEmployees = visitors.filter(v => v.company === company.name && v.entryType === 'Çalışma');
    res.json(companyEmployees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Subcontractor employee
router.post('/contractors/add-employee', async (req: Request, res: Response) => {
  const { companyId, firstName, lastName, phone, email } = req.body;
  if (!companyId || !firstName || !lastName || !phone || !email) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetContractors(companyCode);
    const company = list.find(c => c.id === companyId);
    if (!company) {
      res.status(404).json({ error: 'Firma bulunamadı.' });
      return;
    }

    const visitors = await dbGetVisitors(companyCode);
    const employeeId = `VIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmployee = {
      id: employeeId,
      firstName,
      lastName,
      phone,
      email,
      company: company.name,
      hostName: 'İSG Uzmanı Onayı',
      department: 'İSG',
      visitPurpose: 'Taşeron Çalışması',
      plannedDate: new Date().toISOString().split('T')[0],
      plannedTime: '08:00',
      status: 'PENDING_DOCS' as const,
      requiredDocs: ['İSG Katılım Belgesi', 'SGK İşe Giriş Bildirgesi'],
      uploadedDocs: [],
      trainingId: 'TRN-02', // Subcontractor safety video
      trainingWatched: false,
      quizCompleted: false,
      createdAt: new Date().toISOString(),
      entryType: 'Çalışma' as const
    };

    visitors.push(newEmployee);
    await dbSaveVisitors(visitors, companyCode);

    res.json({ success: true, employee: newEmployee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload document for Subcontractor employee
router.post('/contractors/employee-upload-doc', async (req: Request, res: Response) => {
  const { employeeId, docType, docName, fileUrl } = req.body;
  if (!employeeId || !docType || !docName || !fileUrl) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const visitors = await dbGetVisitors(companyCode);
    const idx = visitors.findIndex(v => v.id === employeeId);
    if (idx === -1) {
      res.status(404).json({ error: 'Çalışan bulunamadı.' });
      return;
    }

    const newDoc = {
      type: docType,
      name: docName,
      status: 'PENDING' as const,
      fileUrl,
      uploadedAt: new Date().toISOString()
    };

    const existing = visitors[idx].uploadedDocs.filter((d: any) => d.type !== docType);
    visitors[idx].uploadedDocs = [...existing, newDoc];

    const uploadedTypes = visitors[idx].uploadedDocs.map((d: any) => d.type);
    const allUploaded = visitors[idx].requiredDocs.every((reqDoc: string) => uploadedTypes.includes(reqDoc));
    if (allUploaded) {
      visitors[idx].status = 'PENDING_APPROVAL';
    }

    await dbSaveVisitors(visitors, companyCode);
    res.json({ success: true, employee: visitors[idx] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or reject employee by OHS Specialist
router.post('/contractors/employee-update-status', async (req: Request, res: Response) => {
  const { employeeId, status, rejectReason } = req.body;
  if (!employeeId || !status) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const visitors = await dbGetVisitors(companyCode);
    const idx = visitors.findIndex(v => v.id === employeeId);
    if (idx === -1) {
      res.status(404).json({ error: 'Çalışan bulunamadı.' });
      return;
    }

    visitors[idx].status = status;
    visitors[idx].uploadedDocs = visitors[idx].uploadedDocs.map((doc: any) => ({
      ...doc,
      status: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : doc.status,
      rejectReason: status === 'REJECTED' ? rejectReason : undefined
    }));

    if (status === 'APPROVED') {
      visitors[idx].qrCodeData = `QR-WORK-${visitors[idx].id}-${Math.floor(1000 + Math.random() * 9000)}`;
      visitors[idx].trainingWatched = true;
      visitors[idx].quizCompleted = true;
      visitors[idx].quizScore = 3;

      // Simulated email notification using tenant custom SMTP/SMS settings
      const config = getStoredConfig();
      const companyInfo = (config.companies || []).find((c: any) => c.code === companyCode);
      const smtpHost = companyInfo?.smtpConfig?.host || 'default-smtp.safeflow.com';
      const smtpPort = companyInfo?.smtpConfig?.port || '587';
      const senderEmail = companyInfo?.smtpConfig?.senderEmail || 'info@safeflow.com';
      const smsHeader = companyInfo?.smsConfig?.senderId || 'SAFEFLOW';

      console.log(`
      ====================================================
      📩 [E-POSTA BİLDİRİMİ] -> ${visitors[idx].email} adresine gönderildi.
      Sunucu: SMTP://${smtpHost}:${smtpPort} (Gönderici: ${senderEmail})
      Konu: V-PASS Giriş Kartı Onayı
      İçerik: Sayın ${visitors[idx].firstName} ${visitors[idx].lastName}, İSG evraklarınız onaylanmıştır.
      Tesis girişiniz aktiftir. Dijital cüzdan kartınızı aşağıdaki bağlantıdan indirebilirsiniz.
      
      🔗 Giriş Kartı Bağlantısı: http://localhost:5173/visitor-card/${visitors[idx].id}
      
      📱 [SMS BİLDİRİMİ] -> ${visitors[idx].phone} (Gönderici Başlığı: ${smsHeader})
      İçerik: Sayın ${visitors[idx].firstName} ${visitors[idx].lastName}, İSG evrak onayınız tamamlanmıştır. Dijital giriş kartınız aktif edilmiştir.
      ====================================================
      `);
    }

    await dbSaveVisitors(visitors, companyCode);
    res.json({ success: true, employee: visitors[idx] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Work Permits (İş İzinleri) API Endpoints
// ==========================================

// GET: List all work permits
router.get('/work-permits', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetWorkPermits(companyCode);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET: List permits for a specific company
router.get('/work-permits/company/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetWorkPermits(companyCode);
    const filtered = list.filter(p => p.companyId === companyId);
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new work permit request
router.post('/work-permits/create', async (req: Request, res: Response) => {
  const { companyId, companyName, workType, description, assignedWorkers, location, startDate, endDate, checklist } = req.body;

  if (!companyId || !companyName || !workType || !location || !startDate || !endDate) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetWorkPermits(companyCode);
    const permitId = `PRM-${Math.floor(100 + Math.random() * 900)}`;
    const newPermit = {
      id: permitId,
      companyId,
      companyName,
      workType,
      description: description || '',
      assignedWorkers: assignedWorkers || [],
      location,
      startDate,
      endDate,
      checklist: checklist || {},
      status: 'PENDING_APPROVAL' as const,
      createdAt: new Date().toISOString()
    };

    list.push(newPermit);
    await dbSaveWorkPermits(list, companyCode);
    res.json({ success: true, permit: newPermit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Approve or reject a work permit (OHS Specialist)
router.post('/work-permits/update-status', async (req: Request, res: Response) => {
  const { permitId, status, rejectReason } = req.body;

  if (!permitId || !status) {
    res.status(400).json({ error: 'Eksik parametreler.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const list = await dbGetWorkPermits(companyCode);
    const idx = list.findIndex(p => p.id === permitId);
    if (idx === -1) {
      res.status(404).json({ error: 'İş izni bulunamadı.' });
      return;
    }

    list[idx].status = status;
    if (status === 'REJECTED') {
      list[idx].rejectReason = rejectReason || 'Belirtilmedi';
    } else {
      list[idx].rejectReason = undefined;
    }

    await dbSaveWorkPermits(list, companyCode);
    res.json({ success: true, permit: list[idx] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. System Users CRUD (Super Admin)
// ==========================================

// GET: List all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const companyCode = getRequestCompanyCode(req);
    const users = await dbGetUsers(companyCode);
    // Don't expose passwords in listing
    const safeUsers = users.map(u => ({ ...u, password: '••••••' }));
    res.json(safeUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add new user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, username, password, role, department, companyCode: bodyCompanyCode } = req.body;

    if (!firstName || !lastName || !username || !password || !role) {
      res.status(400).json({ error: 'Tüm zorunlu alanlar doldurulmalıdır.' });
      return;
    }

    const companyCode = getRequestCompanyCode(req);
    const users = await dbGetUsers(companyCode);

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılmaktadır.' });
      return;
    }

    const newUser: SystemUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName,
      lastName,
      email: email || '',
      username,
      password,
      role,
      department: department || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      companyCode: bodyCompanyCode || companyCode || undefined
    };

    users.push(newUser);
    await dbSaveUsers(users, companyCode);

    res.json({ success: true, user: { ...newUser, password: '••••••' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyCode = getRequestCompanyCode(req);
    const users = await dbGetUsers(companyCode);
    const filtered = users.filter(u => u.id !== id);

    if (filtered.length === users.length) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      return;
    }

    await dbSaveUsers(filtered, companyCode);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const companyCode = getRequestCompanyCode(req);
    const users = await dbGetUsers(companyCode);
    const idx = users.findIndex(u => u.id === id);

    if (idx === -1) {
      res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      return;
    }

    // Update fields
    if (updates.firstName) users[idx].firstName = updates.firstName;
    if (updates.lastName) users[idx].lastName = updates.lastName;
    if (updates.email !== undefined) users[idx].email = updates.email;
    if (updates.role) users[idx].role = updates.role;
    if (updates.department !== undefined) users[idx].department = updates.department;
    if (updates.password) users[idx].password = updates.password;
    if (updates.isActive !== undefined) users[idx].isActive = updates.isActive;

    await dbSaveUsers(users, companyCode);
    res.json({ success: true, user: { ...users[idx], password: '••••••' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. Mail Server (SMTP) Test
// ==========================================

router.post('/mail/test', async (req: Request, res: Response) => {
  const { host, port, senderEmail, senderName, username, password, useTls, testRecipient } = req.body;

  if (!host || !port || !senderEmail) {
    res.status(400).json({ error: 'SMTP sunucu, port ve gönderici e-posta zorunludur.' });
    return;
  }

  // Simulate sending a test email (no real SMTP connection in demo)
  console.log(`
  ====================================================
  📧 [SMTP TEST E-POSTASI]
  Sunucu: ${host}:${port} (TLS: ${useTls ? 'Evet' : 'Hayır'})
  Gönderici: ${senderName} <${senderEmail}>
  Auth: ${username || 'Yok'}
  Alıcı: ${testRecipient || senderEmail}
  Konu: V-PASS SMTP Test Maili
  İçerik: Bu bir test e-postasıdır. SMTP yapılandırması başarılı!
  ====================================================
  `);

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  res.json({
    success: true,
    message: `Test e-postası ${testRecipient || senderEmail} adresine başarıyla gönderildi. (Simülasyon)`
  });
});

// ==========================================
// 10. WordPress-Style System Installation
// ==========================================

router.post('/install', async (req: Request, res: Response) => {
  const config = getStoredConfig();
  if (config.isInstalled) {
    res.status(400).json({ error: 'Sistem zaten kurulmuş durumda.' });
    return;
  }

  const { appName, systemCompanyCode, logoUrl, logoHeight, themeMode, primaryColor, secondaryColor, dbType, dbConnectionString, adminUser } = req.body;

  if (!appName || !systemCompanyCode || !primaryColor || !secondaryColor || !dbType || !adminUser || !adminUser.username || !adminUser.password || !adminUser.firstName || !adminUser.lastName) {
    res.status(400).json({ error: 'Eksik kurulum parametreleri. Tüm zorunlu alanlar doldurulmalıdır.' });
    return;
  }

  try {
    // 1. Build and save new configuration
    const newConfig: any = {
      appName,
      systemCompanyCode: systemCompanyCode || 'SAFEFLOW',
      logoUrl: logoUrl || '',
      logoHeight: logoHeight ? Number(logoHeight) : 40,
      themeMode: themeMode || 'dark',
      primaryColor,
      secondaryColor,
      dbType,
      dbConnectionString: dbConnectionString || '',
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
            }
          ]
        }
      ],
      companies: [],
      isInstalled: true
    };

    saveStoredConfig(newConfig);

    // 2. Re-initialize database with the new settings
    const dbInitResult = await initDatabase();
    if (!dbInitResult.success) {
      // Rollback config if DB initialization fails to allow trying again
      newConfig.isInstalled = false;
      saveStoredConfig(newConfig);
      res.status(500).json({ error: `Veritabanı bağlantısı kurulamadı: ${dbInitResult.message}` });
      return;
    }

    // 3. Create Super Admin account
    const superUser: SystemUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email || '',
      username: adminUser.username,
      password: adminUser.password, // Plain-text fallback used by other seeded users
      role: 'super_admin',
      department: 'IT Yönetim',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Save to the newly configured database
    await dbSaveUsers([superUser], 'SAFEFLOW');

    res.json({
      success: true,
      message: 'Kurulum başarıyla tamamlandı! V-PASS Sisteminiz kullanıma hazır.'
    });

  } catch (err: any) {
    console.error('Setup failure:', err);
    // Rollback setup flag on error
    const old = getStoredConfig();
    old.isInstalled = false;
    saveStoredConfig(old);
    res.status(500).json({ error: `Kurulum sırasında bir hata oluştu: ${err.message}` });
  }
});


// ==========================================
// 8. Visitor Invitation & Pre-Registration API (1. Ziyaretçi Giriş Akışı)
// ==========================================

// POST: Ev Sahibi / Sekretarya tarafından Ziyaretçi Davetiyesi Oluşturma ve SMS/E-posta Gönderme
router.post('/visitors/invite', async (req: Request, res: Response) => {
  const { firstName, lastName, phone, email, company, hostName, department, visitPurpose, plannedDate, plannedTime } = req.body;

  if (!firstName || !lastName || !phone) {
    res.status(400).json({ error: 'Ad, soyad ve telefon alanları zorunludur.' });
    return;
  }

  try {
    const companyCode = getRequestCompanyCode(req);
    const visitors = await dbGetVisitors(companyCode);
    const inviteId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const inviteToken = jwt.sign(
      { inviteId, firstName, lastName, phone, email, companyCode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newVisitor = {
      id: inviteId,
      firstName,
      lastName,
      phone,
      email: email || '',
      company: company || '',
      hostName: hostName || '',
      department: department || '',
      visitPurpose: visitPurpose || 'Ziyaret',
      plannedDate: plannedDate || new Date().toISOString().split('T')[0],
      plannedTime: plannedTime || '09:00',
      status: 'INVITED' as const,
      inviteToken,
      requiredDocs: ['TC/Pasaport No', 'Araç Plakası (Opsiyonel)', 'İSG Onay Formu'],
      uploadedDocs: [],
      trainingId: 'VID-01',
      trainingWatched: false,
      quizCompleted: false,
      createdAt: new Date().toISOString(),
      entryType: 'Ziyaret' as const
    };

    visitors.push(newVisitor);
    await dbSaveVisitors(visitors, companyCode);

    const inviteUrl = `http://localhost:5173/invite/${inviteToken}`;

    // Send Email notification if email is provided
    if (email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #00d2ff;">V-PASS Ziyaretçi Davetiyesi</h2>
          <p>Sayın <strong>${firstName} ${lastName}</strong>,</p>
          <p><strong>${hostName}</strong> (${department}) tarafından tesisimize davet edildiniz.</p>
          <p><strong>Randevu Tarihi:</strong> ${plannedDate || 'Belirtilmedi'} - ${plannedTime || ''}</p>
          <p>Tesis girişinde hızlı geçiş sağlamak için lütfen aşağıdaki bağlantıya tıklayarak ön kayıt formunu doldurunuz:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: linear-gradient(135deg, #00d2ff, #0066ff); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ön Kayıt Formunu Doldur</a>
          </p>
          <p style="font-size: 12px; color: #888;">Davetiye Kodu: ${inviteId}</p>
        </div>
      `;
      await sendEmail(email, 'V-PASS Tesis Ziyaretçi Davetiyesi', emailHtml);
    }

    // Send SMS notification
    const smsMessage = `Sayin ${firstName} ${lastName}, ${hostName} tarafindan V-PASS tesisine davet edildiniz. Hizli giris icin on kayit linki: ${inviteUrl}`;
    await sendSMS(phone, smsMessage);

    res.json({
      success: true,
      message: 'Ziyaretçi davetiyesi oluşturuldu, e-posta ve SMS gönderildi.',
      inviteId,
      inviteUrl,
      visitor: newVisitor
    });

  } catch (err: any) {
    res.status(500).json({ error: `Davetiye oluşturulamadı: ${err.message}` });
  }
});

// GET: Davetiye Linki Doğrulama ve Bilgileri Getirme
router.get('/visitors/invite/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const companyCode = decoded.companyCode || 'SAFEFLOW';
    const visitors = await dbGetVisitors(companyCode);
    const visitor = visitors.find(v => v.id === decoded.inviteId || v.phone === decoded.phone);

    if (!visitor) {
      res.status(404).json({ error: 'Davetiye kaydı bulunamadı veya süresi dolmuş.' });
      return;
    }

    res.json({
      success: true,
      visitor,
      companyCode
    });

  } catch (err: any) {
    res.status(400).json({ error: 'Geçersiz veya süresi dolmuş davetiye linki.' });
  }
});

// POST: Ziyaretçi Self-Service Ön Bilgi Formu Kaydetme
router.post('/visitors/pre-register', async (req: Request, res: Response) => {
  const { inviteToken, idNo, plateNumber, emergencyContact, kvkkApproved } = req.body;

  if (!inviteToken) {
    res.status(400).json({ error: 'Davetiye simgesi (token) gereklidir.' });
    return;
  }

  try {
    const decoded: any = jwt.verify(inviteToken, JWT_SECRET);
    const companyCode = decoded.companyCode || 'SAFEFLOW';
    const visitors = await dbGetVisitors(companyCode);
    const idx = visitors.findIndex(v => v.id === decoded.inviteId || v.phone === decoded.phone);

    if (idx === -1) {
      res.status(404).json({ error: 'Ziyaretçi kaydı bulunamadı.' });
      return;
    }

    // Update visitor pre-registration details
    visitors[idx].idNo = idNo || '';
    visitors[idx].plateNumber = plateNumber || '';
    visitors[idx].emergencyContact = emergencyContact || '';
    visitors[idx].kvkkApproved = !!kvkkApproved;
    visitors[idx].status = 'PENDING_APPROVAL';

    await dbSaveVisitors(visitors, companyCode);

    res.json({
      success: true,
      message: 'Ön kayıt bilgileriniz başarıyla alındı. İSG eğitim aşamasına geçebilirsiniz.',
      visitor: visitors[idx]
    });

  } catch (err: any) {
    res.status(400).json({ error: `Ön kayıt tamamlanamadı: ${err.message}` });
  }
});

// POST: Turnike / Otomatik Kapı Kilidi Tetikleme API (IoT Turnstile Controller)
router.post('/security/unlock-door', async (req: Request, res: Response) => {
  const { gateId, visitorId, guardName } = req.body;

  console.log(`
  ====================================================
  🔓 [KAPI KİLİDİ RÖLE KONTROL] -> Kapı Kodu: ${gateId || 'ANA_TURNIKE_01'}
  Sinyal: UNLOCK_PULSE (5000ms Röle İletimi)
  Giriş Yapan: ${visitorId || 'SERBEST_GIRIS'}
  Onaylayan Güvenlik: ${guardName || 'Güvenlik Görevlisi'}
  ====================================================
  `);

  res.json({
    success: true,
    message: `Kapı / Turnike (${gateId || 'ANA_TURNIKE_01'}) rölesi başarıyla tetiklendi. Geçiş serbest!`,
    timestamp: new Date().toISOString()
  });
});

export default router;


