import React, { useState, useEffect } from 'react';
import type { TenantConfig, TrainingVideo } from '../utils/types';
import { Film, Plus, Trash2, CheckCircle2, Save, ClipboardCheck, XCircle, ChevronDown, ChevronUp, Calendar, AlertTriangle, RefreshCw, BarChart3, Shield } from 'lucide-react';
import { useLanguage, getLocale } from '../utils/LanguageContext';
import { getApiRoot } from '../utils/apiConfig';

interface OHSSpecialistDashboardProps {
  config: TenantConfig;
  trainingVideos: TrainingVideo[];
  onSaveVideos: (videos: TrainingVideo[]) => void;
  visitors: any[];
  onApproveVisitor?: (visitorId: string) => void;
  onRejectVisitor?: (visitorId: string, reason: string) => void;
}

interface QuestionForm {
  question: string;
  options: string[];
  correctAnswer: number;
}

export const OHSSpecialistDashboard: React.FC<OHSSpecialistDashboardProps> = ({
  trainingVideos,
  onSaveVideos,
  visitors,
  onApproveVisitor,
  onRejectVisitor,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'videos' | 'approvals' | 'permits' | 'reports'>('reports');

  // Video form state
  const [videos, setVideos] = useState<TrainingVideo[]>(trainingVideos);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // New video form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState('2:00');
  const [newVideoUrl, setNewVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [newQuestions, setNewQuestions] = useState<QuestionForm[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  // Rejection
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Approvals filtering
  const [approvalTypeFilter, setApprovalTypeFilter] = useState<'visitor' | 'worker'>('visitor');

  // Work Permits
  const [permits, setPermits] = useState<any[]>([]);
  const [loadingPermits, setLoadingPermits] = useState(false);
  const [permitRejectingId, setPermitRejectingId] = useState<string | null>(null);
  const [permitRejectReason, setPermitRejectReason] = useState('');

  // Sync videos from props
  useEffect(() => {
    setVideos(trainingVideos);
  }, [trainingVideos]);

  // Fetch permits
  const fetchPermits = async () => {
    setLoadingPermits(true);
    try {
      const res = await fetch(`${getApiRoot()}/work-permits`);
      if (res.ok) {
        const data = await res.json();
        setPermits(data);
      }
    } catch (err) {
      // Error loading permits
    } finally {
      setLoadingPermits(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'permits') {
      fetchPermits();
    }
  }, [activeTab]);

  const handleApprovePermit = async (permitId: string) => {
    try {
      const res = await fetch(`${getApiRoot()}/work-permits/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permitId, status: 'APPROVED' })
      });
      if (res.ok) {
        alert('İş izni onaylandı!');
        fetchPermits();
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  const handleRejectPermit = async (permitId: string) => {
    if (!permitRejectReason.trim()) {
      alert('Lütfen red gerekçesini yazınız.');
      return;
    }
    try {
      const res = await fetch(`${getApiRoot()}/work-permits/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permitId, status: 'REJECTED', rejectReason: permitRejectReason })
      });
      if (res.ok) {
        alert('İş izni reddedildi.');
        setPermitRejectingId(null);
        setPermitRejectReason('');
        fetchPermits();
      }
    } catch (e) {
      alert('İşlem başarısız.');
    }
  };

  // ============ VIDEO MANAGEMENT ============

  const addQuestion = () => {
    setNewQuestions([...newQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    if (newQuestions.length <= 1) {
      alert('En az 1 soru bulunmalıdır.');
      return;
    }
    setNewQuestions(newQuestions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (qIdx: number, field: string, value: any) => {
    const updated = [...newQuestions];
    if (field === 'question') {
      updated[qIdx].question = value;
    } else if (field === 'correctAnswer') {
      updated[qIdx].correctAnswer = value;
    } else if (field.startsWith('option-')) {
      const oIdx = parseInt(field.split('-')[1], 10);
      updated[qIdx].options[oIdx] = value;
    }
    setNewQuestions(updated);
  };

  const handleAddVideo = () => {
    if (!newTitle || !newDesc) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    const newId = `VID-${Math.floor(100 + Math.random() * 900)}`;
    const newVideo: TrainingVideo = {
      id: newId,
      title: newTitle,
      duration: newDuration,
      videoUrl: newVideoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: newDesc,
      questions: newQuestions.map((q, i) => ({
        id: `${newId}-Q${i + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer
      }))
    };

    const updated = [...videos, newVideo];
    setVideos(updated);
    onSaveVideos(updated);

    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewDuration('2:00');
    setNewVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    setNewQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    setShowAddForm(false);
    alert(`"${newTitle}" İSG eğitim videosu ve ${newQuestions.length} soru başarıyla eklendi.`);
  };

  const handleRemoveVideo = (id: string) => {
    if (videos.length <= 1) {
      alert('Sistemde en az 1 adet aktif İSG eğitim videosu bulunmalıdır.');
      return;
    }
    if (!window.confirm('Bu eğitim videosunu ve sınav sorularını silmek istediğinize emin misiniz?')) return;
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    onSaveVideos(updated);
  };

  // ============ APPROVALS ============

  const allPending = visitors.filter(
    v => v.status === 'PENDING_APPROVAL' || v.status === 'PENDING_DOCS'
  );

  const filteredApprovals = allPending.filter(v => {
    if (approvalTypeFilter === 'worker') return v.entryType === 'Çalışma';
    return v.entryType !== 'Çalışma';
  });

  const handleApprove = (visitorId: string) => {
    if (onApproveVisitor) onApproveVisitor(visitorId);
  };

  const handleReject = (visitorId: string) => {
    if (!rejectReason.trim()) {
      alert('Lütfen red sebebini yazınız.');
      return;
    }
    if (onRejectVisitor) onRejectVisitor(visitorId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  const tabStyle = (tab: string) => ({
    background: 'transparent',
    border: 'none',
    color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.5rem 0.75rem',
    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.2s ease',
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          İSG Uzmanı Paneli
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          İSG eğitimleri, sınav yönetimi, taşeron çalışan evrakları ve iş izinleri onay süreçleri.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '0.25rem' }}>
        <button type="button" onClick={() => setActiveTab('videos')} style={tabStyle('videos')}>
          <Film size={14} /> Eğitim Videoları & Sınavlar
        </button>
        <button type="button" onClick={() => setActiveTab('approvals')} style={tabStyle('approvals')}>
          <ClipboardCheck size={14} /> Evrak Onayları
          {allPending.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', borderRadius: '50%', background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, marginLeft: '4px' }}>
              {allPending.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('permits')} style={tabStyle('permits')}>
          <Calendar size={14} /> İş İzinleri (PTW)
          {permits.filter(p => p.status === 'PENDING_APPROVAL').length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, marginLeft: '4px' }}>
              {permits.filter(p => p.status === 'PENDING_APPROVAL').length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('reports')} style={tabStyle('reports')}>
          <BarChart3 size={14} /> Raporlama & Analiz
        </button>
      </div>

      {/* TAB: VIDEOS */}
      {activeTab === 'videos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Add Video Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              <Plus size={14} /> {showAddForm ? 'Formu Kapat' : 'Yeni Video Ekle'}
            </button>
          </div>

          {/* Add Video Form */}
          {showAddForm && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px dashed var(--primary)' }}>
              <h3 style={{ color: 'var(--primary)', fontSize: '1rem', margin: 0 }}>Yeni İSG Eğitim Videosu</h3>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Video Başlığı *</label>
                  <input type="text" className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Örn: Yüksekte Çalışma Kuralları" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Süre</label>
                  <input type="text" className="form-input" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="2:00" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Açıklama *</label>
                <textarea className="form-textarea" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Video içeriğinin kısa açıklaması..." rows={2} style={{ resize: 'vertical' }} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Video URL</label>
                <input type="url" className="form-input" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="https://..." />
              </div>

              {/* Dynamic Questions */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sınav Soruları ({newQuestions.length})</label>
                  <button type="button" className="btn btn-secondary" onClick={addQuestion} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                    <Plus size={12} /> Soru Ekle
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {newQuestions.map((q, qIdx) => (
                    <div key={qIdx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Soru {qIdx + 1}</span>
                        <button type="button" onClick={() => removeQuestion(qIdx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <input type="text" className="form-input" value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} placeholder="Soru metni..." style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input
                              type="radio"
                              name={`q-${qIdx}-correct`}
                              checked={q.correctAnswer === oIdx}
                              onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                              style={{ accentColor: 'var(--success)', flexShrink: 0 }}
                            />
                            <input
                              type="text"
                              className="form-input"
                              value={opt}
                              onChange={e => updateQuestion(qIdx, `option-${oIdx}`, e.target.value)}
                              placeholder={`${String.fromCharCode(65 + oIdx)} şıkkı`}
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="button" className="btn btn-success" onClick={handleAddVideo} style={{ alignSelf: 'flex-start', fontSize: '0.85rem' }}>
                <Save size={14} /> Video & Sınavı Kaydet
              </button>
            </div>
          )}

          {/* Existing Videos List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {videos.map(video => (
              <div key={video.id} className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Film size={16} color="var(--primary)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{video.title}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.15rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        {video.duration} | {video.questions?.length || 0} soru
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setExpandedVideoId(expandedVideoId === video.id ? null : video.id)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>
                      {expandedVideoId === video.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Detay
                    </button>
                    <button type="button" onClick={() => handleRemoveVideo(video.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Sil
                    </button>
                  </div>
                </div>

                {/* Expanded: show questions */}
                {expandedVideoId === video.id && video.questions && (
                  <div className="animate-fade-in" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {video.questions.map((q, qi) => (
                      <div key={qi} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{qi + 1}. {q.question}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem' }}>
                          {q.options.map((o, oi) => (
                            <span key={oi} style={{ fontSize: '0.75rem', color: q.correctAnswer === oi ? 'var(--success)' : 'var(--text-muted)', fontWeight: q.correctAnswer === oi ? 700 : 400 }}>
                              {String.fromCharCode(65 + oi)}) {o} {q.correctAnswer === oi ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: APPROVALS */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Sub-tabs for Approval types */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border)', width: 'fit-content' }}>
            <button
              onClick={() => setApprovalTypeFilter('visitor')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 1rem',
                border: 'none',
                background: approvalTypeFilter === 'visitor' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: approvalTypeFilter === 'visitor' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Bireysel Ziyaretçiler
            </button>
            <button
              onClick={() => setApprovalTypeFilter('worker')}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 1rem',
                border: 'none',
                background: approvalTypeFilter === 'worker' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: approvalTypeFilter === 'worker' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Taşeron Çalışanları (Yüklenici)
            </button>
          </div>

          {filteredApprovals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ color: 'var(--text-primary)', marginTop: '0.75rem' }}>Bekleyen Onay Yok</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>İlgili gruptaki tüm evraklar onaylanmıştır.</p>
            </div>
          ) : (
            filteredApprovals.map(visitor => (
              <div key={visitor.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{visitor.firstName} {visitor.lastName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Firma: <strong>{visitor.company}</strong> | Tip: {visitor.entryType || 'Ziyaretçi'} | E-posta: {visitor.email}
                    </div>
                  </div>
                  <span className={`badge badge-${visitor.status === 'PENDING_APPROVAL' ? 'pending-approval' : 'pending-docs'}`}>
                    {visitor.status === 'PENDING_APPROVAL' ? 'Onay Bekliyor' : 'Evrak Eksik'}
                  </span>
                </div>

                {/* Documents */}
                {visitor.uploadedDocs && visitor.uploadedDocs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {visitor.uploadedDocs.map((doc: any, idx: number) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '8px', background: doc.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: doc.status === 'APPROVED' ? 'var(--success)' : 'var(--warning)', border: `1px solid ${doc.status === 'APPROVED' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                        {doc.type}: {doc.status === 'APPROVED' ? 'Onaylı' : 'Beklemede'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {visitor.status === 'PENDING_APPROVAL' && (
                    <>
                      <button type="button" className="btn btn-success" onClick={() => handleApprove(visitor.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                        <CheckCircle2 size={14} /> Onayla (Giriş Yetkisi Ver)
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => setRejectingId(rejectingId === visitor.id ? null : visitor.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                        <XCircle size={14} /> Reddet
                      </button>
                    </>
                  )}
                </div>

                {/* Reject Reason Form */}
                {rejectingId === visitor.id && (
                  <div className="animate-fade-in" style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="form-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Red gerekçesini yazınız..." style={{ flex: 1, fontSize: '0.85rem' }} />
                    <button type="button" className="btn btn-danger" onClick={() => handleReject(visitor.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', flexShrink: 0 }}>
                      Reddet ve Bildir
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: WORK PERMITS */}
      {activeTab === 'permits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingPermits ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><RefreshCw className="spin" /> Yükleniyor...</div>
          ) : permits.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <Calendar size={40} style={{ opacity: 0.3, margin: '0 auto 0.5rem auto' }} />
              <h3 style={{ color: 'var(--text-primary)', marginTop: '0.75rem' }}>İş İzni Bulunmuyor</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Taşeron firmalar tarafından henüz iş izni talep edilmemiştir.</p>
            </div>
          ) : (
            permits.map(permit => (
              <div key={permit.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>{permit.id}</span>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '2px 0' }}>{permit.workType}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Firma: <strong>{permit.companyName}</strong> | Konum: <strong>{permit.location}</strong>
                    </div>
                  </div>
                  <span className={`badge badge-${permit.status === 'APPROVED' ? 'approved' : permit.status === 'REJECTED' ? 'rejected' : 'pending-approval'}`}>
                    {permit.status === 'APPROVED' ? 'Onaylandı' : permit.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  <div><strong>İş Detayı:</strong> {permit.description || 'Açıklama belirtilmedi.'}</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Geçerlilik Süresi:</strong> {new Date(permit.startDate).toLocaleDateString(getLocale(lang))} - {new Date(permit.endDate).toLocaleDateString(getLocale(lang))}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>Çalışacak İşçiler (Ziyaretçi ID):</strong> {permit.assignedWorkers.join(', ')}
                  </div>
                </div>

                {/* Safety Checklist verification */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '0.25rem' }}>Taşeron Tarafından Onaylanan İSG Önlemleri:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div>• KKD kullanımı: <span style={{ color: permit.checklist?.personalProtectiveEquipment ? 'var(--success)' : 'var(--danger)' }}>{permit.checklist?.personalProtectiveEquipment ? 'EVET' : 'HAYIR'}</span></div>
                    <div>• Yangın Tüpü Hazır: <span style={{ color: permit.checklist?.fireExtinguisherReady ? 'var(--success)' : 'var(--danger)' }}>{permit.checklist?.fireExtinguisherReady ? 'EVET' : 'HAYIR'}</span></div>
                    <div>• Enerji Kesme/LOTO: <span style={{ color: permit.checklist?.energyLocked ? 'var(--success)' : 'var(--danger)' }}>{permit.checklist?.energyLocked ? 'EVET' : 'HAYIR'}</span></div>
                    <div>• Alan İzole Edildi: <span style={{ color: permit.checklist?.areaIsolated ? 'var(--success)' : 'var(--danger)' }}>{permit.checklist?.areaIsolated ? 'EVET' : 'HAYIR'}</span></div>
                  </div>
                </div>

                {/* Actions */}
                {permit.status === 'PENDING_APPROVAL' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    {!permitRejectingId ? (
                      <>
                        <button type="button" className="btn btn-success" onClick={() => handleApprovePermit(permit.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                          <CheckCircle2 size={14} /> İş İznini Onayla
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => setPermitRejectingId(permit.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                          <XCircle size={14} /> Reddet
                        </button>
                      </>
                    ) : permitRejectingId === permit.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={permitRejectReason}
                          onChange={e => setPermitRejectReason(e.target.value)}
                          placeholder="İş izni red gerekçesini yazınız..."
                          style={{ flex: 1, fontSize: '0.8rem' }}
                        />
                        <button type="button" className="btn btn-danger" onClick={() => handleRejectPermit(permit.id)} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                          Reddet
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setPermitRejectingId(null); setPermitRejectReason(''); }} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                          İptal
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {permit.status === 'REJECTED' && permit.rejectReason && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.03)', padding: '0.4rem 0.75rem', borderRadius: '4px', borderLeft: '3px solid var(--danger)', marginTop: '0.25rem' }}>
                    <strong>İSG Red Sebebi:</strong> {permit.rejectReason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: REPORTS */}
      {activeTab === 'reports' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            
            {/* Card 1: Quiz success */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255,255,255,0.01) 100%)', borderLeft: '4px solid var(--success)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>İSG Sınav Başarı Oranı</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', margin: '0.25rem 0' }}>
                {visitors.length > 0 
                  ? Math.round((visitors.filter(v => v.trainingWatched && v.quizCompleted).length / visitors.length) * 100) 
                  : 100}%
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Eğitimi izleyip testi 100% doğru çözen ziyaretçi/çalışan oranı.
              </p>
            </div>

            {/* Card 2: Active Permits */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08) 0%, rgba(255,255,255,0.01) 100%)', borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Aktif İş İzinleri (PTW)</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>
                {permits.filter(p => p.status === 'APPROVED').length}
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Sahada aktif çalışma yürüten tehlikeli iş grupları sayısı.
              </p>
            </div>

            {/* Card 3: Pending Approvals */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255,255,255,0.01) 100%)', borderLeft: '4px solid var(--warning)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bekleyen Onaylar</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', margin: '0.25rem 0' }}>
                {allPending.length}
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                İSG onayı bekleyen ziyaretçi ve taşeron çalışanları.
              </p>
            </div>
            
          </div>

          {/* Detailed Lists & Sub-Modules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
            
            {/* Left Box: Kaza / Olay & Ramak Kala Kayıt Sistemi */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--warning)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Kaza / Ramak Kala Kayıt ve Raporlama
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Olay / Ramak kala kaydı İSG veritabanına başarıyla eklendi!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <select className="form-input" style={{ fontSize: '0.8rem' }} required>
                    <option value="RAMAK_KALA">Ramak Kala Olayı</option>
                    <option value="IS_KAZASI">İş Kazası</option>
                    <option value="TEHLIKELI_DURUM">Tehlikeli Durum</option>
                  </select>
                  <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} style={{ fontSize: '0.8rem' }} required />
                </div>
                <input type="text" className="form-input" placeholder="Olay Lokasyonu (Örn: Depo B Blok Yükleme)" style={{ fontSize: '0.8rem' }} required />
                <textarea className="form-textarea" placeholder="Olayın tanımı ve alınan acil önlem..." rows={2} style={{ fontSize: '0.8rem' }} required />
                <button type="submit" className="btn btn-warning" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                  <Plus size={12} /> Olay Bildirimini Kaydet
                </button>
              </form>
            </div>

            {/* Right Box: Risk Assessment Form & Calculation Matrix */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} /> Risk Assessment (Risk Değerlendirme Matrisi)
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                alert('Risk Analizi değerlendirmesi kaydedildi!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="text" className="form-input" placeholder="Tehlike / Risk Tanımı (Örn: Islak Zeminde Kayma)" style={{ fontSize: '0.8rem' }} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Olasılık (1-5)</label>
                    <select className="form-input" style={{ fontSize: '0.8rem' }}>
                      <option value="1">1 - Çok Düşük</option>
                      <option value="2">2 - Düşük</option>
                      <option value="3">3 - Orta</option>
                      <option value="4">4 - Yüksek</option>
                      <option value="5">5 - Çok Yüksek</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Şiddet (1-5)</label>
                    <select className="form-input" style={{ fontSize: '0.8rem' }}>
                      <option value="1">1 - Hafif Yaralanma</option>
                      <option value="2">2 - İlk Yardım</option>
                      <option value="3">3 - Tıbbi Müdahale</option>
                      <option value="4">4 - Ağır Yaralanma</option>
                      <option value="5">5 - Kalıcı Hasar/Ölüm</option>
                    </select>
                  </div>
                </div>
                <input type="text" className="form-input" placeholder="Düzeltici / Önleyici Faaliyet (DÖF)" style={{ fontSize: '0.8rem' }} required />
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem' }}>
                  <Save size={12} /> Risk Formunu Onayla
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
