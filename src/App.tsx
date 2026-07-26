import { useState, useEffect } from 'react';
import type { Visitor, SecurityLog, DocumentType, TenantConfig, ContractorCompany } from './utils/types';
import { getDatabaseAdapter } from './utils/dbAdapter';
import { UnifiedLogin } from './components/UnifiedLogin';
import { AppHeader } from './components/AppHeader';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { VisitorPortal } from './components/VisitorPortal';
import { SecurityPortal } from './components/SecurityPortal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ContractorPortal } from './components/ContractorPortal';
import { OHSSpecialistDashboard } from './components/OHSSpecialistDashboard';
import { SetupWizard } from './components/SetupWizard';
import { Shield, RefreshCw } from 'lucide-react';
import { i18n } from './utils/i18n';
import { useLanguage, getLocale } from './utils/LanguageContext';

type AppRole = 'department' | 'admin' | 'visitor' | 'security' | 'super_admin' | 'contractor' | 'isg';

const DEFAULT_CONFIG: TenantConfig = {
  appName: 'SafeFlow',
  logoUrl: '/logo.png',
  primaryColor: '#00d2ff',
  secondaryColor: '#0066ff',
  dbType: 'local_storage',
  dbConnectionString: '',
  logoHeight: 40,
  themeMode: 'dark',
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

// Utility function to convert Hex to RGBA for CSS variables
function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Global fetch interceptor for multi-tenant headers
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const urlString = typeof input === 'string' ? input : (input as any).url || '';
  if (urlString.includes('/config') || urlString.includes('/install')) {
    return originalFetch(input, init);
  }

  const getCompanyHeader = () => {
    const activeCompany = localStorage.getItem('vpass_active_company_config');
    if (activeCompany) {
      try {
        const parsed = JSON.parse(activeCompany);
        if (parsed && parsed.code) {
          return parsed.code.toUpperCase();
        }
      } catch (e) {}
    }
    const token = localStorage.getItem('vpass_ad_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        if (decoded && decoded.companyCode) {
          return decoded.companyCode.toUpperCase();
        }
      } catch (e) {}
    }
    return 'SAFEFLOW';
  };

  const headers = new Headers(init?.headers || {});
  if (!headers.has('X-Company-Code')) {
    headers.set('X-Company-Code', getCompanyHeader());
  }

  const token = localStorage.getItem('vpass_ad_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return originalFetch(input, {
    ...init,
    headers
  });
};

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<AppRole>('department');
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName: string; role: string; department: string; companyCode?: string } | null>(null);
  const [activeContractorCompany, setActiveContractorCompany] = useState<ContractorCompany | null>(null);

  // White-Label Configuration State
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(DEFAULT_CONFIG);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  
  // Application Data States
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const { lang, setLang } = useLanguage();


  // Get active tenant configuration
  const getActiveThemeConfig = (): TenantConfig => {
    const activeCompany = localStorage.getItem('vpass_active_company_config');
    const savedToken = localStorage.getItem('vpass_ad_token');
    if (savedToken && activeCompany) {
      try {
        const comp = JSON.parse(activeCompany);
        return {
          appName: comp.name,
          logoUrl: comp.logoUrl || tenantConfig.logoUrl,
          logoHeight: comp.logoHeight || tenantConfig.logoHeight,
          themeMode: comp.themeMode || tenantConfig.themeMode,
          primaryColor: comp.primaryColor,
          secondaryColor: comp.secondaryColor,
          dbType: tenantConfig.dbType,
          dbConnectionString: tenantConfig.dbConnectionString,
          departments: comp.departments || tenantConfig.departments,
          trainingVideos: comp.trainingVideos || tenantConfig.trainingVideos,
          companies: tenantConfig.companies
        };
      } catch (e) {
        // Error parsing active company config
      }
    }
    return tenantConfig;
  };

  const currentConfig = getActiveThemeConfig();

  // Dynamically update browser tab title
  useEffect(() => {
    document.title = `${currentConfig.appName} - Tesis Giriş & İSG Yönetim Sistemi`;
  }, [currentConfig.appName]);

  // Check Installation status on boot
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const apiHost = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        const response = await fetch(`${apiHost}/api/config?_cb=${Date.now()}`);
        if (response.ok) {
          const config = await response.json();
          if (config.isInstalled === false) {
            setIsInstalled(false);
          } else {
            setIsInstalled(true);
            setTenantConfig(config);
            applyTheme(config);
          }
        } else {
          setIsInstalled(false);
        }
      } catch (err) {
        setIsInstalled(false);
      }
    };
    checkInstallation();
  }, []);

  // Restore session on boot
  useEffect(() => {
    const savedConfig = localStorage.getItem('vpass_tenant_config');
    const activeCompany = localStorage.getItem('vpass_active_company_config');
    
    let configToApply = DEFAULT_CONFIG;
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as TenantConfig;
        if (!parsed.logoUrl || parsed.logoUrl === '') {
          parsed.logoUrl = '/logo.png';
          localStorage.setItem('vpass_tenant_config', JSON.stringify(parsed));
        }

        // Migrate company logos if they are missing
        if (parsed.companies) {
          let updated = false;
          parsed.companies = parsed.companies.map(c => {
            const defaultCompany = DEFAULT_CONFIG.companies?.find(dc => dc.code === c.code);
            if (defaultCompany && !c.logoUrl) {
              c.logoUrl = defaultCompany.logoUrl;
              updated = true;
            }
            return c;
          });
          if (updated) {
            localStorage.setItem('vpass_tenant_config', JSON.stringify(parsed));
          }
        }

        configToApply = parsed;
      } catch (e) {
        configToApply = DEFAULT_CONFIG;
      }
      setTenantConfig(configToApply);
    } else {
      localStorage.setItem('vpass_tenant_config', JSON.stringify(DEFAULT_CONFIG));
    }

    const savedToken = localStorage.getItem('vpass_ad_token');
    let isUserLoggedIn = false;
    if (savedToken) {
      try {
        const base64Url = savedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        setCurrentUser({
          username: decoded.username,
          displayName: decoded.displayName,
          role: decoded.role,
          department: decoded.department,
          companyCode: decoded.companyCode
        });
        setCurrentRole(decoded.role as AppRole);
        setIsAuthenticated(true);
        isUserLoggedIn = true;

        // Restore contractor data if applicable
        const savedContractor = localStorage.getItem('vpass_contractor_data');
        if (decoded.role === 'contractor' && savedContractor) {
          setActiveContractorCompany(JSON.parse(savedContractor));
        }
      } catch (err) {
        // Session restore failed
        localStorage.removeItem('vpass_ad_token');
        localStorage.removeItem('vpass_contractor_data');
      }
    }

    if (isUserLoggedIn && activeCompany) {
      try {
        const comp = JSON.parse(activeCompany);
        applyTheme(comp);
      } catch (e) {
        applyTheme(configToApply);
      }
    } else {
      applyTheme(configToApply);
    }
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (token: string, user: any, extraData?: any) => {
    setCurrentUser(user);
    setCurrentRole(user.role as AppRole);
    setIsAuthenticated(true);
    localStorage.setItem('vpass_ad_token', token);

    if (extraData) {
      if (extraData.companyData) {
        setActiveContractorCompany(extraData.companyData);
        localStorage.setItem('vpass_contractor_data', JSON.stringify(extraData.companyData));
      }
      if (extraData.companyConfig) {
        localStorage.setItem('vpass_active_company_config', JSON.stringify(extraData.companyConfig));
        applyTheme(extraData.companyConfig);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveContractorCompany(null);
    localStorage.removeItem('vpass_ad_token');
    localStorage.removeItem('vpass_contractor_data');
    localStorage.removeItem('vpass_active_company_config');
    setCurrentRole('department');
    // Reset to default theme
    applyTheme(tenantConfig);
  };

  // 2. Data Load: Fetch visitors and logs
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        const adapter = getDatabaseAdapter(tenantConfig.dbType, tenantConfig.dbConnectionString);
        const loadedVisitors = await adapter.getVisitors();
        const loadedLogs = await adapter.getLogs();
        setVisitors(loadedVisitors);
        setSecurityLogs(loadedLogs);
      } catch (err) {
        // Database connection/load error
      }
    };
    loadDatabaseData();
  }, [tenantConfig.dbType, tenantConfig.dbConnectionString]);

  // Apply Theme styling dynamically
  const applyTheme = (config: TenantConfig) => {
    try {
      document.documentElement.style.setProperty('--primary', config.primaryColor);
      document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`);
      document.documentElement.style.setProperty('--primary-glow', hexToRgba(config.primaryColor, 0.15));
      
      if (config.themeMode === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      // Failed to apply theme settings
    }
  };

  // Save changes to state & active Database adapter
  const saveState = async (updatedVisitors: Visitor[], updatedLogs?: SecurityLog[]) => {
    setVisitors(updatedVisitors);
    
    try {
      const adapter = getDatabaseAdapter(tenantConfig.dbType, tenantConfig.dbConnectionString);
      await adapter.saveVisitors(updatedVisitors);
      
      if (updatedLogs) {
        setSecurityLogs(updatedLogs);
        await adapter.saveLogs(updatedLogs);
      }
    } catch (err) {
      // Failed to save state to adapter
    }
  };

  // Update System Settings (SaaS Customization)
  const handleSaveTenantConfig = async (newConfig: TenantConfig) => {
    try {
      const response = await fetch('http://localhost:5000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setTenantConfig(newConfig);
        localStorage.setItem('vpass_tenant_config', JSON.stringify(newConfig));
        applyTheme(newConfig);
      } else {
        const errorData = await response.json();
        alert(`Ayarlar sunucuya kaydedilemedi: ${errorData.error}`);
      }
    } catch (err) {
      // Failed to save tenant config to backend
      // Fallback local storage update
      setTenantConfig(newConfig);
      localStorage.setItem('vpass_tenant_config', JSON.stringify(newConfig));
      applyTheme(newConfig);
    }
  };


  // 1. Department Action: Add New Visitor Invitation
  const handleAddVisitor = (visitorData: {
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
    requiredDocs: DocumentType[];
    trainingId: string;
  }) => {
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const newId = `VIS-${randCode}`;

    const newVisitor: Visitor = {
      ...visitorData,
      id: newId,
      status: 'PENDING_DOCS',
      uploadedDocs: [],
      trainingWatched: false,
      quizCompleted: false,
      createdAt: new Date().toISOString(),
      tenantCompanyCode: currentUser?.companyCode || 'KARTON'
    };

    const updated = [newVisitor, ...visitors];
    saveState(updated);
  };

  // Helper: Recalculate visitor status based on docs/training
  const checkAndUpdateVisitorOnboardingStatus = (visitor: Visitor): 'PENDING_DOCS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' => {
    const hasAllDocsUploaded = visitor.requiredDocs.every(reqDoc => 
      visitor.uploadedDocs.some(upDoc => upDoc.type === reqDoc && upDoc.status !== 'REJECTED')
    );
    
    const isTrainingDone = visitor.trainingWatched && visitor.quizCompleted;
    const hasRejectedDoc = visitor.uploadedDocs.some(d => d.status === 'REJECTED');
    
    if (hasRejectedDoc) {
      return 'REJECTED';
    }

    if (hasAllDocsUploaded && isTrainingDone) {
      return 'PENDING_APPROVAL';
    }

    return 'PENDING_DOCS';
  };

  // 2. Visitor Action: Upload Documents
  const handleUploadDocs = (visitorId: string, docsToUpload: { type: DocumentType; name: string }[]) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        let newUploadedDocs = [...v.uploadedDocs];
        
        docsToUpload.forEach(newDoc => {
          newUploadedDocs = newUploadedDocs.filter(d => d.type !== newDoc.type);
          newUploadedDocs.push({
            type: newDoc.type,
            name: newDoc.name,
            status: 'PENDING',
            uploadedAt: new Date().toISOString(),
            fileUrl: `MOCK_FILE_${newDoc.type}_DATA`
          });
        });

        const tempVisitor = { ...v, uploadedDocs: newUploadedDocs };
        const newStatus = checkAndUpdateVisitorOnboardingStatus(tempVisitor);

        return {
          ...tempVisitor,
          status: newStatus
        };
      }
      return v;
    });

    saveState(updated);
  };

  // 3. Visitor Action: Complete Training & Quiz
  const handleCompleteTraining = (visitorId: string, score: number) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        const tempVisitor = {
          ...v,
          trainingWatched: true,
          quizCompleted: true,
          quizScore: score
        };
        const newStatus = checkAndUpdateVisitorOnboardingStatus(tempVisitor);

        return {
          ...tempVisitor,
          status: newStatus
        };
      }
      return v;
    });

    saveState(updated);
  };

  // 4. Admin Action: Approve/Reject Document Individually
  const handleApproveDocument = (visitorId: string, docType: DocumentType) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        const updatedDocs = v.uploadedDocs.map(d => {
          if (d.type === docType) {
            return { ...d, status: 'APPROVED' as const, rejectReason: undefined };
          }
          return d;
        });

        return {
          ...v,
          uploadedDocs: updatedDocs
        };
      }
      return v;
    });

    saveState(updated);
  };

  const handleRejectDocument = (visitorId: string, docType: DocumentType, reason: string) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        const updatedDocs = v.uploadedDocs.map(d => {
          if (d.type === docType) {
            return { ...d, status: 'REJECTED' as const, rejectReason: reason };
          }
          return d;
        });

        return {
          ...v,
          uploadedDocs: updatedDocs,
          status: 'REJECTED' as const
        };
      }
      return v;
    });

    saveState(updated);
  };

  // 5. Final Approval / Rejection for Visitor (Individual and Worker)
  const handleApproveVisitor = (visitorId: string) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        if (v.entryType === 'Çalışma') {
          return {
            ...v,
            status: 'APPROVED' as const,
            qrCodeData: `QR-WORK-${v.id}-${Math.floor(1000 + Math.random() * 9000)}`,
            trainingWatched: true,
            quizCompleted: true,
            quizScore: 3,
            uploadedDocs: v.uploadedDocs.map(d => ({ ...d, status: 'APPROVED' as const }))
          };
        }
        return {
          ...v,
          status: 'APPROVED' as const,
          qrCodeData: `${v.id}-APPROVED`
        };
      }
      return v;
    });

    saveState(updated);
  };

  const handleRejectVisitor = (visitorId: string, reason: string) => {
    const updated = visitors.map(v => {
      if (v.id === visitorId) {
        const updatedDocs = v.uploadedDocs.map(d => ({
          ...d,
          status: 'REJECTED' as const,
          rejectReason: reason
        }));
        return {
          ...v,
          status: 'REJECTED' as const,
          uploadedDocs: updatedDocs,
          qrCodeData: undefined
        };
      }
      return v;
    });

    saveState(updated);
  };

  // 6. Security Action: Check In Visitor
  const handleCheckIn = (visitorId: string, guardName: string) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    const updatedVisitors = visitors.map(v => {
      if (v.id === visitorId) {
        return {
          ...v,
          status: 'CHECKED_IN' as const,
          checkInTime: new Date().toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })
        };
      }
      return v;
    });

    const newLog: SecurityLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      visitorId,
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      company: visitor.company,
      action: 'IN',
      timestamp: new Date().toISOString(),
      guardName,
      tenantCompanyCode: currentUser?.companyCode || 'KARTON'
    };

    const updatedLogs = [...securityLogs, newLog];
    saveState(updatedVisitors, updatedLogs);
  };

  // 7. Security Action: Check Out Visitor
  const handleCheckOut = (visitorId: string, guardName: string) => {
    const visitor = visitors.find(v => v.id === visitorId);
    if (!visitor) return;

    const updatedVisitors = visitors.map(v => {
      if (v.id === visitorId) {
        return {
          ...v,
          status: 'CHECKED_OUT' as const,
          checkOutTime: new Date().toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })
        };
      }
      return v;
    });

    const newLog: SecurityLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      visitorId,
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      company: visitor.company,
      action: 'OUT',
      timestamp: new Date().toISOString(),
      guardName,
      tenantCompanyCode: currentUser?.companyCode || 'KARTON'
    };

    const updatedLogs = [...securityLogs, newLog];
    saveState(updatedVisitors, updatedLogs);
  };

  // Render correct dashboard
  const renderDashboard = () => {
    // Filter visitors and logs dynamically by active tenant company
    const filteredVisitors = visitors.filter(v => {
      if (!currentUser) return false;
      if (currentUser.role === 'super_admin') return true;
      const vTenant = v.tenantCompanyCode || 'KARTON';
      const userTenant = currentUser.companyCode || 'KARTON';
      return vTenant.toUpperCase() === userTenant.toUpperCase();
    });

    const filteredLogs = securityLogs.filter(l => {
      if (!currentUser) return false;
      if (currentUser.role === 'super_admin') return true;
      const lTenant = l.tenantCompanyCode || 'KARTON';
      const userTenant = currentUser.companyCode || 'KARTON';
      return lTenant.toUpperCase() === userTenant.toUpperCase();
    });

    switch (currentRole) {
      case 'department':
        return (
          <DepartmentDashboard
            visitors={filteredVisitors}
            onAddVisitor={handleAddVisitor}
            trainingVideos={currentConfig.trainingVideos || []}
            config={currentConfig}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            visitors={filteredVisitors}
            onApproveVisitor={handleApproveVisitor}
            onRejectVisitor={handleRejectVisitor}
            onApproveDocument={handleApproveDocument}
            onRejectDocument={handleRejectDocument}
            config={currentConfig}
          />
        );
      case 'visitor':
        return (
          <VisitorPortal
            visitors={visitors} // Needs all visitors to scan by QR code on login
            trainingVideos={currentConfig.trainingVideos || []}
            onUploadDocs={handleUploadDocs}
            onCompleteTraining={handleCompleteTraining}
            config={currentConfig}
          />
        );
      case 'security':
        return (
          <SecurityPortal
            visitors={filteredVisitors}
            logs={filteredLogs}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        );
      case 'super_admin':
        return (
          <SuperAdminDashboard
            config={tenantConfig}
            onSaveConfig={handleSaveTenantConfig}
            lang={lang}
          />
        );
      case 'contractor':
        return (
          <ContractorPortal
            config={currentConfig}
            activeCompany={activeContractorCompany}
          />
        );
      case 'isg':
        return (
          <OHSSpecialistDashboard
            config={currentConfig}
            trainingVideos={currentConfig.trainingVideos || []}
            onSaveVideos={(updatedVideos) => {
              const newConfig = { ...tenantConfig, trainingVideos: updatedVideos };
              handleSaveTenantConfig(newConfig);
            }}
            visitors={filteredVisitors}
            onApproveVisitor={handleApproveVisitor}
            onRejectVisitor={handleRejectVisitor}
          />
        );
      default:
        return <div>Rol Seçilmedi</div>;
    }
  };

  // --- INSTALLATION WIZARD RENDERING ---
  if (isInstalled === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: '#f3f4f6',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <RefreshCw size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Sistem yükleniyor...</p>
      </div>
    );
  }

  if (isInstalled === false) {
    return (
      <SetupWizard
        onInstallComplete={(newConfig) => {
          setTenantConfig(newConfig);
          localStorage.setItem('vpass_tenant_config', JSON.stringify(newConfig));
          applyTheme(newConfig);
          setIsInstalled(true);
        }}
      />
    );
  }

  // --- NOT AUTHENTICATED: Show Login ---
  if (!isAuthenticated) {
    return (
      <UnifiedLogin
        config={tenantConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // --- AUTHENTICATED: Show Dashboard ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Minimal Header */}
      {currentUser && (
        <AppHeader
          config={currentConfig}
          currentUser={currentUser}
          onLogout={handleLogout}
          lang={lang}
          onSetLang={setLang}
        />
      )}

      {/* Main Content Area */}
      <main className="app-main">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Shield size={14} color="var(--primary)" />
          <strong>{(() => {
            const rawName = currentConfig.appName || 'SafeFlow';
            const cleanName = rawName.replace(/\b(System|Sistemi|Sistema)\b/gi, '').trim();
            if (lang === 'en') return `${cleanName} System`;
            if (lang === 'es') return `${cleanName} Sistema`;
            return `${cleanName} Sistemi`;
          })()} v1.0.0</strong>
        </div>
        <span>{i18n[lang].footerText}</span>
      </footer>

    </div>
  );
}

export default App;
