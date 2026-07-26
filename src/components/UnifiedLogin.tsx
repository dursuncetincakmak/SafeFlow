import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, User, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { SafeFlowLogo } from './SafeFlowLogo';
import type { TenantConfig } from '../utils/types';
import { useLanguage } from '../utils/LanguageContext';

interface UnifiedLoginProps {
  config: TenantConfig;
  onLoginSuccess: (token: string, user: { username: string; displayName: string; role: string; department: string }, extraData?: any) => void;
}

function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({ config, onLoginSuccess }) => {
  const { t } = useLanguage();
  const [companyCode, setCompanyCode] = useState(config.systemCompanyCode || 'SAFEFLOW');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronize companyCode when config loads
  useEffect(() => {
    if (config.systemCompanyCode) {
      setCompanyCode(config.systemCompanyCode);
    }
  }, [config.systemCompanyCode]);

  // Dynamic branding variables based on typed companyCode
  const enteredCode = companyCode.trim().toUpperCase();

  // Dynamic branding variables based on typed companyCode
  const matchedCompany = (config.companies || []).find(
    c => c.code.toUpperCase() === enteredCode
  );

  const activeLogoUrl = matchedCompany?.logoUrl || config.logoUrl || '/logo.png';
  const activeAppName = matchedCompany?.name || config.appName || 'SafeFlow';
  const activeLogoHeight = matchedCompany?.logoHeight || config.logoHeight || 40;

  // Apply matched company theme dynamically during login
  useEffect(() => {
    document.title = `${activeAppName} - Tesis Giriş & İSG Yönetim Sistemi`;
    const root = document.documentElement;
    if (matchedCompany) {
      root.style.setProperty('--primary', matchedCompany.primaryColor);
      root.style.setProperty(
        '--primary-gradient',
        `linear-gradient(135deg, ${matchedCompany.primaryColor} 0%, ${matchedCompany.secondaryColor} 100%)`
      );
      root.style.setProperty('--primary-glow', hexToRgba(matchedCompany.primaryColor, 0.15));

      if (matchedCompany.themeMode === 'light') {
        root.classList.add('light-theme');
      } else {
        root.classList.remove('light-theme');
      }
    } else {
      root.style.setProperty('--primary', config.primaryColor);
      root.style.setProperty(
        '--primary-gradient',
        `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`
      );
      root.style.setProperty('--primary-glow', hexToRgba(config.primaryColor, 0.15));

      if (config.themeMode === 'light') {
        root.classList.add('light-theme');
      } else {
        root.classList.remove('light-theme');
      }
    }
  }, [companyCode, config, matchedCompany, activeAppName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim() || !username.trim() || !password.trim()) {
      setError(t.loginError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiRoot = config.dbConnectionString?.startsWith('http') ? config.dbConnectionString : 'http://localhost:5000/api';

      const response = await fetch(`${apiRoot}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCode: companyCode.trim(), username: username.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız.');
      }

      onLoginSuccess(data.token, data.user, {
        companyData: data.companyData,
        visitorData: data.visitorData,
        companyConfig: data.companyConfig
      });
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background animated shapes */}
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1" />
        <div className="login-shape login-shape-2" />
        <div className="login-shape login-shape-3" />
      </div>

      <div className="login-container">
        {/* Logo & Brand */}
        <div className="login-brand">
          <div
            className="login-logo-circle"
            style={{
              background: 'none',
              boxShadow: 'none',
              borderRadius: 0,
              width: 'auto',
              height: `${(activeLogoHeight) * 1.5}px`,
              maxWidth: '220px',
              overflow: 'visible',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {activeLogoUrl && activeLogoUrl !== '/logo.png' ? (
              <img
                src={activeLogoUrl}
                alt="Logo"
                style={{ height: '100%', width: 'auto', objectFit: 'contain', maxHeight: '100%' }}
              />
            ) : (
              <SafeFlowLogo size={54} />
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">

          <div className="login-field">
            <label className="login-label">{t.loginUsername}</label>
            <div className="login-input-wrapper">
              <User size={18} className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder={t.loginUsernamePlaceholder}
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">{t.loginPassword}</label>
            <div className="login-input-wrapper">
              <KeyRound size={18} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                {t.loginButton} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = window.location.pathname + '?setup=true';
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              opacity: 0.8
            }}
          >
            ⚙️ Sıfırdan Kurulum Sihirbazı'nı Aç (Setup Wizard)
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} style={{ color: 'var(--primary)' }} />
            <span>{activeAppName} System v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
