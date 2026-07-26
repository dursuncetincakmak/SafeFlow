import React, { useState, useEffect } from 'react';
import type { Visitor, TrainingVideo, DocumentType, VisitorStatus, TenantConfig } from '../utils/types';
import { UserPlus, Users, ClipboardCheck, Search, Calendar, FileText, CheckCircle2, Clock, XCircle, LogIn, X } from 'lucide-react';
import { getApiRoot } from '../utils/apiConfig';

interface DepartmentDashboardProps {
  visitors: Visitor[];
  onAddVisitor: (visitorData: {
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
  }) => void;
  trainingVideos: TrainingVideo[];
  config: TenantConfig;
}

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({
  visitors,
  onAddVisitor,
  trainingVideos,
  config,
}) => {
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>(config.companies?.[0]?.code || '');
  const [hostName, setHostName] = useState('');
  const [department, setDepartment] = useState(config.departments?.[0] || '');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [plannedTime, setPlannedTime] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>(['ISG']);
  const [selectedTrainingId, setSelectedTrainingId] = useState(trainingVideos[0]?.id || '');

  // Form type tab: individual guest vs contractor registration
  const [formTab, setFormTab] = useState<'individual' | 'contractor'>('individual');

  // Contractor Company Form States
  const [compName, setCompName] = useState('');
  const [compContact, setCompContact] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compDocs, setCompDocs] = useState<string[]>(['Vergi Levhası', 'İSG Taahhütnamesi']);

  // Simulated Email Notification Popup State
  const [simulatedEmail, setSimulatedEmail] = useState<{ show: boolean; to: string; code: string; user: string; pass: string } | null>(null);

  // Sync default department selection
  useEffect(() => {
    if (config.departments && config.departments.length > 0 && !config.departments.includes(department)) {
      setDepartment(config.departments[0]);
    }
  }, [config, department]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !selectedCompany || !hostName || !plannedDate || !plannedTime) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    const compObj = (config.companies || []).find((c) => c.code === selectedCompany);
    const cleanedPhone = phone.replace(/\D/g, '');

    try {
      // Call backend invitation service
      const res = await fetch(`${getApiRoot()}/visitors/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-company-code': selectedCompany
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: cleanedPhone,
          email,
          company: compObj?.name || '',
          hostName,
          department,
          visitPurpose,
          plannedDate,
          plannedTime
        })
      });
      const data = await res.json();
      if (data.success && data.visitor) {
        onAddVisitor(data.visitor);
        alert(`Ziyaretçi başarıyla davet edildi!\n\nSMS/E-Posta Bildirimi Gönderildi.\nDavet Kodu: ${data.inviteId}\nLink: ${data.inviteUrl}`);
      } else {
        onAddVisitor({
          firstName,
          lastName,
          phone: cleanedPhone,
          email,
          company: compObj?.name || '',
          hostName,
          department,
          visitPurpose,
          plannedDate,
          plannedTime,
          requiredDocs: selectedDocs,
          trainingId: selectedTrainingId,
        });
        alert('Misafir daveti oluşturuldu.');
      }
    } catch (err) {
      onAddVisitor({
        firstName,
        lastName,
        phone: cleanedPhone,
        email,
        company: compObj?.name || '',
        hostName,
        department,
        visitPurpose,
        plannedDate,
        plannedTime,
        requiredDocs: selectedDocs,
        trainingId: selectedTrainingId,
      });
      alert('Misafir daveti oluşturuldu.');
    }

    // Reset Form
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setSelectedCompany(config.companies?.[0]?.code || '');
    setVisitPurpose('');
    setPlannedDate('');
    setPlannedTime('');
    setSelectedDocs(['ISG']);
  };

  // Toggle document selection
  const handleDocCheckboxChange = (doc: DocumentType) => {
    if (selectedDocs.includes(doc)) {
      setSelectedDocs(selectedDocs.filter(d => d !== doc));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  // Submit Handler for Contractor Company Registration
  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compContact || !compEmail) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    try {
      const res = await fetch(`${getApiRoot()}/contractors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: compName,
          contactName: compContact,
          contactEmail: compEmail,
          requiredDocs: compDocs
        })
      });

      if (!res.ok) {
        throw new Error('Taşeron firma sisteme kaydedilemedi.');
      }

      const data = await res.json();
      const comp = data.company;

      // Show simulated e-mail details in popup!
      setSimulatedEmail({
        show: true,
        to: comp.contactEmail,
        code: comp.id,
        user: comp.username,
        pass: comp.password
      });

      // Reset form
      setCompName('');
      setCompContact('');
      setCompEmail('');
      setCompDocs(['Vergi Levhası', 'İSG Taahhütnamesi']);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompDocCheckbox = (doc: string) => {
    if (compDocs.includes(doc)) {
      setCompDocs(compDocs.filter(d => d !== doc));
    } else {
      setCompDocs([...compDocs, doc]);
    }
  };

  // Status badges helper
  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case 'PENDING_DOCS':
        return <span className="badge badge-pending-docs"><Clock size={12} /> Evrak Bekliyor</span>;
      case 'PENDING_APPROVAL':
        return <span className="badge badge-pending-approval"><Clock size={12} /> Onay Bekliyor</span>;
      case 'APPROVED':
        return <span className="badge badge-approved"><CheckCircle2 size={12} /> Onaylandı</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected"><XCircle size={12} /> Reddedildi</span>;
      case 'CHECKED_IN':
        return <span className="badge badge-checked-in"><LogIn size={12} /> Tesiste</span>;
      case 'CHECKED_OUT':
        return <span className="badge badge-checked-out">Ayrıldı</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    const fullName = `${v.firstName} ${v.lastName}`.toLowerCase();
    const companyName = v.company.toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || companyName.includes(query) || v.id.toLowerCase().includes(query);
  });

  // Analytics helper
  const stats = {
    total: visitors.length,
    inFacility: visitors.filter(v => v.status === 'CHECKED_IN').length,
    pendingApproval: visitors.filter(v => v.status === 'PENDING_APPROVAL').length,
    pendingDocs: visitors.filter(v => v.status === 'PENDING_DOCS').length,
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Upper Title Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
            {config.appName} Departman Davet ve Takip Paneli
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tesise gelecek misafirleriniz için davet oluşturun, gerekli İSG eğitimlerini atayın ve giriş onaylarını izleyin.
          </p>
        </div>
      </div>

      {/* Stats Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toplam Davet</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <LogIn size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tesisteki Misafirler</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.inFacility}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Onay Bekleyenler</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.pendingApproval}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evrak/Eğitim Bekleyen</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{stats.pendingDocs}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
        alignItems: 'start'
      }} className="desktop-grid">
        <style>{`
          @media(min-width: 1024px) {
            .desktop-grid {
              grid-template-columns: 380px 1fr !important;
            }
          }
        `}</style>

        {/* Left Column: Form Card */}
        <div className="glass-panel glow-card-primary" style={{ padding: '1.5rem' }}>
          
          {/* Sub-Tab Form Nav */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '0.75rem', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setFormTab('individual')}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: formTab === 'individual' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.25rem',
                borderBottom: formTab === 'individual' ? '2px solid var(--primary)' : 'none'
              }}
            >
              Bireysel Ziyaretçi
            </button>
            <button
              type="button"
              onClick={() => setFormTab('contractor')}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: formTab === 'contractor' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '0.25rem',
                borderBottom: formTab === 'contractor' ? '2px solid var(--primary)' : 'none'
              }}
            >
              Taşeron Firma Kaydı
            </button>
          </div>

          {formTab === 'individual' ? (
            <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ad *</label>
                <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Örn: Ahmet" />
              </div>
              <div className="form-group">
                <label className="form-label">Soyad *</label>
                <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Örn: Yılmaz" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Telefon No * (Doğrulama ve Giriş için)</label>
              <input type="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Örn: 5551234567" />
            </div>

            <div className="form-group">
              <label className="form-label">E-posta</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="isim@firma.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Firma / Kurum Adı *</label>
              <select className="form-select" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} required>
                <option value="">Firma seçin...</option>
                {(config.companies || []).map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ev Sahibi Personel *</label>
                {(() => {
                  const comp = (config.companies || []).find((c) => c.code === selectedCompany);
                  const hosts = comp?.hosts || [];
                  return hosts.length > 0 ? (
                    <select className="form-select" value={hostName} onChange={e => setHostName(e.target.value)} required>
                      <option value="">Ev sahibi seçin...</option>
                      {hosts.map((h: string) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="form-input" value={hostName} onChange={e => setHostName(e.target.value)} required placeholder="Örn: Murat Güler" />
                  );
                })()}
              </div>
              <div className="form-group">
                <label className="form-label">Tarih *</label>
                <input type="date" className="form-input" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Saat *</label>
                <input type="time" className="form-input" value={plannedTime} onChange={e => setPlannedTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Departman</label>
                <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                   {config.departments?.map(dept => (
                     <option key={dept} value={dept}>{dept}</option>
                   ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ziyaret Sebebi / Yapılacak İş</label>
              <input type="text" className="form-input" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value)} placeholder="Örn: Jeneratör bakımı" />
            </div>

            {/* Document Selection Box */}
            <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>Gerekli Evraklar (İSG)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes('ISG')} onChange={() => handleDocCheckboxChange('ISG')} />
                  İSG Katılım Belgesi (Eğitim Sertifikası)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes('SGK')} onChange={() => handleDocCheckboxChange('SGK')} />
                  SGK İşe Giriş Bildirgesi
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDocs.includes('ID_COPY')} onChange={() => handleDocCheckboxChange('ID_COPY')} />
                  Kimlik Fotokopisi / Görseli
                </label>
              </div>
            </div>

            {/* Training Assignment */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Atanacak İSG Eğitim Videosu</label>
              <select className="form-select" value={selectedTrainingId} onChange={e => setSelectedTrainingId(e.target.value)}>
                {trainingVideos.map(video => (
                  <option key={video.id} value={video.id}>
                    {video.title} ({video.duration})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <UserPlus size={18} />
              Daveti Gönder
            </button>
          </form>
          ) : (
            /* CONTRACTOR COMPANY REGISTRATION FORM */
            <form onSubmit={handleContractorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Taşeron Firma Adı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  placeholder="Örn: Özdemir İnşaat A.Ş."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">İrtibat Kişisi Adı Soyadı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={compContact}
                  onChange={e => setCompContact(e.target.value)}
                  placeholder="Örn: Ahmet Özdemir"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Yetkili E-postası * (Giriş bilgileri gönderilir)</label>
                <input
                  type="email"
                  className="form-input"
                  value={compEmail}
                  onChange={e => setCompEmail(e.target.value)}
                  placeholder="yetkili@firma.com"
                  required
                />
              </div>

              {/* Contractor required documents checklist */}
              <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>İstenen Şirket Evrakları</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {['Vergi Levhası', 'İSG Taahhütnamesi', 'SGK Hizmet Listesi', 'Ticaret Sicil Gazetesi'].map(doc => (
                    <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={compDocs.includes(doc)}
                        onChange={() => handleCompDocCheckbox(doc)}
                      />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <UserPlus size={18} />
                Taşeron Firmayı Kaydet
              </button>
            </form>
          )}
        </div>

        {/* Right Column: List & Tracking */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '520px' }}>
          
          {/* Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="var(--primary)" />
              Aktif Ziyaretçi ve Taşeron Listesi
            </h3>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Misafir adı, firma veya kod ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '36px' }}
              />
            </div>
          </div>

          {/* List Table */}
          <div className="custom-table-container" style={{ flex: 1 }}>
            {filteredVisitors.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Aradığınız kriterlere uygun davet bulunamadı.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ref Kodu</th>
                    <th>Misafir / Taşeron</th>
                    <th>Ev Sahibi / Departman</th>
                    <th>Planlanan Tarih</th>
                    <th>İSG Eğitim</th>
                    <th>Giriş Durumu</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map(visitor => {
                    const matchedVideo = trainingVideos.find(v => v.id === visitor.trainingId);
                    return (
                      <tr key={visitor.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>
                          {visitor.id}
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{visitor.firstName} {visitor.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{visitor.company}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontSize: '0.85rem' }}>{visitor.hostName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{visitor.department}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{visitor.plannedDate}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saat: {visitor.plannedTime}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '120px' }}>
                              {matchedVideo?.title}
                            </span>
                            <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}>
                              {visitor.trainingWatched ? (
                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  ✓ İzledi
                                </span>
                              ) : (
                                <span style={{ color: 'var(--warning)' }}>İzlemedi</span>
                              )}
                              {visitor.quizCompleted && (
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                  Test: {visitor.quizScore}/3
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(visitor.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span>Toplam {filteredVisitors.length} kayıt gösteriliyor</span>
            <span>Veriler anlık olarak LocalStorage üzerinde senkronizedir.</span>
          </div>

        </div>

      </div>

      {/* Simulated Email Notification Popup Modal */}
      {simulatedEmail && simulatedEmail.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel glow-card-primary" style={{ padding: '2rem', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <CheckCircle2 size={20} />
                <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>E-Posta Bildirim Simülasyonu</h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulatedEmail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Taşeron firma yetkilisi e-posta adresine (`{simulatedEmail.to}`) aşağıdaki otomatik giriş bilgileri başarıyla gönderildi:
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.85rem',
              fontFamily: 'monospace'
            }}>
              <div><strong>Konu:</strong> SafeFlow Tesis Geçiş Giriş Bilgileri</div>
              <div style={{ borderTop: '1px dashed var(--border)', marginTop: '0.25rem', paddingTop: '0.5rem' }}>
                🏢 <strong>Şirket Kodu:</strong> <span style={{ color: 'var(--primary)', fontWeight: 750 }}>{simulatedEmail.code}</span>
              </div>
              <div>
                👤 <strong>Kullanıcı Adı:</strong> <span style={{ color: '#fff' }}>{simulatedEmail.user}</span>
              </div>
              <div>
                🔑 <strong>Şifre:</strong> <span style={{ color: '#fff' }}>{simulatedEmail.pass}</span>
              </div>
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'rgba(0, 210, 255, 0.03)',
              padding: '0.5rem',
              borderRadius: '4px',
              borderLeft: '3px solid var(--primary)',
              lineHeight: 1.4
            }}>
              💡 Taşeron yetkilisi bu kimlik bilgileriyle üst menüdeki <strong>"Taşeron Portalı"</strong> sekmesinden giriş yaparak evraklarını yükleyebilir.
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSimulatedEmail(null)}
              style={{ width: '100%' }}
            >
              Tamam, Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
