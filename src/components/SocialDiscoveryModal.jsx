import React from 'react';
import { 
  CheckCircle2, ExternalLink, Sparkles, Globe, Share2, Check, ArrowRight, Building, User, Info
} from 'lucide-react';

const LinkedinIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const FacebookIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const TwitterIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const YouTubeIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function SocialDiscoveryModal({
  isOpen,
  onClose,
  candidates = [],
  client,
  verificationSocials,
  setVerificationSocials,
  onConfirm,
  isEnriching
}) {
  if (!isOpen) return null;

  const handleApplyCandidate = (candidate) => {
    const plat = (candidate.platform || '').toLowerCase();
    if (plat.includes('linkedin')) {
      setVerificationSocials(prev => ({ ...prev, linkedinUrl: candidate.url }));
    } else if (plat.includes('instagram')) {
      setVerificationSocials(prev => ({ ...prev, instagramUrl: candidate.url }));
    } else if (plat.includes('tiktok')) {
      setVerificationSocials(prev => ({ ...prev, tiktokUrl: candidate.url }));
    } else if (plat.includes('twitter') || plat.includes('x')) {
      setVerificationSocials(prev => ({ ...prev, twitterUrl: candidate.url }));
    } else if (plat.includes('youtube')) {
      setVerificationSocials(prev => ({ ...prev, youtubeUrl: candidate.url }));
    } else if (plat.includes('facebook')) {
      setVerificationSocials(prev => ({ ...prev, facebookUrl: candidate.url }));
    } else {
      setVerificationSocials(prev => ({ ...prev, websiteUrl: candidate.url }));
    }
  };

  const getPlatformIcon = (platformStr) => {
    const p = (platformStr || '').toLowerCase();
    if (p.includes('linkedin')) return <LinkedinIcon size={14} color="#60a5fa" />;
    if (p.includes('instagram')) return <InstagramIcon size={14} color="#f472b6" />;
    if (p.includes('tiktok')) return <TikTokIcon size={14} color="#38bdf8" />;
    if (p.includes('twitter') || p.includes('x')) return <TwitterIcon size={14} color="#cbd5e1" />;
    if (p.includes('youtube')) return <YouTubeIcon size={14} color="#f87171" />;
    if (p.includes('facebook')) return <FacebookIcon size={14} color="#93c5fd" />;
    return <Globe size={14} color="#a855f7" />;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '720px', padding: '32px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Sparkles size={22} color="#c084fc" />
            Candidate Online Accounts & Signals
          </h2>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: '600', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            {candidates.length} Signals Discovered
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
          Gemini Search Grounding searched LinkedIn, Instagram, TikTok, Facebook, X, YouTube, and Singapore Business News for <strong>{client?.fullName}</strong>. Review and confirm verified links below before running deep extraction.
        </p>

        {/* Candidates List */}
        {candidates.length > 0 ? (
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={13} color="#60a5fa" /> Discovered Candidate Profiles (Click 'Apply' to verify):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
              {candidates.map((cand, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '12px 14px', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-light)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {getPlatformIcon(cand.platform)} {cand.platform}
                      </span>
                      {cand.confidence && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          backgroundColor: cand.confidence === 'High' ? 'rgba(16, 185, 129, 0.15)' : cand.confidence === 'Medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.08)', 
                          color: cand.confidence === 'High' ? '#34d399' : cand.confidence === 'Medium' ? '#fbbf24' : 'var(--text-muted)',
                          fontWeight: '600'
                        }}>
                          {cand.confidence} Match
                        </span>
                      )}
                      {cand.matchReason && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          • {cand.matchReason}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                      {cand.title || cand.url}
                    </div>

                    {cand.snippet && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                        "{cand.snippet}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleApplyCandidate(cand)}
                      title="Apply URL to Form"
                    >
                      <Check size={12} /> Apply
                    </button>
                    {cand.url && (
                      <a 
                        href={cand.url.startsWith('http') ? cand.url : `https://${cand.url}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn" 
                        style={{ padding: '5px 8px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                        title="Open in Browser"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-light)', marginBottom: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            No automatic candidate matches returned. You can enter known profile handles and URLs manually below.
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={onConfirm}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <Building size={13} color="#60a5fa" /> Company Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="e.g. DBS Bank, Google, ByteDance" 
                  value={verificationSocials.companyName || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, companyName: e.target.value })} 
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <User size={13} color="#34d399" /> Job Title / Designation
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="e.g. VP, Managing Director, Founder" 
                  value={verificationSocials.jobTitle || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, jobTitle: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <LinkedinIcon size={13} color="#60a5fa" /> LinkedIn URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://linkedin.com/in/..." 
                  value={verificationSocials.linkedinUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, linkedinUrl: e.target.value })} 
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <InstagramIcon size={13} color="#f472b6" /> Instagram Handle / URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://instagram.com/... or @handle" 
                  value={verificationSocials.instagramUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, instagramUrl: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <TikTokIcon size={13} color="#38bdf8" /> TikTok Handle / URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://tiktok.com/@... or @handle" 
                  value={verificationSocials.tiktokUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, tiktokUrl: e.target.value })} 
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <TwitterIcon size={13} color="#cbd5e1" /> X / Twitter Handle / URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://x.com/... or @handle" 
                  value={verificationSocials.twitterUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, twitterUrl: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <YouTubeIcon size={13} color="#f87171" /> YouTube Channel URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://youtube.com/@... or channel link" 
                  value={verificationSocials.youtubeUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, youtubeUrl: e.target.value })} 
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                  <FacebookIcon size={13} color="#93c5fd" /> Facebook Profile URL
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '100%', fontSize: '13px' }} 
                  placeholder="https://facebook.com/..." 
                  value={verificationSocials.facebookUrl || ''} 
                  onChange={(e) => setVerificationSocials({ ...verificationSocials, facebookUrl: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px' }}>
                <Globe size={13} color="#a855f7" /> Company / Personal Website
              </label>
              <input 
                type="text" 
                className="input-field" 
                style={{ width: '100%', fontSize: '13px' }} 
                placeholder="https://example.com" 
                value={verificationSocials.websiteUrl || ''} 
                onChange={(e) => setVerificationSocials({ ...verificationSocials, websiteUrl: e.target.value })} 
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} 
              onClick={onClose}
              disabled={isEnriching}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 20px',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
              }}
              disabled={isEnriching}
            >
              <Sparkles size={15} />
              Confirm & Deep Extract 360° Dossier
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
