import React, { useState } from 'react';
import { Database, Settings, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, Upload } from 'lucide-react';
import type { DatabaseType } from '../utils/types';

const TRANSLATIONS = {
  tr: {
    title: "SafeFlow Kurulum Sihirbazı",
    subtitle: "Sisteminizi saniyeler içinde çalışır duruma getirin.",
    step1: "Genel",
    step2: "Veritabanı",
    step3: "Yönetici",
    step4: "Özet",
    appName: "Uygulama İsmi *",
    appNamePlaceholder: "Örn: SafeFlow",
    systemCompanyCode: "Sistem Giriş Firma Kodu *",
    systemCompanyCodePlaceholder: "Girişte kullanılacak kod (Örn: SAFEFLOW)",
    logoLabel: "Uygulama Logosu",
    logoUploadBtn: "Logo Yükle",
    logoRemove: "Kaldır",
    logoInfo: "Maksimum boyut 200KB. PNG, JPG veya SVG tavsiye edilir.",
    logoAlert: "Hata: Demo amaçlı logo boyutu 200KB'tan küçük olmalıdır.",
    primaryColor: "Tema Rengi (Birincil)",
    secondaryColor: "Tema Rengi (İkincil)",
    themeMode: "Arayüz Modu",
    themeDark: "Karanlık Tema (Dark Mode)",
    themeLight: "Aydınlık Tema (Light Mode)",
    logoHeightLabel: "Logo Yükseklik Boyutu",
    dbType: "Veritabanı Türü *",
    dbConnString: "Veritabanı Bağlantı Dizesi (Connection String) *",
    dbTestBtn: "Bağlantıyı Test Et",
    dbTesting: "Bağlantı Test Ediliyor...",
    dbTestSuccess: "Veritabanı bağlantısı başarılı.",
    dbTestFail: "Bağlantı başarısız.",
    dbLocal: "Yerel Simülasyon (JSON Dosya DB - Kolay Kurulum)",
    dbConnWarn: "Veritabanı bağlantısı henüz başarıyla doğrulanmadı. Devam etmek istiyor musunuz?",
    firstName: "Adı *",
    lastName: "Soyadı *",
    email: "E-Posta Adresi",
    username: "Yönetici Kullanıcı Adı *",
    password: "Yönetici Şifresi *",
    passwordPlaceholder: "Yönetici şifreniz",
    summaryTitle: "Kurulum Özeti",
    summaryApp: "Uygulama İsmi:",
    summarySystemCode: "Sistem Firma Kodu:",
    summaryTheme: "Tema Arayüzü:",
    summaryDbType: "Veritabanı Türü:",
    summaryAdmin: "Yönetici Hesabı:",
    summaryDbLocalVal: "Yerel Dosya (JSON)",
    summaryInfo: "Kurulumu Başlat butonuna tıkladığınızda veritabanı tabloları otomatik oluşturulacak, superadmin kullanıcısı eklenecek ve yapılandırmanız sunucuya kaydedilecektir.",
    installingBtn: "Sistem Kuruluyor...",
    installBtn: "Kurulumu Başlat",
    backBtn: "Geri",
    nextBtn: "İleri",
    errorRequired: "Lütfen zorunlu alanları doldurunuz.",
    errorAdminRequired: "Yönetici hesap bilgileri boş bırakılamaz.",
    errorDbRequired: "Uzak veritabanları için bağlantı dizesi girilmesi zorunludur.",
    errorInstallFail: "Kurulum başlatılamadı."
  },
  en: {
    title: "SafeFlow Setup Wizard",
    subtitle: "Get your system up and running in seconds.",
    step1: "General",
    step2: "Database",
    step3: "Admin",
    step4: "Summary",
    appName: "Application Name *",
    appNamePlaceholder: "e.g., SafeFlow",
    systemCompanyCode: "System Login Company Code *",
    systemCompanyCodePlaceholder: "Code to use for login (e.g., SAFEFLOW)",
    logoLabel: "Application Logo",
    logoUploadBtn: "Upload Logo",
    logoRemove: "Remove",
    logoInfo: "Maximum size 200KB. PNG, JPG or SVG recommended.",
    logoAlert: "Error: Logo size must be smaller than 200KB for demo.",
    primaryColor: "Theme Color (Primary)",
    secondaryColor: "Theme Color (Secondary)",
    themeMode: "Interface Mode",
    themeDark: "Dark Theme (Dark Mode)",
    themeLight: "Light Theme (Light Mode)",
    logoHeightLabel: "Logo Height Size",
    dbType: "Database Type *",
    dbConnString: "Database Connection String *",
    dbTestBtn: "Test Connection",
    dbTesting: "Testing Connection...",
    dbTestSuccess: "Database connection successful.",
    dbTestFail: "Connection failed.",
    dbLocal: "Local Simulation (JSON File DB - Easy Setup)",
    dbConnWarn: "Database connection has not been verified yet. Do you want to continue?",
    firstName: "First Name *",
    lastName: "Last Name *",
    email: "Email Address",
    username: "Admin Username *",
    password: "Admin Password *",
    passwordPlaceholder: "Your admin password",
    summaryTitle: "Setup Summary",
    summaryApp: "Application Name:",
    summarySystemCode: "System Company Code:",
    summaryTheme: "Interface Theme:",
    summaryDbType: "Database Type:",
    summaryAdmin: "Admin Account:",
    summaryDbLocalVal: "Local File (JSON)",
    summaryInfo: "When you click the Start Installation button, database tables will be created automatically, the superadmin user will be added, and your configuration will be saved to the server.",
    installingBtn: "Installing System...",
    installBtn: "Start Installation",
    backBtn: "Back",
    nextBtn: "Next",
    errorRequired: "Please fill in the required fields.",
    errorAdminRequired: "Admin account details cannot be left blank.",
    errorDbRequired: "Connection string is required for remote databases.",
    errorInstallFail: "Installation could not be started."
  },
  es: {
    title: "Asistente de Instalación de SafeFlow",
    subtitle: "Ponga su sistema en funcionamiento en segundos.",
    step1: "General",
    step2: "Base de Datos",
    step3: "Admin",
    step4: "Resumen",
    appName: "Nombre de la Aplicación *",
    appNamePlaceholder: "Ej: SafeFlow",
    systemCompanyCode: "Código de Empresa del Sistema *",
    systemCompanyCodePlaceholder: "Código para iniciar sesión (Ej: SAFEFLOW)",
    logoLabel: "Logo de la Aplicación",
    logoUploadBtn: "Subir Logo",
    logoRemove: "Eliminar",
    logoInfo: "Tamaño máximo 200KB. Se recomienda PNG, JPG o SVG.",
    logoAlert: "Error: El tamaño del logo debe ser menor a 200KB para la demo.",
    primaryColor: "Color de Tema (Primario)",
    secondaryColor: "Color de Tema (Secundario)",
    themeMode: "Modo de Interfaz",
    themeDark: "Tema Oscuro (Dark Mode)",
    themeLight: "Tema Claro (Light Mode)",
    logoHeightLabel: "Altura del Logo",
    dbType: "Tipo de Base de Datos *",
    dbConnString: "Cadena de Conexión de Base de Datos *",
    dbTestBtn: "Probar Conexión",
    dbTesting: "Probando Conexión...",
    dbTestSuccess: "Conexión a la base de datos exitosa.",
    dbTestFail: "Conexión fallida.",
    dbLocal: "Simulación Local (JSON File DB - Configuración Fácil)",
    dbConnWarn: "La conexión a la base de datos aún no ha sido verificada. ¿Desea continuar?",
    firstName: "Nombre *",
    lastName: "Apellido *",
    email: "Correo Electrónico",
    username: "Usuario Administrador *",
    password: "Contraseña de Administrador *",
    passwordPlaceholder: "Su contraseña de administrador",
    summaryTitle: "Resumen de Instalación",
    summaryApp: "Nombre de Aplicación:",
    summarySystemCode: "Código de la Empresa del Sistema:",
    summaryTheme: "Tema de Interfaz:",
    summaryDbType: "Tipo de Base de Datos:",
    summaryAdmin: "Cuenta Administradora:",
    summaryDbLocalVal: "Archivo Local (JSON)",
    summaryInfo: "Al hacer clic en el botón Iniciar Instalación, las tablas de la base de datos se crearán automáticamente, se agregará el usuario superadmin y su configuración se guardará en el servidor.",
    installingBtn: "Instalando Sistema...",
    installBtn: "Iniciar Instalación",
    backBtn: "Atrás",
    nextBtn: "Siguiente",
    errorRequired: "Por favor complete los campos requeridos.",
    errorAdminRequired: "Los detalles de la cuenta de administrador no pueden estar vacíos.",
    errorDbRequired: "Se requiere la cadena de conexión para bases de datos remotas.",
    errorInstallFail: "La instalación no pudo ser iniciada."
  }
};

interface SetupWizardProps {
  onInstallComplete: (config: any) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onInstallComplete }) => {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<'tr' | 'en' | 'es'>('tr');
  const t = TRANSLATIONS[lang];
  const API_ROOT = 'http://localhost:5000/api';

  // State: Wizard Fields
  const [appName, setAppName] = useState('SafeFlow');
  const [systemCompanyCode, setSystemCompanyCode] = useState('SAFEFLOW');
  const [primaryColor, setPrimaryColor] = useState('#00d2ff');
  const [secondaryColor, setSecondaryColor] = useState('#0066ff');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('light');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoHeight, setLogoHeight] = useState(40);
  
  const [dbType, setDbType] = useState<DatabaseType>('local_storage');
  const [dbConnectionString, setDbConnectionString] = useState('');
  
  const [adminUser, setAdminUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: 'superadmin',
    password: ''
  });

  // UI Helpers
  const [showPassword, setShowPassword] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [installing, setInstalling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const COLOR_PRESETS = [
    { name: 'SafeFlow Mavi (Varsayılan)', primary: '#00d2ff', secondary: '#0066ff' },
    { name: 'Modern Turuncu', primary: '#ff6600', secondary: '#ffcc00' },
    { name: 'Karton Yeşil', primary: '#10b981', secondary: '#047857' },
    { name: 'Kurumsal Mor', primary: '#a855f7', secondary: '#6366f1' },
    { name: 'Metal Platin', primary: '#94a3b8', secondary: '#475569' }
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        alert(t.logoAlert);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestConnection = async () => {
    setTestingDb(true);
    setTestResult(null);
    try {
      const response = await fetch(`${API_ROOT}/config/test-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType, dbConnectionString })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({ success: true, message: t.dbTestSuccess });
      } else {
        setTestResult({ success: false, message: data.message || t.dbTestFail });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Hata: ${err.message}` });
    } finally {
      setTestingDb(false);
    }
  };

  const handleInstall = async () => {
    if (!appName || !systemCompanyCode || !primaryColor || !secondaryColor || !dbType) {
      setErrorMsg(t.errorRequired);
      return;
    }
    if (!adminUser.firstName || !adminUser.lastName || !adminUser.username || !adminUser.password) {
      setErrorMsg(t.errorAdminRequired);
      return;
    }

    setInstalling(true);
    setErrorMsg('');
    try {
      const payload = {
        appName,
        systemCompanyCode,
        logoUrl: logoUrl,
        logoHeight,
        themeMode,
        primaryColor,
        secondaryColor,
        dbType,
        dbConnectionString: dbType === 'local_storage' ? '' : dbConnectionString,
        adminUser
      };

      const response = await fetch(`${API_ROOT}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Installation complete! Fetch the config to proceed
        const configRes = await fetch(`${API_ROOT}/config`);
        const latestConfig = await configRes.json();
        onInstallComplete(latestConfig);
      } else {
        setErrorMsg(data.error || t.errorInstallFail);
      }
    } catch (err: any) {
      setErrorMsg(`${t.errorInstallFail}: ${err.message}`);
    } finally {
      setInstalling(false);
    }
  };

  const isLight = themeMode === 'light';
  const styles = {
    background: isLight 
      ? 'radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%)' 
      : 'radial-gradient(circle at center, #111827 0%, #030712 100%)',
    textColor: isLight ? '#1e293b' : '#f3f4f6',
    cardBackground: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 24, 39, 0.7)',
    cardBorder: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
    cardShadow: isLight ? '0 25px 50px -12px rgba(0, 0, 0, 0.08)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    inputBackground: isLight ? '#ffffff' : '#1f2937',
    inputBorder: isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
    inputText: isLight ? '#1e293b' : '#ffffff',
    labelColor: isLight ? '#475569' : '#d1d5db',
    subText: isLight ? '#64748b' : '#9ca3af',
    stepperLine: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    stepCircleUnselectedBg: isLight ? '#f1f5f9' : '#111827',
    stepCircleUnselectedBorder: isLight ? '2px solid rgba(0, 0, 0, 0.08)' : '2px solid rgba(255, 255, 255, 0.08)',
    stepCircleUnselectedColor: isLight ? '#64748b' : '#4b5563',
    stepTextUnselectedColor: isLight ? '#64748b' : '#4b5563',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: styles.background,
      fontFamily: 'Outfit, sans-serif',
      color: styles.textColor,
      padding: '2rem 1rem',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      <style>{`
        .wizard-container label {
          color: ${styles.labelColor} !important;
          transition: color 0.3s ease;
        }
        .wizard-container input:not([type="color"]):not([type="range"]), 
        .wizard-container select {
          background-color: ${styles.inputBackground} !important;
          border: ${styles.inputBorder} !important;
          color: ${styles.inputText} !important;
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        .wizard-container .color-preset-btn {
          background-color: ${styles.inputBackground} !important;
          border: ${styles.inputBorder} !important;
          color: ${styles.subText} !important;
          transition: all 0.3s ease;
        }
        .wizard-container .theme-mode-btn-unselected {
          background-color: ${styles.stepCircleUnselectedBg} !important;
          border: ${styles.inputBorder} !important;
          color: ${styles.subText} !important;
        }
        .wizard-container .summary-box {
          background-color: ${styles.inputBackground} !important;
          border: ${styles.inputBorder} !important;
        }
        .wizard-container .summary-label {
          color: ${styles.subText} !important;
        }
        .wizard-container .footer-divider {
          border-top: ${styles.cardBorder} !important;
        }
        .wizard-container .back-btn {
          background-color: ${styles.inputBackground} !important;
          border: ${styles.inputBorder} !important;
          color: ${styles.inputText} !important;
        }
        .wizard-container .logo-preview-box {
          background-color: ${isLight ? '#f1f5f9' : '#111827'} !important;
          border: ${isLight ? '1px dashed rgba(0, 0, 0, 0.15)' : '1px dashed rgba(255, 255, 255, 0.15)'} !important;
        }
        .wizard-container .logo-upload-btn {
          background-color: ${styles.inputBackground} !important;
          border: ${styles.inputBorder} !important;
          color: ${styles.inputText} !important;
        }
        .wizard-container input[type="range"] {
          background: ${isLight ? '#e2e8f0' : '#374151'} !important;
          height: 6px !important;
          border-radius: 3px !important;
          outline: none !important;
          -webkit-appearance: none !important;
        }
      `}</style>

      {/* GLOW DECORATIONS */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
        top: '10%',
        left: '20%',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: `radial-gradient(circle, ${secondaryColor}15 0%, transparent 70%)`,
        bottom: '10%',
        right: '20%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* SETUP CARD */}
      <div className="wizard-container" style={{
        width: '100%',
        maxWidth: '640px',
        background: styles.cardBackground,
        backdropFilter: 'blur(20px)',
        border: styles.cardBorder,
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: styles.cardShadow,
        zIndex: 1,
        position: 'relative',
        transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
      }}>
        {/* Language Selector */}
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          gap: '0.4rem',
          zIndex: 10
        }}>
          {['tr', 'en', 'es'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l as any)}
              style={{
                background: lang === l ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : styles.inputBackground,
                border: lang === l ? 'none' : styles.inputBorder,
                color: lang === l ? '#ffffff' : styles.textColor,
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: lang === l ? `0 2px 8px ${primaryColor}40` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {l === 'tr' ? '🇹🇷 TR' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
            </button>
          ))}
        </div>

        {/* LOGO & TITLE */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}25 100%)`,
            border: `1px solid ${primaryColor}40`,
            boxShadow: `0 0 20px ${primaryColor}15`,
            marginBottom: '1rem'
          }}>
            <Settings size={32} style={{ color: primaryColor }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.05em', margin: 0 }}>
            {t.title}
          </h1>
          <p style={{ color: styles.subText, fontSize: '0.925rem', marginTop: '0.5rem' }}>
            {t.subtitle}
          </p>
        </div>

        {/* STEPPER PROGRESS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          position: 'relative'
        }}>
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            height: '2px',
            background: styles.stepperLine,
            left: '10%',
            right: '10%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            height: '2px',
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            left: '10%',
            width: `${(step - 1) * 26.6}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 0
          }} />

          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: step > s 
                  ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                  : step === s 
                    ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` 
                    : styles.stepCircleUnselectedBg,
                border: step >= s ? `2px solid ${primaryColor}` : styles.stepCircleUnselectedBorder,
                color: step > s 
                  ? '#ffffff' 
                  : step === s 
                    ? primaryColor 
                    : styles.stepCircleUnselectedColor,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: step === s ? `0 0 15px ${primaryColor}40` : 'none',
                transition: 'all 0.3s ease'
              }}>
                {step > s ? <CheckCircle2 size={18} /> : s}
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: step >= s ? (isLight ? '#1e293b' : '#ffffff') : styles.stepTextUnselectedColor,
                transition: 'color 0.3s ease'
              }}>
                {s === 1 ? t.step1 : s === 2 ? t.step2 : s === 3 ? t.step3 : t.step4}
              </span>
            </div>
          ))}
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#f87171',
            fontSize: '0.875rem'
          }}>
            {errorMsg}
          </div>
        )}

        {/* STEP CONTENT */}
        <div style={{ minHeight: '260px' }}>
          {/* STEP 1: GENERAL SETTINGS */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.appName}
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  placeholder={t.appNamePlaceholder}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.systemCompanyCode}
                </label>
                <input
                  type="text"
                  value={systemCompanyCode}
                  onChange={(e) => setSystemCompanyCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  placeholder={t.systemCompanyCodePlaceholder}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.logoLabel}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="logo-preview-box" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: '#111827',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Önizleme" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Settings size={24} style={{ opacity: 0.3, color: primaryColor }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="wizard-logo-file"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="wizard-logo-file"
                      className="logo-upload-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#1f2937',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        color: '#f3f4f6',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Upload size={14} /> {t.logoUploadBtn}
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '0.825rem',
                          marginLeft: '1rem',
                          cursor: 'pointer'
                        }}
                      >
                        {t.logoRemove}
                      </button>
                    )}
                    <p style={{ color: '#6b7280', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0 }}>
                      {t.logoInfo}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                    {t.primaryColor}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        width: '42px',
                        height: '42px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: styles.inputBackground,
                        border: styles.inputBorder,
                        borderRadius: '8px',
                        color: styles.inputText,
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                    {t.secondaryColor}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      style={{
                        width: '42px',
                        height: '42px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: styles.inputBackground,
                        border: styles.inputBorder,
                        borderRadius: '8px',
                        color: styles.inputText,
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="color-preset-btn"
                    onClick={() => {
                      setPrimaryColor(preset.primary);
                      setSecondaryColor(preset.secondary);
                    }}
                    style={{
                      background: '#1f2937',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}
                  >
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                    }} />
                    {preset.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.themeMode}
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className={themeMode === 'dark' ? '' : 'theme-mode-btn-unselected'}
                    onClick={() => setThemeMode('dark')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: themeMode === 'dark' ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` : '#111827',
                      border: themeMode === 'dark' ? `1px solid ${primaryColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: themeMode === 'dark' ? (isLight ? '#0f172a' : '#ffffff') : '#9ca3af',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t.themeDark}
                  </button>
                  <button
                    type="button"
                    className={themeMode === 'light' ? '' : 'theme-mode-btn-unselected'}
                    onClick={() => setThemeMode('light')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: themeMode === 'light' ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` : '#111827',
                      border: themeMode === 'light' ? `1px solid ${primaryColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: themeMode === 'light' ? (isLight ? '#0f172a' : '#ffffff') : '#9ca3af',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {t.themeLight}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.logoHeightLabel} ({logoHeight}px)
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={logoHeight}
                  onChange={(e) => setLogoHeight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: primaryColor,
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: DATABASE CONFIGURATION */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.dbType}
                </label>
                <select
                  value={dbType}
                  onChange={(e) => {
                    setDbType(e.target.value as DatabaseType);
                    setTestResult(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="local_storage">{t.dbLocal}</option>
                  <option value="mysql">MySQL / MariaDB</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mssql">Microsoft SQL Server (MSSQL)</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              {dbType !== 'local_storage' && (
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                    {t.dbConnString}
                  </label>
                  <input
                    type="text"
                    value={dbConnectionString}
                    onChange={(e) => {
                      setDbConnectionString(e.target.value);
                      setTestResult(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1f2937',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    placeholder={
                      dbType === 'mysql' ? 'mysql://root:sifre@127.0.0.1:3306/vpass_db' :
                      dbType === 'postgresql' ? 'postgresql://postgres:sifre@127.0.0.1:5432/vpass_db' :
                      dbType === 'mssql' ? 'Server=127.0.0.1,1433;Database=vpass_db;User Id=sa;Password=sifre;' :
                      'mongodb+srv://user:sifre@cluster0.abcde.mongodb.net/vpass_db'
                    }
                  />
                  
                  {/* Test Connection Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingDb || !dbConnectionString}
                      style={{
                        background: 'transparent',
                        color: primaryColor,
                        border: `1px solid ${primaryColor}`,
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: !dbConnectionString ? 0.5 : 1
                      }}
                    >
                      {testingDb ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                      {testingDb ? t.dbTesting : t.dbTestBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* DB Connection Test Results */}
              {testResult && (
                <div style={{
                  background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: testResult.success ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.825rem',
                  color: testResult.success ? '#34d399' : '#f87171',
                  marginTop: '0.25rem'
                }}>
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ADMINISTRATOR ACCOUNT */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                    {t.firstName}
                  </label>
                  <input
                    type="text"
                    value={adminUser.firstName}
                    onChange={(e) => setAdminUser({ ...adminUser, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1f2937',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    placeholder="Süper"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                    {t.lastName}
                  </label>
                  <input
                    type="text"
                    value={adminUser.lastName}
                    onChange={(e) => setAdminUser({ ...adminUser, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: '#1f2937',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    placeholder="Yönetici"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.email}
                </label>
                <input
                  type="email"
                  value={adminUser.email}
                  onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  placeholder="admin@sirket.com"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.username}
                </label>
                <input
                  type="text"
                  value={adminUser.username}
                  onChange={(e) => setAdminUser({ ...adminUser, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  placeholder="superadmin"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#d1d5db' }}>
                  {t.password}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminUser.password}
                    onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 1rem',
                      background: '#1f2937',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    placeholder={t.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & CONFIRMATION */}
          {step === 4 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{t.summaryTitle}</h3>
              
              <div className="summary-box" style={{
                background: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="summary-label" style={{ color: '#9ca3af' }}>{t.summaryApp}</span>
                  <span style={{ fontWeight: 600 }}>{appName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="summary-label" style={{ color: '#9ca3af' }}>{t.summarySystemCode}</span>
                  <span style={{ fontWeight: 600 }}>{systemCompanyCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="summary-label" style={{ color: '#9ca3af' }}>{t.summaryTheme}</span>
                  <span style={{ fontWeight: 600 }}>
                    {themeMode === 'dark' ? t.themeDark : t.themeLight}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="summary-label" style={{ color: '#9ca3af' }}>{t.summaryDbType}</span>
                  <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                    {dbType === 'local_storage' ? t.summaryDbLocalVal : dbType}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span className="summary-label" style={{ color: '#9ca3af' }}>{t.summaryAdmin}</span>
                  <span style={{ fontWeight: 600 }}>{adminUser.firstName} {adminUser.lastName} ({adminUser.username})</span>
                </div>
              </div>

              <div className="summary-label" style={{
                background: `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}08)`,
                border: `1px dashed ${primaryColor}30`,
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.825rem',
                color: '#9ca3af',
                lineHeight: '1.4'
              }}>
                {t.summaryInfo}
              </div>
            </div>
          )}
        </div>

        {/* BUTTON FOOTER */}
        <div className="footer-divider" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1.5rem'
        }}>
          {step > 1 ? (
            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(step - 1)}
              disabled={installing}
              style={{
                background: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f3f4f6',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                opacity: installing ? 0.5 : 1
              }}
            >
              <ArrowLeft size={16} /> {t.backBtn}
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && (!appName || !systemCompanyCode)) {
                  setErrorMsg(t.errorRequired);
                  return;
                }
                if (step === 2 && dbType !== 'local_storage' && !dbConnectionString) {
                  setErrorMsg(t.errorDbRequired);
                  return;
                }
                if (step === 2 && dbType !== 'local_storage' && testResult?.success !== true) {
                  if (!window.confirm(t.dbConnWarn)) {
                    return;
                  }
                }
                if (step === 3 && (!adminUser.firstName || !adminUser.lastName || !adminUser.username || !adminUser.password)) {
                  setErrorMsg(t.errorRequired);
                  return;
                }
                setErrorMsg('');
                setStep(step + 1);
              }}
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: `0 4px 15px ${primaryColor}30`,
                transition: 'all 0.2s ease'
              }}
            >
              {t.nextBtn} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 2rem',
                fontWeight: 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: `0 4px 20px ${primaryColor}40`,
                transition: 'all 0.2s ease',
                opacity: installing ? 0.7 : 1
              }}
            >
              {installing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {installing ? t.installingBtn : t.installBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
