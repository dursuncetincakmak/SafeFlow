import React, { useState, useEffect } from 'react';
import type { TenantConfig, DatabaseType, SmtpConfig, SystemUser, CompanyTenant } from '../utils/types';
import { Settings, Palette, Database, Upload, CheckCircle2, Shield, Trash2, Plus, Users, Mail, Eye, EyeOff, RefreshCw, Activity, UserPlus, Send, Building2 } from 'lucide-react';
import { i18n } from '../utils/i18n';
import { getApiRoot } from '../utils/apiConfig';

interface SuperAdminDashboardProps {
  config: TenantConfig;
  onSaveConfig: (newConfig: TenantConfig) => Promise<void> | void;
  lang: 'tr' | 'en' | 'es';
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  config,
  onSaveConfig,
  lang,
}) => {
  const t = i18n[lang];

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    department: { label: t.roleDepartment, color: '#3b82f6' },
    admin: { label: t.roleAdmin, color: '#8b5cf6' },
    isg: { label: t.roleOHS, color: '#f59e0b' },
    security: { label: t.roleSecurity, color: '#10b981' },
    super_admin: { label: t.roleSuperAdmin, color: '#ef4444' },
  };

  const getPresetName = (name: string) => {
    if (lang === 'en') {
      const map: Record<string, string> = {
        'Koyu Mavi (Varsayılan)': 'Dark Blue (Default)',
        'Enerjik Turuncu': 'Energetic Orange',
        'Kurumsal Mor': 'Corporate Purple',
        'Doğa Dostu Yeşil': 'Eco Green',
        'Çelik Gri / Platin': 'Steel Gray / Platinum'
      };
      return map[name] || name;
    }
    if (lang === 'es') {
      const map: Record<string, string> = {
        'Koyu Mavi (Varsayılan)': 'Azul Oscuro (Por defecto)',
        'Enerjik Turuncu': 'Naranja Energético',
        'Kurumsal Mor': 'Púrpura Corporativo',
        'Doğa Dostu Yeşil': 'Verde Ecológico',
        'Çelik Gri / Platin': 'Gris Acero / Platino'
      };
      return map[name] || name;
    }
    return name;
  };

  // Navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<'brand' | 'departments' | 'users' | 'mail'>('brand');

  // Brand Configuration States
  const [appName, setAppName] = useState(config.appName);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [logoHeight, setLogoHeight] = useState(config.logoHeight || 40);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(config.themeMode || 'dark');
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor);
  
  // Database Configuration States
  const [dbType, setDbType] = useState<DatabaseType>(config.dbType);
  const [dbConnectionString, setDbConnectionString] = useState(config.dbConnectionString);

  // Dynamic Departments State
  const [departments, setDepartments] = useState<string[]>(config.departments || []);
  const [newDeptName, setNewDeptName] = useState('');

  // Multi-tenant Companies State
  const [companies, setCompanies] = useState<CompanyTenant[]>(config.companies || []);
  const [showAddCompanyForm, setShowAddCompanyForm] = useState(false);
  const [compActiveTab, setCompActiveTab] = useState<'general' | 'db' | 'smtp' | 'sms' | 'auth' | 'videos'>('general');
  const [newCompany, setNewCompany] = useState({
    code: '',
    name: '',
    logoUrl: '',
    logoHeight: 40,
    themeMode: 'light' as 'light' | 'dark',
    primaryColor: '#00d2ff',
    secondaryColor: '#0066ff',
    departmentsText: 'İSG ve Çevre, IT, HR, Lojistik, Depo Operasyonları',
    hostsText: 'Ahmet Yılmaz, Canan Demir, Esra Koç',
    dbType: 'local_storage' as DatabaseType,
    dbConnectionString: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSenderEmail: '',
    smtpSenderName: '',
    smtpUsername: '',
    smtpPassword: '',
    smtpUseTls: true,
    smsProvider: 'netgsm',
    smsApiKey: '',
    smsApiSecret: '',
    smsSenderId: '',
    authType: 'local' as 'local' | 'ldap' | 'entra_id',
    ldapUrl: '',
    ldapBaseDn: '',
    ldapDomainSuffix: '',
    entraTenantId: '',
    entraClientId: '',
    entraClientSecret: '',
    trainingVideosText: JSON.stringify(config.trainingVideos || [], null, 2)
  });

  // Users State
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'department' as string, department: '', companyCode: 'KARTON' });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // SMTP Config State
  const [smtpHost, setSmtpHost] = useState(config.smtpConfig?.host || '');
  const [smtpPort, setSmtpPort] = useState(config.smtpConfig?.port || 587);
  const [smtpSenderEmail, setSmtpSenderEmail] = useState(config.smtpConfig?.senderEmail || '');
  const [smtpSenderName, setSmtpSenderName] = useState(config.smtpConfig?.senderName || '');
  const [smtpUsername, setSmtpUsername] = useState(config.smtpConfig?.username || '');
  const [smtpPassword, setSmtpPassword] = useState(config.smtpConfig?.password || '');
  const [smtpUseTls, setSmtpUseTls] = useState(config.smtpConfig?.useTls !== false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Connection Test States
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Preset Colors
  const COLOR_PRESETS = [
    { name: 'Koyu Mavi (Varsayılan)', primary: '#00d2ff', secondary: '#0066ff' },
    { name: 'Enerjik Turuncu', primary: '#ff6600', secondary: '#ffcc00' },
    { name: 'Kurumsal Mor', primary: '#a855f7', secondary: '#6366f1' },
    { name: 'Doğa Dostu Yeşil', primary: '#10b981', secondary: '#059669' },
    { name: 'Çelik Gri / Platin', primary: '#94a3b8', secondary: '#475569' }
  ];

  // Sync state with incoming config
  useEffect(() => {
    setAppName(config.appName);
    setLogoUrl(config.logoUrl || '');
    setLogoHeight(config.logoHeight || 40);
    setThemeMode(config.themeMode || 'dark');
    setPrimaryColor(config.primaryColor);
    setSecondaryColor(config.secondaryColor);
    setDbType(config.dbType);
    setDbConnectionString(config.dbConnectionString);
    setDepartments(config.departments || []);
    setCompanies(config.companies || []);
    setTestResult(null);
    // SMTP
    setSmtpHost(config.smtpConfig?.host || '');
    setSmtpPort(config.smtpConfig?.port || 587);
    setSmtpSenderEmail(config.smtpConfig?.senderEmail || '');
    setSmtpSenderName(config.smtpConfig?.senderName || '');
    setSmtpUsername(config.smtpConfig?.username || '');
    setSmtpPassword(config.smtpConfig?.password || '');
    setSmtpUseTls(config.smtpConfig?.useTls !== false);
  }, [config]);

  // Fetch users when tab switches to users
  useEffect(() => {
    if (activeSubTab === 'users') {
      loadUsers();
    }
  }, [activeSubTab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const apiRoot = (config.dbConnectionString?.startsWith('http://') || config.dbConnectionString?.startsWith('https://')) ? config.dbConnectionString : getApiRoot();
      const res = await fetch(`${apiRoot}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      // Failed to load users
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.username || !newUser.password || !newUser.role) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    try {
      const apiRoot = (config.dbConnectionString?.startsWith('http://') || config.dbConnectionString?.startsWith('https://')) ? config.dbConnectionString : getApiRoot();
      const res = await fetch(`${apiRoot}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Kullanıcı eklenirken hata oluştu.');
        return;
      }

      setNewUser({ firstName: '', lastName: '', email: '', username: '', password: '', role: 'department', department: '', companyCode: 'KARTON' });
      setShowAddUserForm(false);
      loadUsers();
      alert(`"${newUser.firstName} ${newUser.lastName}" kullanıcısı başarıyla eklendi.`);
    } catch (err: any) {
      alert('Bağlantı hatası: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!window.confirm(`"${displayName}" kullanıcısını silmek istediğinize emin misiniz?`)) return;

    try {
      const apiRoot = (config.dbConnectionString?.startsWith('http://') || config.dbConnectionString?.startsWith('https://')) ? config.dbConnectionString : getApiRoot();
      const res = await fetch(`${apiRoot}/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        loadUsers();
      }
    } catch (err: any) {
      alert('Silme hatası: ' + err.message);
    }
  };

  // Apply Preset Color
  const handleApplyPreset = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200000) {
        alert('Hata: Demo amaçlı logo boyutu 200KB\'tan küçük olmalıdır.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Department CRUD
  const handleAddDept = () => {
    const name = newDeptName.trim();
    if (!name) return;
    if (departments.includes(name)) {
      alert('Bu departman zaten tanımlı.');
      return;
    }
    setDepartments([...departments, name]);
    setNewDeptName('');
  };

  const handleRemoveDept = (name: string) => {
    if (departments.length <= 1) {
      alert('En az 1 adet aktif departman tanımı bulunmalıdır.');
      return;
    }
    setDepartments(departments.filter(d => d !== name));
  };

  // DB Connection Test
  const handleTestConnection = () => {
    if (!dbConnectionString && dbType !== 'local_storage') {
      alert('Lütfen test etmeden önce bir bağlantı dizesi veya API Endpoint giriniz.');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    const apiRoot = (dbConnectionString.startsWith('http://') || dbConnectionString.startsWith('https://')) ? dbConnectionString : getApiRoot();
    
    fetch(`${apiRoot}/config/test-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbType, dbConnectionString })
    })
      .then(res => res.json())
      .then(data => {
        setTestingConnection(false);
        setTestResult({ success: data.success, message: data.message });
      })
      .catch(err => {
        setTestingConnection(false);
        setTestResult({ success: false, message: `Bağlantı Hatası: ${err.message}` });
      });
  };

  // SMTP Test
  const handleSmtpTest = async () => {
    if (!smtpHost || !smtpPort || !smtpSenderEmail) {
      alert('Lütfen SMTP sunucu, port ve gönderici e-posta adresini giriniz.');
      return;
    }

    setSmtpTesting(true);
    setSmtpTestResult(null);

    try {
      const apiRoot = (config.dbConnectionString?.startsWith('http://') || config.dbConnectionString?.startsWith('https://')) ? config.dbConnectionString : getApiRoot();
      const res = await fetch(`${apiRoot}/mail/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          senderEmail: smtpSenderEmail,
          senderName: smtpSenderName,
          username: smtpUsername,
          password: smtpPassword,
          useTls: smtpUseTls,
          testRecipient: smtpTestEmail || smtpSenderEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpTestResult({ success: true, message: 'Test e-postası başarıyla gönderildi.' });
      } else {
        setSmtpTestResult({ success: false, message: data.error || 'SMTP testi başarısız.' });
      }
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: `Bağlantı hatası: ${err.message}` });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.code || !newCompany.name) {
      alert('Firma kodu ve adı zorunludur.');
      return;
    }
    
    const codeUpper = newCompany.code.toUpperCase().trim();
    if (companies.some(c => c.code === codeUpper)) {
      alert('Bu firma kodu zaten mevcut.');
      return;
    }

    let trainingVideosList = [];
    if (newCompany.trainingVideosText) {
      try {
        trainingVideosList = JSON.parse(newCompany.trainingVideosText);
      } catch (err) {
        alert('İSG Eğitim Videoları JSON formatı hatalı. Lütfen geçerli bir JSON giriniz.');
        return;
      }
    }

    const createdCompany: CompanyTenant = {
      code: codeUpper,
      name: newCompany.name.trim(),
      logoUrl: newCompany.logoUrl || undefined,
      logoHeight: Number(newCompany.logoHeight),
      themeMode: newCompany.themeMode,
      primaryColor: newCompany.primaryColor,
      secondaryColor: newCompany.secondaryColor,
      departments: newCompany.departmentsText.split(',').map(d => d.trim()).filter(Boolean),
      hosts: newCompany.hostsText.split(',').map(h => h.trim()).filter(Boolean),
      dbType: newCompany.dbType !== 'local_storage' ? newCompany.dbType : undefined,
      dbConnectionString: newCompany.dbConnectionString.trim() || undefined,
      smtpConfig: newCompany.smtpHost ? {
        host: newCompany.smtpHost.trim(),
        port: Number(newCompany.smtpPort),
        senderEmail: newCompany.smtpSenderEmail.trim(),
        senderName: newCompany.smtpSenderName.trim(),
        username: newCompany.smtpUsername.trim(),
        password: newCompany.smtpPassword,
        useTls: newCompany.smtpUseTls
      } : undefined,
      smsConfig: newCompany.smsApiKey ? {
        provider: newCompany.smsProvider,
        apiKey: newCompany.smsApiKey.trim(),
        apiSecret: newCompany.smsApiSecret,
        senderId: newCompany.smsSenderId.trim()
      } : undefined,
      authConfig: newCompany.authType !== 'local' ? {
        type: newCompany.authType,
        ldapUrl: newCompany.ldapUrl.trim(),
        ldapBaseDn: newCompany.ldapBaseDn.trim(),
        ldapDomainSuffix: newCompany.ldapDomainSuffix.trim(),
        entraTenantId: newCompany.entraTenantId.trim(),
        entraClientId: newCompany.entraClientId.trim(),
        entraClientSecret: newCompany.entraClientSecret
      } : undefined,
      trainingVideos: trainingVideosList
    };

    const updated = [...companies, createdCompany];
    setCompanies(updated);
    
    // Save to configuration immediately
    onSaveConfig({
      ...config,
      companies: updated
    });

    setShowAddCompanyForm(false);
    setNewCompany({
      code: '',
      name: '',
      logoUrl: '',
      logoHeight: 40,
      themeMode: 'light',
      primaryColor: '#00d2ff',
      secondaryColor: '#0066ff',
      departmentsText: 'İSG ve Çevre, IT, HR, Lojistik, Depo Operasyonları',
      hostsText: 'Ahmet Yılmaz, Canan Demir, Esra Koç',
      dbType: 'local_storage',
      dbConnectionString: '',
      smtpHost: '',
      smtpPort: 587,
      smtpSenderEmail: '',
      smtpSenderName: '',
      smtpUsername: '',
      smtpPassword: '',
      smtpUseTls: true,
      smsProvider: 'netgsm',
      smsApiKey: '',
      smsApiSecret: '',
      smsSenderId: '',
      authType: 'local',
      ldapUrl: '',
      ldapBaseDn: '',
      ldapDomainSuffix: '',
      entraTenantId: '',
      entraClientId: '',
      entraClientSecret: '',
      trainingVideosText: JSON.stringify(config.trainingVideos || [], null, 2)
    });
    setCompActiveTab('general');
    alert('Yeni firma başarıyla kaydedildi!');
  };

  const handleDeleteCompany = (code: string) => {
    if (window.confirm(`${code} firmasını silmek istediğinize emin misiniz?`)) {
      const updated = companies.filter(c => c.code !== code);
      setCompanies(updated);
      onSaveConfig({
        ...config,
        companies: updated
      });
    }
  };

  // Save config
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const smtpConfig: SmtpConfig | undefined = smtpHost ? {
      host: smtpHost,
      port: smtpPort,
      senderEmail: smtpSenderEmail,
      senderName: smtpSenderName,
      username: smtpUsername,
      password: smtpPassword,
      useTls: smtpUseTls
    } : undefined;

    await onSaveConfig({
      ...config,
      appName,
      logoUrl,
      logoHeight,
      themeMode,
      primaryColor,
      secondaryColor,
      dbType,
      dbConnectionString,
      departments,
      smtpConfig,
      companies
    });
    alert('Sistem yapılandırması başarıyla kaydedildi!');
  };

  // Save departments only - also syncs directly to departments table
  const handleSaveDepts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiRoot = config.dbConnectionString?.startsWith('http') ? config.dbConnectionString : 'http://localhost:5000/api';

      // 1. Sync directly to departments table
      const syncRes = await fetch(`${apiRoot}/departments/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments })
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json();
        alert(`Departman kayıt hatası: ${errData.error}`);
        return;
      }

      // 2. Also update the full config
      await onSaveConfig({
        ...config,
        appName,
        logoUrl,
        logoHeight,
        themeMode,
        primaryColor,
        secondaryColor,
        dbType,
        dbConnectionString,
        departments,
        companies
      });

      alert('Departmanlar veritabanına başarıyla kaydedildi!');
    } catch (err: any) {
      alert(`Bağlantı hatası: ${err.message}`);
    }
  };

  const tabStyle = (tab: string) => ({
    background: 'transparent',
    border: 'none',
    color: activeSubTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: 700 as const,
    fontSize: '0.85rem',
    cursor: 'pointer' as const,
    padding: '0.5rem 0.75rem',
    borderBottom: activeSubTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.4rem',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {t.saTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t.saSubtitle}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0' }}>
        <button type="button" onClick={() => setActiveSubTab('brand')} style={tabStyle('brand')}>
          <Palette size={14} /> {t.saBranding}
        </button>
        <button type="button" onClick={() => setActiveSubTab('departments')} style={tabStyle('departments')}>
          <Settings size={14} /> {t.saDepartments}
        </button>
        <button type="button" onClick={() => setActiveSubTab('users')} style={tabStyle('users')}>
          <Users size={14} /> {t.saUsers}
        </button>
        <button type="button" onClick={() => setActiveSubTab('mail')} style={tabStyle('mail')}>
          <Mail size={14} /> {t.saMailServer}
        </button>
      </div>

      {/* SUBTAB: BRANDING & DB */}
      {activeSubTab === 'brand' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', alignItems: 'start' }} className="sa-desktop-grid">
            <style>{`@media(min-width: 1024px) { .sa-desktop-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>

            {/* Branding */}
            <div className="glass-panel glow-card-primary" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <Palette size={20} color="var(--primary)" />
                {t.saCustomization}
              </h3>

              <div className="form-group">
                <label className="form-label">{t.saAppName}</label>
                <input type="text" className="form-input" value={appName} onChange={e => setAppName(e.target.value)} placeholder="Örn: SafeFlow" required />
              </div>

              <div className="form-group">
                <label className="form-label">{t.saLogo}</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {logoUrl ? <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Shield size={24} style={{ opacity: 0.3 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} id="logo-file-input" />
                    <label htmlFor="logo-file-input" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', cursor: 'pointer', display: 'inline-flex', width: 'auto' }}>
                      <Upload size={14} /> {t.saUploadLogo}
                    </label>
                    {logoUrl && <button type="button" className="btn" onClick={() => setLogoUrl('')} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', marginLeft: '0.5rem', background: 'transparent', color: 'var(--danger)', border: 'none' }}>{t.saRemoveLogo}</button>}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.saLogoHeight}</span><span style={{ color: 'var(--primary)', fontWeight: 600 }}>{logoHeight}px</span></label>
                <input type="range" min="30" max="80" value={logoHeight} onChange={e => setLogoHeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }} />
              </div>

              <div className="form-group">
                <label className="form-label">{t.saThemeMode}</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeMode('dark')} style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>{t.saDark}</button>
                  <button type="button" className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeMode('light')} style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>{t.saLight}</button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t.saPrimaryColor}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" className="form-input" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ fontSize: '0.85rem' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.saSecondaryColor}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }} />
                    <input type="text" className="form-input" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>{t.saPresets}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button key={idx} type="button" className="btn btn-secondary" onClick={() => handleApplyPreset(preset.primary, preset.secondary)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: preset.primary }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: preset.secondary }} />
                      </div>
                      {getPresetName(preset.name)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <Database size={20} color="var(--primary)" />
                {t.saDbConfig}
              </h3>

              <div className="form-group">
                <label className="form-label">{t.saDbType}</label>
                <select className="form-select" value={dbType} onChange={e => setDbType(e.target.value as DatabaseType)}>
                  <option value="local_storage">{t.saDbLocal}</option>
                  <option value="generic_api">{t.saDbGeneric}</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="mssql">MS SQL Server</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.saDbConnString}</label>
                <input type="text" className="form-input" value={dbConnectionString} onChange={e => setDbConnectionString(e.target.value)} placeholder="http://localhost:5000/api" />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleTestConnection} disabled={testingConnection} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                  {testingConnection ? <><RefreshCw size={14} className="spin" /> {t.saDbTesting}</> : <><Activity size={14} /> {t.saDbTest}</>}
                </button>
              </div>

              {testResult && (
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, background: testResult.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', color: testResult.success ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {testResult.success ? <CheckCircle2 size={16} /> : <Activity size={16} />}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> {t.saSaveConfig}
          </button>
        </form>
      )}

      {/* SUBTAB: DEPARTMENTS */}
      {activeSubTab === 'departments' && (
        <form onSubmit={handleSaveDepts} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Settings size={20} color="var(--primary)" />
              {t.saDeptTitle} ({departments.length})
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-input" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder={t.saDeptPlaceholder} style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDept(); } }} />
              <button type="button" className="btn btn-primary" onClick={handleAddDept} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flexShrink: 0 }}>
                <Plus size={14} /> {t.add}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {departments.map((dept, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{dept}</span>
                  <button type="button" onClick={() => handleRemoveDept(dept)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> {t.saDeptSaveBtn}
          </button>
        </form>
      )}

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Users size={20} color="var(--primary)" />
                {t.saUserManagementTitle} ({usersList.length})
              </h3>
              <button type="button" className="btn btn-primary" onClick={() => setShowAddUserForm(!showAddUserForm)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                <UserPlus size={14} /> {showAddUserForm ? t.close : t.saAddUserBtn}
              </button>
            </div>

            {/* Add User Form */}
            {showAddUserForm && (
              <div className="animate-fade-in" style={{ padding: '1.25rem', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 210, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ color: 'var(--primary)', fontSize: '0.9rem', margin: 0 }}>{t.saAddUserTitle}</h4>

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saFirstName}</label>
                    <input type="text" className="form-input" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} placeholder={t.saFirstName.replace(' *', '')} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saLastName}</label>
                    <input type="text" className="form-input" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} placeholder={t.saLastName.replace(' *', '')} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t.saEmail}</label>
                  <input type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="ornek@sirket.com" />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saUsername}</label>
                    <input type="text" className="form-input" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder={t.saUsername.replace(' *', '')} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saPassword}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type={showNewPassword ? 'text' : 'password'} className="form-input" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder={t.saPassword.replace(' *', '')} style={{ paddingRight: '2.5rem' }} />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saRole}</label>
                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="department">{t.roleDepartment}</option>
                      <option value="admin">{t.roleAdmin}</option>
                      <option value="isg">{t.roleOHS}</option>
                      <option value="security">{t.roleSecurity}</option>
                      <option value="super_admin">{t.roleSuperAdmin}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t.saDepartment}</label>
                    <select className="form-select" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })}>
                      <option value="">{t.select}</option>
                      {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <button type="button" className="btn btn-success" onClick={handleAddUser} style={{ alignSelf: 'flex-start', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={14} /> {t.saSaveUser}
                </button>
              </div>
            )}

            {/* Users List */}
            {usersLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t.loading}</div>
            ) : usersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {t.saNoUsers}
              </div>
            ) : (
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{t.saUserTableFullName}</th>
                      <th>{t.saUserTableUsername}</th>
                      <th>{t.saUserTableRole}</th>
                      <th>{t.saUserTableDept}</th>
                      <th>{t.saUserTableStatus}</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => {
                      const roleMeta = ROLE_LABELS[u.role] || { label: u.role, color: '#6b7280' };
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td><code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.username}</code></td>
                          <td>
                            <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, color: roleMeta.color, background: `${roleMeta.color}18`, border: `1px solid ${roleMeta.color}40` }}>
                              {roleMeta.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{u.department || '-'}</td>
                          <td>
                            <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                              {u.isActive ? t.saUserTableActive : t.saUserTablePassive}
                            </span>
                          </td>
                          <td>
                            <button type="button" onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: MAIL SERVER */}
      {activeSubTab === 'mail' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <Mail size={20} color="var(--primary)" />
              {t.saSmtpTitle}
            </h3>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpHost}</label>
                <input type="text" className="form-input" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.sirket.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpPort}</label>
                <input type="number" className="form-input" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} placeholder="587" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpSenderMail}</label>
                <input type="email" className="form-input" value={smtpSenderEmail} onChange={e => setSmtpSenderEmail(e.target.value)} placeholder="noreply@sirket.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpSenderName}</label>
                <input type="text" className="form-input" value={smtpSenderName} onChange={e => setSmtpSenderName(e.target.value)} placeholder={t.saSmtpSenderNamePlaceholder} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpUser}</label>
                <input type="text" className="form-input" value={smtpUsername} onChange={e => setSmtpUsername(e.target.value)} placeholder="mail@sirket.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t.saSmtpPass}</label>
                <input type="password" className="form-input" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.saSmtpSecure}</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className={`btn ${smtpUseTls ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSmtpUseTls(true)} style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>TLS / STARTTLS</button>
                <button type="button" className={`btn ${!smtpUseTls ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSmtpUseTls(false)} style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>{t.saSmtpSslLegacy}</button>
              </div>
            </div>

            {/* Test Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="form-label">{t.saSmtpTestRecipient}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input type="email" className="form-input" value={smtpTestEmail} onChange={e => setSmtpTestEmail(e.target.value)} placeholder={t.saSmtpTestRecipientPlaceholder} style={{ flex: 1, minWidth: '200px' }} />
                <button type="button" className="btn btn-secondary" onClick={handleSmtpTest} disabled={smtpTesting} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', flexShrink: 0 }}>
                  <Send size={14} /> {smtpTesting ? t.saSmtpTesting : t.saSmtpTestBtn}
                </button>
              </div>

              {smtpTestResult && (
                <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${smtpTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, background: smtpTestResult.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', color: smtpTestResult.success ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {smtpTestResult.success ? <CheckCircle2 size={16} /> : <Activity size={16} />}
                  {smtpTestResult.message}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> {t.saSmtpSaveBtn}
          </button>
        </form>
      )}

      {/* SUBTAB: COMPANIES */}
      {false && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                Kayıtlı Multi-Tenant Firmalar ({companies.length})
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Sistemde barınan bağımsız müşteri firmaları. Her firmanın kendine özel renkleri, logosu, departmanları ve personeli bulunur.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddCompanyForm(!showAddCompanyForm)}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              {showAddCompanyForm ? 'Formu Kapat' : 'Yeni Firma/Tenant Ekle'}
            </button>
          </div>

          {/* Add Company Form */}
          {showAddCompanyForm && (
            <form onSubmit={handleCreateCompany} className="glass-panel glow-card-primary animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ color: 'var(--primary)', margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Yeni Firma / Tenant Ekleme Formu</h4>
              
              {/* Tab Navigation inside form */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.5rem', gap: '0.5rem', overflowX: 'auto' }}>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'general' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('general')}>1. Genel Bilgiler</button>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'db' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'db' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('db')}>2. Veritabanı</button>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'smtp' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'smtp' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('smtp')}>3. E-posta (SMTP)</button>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'sms' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'sms' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('sms')}>4. SMS Gateway</button>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'auth' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'auth' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('auth')}>5. Dizin Servisi</button>
                <button type="button" style={{ background: 'none', border: 'none', borderBottom: compActiveTab === 'videos' ? '2px solid var(--primary)' : '2px solid transparent', color: compActiveTab === 'videos' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCompActiveTab('videos')}>6. İSG Videoları</button>
              </div>

              {/* TAB CONTENT: GENERAL */}
              {compActiveTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Firma Kodu (Büyük Harflerle, Boşluksuz) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: ARVATO, DANTE, VESBE"
                        value={newCompany.code}
                        onChange={e => setNewCompany({ ...newCompany, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Firma Ticari Ünvanı *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Örn: Arvato Lojistik Hizmetleri A.Ş."
                        value={newCompany.name}
                        onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Varsayılan Tema Modu</label>
                      <select
                        className="form-select"
                        value={newCompany.themeMode}
                        onChange={e => setNewCompany({ ...newCompany, themeMode: e.target.value as 'light' | 'dark' })}
                      >
                        <option value="light">Açık Tema (Light Mode)</option>
                        <option value="dark">Koyu Tema (Dark Mode)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Firma Logosu</label>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {newCompany.logoUrl ? <img src={newCompany.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Building2 size={18} style={{ opacity: 0.3, color: '#000' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 200000) {
                                  alert('Hata: Logo boyutu 200KB\'tan küçük olmalıdır.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewCompany({ ...newCompany, logoUrl: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                            style={{ display: 'none' }} 
                            id="comp-logo-file-input" 
                          />
                          <label htmlFor="comp-logo-file-input" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'inline-flex' }}>
                            <Upload size={12} /> Yükle
                          </label>
                          {newCompany.logoUrl && (
                            <button 
                              type="button" 
                              className="btn" 
                              onClick={() => setNewCompany({ ...newCompany, logoUrl: '' })} 
                              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', marginLeft: '0.5rem', background: 'transparent', color: 'var(--danger)', border: 'none' }}
                            >
                              Kaldır
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Birincil Marka Rengi *</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={newCompany.primaryColor}
                          onChange={e => setNewCompany({ ...newCompany, primaryColor: e.target.value })}
                          style={{ width: '42px', height: '42px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={newCompany.primaryColor}
                          onChange={e => setNewCompany({ ...newCompany, primaryColor: e.target.value })}
                          placeholder="#00d2ff"
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">İkincil Marka Rengi *</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={newCompany.secondaryColor}
                          onChange={e => setNewCompany({ ...newCompany, secondaryColor: e.target.value })}
                          style={{ width: '42px', height: '42px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', padding: '2px' }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={newCompany.secondaryColor}
                          onChange={e => setNewCompany({ ...newCompany, secondaryColor: e.target.value })}
                          placeholder="#0066ff"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bağlı Departmanlar (Virgülle Ayırın)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newCompany.departmentsText}
                        onChange={e => setNewCompany({ ...newCompany, departmentsText: e.target.value })}
                        placeholder="Örn: İSG ve Çevre, IT, HR, Üretim"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ev Sahipleri / Personel Listesi (Virgülle Ayırın)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newCompany.hostsText}
                        onChange={e => setNewCompany({ ...newCompany, hostsText: e.target.value })}
                        placeholder="Örn: Ahmet Yılmaz, Canan Demir, Esra Koç"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: DATABASE */}
              {compActiveTab === 'db' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">Şirkete Özel Veritabanı Türü</label>
                    <select
                      className="form-select"
                      value={newCompany.dbType}
                      onChange={e => setNewCompany({ ...newCompany, dbType: e.target.value as DatabaseType })}
                    >
                      <option value="local_storage">Sistem Varsayılanı (Paylaşımlı DB veya Yerel Dosya)</option>
                      <option value="mysql">MySQL / MariaDB</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mssql">Microsoft SQL Server</option>
                      <option value="mongodb">MongoDB</option>
                    </select>
                  </div>
                  {(newCompany.dbType as string) !== 'local_storage' && (
                    <div className="form-group">
                      <label className="form-label">Veritabanı Bağlantı Dizesi (Connection String) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={newCompany.dbType === 'mysql' ? 'mysql://user:pass@host:3306/db_name' : newCompany.dbType === 'postgresql' ? 'postgresql://user:pass@host:5432/db_name' : 'Bağlantı URLsi'}
                        value={newCompany.dbConnectionString}
                        onChange={e => setNewCompany({ ...newCompany, dbConnectionString: e.target.value })}
                        required={(newCompany.dbType as string) !== 'local_storage'}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        Bu şirkete özel veriler, bu veritabanında otomatik oluşturulacak izole tablolarda saklanacaktır.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: SMTP */}
              {compActiveTab === 'smtp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMTP Sunucu Adresi</label>
                      <input type="text" className="form-input" value={newCompany.smtpHost} onChange={e => setNewCompany({ ...newCompany, smtpHost: e.target.value })} placeholder="smtp.sirket.com" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Port</label>
                      <input type="number" className="form-input" value={newCompany.smtpPort} onChange={e => setNewCompany({ ...newCompany, smtpPort: Number(e.target.value) })} placeholder="587" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Gönderici E-posta</label>
                      <input type="email" className="form-input" value={newCompany.smtpSenderEmail} onChange={e => setNewCompany({ ...newCompany, smtpSenderEmail: e.target.value })} placeholder="noreply@sirket.com" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Gönderici Adı</label>
                      <input type="text" className="form-input" value={newCompany.smtpSenderName} onChange={e => setNewCompany({ ...newCompany, smtpSenderName: e.target.value })} placeholder="SafeFlow Bildirim Sistemi" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMTP Kullanıcı Adı</label>
                      <input type="text" className="form-input" value={newCompany.smtpUsername} onChange={e => setNewCompany({ ...newCompany, smtpUsername: e.target.value })} placeholder="mail@sirket.com" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMTP Şifre</label>
                      <input type="password" className="form-input" value={newCompany.smtpPassword} onChange={e => setNewCompany({ ...newCompany, smtpPassword: e.target.value })} placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">TLS / STARTTLS Protokolü</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className={`btn ${newCompany.smtpUseTls ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setNewCompany({ ...newCompany, smtpUseTls: true })} style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>TLS Aktif</button>
                      <button type="button" className={`btn ${!newCompany.smtpUseTls ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setNewCompany({ ...newCompany, smtpUseTls: false })} style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}>SSL (Eski)</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SMS */}
              {compActiveTab === 'sms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMS Servis Sağlayıcısı</label>
                      <select
                        className="form-select"
                        value={newCompany.smsProvider}
                        onChange={e => setNewCompany({ ...newCompany, smsProvider: e.target.value })}
                      >
                        <option value="netgsm">NetGSM</option>
                        <option value="mutlucell">Mutlucell</option>
                        <option value="generic">Özel Webhook API</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMS Gönderici Başlığı (Sender ID)</label>
                      <input type="text" className="form-input" value={newCompany.smsSenderId} onChange={e => setNewCompany({ ...newCompany, smsSenderId: e.target.value })} placeholder="Örn: SIRKET" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMS API Anahtarı (Username)</label>
                      <input type="text" className="form-input" value={newCompany.smsApiKey} onChange={e => setNewCompany({ ...newCompany, smsApiKey: e.target.value })} placeholder="Kullanıcı adı veya API Key" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">SMS Şifresi (API Secret)</label>
                      <input type="password" className="form-input" value={newCompany.smsApiSecret} onChange={e => setNewCompany({ ...newCompany, smsApiSecret: e.target.value })} placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: AUTH INTEGRATION */}
              {compActiveTab === 'auth' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">Kurumsal Kimlik Doğrulama (SSO) Tipi</label>
                    <select
                      className="form-select"
                      value={newCompany.authType}
                      onChange={e => setNewCompany({ ...newCompany, authType: e.target.value as 'local' | 'ldap' | 'entra_id' })}
                    >
                      <option value="local">Sistem Veritabanı (Local Users)</option>
                      <option value="ldap">LDAP / Active Directory Entegrasyonu</option>
                      <option value="entra_id">Microsoft Entra ID (Azure AD)</option>
                    </select>
                  </div>

                  {newCompany.authType === 'ldap' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                      <div className="form-group">
                        <label className="form-label">LDAP Sunucu URL *</label>
                        <input type="text" className="form-input" value={newCompany.ldapUrl} onChange={e => setNewCompany({ ...newCompany, ldapUrl: e.target.value })} placeholder="ldap://ldap.sirket.com:389" required={newCompany.authType === 'ldap'} />
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">LDAP Base DN *</label>
                          <input type="text" className="form-input" value={newCompany.ldapBaseDn} onChange={e => setNewCompany({ ...newCompany, ldapBaseDn: e.target.value })} placeholder="dc=sirket,dc=com" required={newCompany.authType === 'ldap'} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Alan Adı Uzantısı (Domain Suffix)</label>
                          <input type="text" className="form-input" value={newCompany.ldapDomainSuffix} onChange={e => setNewCompany({ ...newCompany, ldapDomainSuffix: e.target.value })} placeholder="@sirket.com" />
                        </div>
                      </div>
                    </div>
                  )}

                  {newCompany.authType === 'entra_id' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                      <div className="form-group">
                        <label className="form-label">Microsoft Entra Tenant ID *</label>
                        <input type="text" className="form-input" value={newCompany.entraTenantId} onChange={e => setNewCompany({ ...newCompany, entraTenantId: e.target.value })} placeholder="Tenant GUID" required={newCompany.authType === 'entra_id'} />
                      </div>
                      <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Microsoft Entra Client ID *</label>
                          <input type="text" className="form-input" value={newCompany.entraClientId} onChange={e => setNewCompany({ ...newCompany, entraClientId: e.target.value })} placeholder="Application Client GUID" required={newCompany.authType === 'entra_id'} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Microsoft Entra Client Secret *</label>
                          <input type="password" className="form-input" value={newCompany.entraClientSecret} onChange={e => setNewCompany({ ...newCompany, entraClientSecret: e.target.value })} placeholder="Secret Value" required={newCompany.authType === 'entra_id'} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: VIDEOS */}
              {compActiveTab === 'videos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">İSG Eğitim Videoları ve Quiz Soruları Yapılandırması (JSON Formatında)</label>
                    <textarea
                      rows={12}
                      className="form-input"
                      style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.4' }}
                      value={newCompany.trainingVideosText}
                      onChange={e => setNewCompany({ ...newCompany, trainingVideosText: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Şirkete özel İSG eğitimi, videoları, şıkları ve doğru cevapları içeren JSON dizisi.
                    </span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  <CheckCircle2 size={14} /> Firmayı Kaydet ve Oluştur
                </button>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => { setShowAddCompanyForm(false); setCompActiveTab('general'); }}>
                  İptal Et
                </button>
              </div>
            </form>
          )}

          {/* Companies List */}
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Logo</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Firma Kodu</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Firma Adı</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Marka Renkleri</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Departmanlar</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Ev Sahipleri</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Henüz özel firma kaydı bulunmamaktadır. KARTON ana kodu aktiftir.
                    </td>
                  </tr>
                ) : (
                  companies.map(comp => (
                    <tr key={comp.code} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {comp.logoUrl ? (
                          <img src={comp.logoUrl} alt="Logo" style={{ height: '20px', maxWidth: '80px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={10} color="var(--primary)" />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--primary)' }}>{comp.code}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{comp.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: comp.primaryColor, border: '1px solid rgba(255,255,255,0.1)' }} title="Birincil" />
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: comp.secondaryColor, border: '1px solid rgba(255,255,255,0.1)' }} title="İkincil" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({comp.themeMode === 'dark' ? 'Dark' : 'Light'})</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {comp.departments.map(d => (
                            <span key={d} style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comp.hosts.join(', ')}>
                          {comp.hosts.join(', ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompany(comp.code)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                          title="Firmayı Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
