import React, { useState, useEffect } from 'react';
import type { ContractorCompany, TenantConfig, Visitor } from '../utils/types';
import { Upload, CheckCircle2, AlertTriangle, FileText, Check, Users, Plus, Calendar, ShieldAlert, RefreshCw } from 'lucide-react';
import { useLanguage, getLocale } from '../utils/LanguageContext';

interface ContractorPortalProps {
  config: TenantConfig;
  activeCompany: ContractorCompany | null;
}

export const ContractorPortal: React.FC<ContractorPortalProps> = ({ config, activeCompany: initialCompany }) => {
  const { lang } = useLanguage();
  // Active Contractor State
  const [activeCompany, setActiveCompany] = useState<ContractorCompany | null>(initialCompany);

  // Tabs
  const [activeTab, setActiveTab] = useState<'docs' | 'employees' | 'permits'>('docs');

  // File Upload State
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // Employees List
  const [employees, setEmployees] = useState<Visitor[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Work Permits List
  const [permits, setPermits] = useState<any[]>([]);
  const [loadingPermits, setLoadingPermits] = useState(false);

  // Add Employee Form States
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [showAddEmpForm, setShowAddEmpForm] = useState(false);
  const [uploadingEmpDoc, setUploadingEmpDoc] = useState<{ empId: string; docType: string } | null>(null);

  // Add Work Permit Form States
  const [permitWorkType, setPermitWorkType] = useState('Sıcak Çalışma');
  const [permitDesc, setPermitDesc] = useState('');
  const [permitLocation, setPermitLocation] = useState('');
  const [permitStartDate, setPermitStartDate] = useState('');
  const [permitEndDate, setPermitEndDate] = useState('');
  const [permitWorkers, setPermitWorkers] = useState<string[]>([]); // worker IDs
  const [permitChecklist, setPermitChecklist] = useState<Record<string, boolean>>({
    personalProtectiveEquipment: true,
    fireExtinguisherReady: false,
    energyLocked: false,
    areaIsolated: false
  });
  const [showCreatePermitForm, setShowCreatePermitForm] = useState(false);

  // Fetch Employees List
  const fetchEmployees = async () => {
    if (!activeCompany) return;
    setLoadingEmployees(true);
    try {
      const res = await fetch(`http://localhost:5000/api/contractors/employees/${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      // Error loading employees
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch Work Permits List
  const fetchPermits = async () => {
    if (!activeCompany) return;
    setLoadingPermits(true);
    try {
      const res = await fetch(`http://localhost:5000/api/work-permits/company/${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setPermits(data);
      }
    } catch (e) {
      // Error loading permits
    } finally {
      setLoadingPermits(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'permits') {
      fetchPermits();
      fetchEmployees(); // Need employees for multi-select
    }
  }, [activeTab]);

  // Convert File to Base64 and Upload for Company
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeCompany) return;

    if (file.size > 300000) {
      alert('Hata: Yüklenecek belge boyutu 300KB\'tan küçük olmalıdır.');
      return;
    }

    setUploadingDocType(docType);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;

      try {
        const res = await fetch('http://localhost:5000/api/contractors/upload-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: activeCompany.id,
            docType,
            docName: file.name,
            fileUrl
          })
        });

        if (!res.ok) {
          throw new Error('Belge yükleme başarısız.');
        }

        const data = await res.json();
        setActiveCompany(data.company);
        alert(`"${docType}" belgesi başarıyla yüklendi.`);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploadingDocType(null);
      }
    };

    reader.readAsDataURL(file);
  };

  // Add Employee Submit
  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !empFirstName || !empLastName || !empPhone || !empEmail) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/contractors/add-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany.id,
          firstName: empFirstName,
          lastName: empLastName,
          phone: empPhone.replace(/\D/g, ''),
          email: empEmail
        })
      });

      if (!res.ok) throw new Error('Çalışan eklenemedi.');
      alert('Çalışan sisteme kaydedildi! SGK ve İSG evraklarını yükleyebilirsiniz.');
      setEmpFirstName('');
      setEmpLastName('');
      setEmpPhone('');
      setEmpEmail('');
      setShowAddEmpForm(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Upload Document for Employee
  const handleEmpDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, empId: string, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 300000) {
      alert('Hata: Belge boyutu 300KB\'tan küçük olmalıdır.');
      return;
    }

    setUploadingEmpDoc({ empId, docType });
    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;

      try {
        const res = await fetch('http://localhost:5000/api/contractors/employee-upload-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: empId,
            docType,
            docName: file.name,
            fileUrl
          })
        });

        if (!res.ok) throw new Error('Evrak sunucuya yüklenemedi.');
        alert(`"${docType}" belgesi başarıyla yüklendi.`);
        fetchEmployees();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUploadingEmpDoc(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Permit Submit
  const handleCreatePermitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !permitLocation || !permitStartDate || !permitEndDate) {
      alert('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    if (permitWorkers.length === 0) {
      alert('Lütfen iş izninde çalışacak en az 1 işçi seçiniz.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/work-permits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany.id,
          companyName: activeCompany.name,
          workType: permitWorkType,
          description: permitDesc,
          assignedWorkers: permitWorkers,
          location: permitLocation,
          startDate: permitStartDate,
          endDate: permitEndDate,
          checklist: permitChecklist
        })
      });

      if (!res.ok) throw new Error('İş izni talebi oluşturulamadı.');
      alert('İş izni talebi başarıyla oluşturuldu, İSG onayı bekleniyor.');
      setPermitDesc('');
      setPermitLocation('');
      setPermitStartDate('');
      setPermitEndDate('');
      setPermitWorkers([]);
      setShowCreatePermitForm(false);
      fetchPermits();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Worker Checkbox Toggle
  const handleWorkerCheckboxToggle = (workerId: string) => {
    if (permitWorkers.includes(workerId)) {
      setPermitWorkers(permitWorkers.filter(id => id !== workerId));
    } else {
      setPermitWorkers([...permitWorkers, workerId]);
    }
  };

  // Checklist Toggle
  const handleChecklistToggle = (key: string) => {
    setPermitChecklist({
      ...permitChecklist,
      [key]: !permitChecklist[key]
    });
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { text: 'Onaylandı / Aktif', bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'PENDING_APPROVAL':
        return { text: 'Onay Bekliyor', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'REJECTED':
        return { text: 'Reddedildi', bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { text: 'Evrak Bekleniyor', bg: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-secondary)', border: '1px solid rgba(156, 163, 175, 0.3)' };
    }
  };

  if (!activeCompany) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} color="var(--warning)" />
        <h2 style={{ color: 'var(--text-primary)', marginTop: '1rem' }}>Firma Bilgileri Yüklenemedi</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Lütfen çıkış yapıp tekrar giriş yapınız.</p>
      </div>
    );
  }

  const tabStyle = (tab: string) => ({
    background: 'transparent',
    border: 'none',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.6rem 1rem',
    borderBottom: activeTab === tab ? '2.5px solid var(--primary)' : '2.5px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease',
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {config.appName} Taşeron Portal
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Tesis girişleri öncesinde kurumsal belgeleri yükleyin, çalışanları kaydedin ve iş izinlerini yönetin.
        </p>
      </div>

      {/* WORKSPACE VIEW */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Card */}
        <div className="contractor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>TAŞERON YETKİLİ PANELİ</span>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, margin: '4px 0' }}>{activeCompany.name}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Yetkili: <strong>{activeCompany.contactName}</strong> | {activeCompany.contactEmail}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: getStatusBadge(activeCompany.status).bg,
              color: getStatusBadge(activeCompany.status).color,
              border: getStatusBadge(activeCompany.status).border
            }}>
              {getStatusBadge(activeCompany.status).text}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '0.25rem' }}>
          <button type="button" onClick={() => setActiveTab('docs')} style={tabStyle('docs')}>
            <FileText size={14} /> Kurumsal Belgeler
          </button>
          <button type="button" onClick={() => setActiveTab('employees')} style={tabStyle('employees')}>
            <Users size={14} /> Çalışan Yönetimi
          </button>
          <button type="button" onClick={() => setActiveTab('permits')} style={tabStyle('permits')}>
            <Calendar size={14} /> İş İzinleri (Wellcome PTW)
          </button>
        </div>

        {/* TAB 1: CORPORATE DOCUMENTS */}
        {activeTab === 'docs' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Guidelines / Notices */}
            {activeCompany.status === 'APPROVED' && (
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Kurumsal Kaydınız Onaylandı!</strong>
                  <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    Tüm kurumsal belgeleriniz doğrulanmıştır. Çalışanlarınızı kaydedip kişisel İSG evraklarını yüklemeye başlayabilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {activeCompany.status === 'REJECTED' && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Belgelerinizde Uyumsuzluk Tespit Edildi</strong>
                  <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    Yüklediğiniz evraklar kriterleri karşılamadığı için reddedilmiştir. Lütfen belgeleri kontrol edip yenilerini yükleyin.
                  </p>
                </div>
              </div>
            )}

            {activeCompany.status === 'PENDING_APPROVAL' && (
              <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Evraklarınız İncelemede</strong>
                  <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    Kurumsal belgeleri sisteme yüklediniz. İdari işler ekibinin doğruluğunu kontrol etmesi beklenmektedir.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Talep Edilen Kurumsal Evraklar</h3>
              <div className="contractor-docs-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeCompany.requiredDocs.map(docType => {
                  const uploaded = activeCompany.uploadedDocs.find(d => d.type === docType);
                  return (
                    <div key={docType} className="contractor-doc-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: uploaded?.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : uploaded?.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                          {uploaded?.status === 'APPROVED' ? (
                            <Check size={18} color="var(--success)" />
                          ) : (
                            <FileText size={18} color={uploaded ? 'var(--warning)' : 'var(--text-muted)'} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{docType}</strong>
                          {uploaded ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Dosya: {uploaded.name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Eksik Belge • Yüklenmesi Zorunlu</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                        {uploaded && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: uploaded.status === 'APPROVED' ? 'var(--success)' : uploaded.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)' }}>
                            {uploaded.status === 'APPROVED' ? 'Onaylandı' : uploaded.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                          </span>
                        )}

                        {(!uploaded || uploaded.status === 'REJECTED') && (
                          <div>
                            <input
                              type="file"
                              accept=".pdf, image/*"
                              id={`file-upload-${docType}`}
                              style={{ display: 'none' }}
                              onChange={e => handleFileUpload(e, docType)}
                              disabled={uploadingDocType !== null}
                            />
                            <label
                              htmlFor={`file-upload-${docType}`}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Upload size={12} /> 
                              {uploadingDocType === docType ? 'Yükleniyor...' : 'Belge Yükle'}
                            </label>
                          </div>
                        )}
                      </div>

                      {uploaded?.status === 'REJECTED' && uploaded.rejectReason && (
                        <div style={{ width: '100%', fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--danger)', marginTop: '0.25rem' }}>
                          <strong>Red Sebebi:</strong> {uploaded.rejectReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEE MANAGEMENT */}
        {activeTab === 'employees' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>Çalışan Listesi ve Evrak Takibi</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddEmpForm(!showAddEmpForm)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                <Plus size={14} /> Yeni Çalışan Ekle
              </button>
            </div>

            {/* Add Employee Form */}
            {showAddEmpForm && (
              <form onSubmit={handleAddEmployeeSubmit} className="glass-panel animate-fade-in" style={{ padding: '1rem', border: '1px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', margin: 0 }}>Yeni Çalışan Kaydı</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Adı *</label>
                    <input type="text" className="form-input" value={empFirstName} onChange={e => setEmpFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Soyadı *</label>
                    <input type="text" className="form-input" value={empLastName} onChange={e => setEmpLastName(e.target.value)} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Telefon *</label>
                    <input type="tel" className="form-input" placeholder="05XXXXXXXXX" value={empPhone} onChange={e => setEmpPhone(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">E-posta *</label>
                    <input type="email" className="form-input" placeholder="ornek@mail.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-success" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                  Kaydet ve Bildir
                </button>
              </form>
            )}

            {/* Employees Grid */}
            {loadingEmployees ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><RefreshCw className="spin" /> Yükleniyor...</div>
            ) : employees.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Henüz çalışan eklenmemiştir. Tesis girişlerinden önce çalışanlarınızı ekleyin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {employees.map(emp => (
                  <div key={emp.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{emp.firstName} {emp.lastName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Tel: {emp.phone} | E-posta: {emp.email}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '10px',
                        background: getStatusBadge(emp.status).bg,
                        color: getStatusBadge(emp.status).color,
                        border: getStatusBadge(emp.status).border
                      }}>
                        {getStatusBadge(emp.status).text}
                      </span>
                    </div>

                    {/* Employee Required Documents Grid */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {emp.requiredDocs.map(docType => {
                        const uploaded = emp.uploadedDocs.find(d => d.type === docType);
                        return (
                          <div key={docType} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{docType}</span>
                              <span style={{ fontSize: '0.7rem', color: uploaded?.status === 'APPROVED' ? 'var(--success)' : uploaded?.status === 'REJECTED' ? 'var(--danger)' : uploaded ? 'var(--warning)' : 'var(--text-muted)' }}>
                                {uploaded?.status === 'APPROVED' ? 'Onaylı' : uploaded?.status === 'REJECTED' ? 'Reddedildi' : uploaded ? 'Onay Bekliyor' : 'Eksik Evrak'}
                              </span>
                            </div>
                            
                            {(!uploaded || uploaded.status === 'REJECTED') ? (
                              <div>
                                <input
                                  type="file"
                                  accept=".pdf, image/*"
                                  id={`file-emp-${emp.id}-${docType}`}
                                  style={{ display: 'none' }}
                                  onChange={e => handleEmpDocUpload(e, emp.id, docType)}
                                  disabled={uploadingEmpDoc !== null}
                                />
                                <label
                                  htmlFor={`file-emp-${emp.id}-${docType}`}
                                  style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff' }}
                                >
                                  <Upload size={10} /> Yükle
                                </label>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* Reject reason for worker */}
                    {emp.status === 'REJECTED' && emp.uploadedDocs.some(d => d.status === 'REJECTED') && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.03)', padding: '0.4rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--danger)' }}>
                        <strong>İSG Evrak Red Sebebi:</strong> {emp.uploadedDocs.find(d => d.status === 'REJECTED')?.rejectReason || 'Belgeler standartlara uygun değil.'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WORK PERMITS */}
        {activeTab === 'permits' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>İş İzni Talepleri (Permit to Work)</h3>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreatePermitForm(!showCreatePermitForm)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                disabled={activeCompany.status !== 'APPROVED'}
              >
                <Plus size={14} /> Yeni İş İzni Talebi
              </button>
            </div>

            {activeCompany.status !== 'APPROVED' && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <ShieldAlert size={16} />
                <span>Şirket kurumsal belgeleriniz onaylanmadan iş izni talebi oluşturamazsınız.</span>
              </div>
            )}

            {/* Create Permit Form */}
            {showCreatePermitForm && (
              <form onSubmit={handleCreatePermitSubmit} className="glass-panel animate-fade-in" style={{ padding: '1.25rem', border: '1px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary)', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>İş İzni Onay Formu</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Çalışma Tipi *</label>
                    <select className="form-select" value={permitWorkType} onChange={e => setPermitWorkType(e.target.value)}>
                      <option value="Sıcak Çalışma">Sıcak Çalışma (Kaynak, Kesme)</option>
                      <option value="Yüksekte Çalışma">Yüksekte Çalışma</option>
                      <option value="Kapalı Alan">Kapalı Alan Girişi</option>
                      <option value="Elektrik Çalışması">Elektrik Müdahale / LOTO</option>
                      <option value="Genel Bakım">Genel Bakım ve Montaj</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Çalışma Lokasyonu *</label>
                    <input type="text" className="form-input" placeholder="Örn: A Blok Kazan Dairesi" value={permitLocation} onChange={e => setPermitLocation(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Başlangıç Tarihi *</label>
                    <input type="date" className="form-input" value={permitStartDate} onChange={e => setPermitStartDate(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Bitiş Tarihi *</label>
                    <input type="date" className="form-input" value={permitEndDate} onChange={e => setPermitEndDate(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">İşin Detaylı Açıklaması</label>
                  <textarea className="form-textarea" rows={2} placeholder="Yapılacak saha çalışmasının içeriği..." value={permitDesc} onChange={e => setPermitDesc(e.target.value)} />
                </div>

                {/* Worker Selection Checklist (Only APPROVED workers allowed!) */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Çalışacak İSG Onaylı İşçiler *</label>
                  {employees.filter(emp => emp.status === 'APPROVED').length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.02)' }}>
                      Sistemde onaylanmış işçiniz bulunmamaktadır. Lütfen önce "Çalışan Yönetimi" sekmesinden işçi ekleyip evraklarını İSG onayına sunun.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px' }}>
                      {employees.filter(emp => emp.status === 'APPROVED').map(emp => (
                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={permitWorkers.includes(emp.id)}
                            onChange={() => handleWorkerCheckboxToggle(emp.id)}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span>{emp.firstName} {emp.lastName} ({emp.id})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Safety Checklist Questions */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>İSG Önlem Kontrol Listesi (Lütfen Onaylayın)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permitChecklist.personalProtectiveEquipment} onChange={() => handleChecklistToggle('personalProtectiveEquipment')} />
                      <span>Kişisel Koruyucu Donanımlar (KKD) eksiksiz olarak temin edildi ve kullanılacaktır.</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permitChecklist.fireExtinguisherReady} onChange={() => handleChecklistToggle('fireExtinguisherReady')} />
                      <span>Çalışma alanında çalışır durumda yangın söndürme tüpü hazır bulundurulacaktır.</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permitChecklist.energyLocked} onChange={() => handleChecklistToggle('energyLocked')} />
                      <span>Elektrik ve boru hatları vanaları kapatılmış, etiketleme ve kilitleme (LOTO) yapılmıştır.</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={permitChecklist.areaIsolated} onChange={() => handleChecklistToggle('areaIsolated')} />
                      <span>Çalışma alanı emniyet şeridi ile izole edilmiş ve uyarı levhaları asılmıştır.</span>
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-success" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '0.5rem 1.2rem' }}>
                  Onaya Gönder
                </button>
              </form>
            )}

            {/* Permits List */}
            {loadingPermits ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><RefreshCw className="spin" /> Yükleniyor...</div>
            ) : permits.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Oluşturulmuş iş izni talebiniz bulunmamaktadır.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {permits.map(p => (
                  <div key={p.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>{p.id}</span>
                        <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '2px 0' }}>{p.workType}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lokasyon: <strong>{p.location}</strong></span>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '10px',
                        background: getStatusBadge(p.status).bg,
                        color: getStatusBadge(p.status).color,
                        border: getStatusBadge(p.status).border
                      }}>
                        {getStatusBadge(p.status).text}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <div><strong>İş Açıklaması:</strong> {p.description || 'Girilmedi'}</div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Geçerlilik:</strong> {new Date(p.startDate).toLocaleDateString(getLocale(lang))} - {new Date(p.endDate).toLocaleDateString(getLocale(lang))}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Yetkili İşçiler:</strong> {p.assignedWorkers.map((wId: string) => {
                          const emp = employees.find(e => e.id === wId);
                          return emp ? `${emp.firstName} ${emp.lastName}` : wId;
                        }).join(', ')}
                      </div>
                    </div>

                    {p.status === 'REJECTED' && p.rejectReason && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.03)', padding: '0.4rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--danger)', marginTop: '0.25rem' }}>
                        <strong>İSG Red Gerekçesi:</strong> {p.rejectReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
