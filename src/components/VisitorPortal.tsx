import React, { useState, useEffect } from 'react';
import type { Visitor, TrainingVideo, DocumentType, TenantConfig } from '../utils/types';

import { QRCodeSVG } from 'qrcode.react';
import { User, Phone, Play, CheckCircle2, AlertTriangle, Upload, X, ShieldAlert, Award, FileCheck, XCircle } from 'lucide-react';

interface VisitorPortalProps {
  visitors: Visitor[];
  trainingVideos: TrainingVideo[];
  onUploadDocs: (visitorId: string, docs: { type: DocumentType; name: string }[]) => void;
  onCompleteTraining: (visitorId: string, score: number) => void;
  config: TenantConfig;
}

export const VisitorPortal: React.FC<VisitorPortalProps> = ({
  visitors,
  trainingVideos,
  onUploadDocs,
  onCompleteTraining,
  config,
}) => {
  // Visitor Login simulation
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [activeVisitor, setActiveVisitor] = useState<Visitor | null>(null);

  // Self-Service Pre-registration state
  const [preRegIdNo, setPreRegIdNo] = useState('');
  const [preRegPlate, setPreRegPlate] = useState('');
  const [preRegEmergency, setPreRegEmergency] = useState('');
  const [preRegKvkk, setPreRegKvkk] = useState(false);
  const [isPreRegistered, setIsPreRegistered] = useState(false);

  // Video and Quiz States
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);

  // File Upload States
  const [uploadingDocType, setUploadingDocType] = useState<DocumentType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Auto login if URL hash/param token is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || window.location.pathname.split('/invite/')[1];
    if (token) {
      // Decode or match visitor
      fetch(`http://localhost:5000/api/visitors/invite/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.visitor) {
            setActiveVisitor(data.visitor);
            if (data.visitor.idNo) setIsPreRegistered(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogin = (phoneOrCode: string) => {
    const query = phoneOrCode.trim().toUpperCase();
    const found = visitors.find(v => v.phone === query.replace(/\D/g, '') || v.id.toUpperCase() === query);
    if (found) {
      setActiveVisitor(found);
      if (found.idNo) setIsPreRegistered(true);
      setVideoCompleted(found.trainingWatched);
      setVideoProgress(found.trainingWatched ? 100 : 0);
      if (found.quizCompleted && found.quizScore !== undefined) {
        setQuizScore(found.quizScore);
      } else {
        setQuizScore(null);
        setQuizStarted(false);
        setCurrentQuestionIdx(0);
        setSelectedAnswers({});
      }
    } else {
      alert('Bu telefon numarası veya davet kodu (Örn: INV-123456) ile kayıtlı davetiye bulunamadı.');
    }
  };

  const handleSavePreReg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preRegIdNo || !preRegKvkk) {
      alert('Lütfen T.C. / Pasaport No alanını doldurun ve KVKK metnini onaylayın.');
      return;
    }
    if (activeVisitor) {
      const updated = {
        ...activeVisitor,
        idNo: preRegIdNo,
        plateNumber: preRegPlate,
        emergencyContact: preRegEmergency,
        kvkkApproved: preRegKvkk,
        status: activeVisitor.status === 'INVITED' ? ('PENDING_DOCS' as const) : activeVisitor.status
      };
      setActiveVisitor(updated);
      setIsPreRegistered(true);
    }
  };

  const activeVideo = trainingVideos.find(v => v.id === activeVisitor?.trainingId) || trainingVideos[0];
  const activeQuiz = activeVideo?.questions || [];

  // Video timer simulation
  useEffect(() => {
    let interval: any;
    if (videoPlaying && videoProgress < 100) {
      interval = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 100) {
            setVideoPlaying(false);
            setVideoCompleted(true);
            return 100;
          }
          return prev + 5; // increments progress
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [videoPlaying, videoProgress]);

  // Quiz submission
  const handleAnswerSelect = (optionIdx: number) => {
    const currentQuestion = activeQuiz[currentQuestionIdx];
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIdx
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < activeQuiz.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      activeQuiz.forEach(q => {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });

      setQuizScore(correctCount);
      if (correctCount === activeQuiz.length) {
        onCompleteTraining(activeVisitor!.id, correctCount);
        setQuizError(false);
      } else {
        setQuizError(true);
      }
    }
  };

  const handleRetryQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizScore(null);
    setQuizError(false);
    setQuizStarted(true);
  };

  // Mock File Uploader
  const handleFileUpload = (docType: DocumentType | string) => {
    setUploadingDocType(docType);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const fileName = `${docType.toLowerCase()}_belgesi_${activeVisitor?.firstName.toLowerCase()}_${activeVisitor?.lastName.toLowerCase()}.pdf`;
            
            // Send upload data to main App state
            onUploadDocs(activeVisitor!.id, [{ type: docType, name: fileName }]);
            
            setUploadingDocType(null);
            setUploadProgress(0);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const getDocNameTurkish = (type: DocumentType | string) => {
    switch (type) {
      case 'ISG': return 'İSG Katılım Belgesi';
      case 'SGK': return 'SGK İşe Giriş Bildirgesi';
      case 'ID_COPY': return 'Kimlik Fotokopisi';
      default: return 'Ek Belge';
    }
  };

  // Check progress steps
  const isTrainingPassed = activeVisitor?.trainingWatched && activeVisitor?.quizCompleted && activeVisitor?.quizScore === activeQuiz.length;
  const isDocsUploaded = activeVisitor?.requiredDocs.every(reqDoc => 
    activeVisitor.uploadedDocs.some(upDoc => upDoc.type === reqDoc && (upDoc.status === 'PENDING' || upDoc.status === 'APPROVED'))
  );
  
  const getOverlayContent = () => {
    if (!activeVisitor) return null;
    switch (activeVisitor.status) {
      case 'PENDING_DOCS':
        return { text: 'EVRAK EKSİK / EĞİTİM EKSİK', bg: 'rgba(245, 158, 11, 0.8)' };
      case 'PENDING_APPROVAL':
        return { text: 'ONAY BEKLENİYOR', bg: 'rgba(5, 7, 12, 0.8)' };
      case 'REJECTED':
        return { text: 'BELGELER REDDEDİLDİ', bg: 'rgba(239, 68, 68, 0.85)' };
      case 'CHECKED_OUT':
        return { text: 'ZİYARET SONLANDI / GEÇERSİZ', bg: 'rgba(74, 85, 104, 0.9)' };
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>

      {/* Mobile Device Frame */}
      <div className="mobile-emulator-container">
        <div className="mobile-emulator">
          
          {/* Mobile App Header (Status Bar mockup) */}
          <div style={{ height: '30px', background: '#0b0f19', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', fontSize: '9px', color: 'var(--text-muted)' }}>
            <span>09:41</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span>📶</span>
              <span>🔋 100%</span>
            </div>
          </div>

          <div className="mobile-content">
            
            {/* Login View */}
            {!activeVisitor ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '1.5rem', padding: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    height: `${(config.logoHeight || 40) * 1.5}px`,
                    width: 'auto',
                    minWidth: `${(config.logoHeight || 40) * 1.5}px`,
                    background: config.logoUrl ? 'transparent' : 'var(--primary-gradient)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: config.logoUrl ? 'none' : 'var(--shadow-glow)',
                    overflow: 'hidden'
                  }}>
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
                    ) : (
                      <User size={Math.round((config.logoHeight || 40) * 0.75)} color="#050510" />
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{config.appName} Misafir Girişi</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Tesis giriş İSG sürecinizi tamamlamak ve dijital giriş kartınızı almak için telefon numaranızı girin.
                  </p>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Cep Telefonu Numaranız</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Örn: 5551234567"
                      value={selectedPhone}
                      onChange={e => setSelectedPhone(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => handleLogin(selectedPhone)}>
                  SMS Kodu Gönder & Giriş Yap
                </button>
              </div>
            ) : (
              
              /* Active Portal View */
              <>
                {/* Visitor Portal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 'bold' }}>MİSAFİR PORTALI</span>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>Hoş Geldiniz, {activeVisitor.firstName}!</h3>
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{activeVisitor.company}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveVisitor(null);
                      setVideoCompleted(false);
                      setVideoProgress(0);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifySelf: 'center', color: '#fff', cursor: 'pointer', justifyContent: 'center' }}
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* PRE-REGISTRATION FORM STEP (0. Ön Bilgi Formu) */}
                {!isPreRegistered ? (
                  <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <FileCheck size={14} color="var(--primary)" />
                      <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Adım 0: Ziyaretçi Ön Bilgi Formu</h4>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Tesisimize giriş yapmadan önce lütfen aşağıdaki zorunlu bilgileri doldurunuz.
                    </p>
                    <form onSubmit={handleSavePreReg} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">T.C. Kimlik / Pasaport No *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Kimlik numaranızı girin"
                          value={preRegIdNo}
                          onChange={e => setPreRegIdNo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Araç Plakası (Opsiyonel)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Örn: 34 ABC 123"
                          value={preRegPlate}
                          onChange={e => setPreRegPlate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Acil Durum İletişim Kişisi & Tel</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ad Soyad - 05xx xxx xx xx"
                          value={preRegEmergency}
                          onChange={e => setPreRegEmergency(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input
                          type="checkbox"
                          id="kvkkCheck"
                          checked={preRegKvkk}
                          onChange={e => setPreRegKvkk(e.target.checked)}
                          style={{ marginTop: '3px' }}
                          required
                        />
                        <label htmlFor="kvkkCheck" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          KVKK Aydınlatma Metnini ve Tesis İSG Güvenlik Kurallarını okudum, kabul ediyorum.
                        </label>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        Bilgileri Kaydet & Eğitime Geç
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: TRAINING AND QUIZ */}
                    {!isTrainingPassed && (
                  <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <Play size={14} color="var(--primary)" />
                      <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Adım 1: Zorunlu İSG Eğitimi</h4>
                    </div>

                    {!videoCompleted ? (
                      <>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Lütfen giriş yapabilmek için atanan eğitim videosunu kesintisiz izleyin.
                        </p>

                        {/* Simulated Video Player */}
                        <div style={{ width: '100%', height: '160px', background: '#000', borderRadius: '8px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          {videoPlaying ? (
                            <>
                              {/* Simulated live video scene */}
                              <video
                                src={activeVideo.videoUrl}
                                autoPlay
                                muted
                                loop
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                              />
                              <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px' }}>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', width: '100%', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', background: 'var(--primary)', width: `${videoProgress}%` }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#fff', marginTop: '4px' }}>
                                  <span>Oynatılıyor...</span>
                                  <span>{Math.floor(videoProgress * 1.5 / 60)}:{(Math.floor(videoProgress * 1.5) % 60).toString().padStart(2, '0')} / {activeVideo.duration}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', zIndex: 2 }}>
                              <button
                                onClick={() => setVideoPlaying(true)}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-gradient)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px var(--primary-glow)' }}
                              >
                                <Play size={20} color="#050510" style={{ marginLeft: '2px' }} />
                              </button>
                              <div style={{ color: '#fff', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{activeVideo.title}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Süre: {activeVideo.duration}</div>
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{activeVideo.description}</p>
                      </>
                    ) : (
                      /* Video Done, Take Quiz */
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {!quizStarted && quizScore === null ? (
                          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                              <CheckCircle2 size={16} /> Eğitim Videosu İzlendi
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                              Eğitimi başarıyla tamamladınız. Dijital kartınızı aktive edebilmek için 3 soruluk İSG bilgi sınavını başarıyla geçmeniz gerekmektedir (Tüm sorular doğru cevaplanmalıdır).
                            </p>
                            <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => setQuizStarted(true)}>
                              Sınavı Başlat
                            </button>
                          </div>
                        ) : quizStarted && quizScore === null ? (
                          /* Active Quiz Questions */
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              <span>Soru {currentQuestionIdx + 1} / {activeQuiz.length}</span>
                              <span style={{ color: 'var(--primary)' }}>İSG Değerlendirmesi</span>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.4 }}>
                              {activeQuiz[currentQuestionIdx].question}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {activeQuiz[currentQuestionIdx].options.map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleAnswerSelect(idx)}
                                  style={{
                                    textAlign: 'left',
                                    padding: '0.6rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    borderColor: selectedAnswers[activeQuiz[currentQuestionIdx].id] === idx ? 'var(--primary)' : 'var(--border)',
                                    background: selectedAnswers[activeQuiz[currentQuestionIdx].id] === idx ? 'rgba(0, 210, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                                    color: selectedAnswers[activeQuiz[currentQuestionIdx].id] === idx ? 'var(--primary)' : 'var(--text-primary)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>

                            <button
                              disabled={selectedAnswers[activeQuiz[currentQuestionIdx].id] === undefined}
                              onClick={handleNextQuestion}
                              className="btn btn-primary"
                              style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', fontSize: '0.8rem' }}
                            >
                              {currentQuestionIdx < activeQuiz.length - 1 ? 'Sonraki Soru' : 'Sınavı Bitir'}
                            </button>
                          </div>
                        ) : (
                          /* Quiz Results */
                          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            {quizError ? (
                              <>
                                <ShieldAlert size={36} color="var(--danger)" style={{ margin: '0 auto 0.5rem auto' }} />
                                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>Test Başarısız! ({quizScore} / 3 Doğru)</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem 0', lineHeight: 1.4 }}>
                                  Dijital kartın aktif olabilmesi için tüm sorulara doğru cevap verilmelidir. Lütfen eğitim kurallarını inceleyip testi tekrar çözün.
                                </p>
                                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={handleRetryQuiz}>
                                  Testi Tekrar Çöz
                                </button>
                              </>
                            ) : (
                              <>
                                <Award size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
                                <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700 }}>Test Başarılı! (3 / 3 Doğru)</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1rem 0' }}>
                                  Tebrikler, İSG eğitim sınavını başarıyla geçtiniz. Artık belgelerinizi yükleyebilirsiniz.
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: DOCUMENTS UPLOADER */}
                {isTrainingPassed && !isDocsUploaded && (
                  <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                      <Upload size={14} color="var(--primary)" />
                      <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Adım 2: Gerekli Evrak Yükleme</h4>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Lütfen tesis giriş standartları gereği istenen evrakları PDF veya Görsel formatta yükleyin.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeVisitor.requiredDocs.map(docType => {
                        const uploaded = activeVisitor.uploadedDocs.find(d => d.type === docType);
                        
                        return (
                          <div key={docType} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                                {getDocNameTurkish(docType)}
                              </span>
                              {uploaded ? (
                                <span style={{ fontSize: '7.5px', padding: '1px 5px', borderRadius: '4px', background: uploaded.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : uploaded.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(0,210,255,0.1)', color: uploaded.status === 'APPROVED' ? 'var(--success)' : uploaded.status === 'REJECTED' ? 'var(--danger)' : 'var(--primary)' }}>
                                  {uploaded.status === 'APPROVED' ? 'Onaylandı' : uploaded.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>Yüklenmedi</span>
                              )}
                            </div>

                            {/* Show rejection reason if applicable */}
                            {uploaded?.status === 'REJECTED' && (
                              <div style={{ fontSize: '7.5px', color: 'var(--danger)', padding: '2px 4px', background: 'rgba(239,68,68,0.05)', borderRadius: '2px', borderLeft: '2px solid var(--danger)', marginTop: '2px' }}>
                                <strong>Red Nedeni:</strong> {uploaded.rejectReason}
                              </div>
                            )}

                            {/* Upload action */}
                            {!uploaded || uploaded.status === 'REJECTED' ? (
                              uploadingDocType === docType ? (
                                <div style={{ height: '30px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--primary-glow)', width: `${uploadProgress}%`, transition: 'width 0.1s linear' }} />
                                  <span style={{ fontSize: '8px', zIndex: 1, color: '#fff' }}>Yükleniyor... %{uploadProgress}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleFileUpload(docType)}
                                  style={{
                                    width: '100%',
                                    height: '30px',
                                    border: '1px dashed rgba(0, 210, 255, 0.4)',
                                    borderRadius: '4px',
                                    background: 'transparent',
                                    color: 'var(--primary)',
                                    fontSize: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  <Upload size={10} /> Dosya Seç veya Sürükle
                                </button>
                              )
                            ) : (
                              <div style={{ fontSize: '7.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <FileCheck size={10} color="var(--success)" /> {uploaded.name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: DIGITAL CARD / WALLET PASS */}
                {isTrainingPassed && isDocsUploaded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    
                    {/* Wallet-style Digital Pass */}
                    <div className="pass-card">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '8px', color: 'var(--primary)', letterSpacing: '0.05em', fontWeight: 700 }}>TESİS GİRİŞ KARTI</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>{config.appName.toUpperCase()} CARD</div>
                        </div>
                        {activeVisitor.status === 'APPROVED' || activeVisitor.status === 'CHECKED_IN' ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '4px', padding: '1px 5px', fontSize: '8px', fontWeight: 'bold' }}>
                            GEÇERLİ
                          </span>
                        ) : activeVisitor.status === 'REJECTED' ? (
                          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '1px 5px', fontSize: '8px', fontWeight: 'bold' }}>
                            REDDEDİLDİ
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '4px', padding: '1px 5px', fontSize: '8px', fontWeight: 'bold' }}>
                            ONAY BEKLİYOR
                          </span>
                        )}
                      </div>

                      {/* Card Content (QR code and details) */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        {/* QR Code Container */}
                        <div style={{
                          background: '#fff',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          filter: getOverlayContent() ? 'blur(2px) grayscale(100%)' : 'none',
                          transition: 'filter 0.3s ease',
                          position: 'relative'
                        }}>
                          {getOverlayContent() ? (
                            <>
                              <QRCodeSVG value="MOCK_LOCKED_PASS" size={110} />
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getOverlayContent()?.bg, borderRadius: '8px', color: '#fff', fontSize: '7px', fontWeight: 'bold', padding: '6px', textAlign: 'center', lineHeight: 1.2 }}>
                                {getOverlayContent()?.text}
                              </div>
                            </>
                          ) : (
                            <QRCodeSVG value={activeVisitor.qrCodeData || activeVisitor.id} size={110} />
                          )}
                        </div>

                        {/* Guest Details */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                            {activeVisitor.firstName} {activeVisitor.lastName}
                          </span>
                          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)' }}>
                            {activeVisitor.company}
                          </span>
                          
                          {/* Grid with small data fields */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontSize: '8px', textAlign: 'left' }}>
                            <div>
                              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Ziyaret Edilen</span>
                              <strong>{activeVisitor.hostName}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Tesis Giriş Tarihi</span>
                              <strong>{activeVisitor.plannedDate}</strong>
                            </div>
                          </div>
                        </div>

                      </div>
                      
                      {/* Barcode line mock at the bottom */}
                      <div style={{ width: '100%', height: '16px', background: 'repeating-linear-gradient(90deg, #fff 0px, #fff 2px, transparent 2px, transparent 4px)', marginTop: '0.85rem', opacity: 0.3 }} />
                    </div>
                  </div>
                )}

                {/* Feedback Alert under Card */}
                    {activeVisitor.status === 'PENDING_DOCS' && (
                      <div className="glass-panel" style={{ padding: '0.75rem', width: '100%', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Eksik evraklarınız veya tamamlanmamış İSG eğitiminiz bulunmaktadır. Lütfen yukarıdaki adımları takip ederek süreci tamamlayınız.
                        </span>
                      </div>
                    )}

                    {activeVisitor.status === 'PENDING_APPROVAL' && (
                      <div className="glass-panel" style={{ padding: '0.75rem', width: '100%', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.25)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <AlertTriangle size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          İSG eğitimini tamamladınız ve evraklarınızı yüklediniz. İSG Uzmanı veya Sekreterya onayından sonra QR kodunuz aktifleşecektir.
                        </span>
                      </div>
                    )}

                    {activeVisitor.status === 'REJECTED' && (
                      <div className="glass-panel" style={{ padding: '0.75rem', width: '100%', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <XCircle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Evraklarınız reddedilmiştir. Red Gerekçesi: <strong>{activeVisitor.uploadedDocs.find(d => d.status === 'REJECTED')?.rejectReason || 'Lütfen belgelerinizi gözden geçirin.'}</strong>. Lütfen evrakları yeniden yükleyin.
                        </span>
                      </div>
                    )}

                    {activeVisitor.status === 'CHECKED_OUT' && (
                      <div className="glass-panel" style={{ padding: '0.75rem', width: '100%', background: 'rgba(156, 163, 175, 0.05)', border: '1px solid rgba(156, 163, 175, 0.25)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <XCircle size={24} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Tesis çıkış kaydınız alınmıştır. Giriş kartınız iptal edilmiştir. Tekrar giriş için yeni davet oluşturulmalıdır.
                        </span>
                      </div>
                    )}

                    {(activeVisitor.status === 'APPROVED' || activeVisitor.status === 'CHECKED_IN') && (
                      <div className="glass-panel" style={{ padding: '0.75rem', width: '100%', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <CheckCircle2 size={24} color="var(--success)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          Giriş kartınız onaylanmıştır! Güvenlik kapısına ulaştığınızda yukarıdaki QR kodu görevliye okutarak tesise anında giriş sağlayabilirsiniz.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
