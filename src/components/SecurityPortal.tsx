import React, { useState, useEffect } from 'react';
import type { Visitor, SecurityLog } from '../utils/types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Shield, Camera, AlertCircle, CheckCircle, XCircle, History, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { useLanguage, getLocale } from '../utils/LanguageContext';
import { getApiRoot } from '../utils/apiConfig';

interface SecurityPortalProps {
  visitors: Visitor[];
  logs: SecurityLog[];
  onCheckIn: (visitorId: string, guardName: string) => void;
  onCheckOut: (visitorId: string, guardName: string) => void;
}

export const SecurityPortal: React.FC<SecurityPortalProps> = ({
  visitors,
  logs,
  onCheckIn,
  onCheckOut,
}) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'scan' | 'logs'>('scan');
  
  // Camera Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Scanned Visitor details
  const [scannedVisitor, setScannedVisitor] = useState<Visitor | null>(null);

  // Active Work Permits list for verification
  const [permits, setPermits] = useState<any[]>([]);

  // Fetch all permits to check worker permits in real-time
  const fetchPermits = async () => {
    try {
      const res = await fetch(`${getApiRoot()}/work-permits`);
      if (res.ok) {
        const data = await res.json();
        setPermits(data);
      }
      } catch (e) {
        // Error fetching permits for gate control
    }
  };

  useEffect(() => {
    fetchPermits();
  }, [visitors, scanResult]);

  // Check if worker has active work permit
  const getWorkerActivePermit = (workerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return permits.find(p => 
      p.status === 'APPROVED' && 
      p.assignedWorkers.includes(workerId) &&
      today >= p.startDate && today <= p.endDate
    );
  };

  // Initialize camera scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (cameraActive && activeTab === 'scan' && !scanResult) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          setCameraActive(false);
          if (scanner) {
            scanner.clear().catch(() => {});
          }
        },
        (_error) => {
          // Silent scan errors
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [cameraActive, activeTab, scanResult]);

  // Process Scan Result
  useEffect(() => {
    if (scanResult) {
      const visitorId = scanResult.split('-')[0] + '-' + scanResult.split('-')[1];
      const matched = visitors.find(v => v.id === visitorId || v.id === scanResult);
      if (matched) {
        setScannedVisitor(matched);
      } else {
        setScannedVisitor(null);
      }
    } else {
      setScannedVisitor(null);
    }
  }, [scanResult, visitors]);

  // Gate Check-in / Check-out handling with rules
  const handleAction = () => {
    if (!scannedVisitor) return;
    
    const guardName = "Mehmet Demir (Baş Güvenlik)";
    const isWorker = scannedVisitor.entryType === 'Çalışma';

    // 1. CHECK-IN RULES
    if (scannedVisitor.status === 'APPROVED' || scannedVisitor.status === 'CHECKED_OUT') {
      // Rule A: Checked out individual visitor CANNOT enter again
      if (!isWorker && scannedVisitor.status === 'CHECKED_OUT') {
        alert(`${t.secEntryDeniedSingle}`);
        return;
      }

      // Rule B: Contractor workers MUST have an active approved work permit
      if (isWorker) {
        const activePermit = getWorkerActivePermit(scannedVisitor.id);
        if (!activePermit) {
          alert(`${t.secEntryDeniedNoPermit}`);
          return;
        }
      }

      onCheckIn(scannedVisitor.id, guardName);
      alert(`${scannedVisitor.firstName} ${scannedVisitor.lastName} ${t.secCheckInSuccess}`);
      resetScanner();
    } 
    // 2. CHECK-OUT RULES
    else if (scannedVisitor.status === 'CHECKED_IN') {
      onCheckOut(scannedVisitor.id, guardName);
      alert(`${scannedVisitor.firstName} ${scannedVisitor.lastName} ${t.secCheckOutSuccess}`);
      resetScanner();
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannedVisitor(null);
  };

  // Helper for check-in action permission button
  const canCheckIn = () => {
    if (!scannedVisitor) return false;
    const isWorker = scannedVisitor.entryType === 'Çalışma';
    
    if (scannedVisitor.status === 'APPROVED') {
      if (isWorker) {
        return !!getWorkerActivePermit(scannedVisitor.id);
      }
      return true;
    }
    
    if (scannedVisitor.status === 'CHECKED_OUT') {
      // Only workers can re-enter
      return isWorker && !!getWorkerActivePermit(scannedVisitor.id);
    }

    return false;
  };

  const tabStyle = (tab: string) => ({
    flex: 1,
    padding: '0.9rem',
    border: 'none',
    background: activeTab === tab ? 'rgba(0,0,0,0.02)' : 'transparent',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '2.5px solid var(--primary)' : '2.5px solid transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
      
      {/* Main Container */}
      <div className="glass-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border)' }}>
          <button type="button" onClick={() => { setActiveTab('scan'); resetScanner(); }} style={tabStyle('scan')}>
            <Camera size={16} /> QR Kod Tara
          </button>
          <button type="button" onClick={() => { setActiveTab('logs'); resetScanner(); }} style={tabStyle('logs')}>
            <History size={16} /> Giriş/Çıkış Hareketleri
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'transparent' }}>
          
          {activeTab === 'scan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
              
              {/* Scanner Screen Area */}
              {!scanResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                  {cameraActive ? (
                    <div style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div id="reader" className="scanner-window" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
                        <div className="scanner-laser" />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCameraActive(false)}
                        style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                      >
                        Kamerayı Kapat
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Shield size={48} color="var(--primary)" style={{ opacity: 0.8 }} />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setCameraActive(true)}
                        style={{ width: '100%', minWidth: '240px', fontSize: '0.95rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Camera size={18} /> Kamerayı Başlat
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                
                /* SCAN RESULT CONTAINER */
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                  
                  {/* Visual Result Banner */}
                  {scannedVisitor ? (
                    <>
                      {/* APPROVED / CHECKED OUT -> GREEN */}
                      {(scannedVisitor.status === 'APPROVED' || scannedVisitor.status === 'CHECKED_OUT') && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                          <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
                          <h4 style={{ color: 'var(--success)', fontSize: '1.1rem', fontWeight: 800 }}>{t.secEntryApproved}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.secDocsComplete}</span>
                        </div>
                      )}

                      {/* CHECKED_IN -> GREEN (For checkout) */}
                      {scannedVisitor.status === 'CHECKED_IN' && (
                        <div style={{ background: 'rgba(0, 210, 255, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                          <CheckCircle size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem auto' }} />
                          <h4 style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>{t.secVisitorInside}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.secCheckoutAvailable}</span>
                        </div>
                      )}

                      {/* PENDING_DOCS / PENDING_APPROVAL -> YELLOW */}
                      {(scannedVisitor.status === 'PENDING_DOCS' || scannedVisitor.status === 'PENDING_APPROVAL') && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                          <AlertCircle size={36} color="var(--warning)" style={{ margin: '0 auto 0.5rem auto' }} />
                          <h4 style={{ color: 'var(--warning)', fontSize: '1.1rem', fontWeight: 800 }}>GEÇİŞ YETERSİZ</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {scannedVisitor.status === 'PENDING_APPROVAL' ? 'İSG Uzmanı Onayı Bekleniyor' : 'Eksik Evrak veya Eğitim'}
                          </span>
                        </div>
                      )}

                      {/* REJECTED -> RED */}
                      {scannedVisitor.status === 'REJECTED' && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                          <XCircle size={36} color="var(--danger)" style={{ margin: '0 auto 0.5rem auto' }} />
                          <h4 style={{ color: 'var(--danger)', fontSize: '1.1rem', fontWeight: 800 }}>GİRİŞ REDDEDİLDİ</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evrak Red Nedeniyle Kart İptal Edilmiştir</span>
                        </div>
                      )}

                      {/* WORK PERMIT STATUS FOR WORKERS */}
                      {scannedVisitor.entryType === 'Çalışma' && (
                        <div style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: getWorkerActivePermit(scannedVisitor.id) ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                          border: `1px solid ${getWorkerActivePermit(scannedVisitor.id) ? 'var(--success)' : 'var(--danger)'}`,
                          fontSize: '0.85rem',
                          textAlign: 'center'
                        }}>
                          {getWorkerActivePermit(scannedVisitor.id) ? (
                            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                              🟩 AKTİF İŞ İZNİ ONAYLI: {getWorkerActivePermit(scannedVisitor.id)?.workType} ({getWorkerActivePermit(scannedVisitor.id)?.location})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                              🟥 DİKKAT: BU ÇALIŞANIN ONAYLI AKTİF BİR İŞ İZNİ BULUNAMADI!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Visitor Info Details */}
                      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Kişi Bilgisi:</span>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{scannedVisitor.firstName} {scannedVisitor.lastName}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Firma:</span>
                            <div style={{ fontWeight: 600 }}>{scannedVisitor.company}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Giriş Amacı / Tipi:</span>
                            <div style={{ fontWeight: 600 }}>{scannedVisitor.entryType === 'Çalışma' ? 'Taşeron Çalışan' : 'Bireysel Ziyaretçi'}</div>
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Ziyaret Edilen Yetkili:</span>
                          <div>{scannedVisitor.hostName} ({scannedVisitor.department})</div>
                        </div>
                        
                        {/* Compliance Statuses */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>İSG Sınav Durumu:</span>
                            <strong style={{ color: scannedVisitor.quizCompleted ? 'var(--success)' : 'var(--danger)' }}>
                              {scannedVisitor.quizCompleted ? 'BAŞARILI' : 'BAŞARISIZ / GİRİLMEDİ'}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Evrak Onay Durumu:</span>
                            <strong style={{ color: scannedVisitor.status === 'APPROVED' || scannedVisitor.status === 'CHECKED_IN' || scannedVisitor.status === 'CHECKED_OUT' ? 'var(--success)' : 'var(--danger)' }}>
                              {scannedVisitor.status === 'APPROVED' || scannedVisitor.status === 'CHECKED_IN' || scannedVisitor.status === 'CHECKED_OUT' ? 'ONAYLI' : 'ONAYSIZ / EKSİK'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={resetScanner} style={{ flex: 1, fontSize: '0.85rem', padding: '0.65rem' }}>
                          <RefreshCw size={14} /> Yeni Tarama
                        </button>

                        {scannedVisitor.status === 'CHECKED_IN' ? (
                          <button type="button" className="btn btn-danger" onClick={handleAction} style={{ flex: 2, fontSize: '0.85rem', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <LogOut size={16} /> Çıkış Yap
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleAction}
                            disabled={!canCheckIn()}
                            style={{ flex: 2, fontSize: '0.85rem', padding: '0.65rem', opacity: canCheckIn() ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <LogIn size={16} /> Giriş Yap
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                      <XCircle size={44} />
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Geçersiz Barkod</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Sistemde bu barkod/QR kod verisine karşılık gelen bir kayıt bulunamadı.
                        </p>
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={resetScanner} style={{ width: '100%', maxWidth: '200px', fontSize: '0.85rem' }}>Tekrar Dene</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.25rem', fontWeight: 700 }}>{t.secMovementLog}</h4>
              {logs.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t.secNoMovement}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[...logs].reverse().slice(0, 15).map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.01)', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.visitorName}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({log.company})</span>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.75rem' }}>{t.secGuard}: {log.guardName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: log.action === 'IN' ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem' }}>
                          {log.action === 'IN' ? t.secActionIn : t.secActionOut}
                        </span>
                        <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
