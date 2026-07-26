import React from 'react';
import { LogOut } from 'lucide-react';
import { SafeFlowLogo } from './SafeFlowLogo';
import type { TenantConfig } from '../utils/types';

interface AppHeaderProps {
  config: TenantConfig;
  currentUser: { username: string; displayName: string; role: string; department: string };
  onLogout: () => void;
  lang: 'tr' | 'en' | 'es';
  onSetLang: (lang: 'tr' | 'en' | 'es') => void;
}

const getRoleBadge = (role: string, lang: 'tr' | 'en' | 'es') => {
  const tr: Record<string, string> = {
    department: 'Departman',
    admin: 'Sekreterya / İdari İşler',
    isg: 'İSG Uzmanı',
    security: 'Güvenlik',
    super_admin: 'Süper Yönetici',
    contractor: 'Taşeron Firma',
    visitor: 'Ziyaretçi',
  };
  const en: Record<string, string> = {
    department: 'Department',
    admin: 'Secretariat / Admin',
    isg: 'OHS Specialist',
    security: 'Security',
    super_admin: 'Super Admin',
    contractor: 'Contractor',
    visitor: 'Visitor',
  };
  const es: Record<string, string> = {
    department: 'Departamento',
    admin: 'Secretaría / Administración',
    isg: 'Especialista en SST',
    security: 'Seguridad',
    super_admin: 'Súper Admin',
    contractor: 'Contratista',
    visitor: 'Visitante',
  };

  const labels = lang === 'es' ? es : lang === 'en' ? en : tr;
  const colors: Record<string, string> = {
    department: '#3b82f6',
    admin: '#8b5cf6',
    isg: '#f59e0b',
    security: '#10b981',
    super_admin: '#ef4444',
    contractor: '#06b6d4',
    visitor: '#ec4899',
  };

  return {
    label: labels[role] || role,
    color: colors[role] || '#6b7280'
  };
};

export const AppHeader: React.FC<AppHeaderProps> = ({ config, currentUser, onLogout, lang, onSetLang }) => {
  const badge = getRoleBadge(currentUser.role, lang);

  const getTagline = () => {
    if (lang === 'en') return 'Facility Entry & OHS';
    if (lang === 'es') return 'Entrada y SST';
    return 'Tesis Giriş & İSG';
  };

  const getLogoutLabel = () => {
    if (lang === 'en') return 'Logout';
    if (lang === 'es') return 'Salir';
    return 'Çıkış';
  };

  const getLogoutTitle = () => {
    if (lang === 'en') return 'Log Out';
    if (lang === 'es') return 'Cerrar Sesión';
    return 'Çıkış Yap';
  };

  return (
    <header className="app-header">
      {/* Left: Brand */}
      <div className="app-header-brand">
        <div 
          className="app-header-logo"
          style={{
            background: 'none',
            boxShadow: 'none',
            width: 'auto',
            height: `${config.logoHeight || 30}px`,
            maxWidth: '180px',
            borderRadius: 0,
            overflow: 'visible',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {config.logoUrl && config.logoUrl !== '/logo.png' ? (
            <img
              src={config.logoUrl}
              alt="Logo"
              style={{ height: '100%', width: 'auto', objectFit: 'contain', maxHeight: '100%' }}
            />
          ) : (
            <SafeFlowLogo size={30} />
          )}
        </div>
        <div className="app-header-titles">
          <h2 className="app-header-app-name">{(() => {
            const rawName = config.appName || 'SafeFlow';
            const cleanName = rawName.replace(/\b(System|Sistemi|Sistema)\b/gi, '').trim();
            if (lang === 'en') return `${cleanName} System`;
            if (lang === 'es') return `${cleanName} Sistema`;
            return `${cleanName} Sistemi`;
          })()}</h2>
          <span className="app-header-tagline">{getTagline()}</span>
        </div>
      </div>

      {/* Center: Role Badge (hidden on very small screens) */}
      <div className="app-header-role-badge" style={{ '--badge-color': badge.color } as React.CSSProperties}>
        {badge.label}
      </div>

      {/* Right: User Info + Actions */}
      <div className="app-header-actions">
        <div className="app-header-user-info">
          <span className="app-header-user-name">{currentUser.displayName}</span>
          <span className="app-header-user-dept">{currentUser.department}</span>
        </div>

        {/* Language Selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginRight: '8px' }}>
          <button
            onClick={() => onSetLang('tr')}
            style={{
              background: lang === 'tr' ? 'var(--primary)' : 'transparent',
              color: lang === 'tr' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Türkçe"
          >
            TR
          </button>
          <button
            onClick={() => onSetLang('en')}
            style={{
              background: lang === 'en' ? 'var(--primary)' : 'transparent',
              color: lang === 'en' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => onSetLang('es')}
            style={{
              background: lang === 'es' ? 'var(--primary)' : 'transparent',
              color: lang === 'es' ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Español"
          >
            ES
          </button>
        </div>

        <button
          className="app-header-btn app-header-btn-logout"
          onClick={onLogout}
          title={getLogoutTitle()}
        >
          <LogOut size={14} />
          <span className="app-header-btn-label">{getLogoutLabel()}</span>
        </button>
      </div>
    </header>
  );
};
