import React, { useState, useEffect } from 'react';
import type { Visitor, UploadedDocument, DocumentType, TenantConfig } from '../utils/types';
import { Landmark, FileText, Check, X, ShieldCheck, Eye, Building, AlertTriangle } from 'lucide-react';
import { useLanguage, getLocale } from '../utils/LanguageContext';

interface AdminDashboardProps {
  visitors: Visitor[];
  onApproveVisitor: (id: string) => void;
  onRejectVisitor: (id: string, reason: string) => void;
  onApproveDocument: (visitorId: string, docType: DocumentType) => void;
  onRejectDocument: (visitorId: string, docType: DocumentType, reason: string) => void;
  config: TenantConfig;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  visitors,
  onApproveVisitor,
  onRejectVisitor,
  onApproveDocument,
  onRejectDocument,
  config,
}) => {
  const { lang } = useLanguage();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(visitors[1]?.id || null);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_APPROVAL');
  
  // Document Viewer Modal State
  const [activePreviewDoc, setActivePreviewDoc] = useState<{
    visitor: Visitor;
    doc: UploadedDocument;
  } | null>(null);
  
  // Rejection State
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  const [docRejectReasonText, setDocRejectReasonText] = useState('');
  const [showDocRejectForm, setShowDocRejectForm] = useState<string | null>(null);

  // Contractor Approval Tab States
  const [activeTab, setActiveTab] = useState<'individual' | 'contractors'>('individual');
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [loadingContractors, setLoadingContractors] = useState(false);
  const [contractorRejectReason, setContractorRejectReason] = useState('');
  const [showContractorRejectForm, setShowContractorRejectForm] = useState(false);

  // Fetch Contractors List
  const fetchContractors = async () => {
    setLoadingContractors(true);
    try {
      const res = await fetch('http://localhost:5000/api/contractors');
      if (res.ok) {
        const data = await res.json();
        setContractors(data);
        if (data.length > 0 && !selectedContractorId) {
          setSelectedContractorId(data[0].id);
        }
      }
    } catch (e) {
      // Error loading contractors
    } finally {
      setLoadingContractors(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contractors') {
      fetchContractors();
    }
  }, [activeTab]);

  const handleApproveContractor = async (companyId: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/contractors/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: 'APPROVED' })
      });
      if (res.ok) {
        alert('Taşeron firma başarıyla onaylandı ve aktif edildi!');
        fetchContractors();
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const handleRejectContractor = async (companyId: string) => {
    if (!contractorRejectReason.trim()) {
      alert('Lütfen bir ret nedeni giriniz.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/contractors/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: 'REJECTED', rejectReason: contractorRejectReason })
      });
      if (res.ok) {
        alert('Taşeron firma başvurusu reddedildi.');
        setContractorRejectReason('');
        setShowContractorRejectForm(false);
        fetchContractors();
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  // Subcontractor Individual Doc approvals
  const handleApproveContractorDoc = async (companyId: string, docType: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/contractors/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          status: 'PENDING_APPROVAL',
          approvedDocs: [docType]
        })
      });

      if (res.ok) {
        alert(`"${docType}" belgesi onaylandı.`);
        fetchContractors();
        setActivePreviewDoc(null);
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const handleRejectContractorDoc = async (companyId: string, docType: string, reason: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/contractors/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          status: 'REJECTED',
          rejectReason: `Belge Hatası (${docType}): ${reason}`
        })
      });

      if (res.ok) {
        alert(`"${docType}" belgesi reddedildi.`);
        fetchContractors();
        setActivePreviewDoc(null);
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const selectedContractor = contractors.find(c => c.id === selectedContractorId);
  const selectedVisitor = visitors.find(v => v.id === selectedVisitorId) || visitors[0];

  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING_APPROVAL') return v.status === 'PENDING_APPROVAL';
    if (filterStatus === 'APPROVED') return v.status === 'APPROVED' || v.status === 'CHECKED_IN';
    if (filterStatus === 'PENDING_DOCS') return v.status === 'PENDING_DOCS';
    if (filterStatus === 'REJECTED') return v.status === 'REJECTED';
    return true;
  });

  const getDocNameTurkish = (type: string) => {
    switch (type) {
      case 'ISG': return 'İSG Eğitim Sertifikası';
      case 'SGK': return 'SGK İşe Giriş Bildirgesi';
      case 'ID_COPY': return 'Kimlik Görseli / Fotokopisi';
      default: return type;
    }
  };

  // Quick stats
  const stats = {
    pendingApproval: visitors.filter(v => v.status === 'PENDING_APPROVAL').length,
    approvedToday: visitors.filter(v => v.status === 'APPROVED' || v.status === 'CHECKED_IN').length,
    rejected: visitors.filter(v => v.status === 'REJECTED').length,
    pendingDocs: visitors.filter(v => v.status === 'PENDING_DOCS').length,
  };

  // Document approval/rejection handlers inside review modal for visitors
  const handleApproveDoc = (visitorId: string, docType: DocumentType) => {
    onApproveDocument(visitorId, docType);
    if (activePreviewDoc) {
      setActivePreviewDoc({
        ...activePreviewDoc,
        doc: { ...activePreviewDoc.doc, status: 'APPROVED', rejectReason: undefined }
      });
    }
    alert(`${getDocNameTurkish(docType)} onaylandı.`);
  };

  const handleRejectDocSubmit = (visitorId: string, docType: DocumentType) => {
    if (!docRejectReasonText.trim()) {
      alert('Lütfen reddetme gerekçesini yazınız.');
      return;
    }
    onRejectDocument(visitorId, docType, docRejectReasonText);
    if (activePreviewDoc) {
      setActivePreviewDoc({
        ...activePreviewDoc,
        doc: { ...activePreviewDoc.doc, status: 'REJECTED', rejectReason: docRejectReasonText }
      });
    }
    setDocRejectReasonText('');
    setShowDocRejectForm(null);
    alert(`${getDocNameTurkish(docType)} reddedildi. Misafire bildirim iletildi.`);
  };

  // Global visitor approval
  const handleApproveVisitorSubmit = (id: string) => {
    const hasRejectedDocs = selectedVisitor.uploadedDocs.some(d => d.status === 'REJECTED');
    const hasPendingDocs = selectedVisitor.uploadedDocs.some(d => d.status === 'PENDING') || selectedVisitor.uploadedDocs.length < selectedVisitor.requiredDocs.length;
    
    if (hasRejectedDocs) {
      alert('Hata: Reddedilmiş belgelere sahip bir misafir onaylanamaz. Önce evrakların geçerli olması gerekir.');
      return;
    }
    if (hasPendingDocs) {
      alert('Hata: Henüz yüklenmemiş veya kontrol edilmemiş belgeler var. Lütfen tüm belgeleri tek tek onaylayın.');
      return;
    }
    if (!selectedVisitor.trainingWatched || !selectedVisitor.quizCompleted) {
      alert('Hata: Misafir İSG eğitimini izlememiş veya testi geçememiş.');
      return;
    }

    onApproveVisitor(id);
    alert(`${selectedVisitor.firstName} ${selectedVisitor.lastName} onaylandı. QR kodlu dijital kart oluşturulup misafire gönderildi.`);
  };

  const handleRejectVisitorSubmit = (id: string) => {
    if (!rejectReasonText.trim()) {
      alert('Lütfen reddetme gerekçesini yazınız.');
      return;
    }
    onRejectVisitor(id, rejectReasonText);
    setRejectReasonText('');
    setShowRejectForm(false);
    alert('Ziyaretçi talebi reddedildi.');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Upper Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
          {config.appName} Sekreterya ve İdari İşler Onay Paneli
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Giriş taleplerini inceleyin, misafirlerin veya taşeronların yüklediği İSG evraklarını onaylayın ve tesis geçiş izinlerini yönetin.
        </p>
      </div>

      {/* Top Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1rem', paddingBottom: '0.25rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('individual')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'individual' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'individual' ? '2px solid var(--primary)' : 'none'
          }}
        >
          Bireysel Ziyaretçiler
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contractors')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'contractors' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderBottom: activeTab === 'contractors' ? '2px solid var(--primary)' : 'none'
          }}
        >
          Taşeron Firmalar ({contractors.filter(c => c.status === 'PENDING_APPROVAL').length})
        </button>
      </div>

      {/* INDIVIDUAL VISITORS VIEW */}
      {activeTab === 'individual' && (
        <>
          {/* Admin Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Onay Bekleyen Talepler</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
                {stats.pendingApproval}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aktif/Onaylı Kartlar</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>
                {stats.approvedToday}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evrak/Eğitim Bekleyenler</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>
                {stats.pendingDocs}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reddedilen Talepler</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>
                {stats.rejected}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            alignItems: 'start'
          }} className="admin-desktop-grid">
            <style>{`
              @media(min-width: 1024px) {
                .admin-desktop-grid {
                  grid-template-columns: 340px 1fr !important;
                }
              }
            `}</style>

            {/* Left Column: Filter and Visitor List */}
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <Landmark size={18} color="var(--primary)" />
                Ziyaretçi Talepleri
              </h3>

              {/* Quick Filter tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button
                  onClick={() => setFilterStatus('PENDING_APPROVAL')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.75rem',
                    background: filterStatus === 'PENDING_APPROVAL' ? 'rgba(0, 210, 255, 0.1)' : 'var(--bg-surface-elevated)',
                    borderColor: filterStatus === 'PENDING_APPROVAL' ? 'var(--primary)' : 'var(--border)',
                    color: filterStatus === 'PENDING_APPROVAL' ? 'var(--primary)' : 'var(--text-primary)'
                  }}
                >
                  <span>Onay Bekleyenler</span>
                  <span className="badge badge-pending-approval" style={{ padding: '2px 6px' }}>{stats.pendingApproval}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('PENDING_DOCS')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.75rem',
                    background: filterStatus === 'PENDING_DOCS' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface-elevated)',
                    borderColor: filterStatus === 'PENDING_DOCS' ? 'var(--warning)' : 'var(--border)',
                    color: filterStatus === 'PENDING_DOCS' ? 'var(--warning)' : 'var(--text-primary)'
                  }}
                >
                  <span>Evrak Eksik/Eğitimde</span>
                  <span className="badge badge-pending-docs" style={{ padding: '2px 6px' }}>{stats.pendingDocs}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('APPROVED')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.75rem',
                    background: filterStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                    borderColor: filterStatus === 'APPROVED' ? 'var(--success)' : 'var(--border)',
                    color: filterStatus === 'APPROVED' ? 'var(--success)' : 'var(--text-primary)'
                  }}
                >
                  <span>Onaylı / Tesistekiler</span>
                  <span className="badge badge-approved" style={{ padding: '2px 6px' }}>{stats.approvedToday}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('REJECTED')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.75rem',
                    background: filterStatus === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface-elevated)',
                    borderColor: filterStatus === 'REJECTED' ? 'var(--danger)' : 'var(--border)',
                    color: filterStatus === 'REJECTED' ? 'var(--text-primary)' : 'var(--text-primary)'
                  }}
                >
                  <span>Reddedilenler</span>
                  <span className="badge badge-rejected" style={{ padding: '2px 6px' }}>{stats.rejected}</span>
                </button>

                <button
                  onClick={() => setFilterStatus('ALL')}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.75rem',
                    background: filterStatus === 'ALL' ? 'rgba(255,255,255,0.05)' : 'var(--bg-surface-elevated)',
                    borderColor: filterStatus === 'ALL' ? 'var(--text-primary)' : 'var(--border)'
                  }}
                >
                  <span>Tüm Davetler</span>
                  <span className="badge" style={{ padding: '2px 6px', background: 'var(--border)' }}>{visitors.length}</span>
                </button>
              </div>

              {/* Visitor List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '400px', paddingRight: '0.25rem' }}>
                {filteredVisitors.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Bu kategoride talep bulunmuyor.
                  </div>
                ) : (
                  filteredVisitors.map(v => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVisitorId(v.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedVisitorId === v.id ? 'var(--bg-surface-elevated)' : 'rgba(255,255,255,0.01)',
                        border: selectedVisitorId === v.id ? '1px solid rgba(0, 210, 255, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      className="visitor-item-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedVisitorId === v.id ? 'var(--primary)' : '#fff' }}>
                          {v.firstName} {v.lastName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.id}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        {v.company}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Tarih: {v.plannedDate}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                          {v.status === 'PENDING_APPROVAL' ? 'Evrak Kontrolü' : v.status === 'APPROVED' ? 'Onaylandı' : v.status === 'CHECKED_IN' ? 'Giriş Yaptı' : v.status === 'PENDING_DOCS' ? 'Evrak Eksik' : 'Reddedildi'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Detailed Review Card */}
            {selectedVisitor ? (
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '500px' }}>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ZİYARETÇİ DETAYLARI
                    </span>
                    <h2 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '0.25rem' }}>
                      {selectedVisitor.firstName} {selectedVisitor.lastName}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {selectedVisitor.company} • {selectedVisitor.email || 'E-posta girilmemiş'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Referans Kodu: <strong style={{ color: 'var(--primary)' }}>{selectedVisitor.id}</strong></span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Davet Tarihi: {selectedVisitor.plannedDate} - {selectedVisitor.plannedTime}</span>
                  </div>
                </div>

                {/* Sub-grid with details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ziyaret Edilen Departman & Personel</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>{selectedVisitor.hostName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedVisitor.department}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ziyaret Gerekçesi</div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>
                      {selectedVisitor.visitPurpose || 'Belirtilmemiş'}
                    </div>
                  </div>
                </div>

                {/* OHS / Training Status Box */}
                <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)', background: 'rgba(0, 210, 255, 0.02)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    İSG Eğitim ve Sınav Takibi
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Atanan Video: <strong>{selectedVisitor.trainingId || 'Genel Tesis İSG Eğitimi'}</strong>
                    </span>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: selectedVisitor.trainingWatched ? 'var(--success)' : 'var(--warning)' }}>
                        {selectedVisitor.trainingWatched ? '✓ İzleme Tamamlandı' : '⚠ İzlenmedi'}
                      </span>
                      
                      {selectedVisitor.quizCompleted ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Sınav: {selectedVisitor.quizScore} / 3 (Geçti)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Sınava Girilmedi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents Verification List */}
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} />
                    Yüklenmesi Gereken İSG Belgeleri
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedVisitor.requiredDocs.map(docType => {
                      const uploadedDoc = selectedVisitor.uploadedDocs.find(d => d.type === docType);
                      return (
                        <div
                          key={docType}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} color="var(--text-secondary)" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{getDocNameTurkish(docType)}</span>
                            {uploadedDoc?.status === 'REJECTED' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                                (Reddedildi: {uploadedDoc.rejectReason})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {uploadedDoc ? (
                              <>
                                {uploadedDoc.status === 'PENDING' ? (
                                  <span className="badge badge-pending-approval">Onay Bekliyor</span>
                                ) : uploadedDoc.status === 'APPROVED' ? (
                                  <span className="badge badge-approved">✓ Onaylandı</span>
                                ) : (
                                  <span className="badge badge-rejected">✗ Reddedildi</span>
                                )}
                                
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                  onClick={() => setActivePreviewDoc({ visitor: selectedVisitor, doc: uploadedDoc })}
                                >
                                  <Eye size={12} />
                                  İncele
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Henüz yüklenmedi</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Approval / Rejection Box */}
                <div style={{
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {selectedVisitor.status === 'PENDING_APPROVAL' ? (
                    <>
                      {!showRejectForm ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setShowRejectForm(true)}
                            style={{ flex: 1, borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }}
                          >
                            <X size={16} />
                            Genel Talebi Reddet
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleApproveVisitorSubmit(selectedVisitor.id)}
                            style={{ flex: 2 }}
                          >
                            <Check size={16} />
                            Talebi Onayla & Giriş Kartı Gönder
                          </button>
                        </div>
                      ) : (
                        <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ color: 'var(--danger)' }}>Red Gerekçesi Yazınız *</label>
                            <textarea
                              className="form-textarea"
                              rows={3}
                              value={rejectReasonText}
                              onChange={e => setRejectReasonText(e.target.value)}
                              placeholder="Ziyaretçi evraklarının reddedilme nedenini detaylandırın..."
                              required
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowRejectForm(false)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Vazgeç</button>
                            <button className="btn btn-danger" onClick={() => handleRejectVisitorSubmit(selectedVisitor.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Reddi Gönder</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {selectedVisitor.status === 'APPROVED' && (
                        <span style={{ color: 'var(--success)' }}>
                          <strong>✓ Bu Giriş Talebi Onaylanmıştır.</strong> QR kod aktiftir.
                        </span>
                      )}
                      {selectedVisitor.status === 'CHECKED_IN' && (
                        <span style={{ color: 'var(--success)' }}>
                          <strong>✓ Misafir Giriş Yaptı.</strong> Giriş Saati: {selectedVisitor.checkInTime}
                        </span>
                      )}
                      {selectedVisitor.status === 'CHECKED_OUT' && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          <strong>Misafir Ayrıldı.</strong> Çıkış Saati: {selectedVisitor.checkOutTime}
                        </span>
                      )}
                      {selectedVisitor.status === 'PENDING_DOCS' && (
                        <span style={{ color: 'var(--warning)' }}>
                          <strong>Ziyaretçinin Adımları Tamamlaması Bekleniyor.</strong> Evrak veya İSG eğitimi eksik.
                        </span>
                      )}
                      {selectedVisitor.status === 'REJECTED' && (
                        <span style={{ color: 'var(--danger)' }}>
                          <strong>✗ Talep Reddedilmiştir.</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Lütfen sol menüden incelemek istediğiniz misafiri seçin.
              </div>
            )}
          </div>
        </>
      )}

      {/* CONTRACTOR APPROVAL TAB */}
      {activeTab === 'contractors' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }} className="admin-desktop-grid">
          
          {/* Left Column: Contractor Companies List */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '500px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <Building size={18} color="var(--primary)" />
              Taşeron Firmalar ({contractors.length})
            </h3>

            {loadingContractors ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Yükleniyor...</div>
            ) : contractors.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                Kayıtlı taşeron firma bulunmuyor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contractors.map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedContractorId(comp.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: selectedContractorId === comp.id ? 'var(--primary)' : 'var(--border)',
                      background: selectedContractorId === comp.id ? 'rgba(0, 210, 255, 0.05)' : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{comp.name}</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Kod: {comp.id} | İrtibat: {comp.contactName}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(comp.createdAt).toLocaleDateString(getLocale(lang))}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: comp.status === 'APPROVED' ? 'var(--success)' : comp.status === 'REJECTED' ? 'var(--danger)' : comp.status === 'PENDING_APPROVAL' ? 'var(--warning)' : 'var(--text-muted)'
                      }}>
                        {comp.status === 'APPROVED' ? 'ONAYLI' : comp.status === 'REJECTED' ? 'RED' : comp.status === 'PENDING_APPROVAL' ? 'ONAY BEKLİYOR' : 'EKSİK EVRAK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Selected Contractor Details */}
          <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {selectedContractor ? (
              <>
                {/* Title info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>{selectedContractor.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      İrtibat: <strong>{selectedContractor.contactName}</strong> | {selectedContractor.contactEmail} | Şirket Kodu: <code>{selectedContractor.id}</code>
                    </p>
                  </div>
                  <span style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid',
                    background: selectedContractor.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : selectedContractor.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: selectedContractor.status === 'APPROVED' ? 'var(--success)' : selectedContractor.status === 'REJECTED' ? 'var(--danger)' : selectedContractor.status === 'warning' ? 'var(--warning)' : 'var(--warning)'
                  }}>
                    {selectedContractor.status === 'APPROVED' ? 'Onaylı / Aktif' : selectedContractor.status === 'REJECTED' ? 'Reddedildi' : selectedContractor.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : 'Evrak Bekleniyor'}
                  </span>
                </div>

                {/* Document Verification List */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>İSG ve Kurumsal Belgelerin Durumu</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedContractor.requiredDocs.map((docType: string) => {
                      const uploaded = selectedContractor.uploadedDocs.find((d: any) => d.type === docType);
                      return (
                        <div
                          key={docType}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.01)',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} color={uploaded ? 'var(--primary)' : 'var(--text-muted)'} />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>{docType}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {uploaded ? `Dosya: ${uploaded.name}` : 'Yüklenmemiş'}
                              </span>
                            </div>
                          </div>

                          {/* Preview Action */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {uploaded && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  // Mock preview triggering activePreviewDoc
                                  setActivePreviewDoc({
                                    visitor: {
                                      id: selectedContractor.id,
                                      firstName: selectedContractor.name,
                                      lastName: '',
                                      company: selectedContractor.name,
                                      requiredDocs: [],
                                      uploadedDocs: [],
                                      trainingId: '',
                                      trainingWatched: false,
                                      quizCompleted: false,
                                      createdAt: '',
                                      phone: '',
                                      email: '',
                                      hostName: '',
                                      department: '',
                                      visitPurpose: '',
                                      plannedDate: '',
                                      plannedTime: '',
                                      status: 'PENDING_APPROVAL'
                                    },
                                    doc: uploaded
                                  });
                                }}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                              >
                                <Eye size={12} /> İncele
                              </button>
                            )}

                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 750,
                              color: uploaded?.status === 'APPROVED' ? 'var(--success)' : uploaded?.status === 'REJECTED' ? 'var(--danger)' : uploaded ? 'var(--warning)' : 'var(--text-muted)'
                            }}>
                              {uploaded?.status === 'APPROVED' ? 'Onaylandı' : uploaded?.status === 'REJECTED' ? 'Reddedildi' : uploaded ? 'Bekliyor' : 'Eksik'}
                            </span>
                          </div>

                          {uploaded?.status === 'REJECTED' && uploaded.rejectReason && (
                            <div style={{
                              width: '100%',
                              fontSize: '0.75rem',
                              color: 'var(--danger)',
                              background: 'rgba(239, 68, 68, 0.03)',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '4px',
                              borderLeft: '3px solid var(--danger)',
                              marginTop: '0.25rem'
                            }}>
                              <strong>Red Gerekçesi:</strong> {uploaded.rejectReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Decision Box */}
                {selectedContractor.status === 'PENDING_APPROVAL' && (
                  <div style={{
                    marginTop: 'auto',
                    padding: '1.25rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                      <AlertTriangle size={18} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tüm Evraklar Yüklenmiş ve Onayınızı Bekliyor</span>
                    </div>

                    {!showContractorRejectForm ? (
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowContractorRejectForm(true)}
                          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }}
                        >
                          <X size={14} /> Reddet
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => handleApproveContractor(selectedContractor.id)}
                          style={{ minWidth: '160px' }}
                        >
                          <Check size={14} /> Firmayı Onayla (Aktif Et)
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ color: 'var(--danger)' }}>Taşeron Red Gerekçesi *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={contractorRejectReason}
                            onChange={e => setContractorRejectReason(e.target.value)}
                            placeholder="Örn: Evrak tarihleri veya kaşeler uyuşmuyor."
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowContractorRejectForm(false);
                              setContractorRejectReason('');
                            }}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleRejectContractor(selectedContractor.id)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            Reddet ve Bildir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <Building size={32} style={{ opacity: 0.3 }} />
                <span>İncelemek için sol taraftan bir taşeron firma seçin.</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Interactive Mock Document Viewer Modal */}
      {activePreviewDoc && (
        <div className="modal-overlay" onClick={() => { setActivePreviewDoc(null); setShowDocRejectForm(null); }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" />
                Belge Önizleme: {getDocNameTurkish(activePreviewDoc.doc.type)}
              </h3>
              <button
                onClick={() => { setActivePreviewDoc(null); setShowDocRejectForm(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', background: '#0e1420' }}>
              
              {/* Visitor Documents Rendering */}
              {activePreviewDoc.doc.type === 'ID_COPY' && (
                <div style={{
                  width: '380px',
                  height: '240px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #a5cde6 0%, #d8e8f3 100%)',
                  padding: '1.25rem',
                  color: '#223344',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  position: 'relative',
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid #778899', paddingBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>TÜRKİYE CUMHURİYETİ KİMLİK KARTI</span>
                    <span>TURKISH REPUBLIC ID</span>
                  </div>
                  <div style={{
                    width: '90px',
                    height: '110px',
                    background: '#ccc',
                    borderRadius: '4px',
                    position: 'absolute',
                    top: '55px',
                    left: '20px',
                    border: '1px solid #778899',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666'
                  }}>
                    <div style={{ fontSize: '2rem' }}>👤</div>
                    <span style={{ fontSize: '8px' }}>MOCK_PHOTO</span>
                  </div>
                  <div style={{ marginLeft: '105px', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><strong>T.C. Kimlik No:</strong> 12456789012</div>
                    <div><strong>Soyadı:</strong> {activePreviewDoc.visitor.lastName ? activePreviewDoc.visitor.lastName.toUpperCase() : 'TAŞERON'}</div>
                    <div><strong>Adı:</strong> {activePreviewDoc.visitor.firstName.toUpperCase()}</div>
                    <div><strong>Doğum Tarihi:</strong> 15.08.1992</div>
                    <div><strong>Seri No:</strong> A12B34567</div>
                  </div>
                  <div style={{
                    width: '30px',
                    height: '24px',
                    background: '#e0c068',
                    borderRadius: '4px',
                    position: 'absolute',
                    top: '55px',
                    right: '25px',
                    border: '1px solid #c8a048'
                  }} />
                  <div style={{ position: 'absolute', bottom: '10px', right: '15px', fontSize: '8px', color: '#667788' }}>
                    * SafeFlow Kimlik Doğrulama Servisi
                  </div>
                </div>
              )}

              {activePreviewDoc.doc.type === 'ISG' && (
                <div style={{
                  width: '420px',
                  minHeight: '280px',
                  background: '#fffdf6',
                  border: '10px double #bf9b30',
                  padding: '1.5rem',
                  color: '#2d2d2d',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  textAlign: 'center',
                  fontFamily: 'serif',
                  position: 'relative'
                }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#bf9b30', margin: '0.5rem 0', letterSpacing: '0.05em' }}>
                    İŞ SAĞLIĞI VE GÜVENLİĞİ EĞİTİM SERTİFİKASI
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#777', marginBottom: '1.25rem' }}>
                    T.C. ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI STANDARTLARINDA
                  </div>
                  <p style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
                    Sayın <strong>{activePreviewDoc.visitor.firstName} {activePreviewDoc.visitor.lastName}</strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', margin: '0.75rem 0', lineHeight: 1.4 }}>
                    yıllık zorunlu 16 saatlik <strong>Temel İş Sağlığı ve Güvenliği Eğitimi</strong> programını başarıyla tamamlayarak bu sertifikayı almaya hak kazanmıştır.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '0.75rem', fontStyle: 'normal' }}>
                    <div>
                      <strong>Eğitim Tarihi:</strong> 12.01.2026<br/>
                      <strong>Geçerlilik:</strong> 12.01.2027
                    </div>
                    <div>
                      <strong>Eğitici İSG Uzmanı:</strong> A Sınıfı Uzm. Ömer Bilgin<br/>
                      <strong>Sertifika No:</strong> ISG-2026-9821
                    </div>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '2px dashed rgba(239, 68, 68, 0.6)',
                    color: 'rgba(239, 68, 68, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    position: 'absolute',
                    bottom: '40px',
                    right: '35px',
                    transform: 'rotate(-15deg)',
                    pointerEvents: 'none'
                  }}>
                    ONAYLANDI
                  </div>
                </div>
              )}

              {activePreviewDoc.doc.type === 'SGK' && (
                <div style={{
                  width: '420px',
                  minHeight: '280px',
                  background: '#ffffff',
                  border: '1px solid #ccc',
                  padding: '1.5rem',
                  color: '#1a1a1a',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontSize: '0.75rem',
                  fontFamily: 'sans-serif'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0056b3', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    <strong style={{ color: '#0056b3' }}>T.C. SOSYAL GÜVENLİK KURUMU</strong>
                    <strong style={{ color: '#000' }}>SİGORTALI İŞE GİRİŞ BİLDİRGESİ</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div><strong>İşveren Unvanı:</strong> {activePreviewDoc.visitor.company}</div>
                    <div><strong>İşyeri Sicil No:</strong> 2.4567.01.01.1234567</div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Sigortalı Bilgileri</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.35rem' }}>
                      <span>T.C. Kimlik No:</span> <strong>12456789012</strong>
                      <span>Adı Soyadı:</span> <strong>{activePreviewDoc.visitor.firstName} {activePreviewDoc.visitor.lastName}</strong>
                      <span>İşe Giriş Tarihi:</span> <strong>01.02.2025</strong>
                      <span>Meslek Kodu/Adı:</span> <span>7212.04 - Elektrik Kaynakçısı</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#666', lineHeight: 1.3 }}>
                    5510 Sayılı Kanunun 8 inci maddesi gereğince Kurumumuza elektronik ortamda verilmiş olan işe giriş bildiriminin resmi çıktısıdır. Barkod doğrulaması geçerlidir.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '7px', color: '#999' }}>E-DEVLET BARKOD: ||| |||| | | |||| || ||</span>
                    <strong style={{ color: '#008000' }}>E-Kurum Kayıtlı</strong>
                  </div>
                </div>
              )}

              {/* Contractor Documents Rendering */}
              {activePreviewDoc.doc.type === 'Vergi Levhası' && (
                <div style={{
                  width: '380px',
                  minHeight: '260px',
                  borderRadius: '8px',
                  background: '#fcf8e3',
                  border: '3px solid #8a6d3b',
                  padding: '1.25rem',
                  color: '#8a6d3b',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', borderBottom: '2px solid #8a6d3b', paddingBottom: '0.25rem', textAlign: 'center', color: '#8a6d3b' }}>
                    T.C. GELİR İDARESİ BAŞKANLIĞI
                  </div>
                  <div style={{ fontSize: '0.8rem', textAlign: 'center', margin: '0.25rem 0', fontWeight: 'bold' }}>VERGİ LEVHASI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.35rem', marginTop: '0.75rem', color: '#333' }}>
                    <span>Unvan:</span> <strong>{activePreviewDoc.visitor.company}</strong>
                    <span>Vergi No:</span> <strong>{Math.floor(1000000000 + Math.random() * 9000000000)}</strong>
                    <span>Vergi Dairesi:</span> <strong>Marmara Kurumlar V.D.</strong>
                    <span>Matrah (2025):</span> <strong>3.450.000,00 TL</strong>
                    <span>Tahakkuk Eden:</span> <strong>759.000,00 TL</strong>
                  </div>
                  <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '9px', color: '#777', borderTop: '1px dashed #8a6d3b', paddingTop: '0.5rem' }}>
                    * E-Vergi Levhası Barkodlu Doğrulama Aktiftir *
                  </div>
                </div>
              )}

              {activePreviewDoc.doc.type === 'İSG Taahhütnamesi' && (
                <div style={{
                  width: '380px',
                  minHeight: '260px',
                  borderRadius: '8px',
                  background: '#f4f6f9',
                  border: '2px solid #34495e',
                  padding: '1.25rem',
                  color: '#2c3e50',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontFamily: 'serif',
                  fontSize: '0.75rem',
                  lineHeight: 1.3
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '2px solid #34495e', paddingBottom: '0.25rem', textAlign: 'center' }}>
                    KURUMSAL İSG TAAHHÜTNAMESİ
                  </div>
                  <p style={{ marginTop: '0.75rem', textIndent: '15px' }}>
                    <strong>{activePreviewDoc.visitor.company}</strong> olarak, tesis sınırları içerisinde gerçekleştirilecek tüm teknik çalışmalarda 6331 sayılı İSG Kanunu ve ilgili yönetmeliklere tam uyum sağlayacağımızı, gerekli tüm KKD ekipmanlarını eksiksiz kullandıracağımızı taahhüt ederiz.
                  </p>
                  <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span>Tarih: {new Date().toLocaleDateString(getLocale(lang))}</span>
                    <span style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>Yetkili Kaşe & İmza</span>
                  </div>
                </div>
              )}

              {(activePreviewDoc.doc.type === 'SGK Hizmet Listesi' || activePreviewDoc.doc.type === 'Ticaret Sicil Gazetesi') && (
                <div style={{
                  width: '380px',
                  minHeight: '260px',
                  borderRadius: '8px',
                  background: '#fff',
                  border: '1px solid #bbb',
                  padding: '1.25rem',
                  color: '#111',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  fontFamily: 'sans-serif',
                  fontSize: '0.7rem'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '2px solid #0056b3', paddingBottom: '0.25rem', color: '#0056b3', textAlign: 'center' }}>
                    RESMİ BARKODLU EVRAK SORGULAMA
                  </div>
                  <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>Belge Türü:</strong> {activePreviewDoc.doc.type}</div>
                    <div><strong>Sorgulayan Şirket:</strong> {activePreviewDoc.visitor.company}</div>
                    <div><strong>Evrak Barkod No:</strong> E-SGK-SGRT-{Math.floor(10000000 + Math.random() * 90000000)}</div>
                    <div><strong>Doğrulama Durumu:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>GEÇERLİ / ONAYLI</span></div>
                  </div>
                  <div style={{ marginTop: '2rem', fontSize: '7px', color: '#999', textAlign: 'right' }}>
                    Barkod |||| | | |||| || || | |||
                  </div>
                </div>
              )}

              {/* Status Info in Modal */}
              <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>
                  Belge Durumu: {activePreviewDoc.doc.status === 'APPROVED' ? (
                    <strong style={{ color: 'var(--success)' }}>Onaylandı</strong>
                  ) : activePreviewDoc.doc.status === 'REJECTED' ? (
                    <strong style={{ color: 'var(--danger)' }}>Reddedildi</strong>
                  ) : (
                    <strong style={{ color: 'var(--warning)' }}>İnceleme Bekliyor</strong>
                  )}
                </span>
                
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Yükleme Zamanı: {activePreviewDoc.doc.uploadedAt ? new Date(activePreviewDoc.doc.uploadedAt).toLocaleString('tr-TR') : '-'}
                </span>
              </div>

            </div>

            {/* Document Action Footer */}
            <div className="modal-footer" style={{ background: '#0e1420' }}>
              {showDocRejectForm === null ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDocRejectForm(activePreviewDoc.doc.type)}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)' }}
                  >
                    <X size={14} />
                    Belgeyi Reddet
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      if (activeTab === 'contractors') {
                        handleApproveContractorDoc(activePreviewDoc.visitor.id, activePreviewDoc.doc.type);
                      } else {
                        handleApproveDoc(activePreviewDoc.visitor.id, activePreviewDoc.doc.type as DocumentType);
                      }
                    }}
                  >
                    <Check size={14} />
                    Belgeyi Onayla
                  </button>
                </>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--danger)' }}>Belge Red Nedeni *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={docRejectReasonText}
                      onChange={e => setDocRejectReasonText(e.target.value)}
                      placeholder="Örn: Belge tarihi güncel değil."
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowDocRejectForm(null)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>İptal</button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => {
                        if (activeTab === 'contractors') {
                          handleRejectContractorDoc(activePreviewDoc.visitor.id, activePreviewDoc.doc.type, docRejectReasonText);
                        } else {
                          handleRejectDocSubmit(activePreviewDoc.visitor.id, activePreviewDoc.doc.type as DocumentType);
                        }
                      }} 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Gerekçeyi Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
