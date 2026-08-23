import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Search, RefreshCw, Trash2, Compass, Heart, TrendingUp, Target, 
  MessageSquare, Copy, Check, Newspaper, Plus, ExternalLink, FileText, 
  ChevronDown, ChevronUp, Image, Shield, Clock, Globe, Briefcase, 
  AlertTriangle, CheckCircle2, Share2, Key
} from 'lucide-react';
import SocialDiscoveryModal from './SocialDiscoveryModal';
import PreMeetingBriefModal from './PreMeetingBriefModal';
import AddSocialPostModal from './AddSocialPostModal';

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

const SocialPostImage = ({ src, caption }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return null;
  }

  return (
    <div style={{ width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={src}
        alt={caption || 'Post image'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        onError={() => setHasError(true)}
        style={{ width: '100%', maxHeight: '550px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
      />
      <div style={{ width: '100%', padding: '8px 14px', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <span>📸 {caption || 'Post Photo (Full Resolution)'}</span>
        <a href={src} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          🔎 Open Full Image ↗
        </a>
      </div>
    </div>
  );
};

export default function ClientSocialIntelligenceSection({
  currentClient,
  setCurrentClient,
  socialLinks,
  setSocialLinks,
  aiDossier,
  setAiDossier,
  socialPosts,
  setSocialPosts,
  setIsSocialModalOpen
}) {
  const [customSearchHints, setCustomSearchHints] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCandidates, setDiscoveredCandidates] = useState([]);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationSocials, setVerificationSocials] = useState({
    companyName: currentClient.companyName || '',
    jobTitle: currentClient.jobTitle || '',
    linkedinUrl: currentClient.linkedinUrl || '',
    facebookUrl: currentClient.facebookUrl || '',
    instagramUrl: currentClient.instagramUrl || '',
    tiktokUrl: currentClient.tiktokUrl || '',
    twitterUrl: currentClient.twitterUrl || '',
    youtubeUrl: currentClient.youtubeUrl || '',
    threadsUrl: currentClient.threadsUrl || '',
    websiteUrl: currentClient.websiteUrl || ''
  });

  const [enrichLoading, setEnrichLoading] = useState(false);
  const [copiedIcebreakerIdx, setCopiedIcebreakerIdx] = useState(null);
  const [isBrowserScanning, setIsBrowserScanning] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);

  // Pre-Meeting Brief State
  const [isPreMeetingModalOpen, setIsPreMeetingModalOpen] = useState(false);
  const [preMeetingBriefData, setPreMeetingBriefData] = useState(null);
  const [preMeetingLoading, setPreMeetingLoading] = useState(false);
  const [meetingContext, setMeetingContext] = useState('');

  // Add Post Modal State
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({ platform: 'LinkedIn', content: '', date: new Date().toISOString().split('T')[0], url: '', imageUrl: '' });
  const [postAnalyzing, setPostAnalyzing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('All');

  const handleCopyIcebreaker = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIcebreakerIdx(idx);
    setTimeout(() => setCopiedIcebreakerIdx(null), 2500);
  };

  const handleStartAutoDiscovery = async (e) => {
    if (e) e.preventDefault();
    if (!window.electronAPI?.discoverClientSocials) return;
    setIsDiscovering(true);
    try {
      const res = await window.electronAPI.discoverClientSocials({
        clientId: currentClient.id,
        customHints: customSearchHints
      });
      if (res.success && res.candidates) {
        setDiscoveredCandidates(res.candidates);
        const findUrl = (platformName) => res.candidates.find(c => c.platform?.toLowerCase().includes(platformName))?.url || '';
        const initialForm = {
          companyName: socialLinks.companyName || currentClient.companyName || '',
          jobTitle: socialLinks.jobTitle || currentClient.jobTitle || '',
          linkedinUrl: socialLinks.linkedinUrl || findUrl('linkedin'),
          facebookUrl: socialLinks.facebookUrl || findUrl('facebook'),
          instagramUrl: socialLinks.instagramUrl || findUrl('instagram'),
          tiktokUrl: socialLinks.tiktokUrl || findUrl('tiktok'),
          twitterUrl: socialLinks.twitterUrl || findUrl('twitter') || findUrl('x'),
          youtubeUrl: socialLinks.youtubeUrl || findUrl('youtube'),
          threadsUrl: socialLinks.threadsUrl || findUrl('threads'),
          websiteUrl: socialLinks.websiteUrl || findUrl('website')
        };
        setVerificationSocials(initialForm);
        setIsVerifyModalOpen(true);
      }
    } catch (err) {
      console.error("Error discovering social profiles:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConfirmAndExtract = async (e) => {
    if (e) e.preventDefault();
    setIsVerifyModalOpen(false);
    setSocialLinks(verificationSocials);
    setEnrichLoading(true);

    try {
      if (window.electronAPI?.saveClientDossier) {
        await window.electronAPI.saveClientDossier({
          clientId: currentClient.id,
          socialLinks: verificationSocials,
          dossier: aiDossier
        });
      }

      if (window.electronAPI?.enrichClientProfile) {
        const res = await window.electronAPI.enrichClientProfile({
          clientId: currentClient.id,
          socialLinks: verificationSocials,
          customHints: customSearchHints
        });
        if (res.success) {
          setAiDossier(res.dossier);
          if (res.client) {
            setCurrentClient(res.client);
            if (res.client.socialPosts) {
              setSocialPosts(res.client.socialPosts);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error running deep post extraction:", err);
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleRunEnrichment = async (e) => {
    if (e) e.preventDefault();
    if (!window.electronAPI?.enrichClientProfile) return;
    setEnrichLoading(true);
    try {
      const res = await window.electronAPI.enrichClientProfile({
        clientId: currentClient.id,
        socialLinks,
        customHints: customSearchHints
      });
      if (res.success) {
        setAiDossier(res.dossier);
        if (res.client) {
          setCurrentClient(res.client);
          if (res.client.socialPosts) {
            setSocialPosts(res.client.socialPosts);
          }
          setSocialLinks({
            companyName: res.client.companyName || socialLinks.companyName,
            jobTitle: res.client.jobTitle || socialLinks.jobTitle,
            linkedinUrl: res.client.linkedinUrl || socialLinks.linkedinUrl,
            facebookUrl: res.client.facebookUrl || socialLinks.facebookUrl,
            instagramUrl: res.client.instagramUrl || socialLinks.instagramUrl,
            tiktokUrl: res.client.tiktokUrl || socialLinks.tiktokUrl,
            twitterUrl: res.client.twitterUrl || socialLinks.twitterUrl,
            youtubeUrl: res.client.youtubeUrl || socialLinks.youtubeUrl,
            threadsUrl: res.client.threadsUrl || socialLinks.threadsUrl,
            websiteUrl: res.client.websiteUrl || socialLinks.websiteUrl
          });
        }
      }
    } catch (err) {
      console.error("Error enriching client profile:", err);
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleOpenPreMeetingBrief = async () => {
    setIsPreMeetingModalOpen(true);
    if (!preMeetingBriefData) {
      handleRegeneratePreMeetingBrief();
    }
  };

  const handleRegeneratePreMeetingBrief = async () => {
    if (!window.electronAPI?.generateClientMeetingBrief) return;
    setPreMeetingLoading(true);
    try {
      const res = await window.electronAPI.generateClientMeetingBrief({
        clientId: currentClient.id,
        meetingContext,
        timeframeDays: 90
      });
      if (res.success && res.brief) {
        setPreMeetingBriefData(res.brief);
      }
    } catch (err) {
      console.error("Error generating meeting brief:", err);
    } finally {
      setPreMeetingLoading(false);
    }
  };

  const handleOpenSocialLogin = (platform = 'instagram') => {
    setIsLoginDropdownOpen(false);
    if (window.electronAPI?.openSocialLoginWindow) {
      window.electronAPI.openSocialLoginWindow(platform);
    }
  };

  const handleRunBrowserScan = async (platform = 'instagram') => {
    if (!window.electronAPI?.runBrowserSocialScan) return;
    setIsBrowserScanning(true);
    try {
      const res = await window.electronAPI.runBrowserSocialScan({
        clientId: currentClient.id,
        platform,
        handle: socialLinks.instagramUrl || socialLinks.linkedinUrl || socialLinks.tiktokUrl || currentClient.fullName
      });
      if (res.success) {
        if (res.client) setCurrentClient(res.client);
        if (res.posts) setSocialPosts(res.posts);
      }
    } catch (err) {
      console.error("Error running browser scan:", err);
    } finally {
      setIsBrowserScanning(false);
    }
  };

  const handleAnalyzeAndAddPost = async (e) => {
    if (e) e.preventDefault();
    if (!postForm.content || !postForm.content.trim()) return;
    setPostAnalyzing(true);
    try {
      let aiAnalysis = null;
      if (window.electronAPI?.analyzeSocialPost) {
        const res = await window.electronAPI.analyzeSocialPost({
          clientId: currentClient.id,
          platform: postForm.platform,
          content: postForm.content,
          date: postForm.date,
          url: postForm.url
        });
        if (res.success && res.aiAnalysis) {
          aiAnalysis = res.aiAnalysis;
        }
      }

      const newPost = {
        id: crypto.randomUUID(),
        platform: postForm.platform,
        content: postForm.content,
        fullCaption: postForm.content,
        date: postForm.date || new Date().toISOString().split('T')[0],
        url: postForm.url || '',
        imageUrl: postForm.imageUrl || '',
        aiAnalysis,
        addedAt: new Date().toISOString()
      };

      const updatedPosts = [newPost, ...socialPosts];
      setSocialPosts(updatedPosts);

      if (window.electronAPI?.saveClientSocialPosts) {
        await window.electronAPI.saveClientSocialPosts({
          clientId: currentClient.id,
          posts: updatedPosts
        });
      }

      setIsAddPostModalOpen(false);
      setPostForm({ platform: 'LinkedIn', content: '', date: new Date().toISOString().split('T')[0], url: '', imageUrl: '' });
    } catch (err) {
      console.error("Error adding post:", err);
    } finally {
      setPostAnalyzing(false);
    }
  };

  const handleDeleteSocialPost = async (postId) => {
    const updated = socialPosts.filter(p => p.id !== postId);
    setSocialPosts(updated);
    if (window.electronAPI?.saveClientSocialPosts) {
      await window.electronAPI.saveClientSocialPosts({
        clientId: currentClient.id,
        posts: updated
      });
    }
  };

  const handleClearSocialPosts = async () => {
    if (!window.confirm("Are you sure you want to clear all social posts for this client?")) return;
    setSocialPosts([]);
    if (window.electronAPI?.saveClientSocialPosts) {
      await window.electronAPI.saveClientSocialPosts({
        clientId: currentClient.id,
        posts: []
      });
    }
  };

  const handleClearDossier = async () => {
    if (!window.confirm("Are you sure you want to clear the AI Client Dossier for this client?")) return;
    setAiDossier(null);
    if (window.electronAPI?.saveClientDossier) {
      await window.electronAPI.saveClientDossier({
        clientId: currentClient.id,
        socialLinks,
        dossier: null
      });
    }
  };

  // Deduplicate and filter posts
  const uniquePosts = [];
  const seenPosts = new Set();
  for (const p of socialPosts) {
    const textSig = (p.fullCaption || p.content || '').trim().toLowerCase();
    const urlSig = (p.url || '').trim().toLowerCase();
    const key = p.id || (urlSig && urlSig !== '#' ? urlSig : textSig);
    if (key && !seenPosts.has(key)) {
      seenPosts.add(key);
      uniquePosts.push(p);
    }
  }

  const filteredPosts = uniquePosts.filter(p => {
    if (platformFilter === 'All') return true;
    const plat = (p.platform || '').toLowerCase();
    if (platformFilter === 'LinkedIn') return plat.includes('linkedin');
    if (platformFilter === 'Instagram') return plat.includes('instagram');
    if (platformFilter === 'TikTok') return plat.includes('tiktok');
    if (platformFilter === 'Facebook') return plat.includes('facebook');
    if (platformFilter === 'X / Twitter') return plat.includes('twitter') || plat.includes('x');
    if (platformFilter === 'YouTube') return plat.includes('youtube');
    if (platformFilter === 'Company News') return plat.includes('news') || plat.includes('article');
    return true;
  });

  const getPlatformIcon = (platformStr) => {
    const p = (platformStr || '').toLowerCase();
    if (p.includes('linkedin')) return <LinkedinIcon size={12} />;
    if (p.includes('instagram')) return <InstagramIcon size={12} />;
    if (p.includes('tiktok')) return <TikTokIcon size={12} />;
    if (p.includes('twitter') || p.includes('x')) return <TwitterIcon size={12} />;
    if (p.includes('youtube')) return <YouTubeIcon size={12} />;
    if (p.includes('facebook')) return <FacebookIcon size={12} />;
    return <Globe size={12} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 360° AI Client Dossier & Social Intelligence Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px' }}>
        
        {/* Section Header & Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '700' }}>
              <Sparkles size={18} color="#a855f7" />
              Step 1: Obtain Info Online (360° AI Dossier)
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              {currentClient.aiDossierGeneratedAt 
                ? `Enriched via Gemini Deep Search Grounding • Updated ${new Date(currentClient.aiDossierGeneratedAt).toLocaleDateString()}`
                : 'Deep web search, corporate context, career highlights & multi-platform persona synthesis'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* 90-Day Pre-Meeting Brief Action Button */}
            <button
              type="button"
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                fontWeight: '600'
              }}
              onClick={handleOpenPreMeetingBrief}
            >
              <Clock size={13} />
              ⚡ 90-Day Pre-Meeting Brief
            </button>

            {/* Auto-Find Social Accounts */}
            <button
              type="button"
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
              onClick={handleStartAutoDiscovery}
              disabled={isDiscovering || enrichLoading}
            >
              <Search size={13} style={{ animation: isDiscovering ? 'spin 1s linear infinite' : 'none' }} />
              {isDiscovering ? 'Searching Web...' : 'Auto-Find Accounts'}
            </button>

            {/* Auto-Find & Deep Enrich */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                fontWeight: '600'
              }}
              onClick={handleRunEnrichment}
              disabled={enrichLoading || isDiscovering}
            >
              <RefreshCw size={13} style={{ animation: enrichLoading ? 'spin 1s linear infinite' : 'none' }} />
              {enrichLoading ? 'Searching & Synthesizing...' : 'Auto-Find & Deep Enrich'}
            </button>

            {/* Social Session Login Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)'
                }}
                onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                title="Log into social platforms for persistent scraping session"
              >
                <Key size={13} />
                Sessions <ChevronDown size={12} />
              </button>

              {isLoginDropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', width: '190px', backgroundColor: 'var(--bg-primary, #0f172a)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '6px', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px', fontWeight: '700' }}>
                    Open Login Window
                  </div>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#60a5fa', gap: '6px' }} onClick={() => handleOpenSocialLogin('linkedin')}>
                    <LinkedinIcon size={12} /> LinkedIn Session
                  </button>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#f472b6', gap: '6px' }} onClick={() => handleOpenSocialLogin('instagram')}>
                    <InstagramIcon size={12} /> Instagram Session
                  </button>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#38bdf8', gap: '6px' }} onClick={() => handleOpenSocialLogin('tiktok')}>
                    <TikTokIcon size={12} /> TikTok Session
                  </button>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#cbd5e1', gap: '6px' }} onClick={() => handleOpenSocialLogin('twitter')}>
                    <TwitterIcon size={12} /> X / Twitter Session
                  </button>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#93c5fd', gap: '6px' }} onClick={() => handleOpenSocialLogin('facebook')}>
                    <FacebookIcon size={12} /> Facebook Session
                  </button>
                  <button type="button" className="btn" style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px', backgroundColor: 'transparent', color: '#f87171', gap: '6px' }} onClick={() => handleOpenSocialLogin('youtube')}>
                    <YouTubeIcon size={12} /> YouTube / Google
                  </button>
                </div>
              )}
            </div>

            {aiDossier && (
              <button
                type="button"
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                onClick={handleClearDossier}
                title="Clear Dossier"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}

          </div>
        </div>

        {/* Search Hint Custom Input */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
          <Compass size={14} color="var(--text-muted)" />
          <input 
            type="text"
            className="input-field"
            style={{ flex: 1, padding: '4px 8px', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
            placeholder="Optional Search Hints (e.g. 'Focus on tech career in Singapore', 'Search for recent marathon runs or speeches'...)"
            value={customSearchHints}
            onChange={(e) => setCustomSearchHints(e.target.value)}
          />
        </div>

        {enrichLoading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={32} color="#a855f7" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600' }}>Executing Deep Search Grounding & Synthesizing 360° Dossier...</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cross-referencing LinkedIn, Instagram, TikTok, Facebook, X, YouTube & Business News</div>
          </div>
        ) : aiDossier ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Executive Summary & Seniority Badge */}
            <div style={{ padding: '18px', backgroundColor: 'rgba(168, 85, 247, 0.06)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#c084fc', fontWeight: '700' }}>
                  Executive & Career Overview
                </div>
                {aiDossier.seniorityLevel && (
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff' }}>
                    {aiDossier.seniorityLevel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {aiDossier.executiveSummary || 'No executive summary available.'}
              </div>
              {aiDossier.companyInsight && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                  💼 <strong>Company Context & Footprint:</strong> {aiDossier.companyInsight}
                </div>
              )}
            </div>

            {/* Behavioral Pattern & Interest Radar */}
            {(aiDossier.patternSummary || (aiDossier.topRecurringThemes && aiDossier.topRecurringThemes.length > 0)) && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.06)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#60a5fa', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={13} /> Behavioral Pattern & Thematic Radar
                </div>
                {aiDossier.patternSummary && (
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '10px' }}>
                    {aiDossier.patternSummary}
                  </div>
                )}
                {aiDossier.topRecurringThemes && aiDossier.topRecurringThemes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {aiDossier.topRecurringThemes.map((theme, idx) => (
                      <span key={idx} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: '500' }}>
                        🏷️ {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key Interests & Hobbies Tags */}
            {aiDossier.keyInterests && aiDossier.keyInterests.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Heart size={14} color="#f472b6" /> Hobbies, Passions & Personal Affinity
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {aiDossier.keyInterests.map((interest, idx) => (
                    <span key={idx} style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '12px', backgroundColor: 'rgba(244, 114, 182, 0.12)', color: '#f472b6', border: '1px solid rgba(244, 114, 182, 0.25)', fontWeight: '500' }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Life Stage & Financial Opportunity Radar */}
            {aiDossier.lifeTriggers && aiDossier.lifeTriggers.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <TrendingUp size={14} color="#34d399" /> Life Stage Triggers & Financial Opportunities
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {aiDossier.lifeTriggers.map((trig, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={12} /> {trig.signal}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{trig.impact}</div>
                      {trig.suggestedProduct && (
                        <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '600', marginTop: '4px' }}>
                          💡 Rec: {trig.suggestedProduct}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business & Key Person Risks (if present) */}
            {aiDossier.businessRisks && aiDossier.businessRisks.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <Shield size={14} color="#f59e0b" /> Business & Key Person Risk Flags
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {aiDossier.businessRisks.map((br, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b' }}>
                        ⚠️ {br.risk}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{br.description}</div>
                      {br.recommendedSafeguard && (
                        <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '500', marginTop: '4px' }}>
                          🛡️ Safeguard: {br.recommendedSafeguard}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tailored Icebreakers & Multi-Channel Outreach */}
            {aiDossier.icebreakers && aiDossier.icebreakers.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <MessageSquare size={14} color="#60a5fa" /> Tailored Conversation Starters & Icebreakers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aiDossier.icebreakers.map((ib, idx) => {
                    const textToCopy = typeof ib === 'string' ? ib : ib.template;
                    const channelLabel = typeof ib === 'object' ? ib.channel : `Option ${idx + 1}`;
                    const toneLabel = typeof ib === 'object' && ib.tone ? ` • ${ib.tone}` : '';
                    return (
                      <div key={idx} style={{ padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                            {channelLabel}{toneLabel}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            "{textToCopy}"
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: copiedIcebreakerIdx === idx ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: copiedIcebreakerIdx === idx ? '#34d399' : 'var(--text-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleCopyIcebreaker(textToCopy, idx)}
                        >
                          {copiedIcebreakerIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                          {copiedIcebreakerIdx === idx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Web Sources Note */}
            {aiDossier.webSourcesNote && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
                🔍 Grounding Note: {aiDossier.webSourcesNote}
              </div>
            )}

          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={32} color="var(--border-light)" />
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No AI Client Dossier generated yet.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '440px' }}>
              Click <strong>Auto-Find & Deep Enrich</strong> to search LinkedIn, Instagram, TikTok, Facebook, X, YouTube, and news to synthesize a 360° client persona with tailored openers.
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Social Media Posts & Activity Feed Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: '16px' }}>
        
        {/* Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '700' }}>
              <Newspaper size={18} color="#60a5fa" />
              Step 2: Social Media Post Import & Intelligence Feed ({socialPosts.length})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Multi-platform feed from LinkedIn, Instagram, TikTok, Facebook, X & News with automatic actuarial and financial planning tags
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', border: 'none' }}
              onClick={() => {
                setPostForm({ platform: 'LinkedIn', content: '', date: new Date().toISOString().split('T')[0], url: '', imageUrl: '' });
                setIsAddPostModalOpen(true);
              }}
            >
              <Plus size={15} /> Add / Paste Social Post
            </button>

            <button
              type="button"
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}
              onClick={() => handleRunBrowserScan('instagram')}
              disabled={isBrowserScanning}
            >
              <RefreshCw size={13} style={{ animation: isBrowserScanning ? 'spin 1s linear infinite' : 'none' }} />
              {isBrowserScanning ? 'Scanning...' : 'Offscreen Browser Scan'}
            </button>

            {socialPosts.length > 0 && (
              <button
                type="button"
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                onClick={handleClearSocialPosts}
                title="Clear All Social Posts"
              >
                <Trash2 size={13} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Platform Filter Tabs */}
        {socialPosts.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['All', 'LinkedIn', 'Instagram', 'TikTok', 'Facebook', 'X / Twitter', 'YouTube', 'Company News'].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setPlatformFilter(plat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: platformFilter === plat ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                  borderColor: platformFilter === plat ? '#60a5fa' : 'var(--border-light)',
                  color: platformFilter === plat ? '#60a5fa' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {plat}
              </button>
            ))}
          </div>
        )}

        {/* Posts Feed */}
        {socialPosts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Newspaper size={32} color="var(--border-light)" />
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No social posts added yet.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '440px' }}>
              Click <strong>+ Add / Paste Social Post</strong> to import an Instagram caption, LinkedIn article, TikTok caption, or news update for instant AI breakdown!
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No posts found for filter <strong>{platformFilter}</strong>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredPosts.map(post => {
              // Deduplicate media items for this post so identical images are never duplicated
              const allMedia = [];
              if (post.imageUrl) {
                allMedia.push({ url: post.imageUrl, caption: post.aiAnalysis?.topic || post.platform });
              }
              if (Array.isArray(post.media)) {
                for (const m of post.media) {
                  if (m?.url && !allMedia.some(existing => existing.url === m.url)) {
                    allMedia.push(m);
                  }
                }
              }

              const postText = (post.fullCaption || post.content || '').trim();

              return (
                <div key={post.id} style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Post Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: '600',
                        backgroundColor: post.platform === 'LinkedIn' ? 'rgba(10, 102, 194, 0.15)' 
                          : post.platform === 'Instagram' ? 'rgba(225, 48, 108, 0.15)' 
                          : post.platform === 'TikTok' ? 'rgba(56, 189, 248, 0.15)' 
                          : post.platform === 'Facebook' ? 'rgba(24, 119, 242, 0.15)' 
                          : post.platform === 'YouTube' ? 'rgba(239, 68, 68, 0.15)' 
                          : 'rgba(255,255,255,0.1)',
                        color: post.platform === 'LinkedIn' ? '#60a5fa' 
                          : post.platform === 'Instagram' ? '#f472b6' 
                          : post.platform === 'TikTok' ? '#38bdf8' 
                          : post.platform === 'Facebook' ? '#93c5fd' 
                          : post.platform === 'YouTube' ? '#f87171' 
                          : 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getPlatformIcon(post.platform)}
                        {post.platform}
                      </span>

                      {post.author && (
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>
                          👤 {post.author}
                        </span>
                      )}

                      {post.browserSubagentExtracted ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: '600' }}>
                          🤖 Authentic Media Extracted
                        </span>
                      ) : post.salient ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fde047', fontWeight: '600' }}>
                          ⭐ Salient Post
                        </span>
                      ) : null}

                      {post.autoExtracted && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: '600' }}>
                          ✨ Auto-Discovered
                        </span>
                      )}

                      {post.engagement && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          📊 {post.engagement}
                        </span>
                      )}

                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{post.date || 'Recent'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {post.url && (
                        <a 
                          href={post.url.startsWith('http') ? post.url : `https://${post.url}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="btn" 
                          style={{ padding: '5px 10px', fontSize: '11px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} /> View Original Post
                        </a>
                      )}
                      <button 
                        onClick={() => handleDeleteSocialPost(post.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.6 }}
                        title="Delete Post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Complete, Un-truncated Post Text */}
                  {postText && (
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-primary)', 
                      lineHeight: '1.6', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      backgroundColor: 'rgba(0,0,0,0.25)', 
                      padding: '14px 16px', 
                      borderRadius: '10px', 
                      borderLeft: '3px solid var(--accent-blue)' 
                    }}>
                      {postText}
                    </div>
                  )}

                  {/* Uncropped Images & Discovered Media (Full Resolution, No Cropping) */}
                  {allMedia.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {allMedia.map((m, mIdx) => (
                        <SocialPostImage
                          key={mIdx}
                          src={m.url}
                          caption={m.caption || post.aiAnalysis?.topic || post.platform}
                        />
                      ))}
                    </div>
                  )}

                  {/* AI Analysis Breakdown Box */}
                  {post.aiAnalysis && (
                    <div style={{ padding: '12px 14px', backgroundColor: 'rgba(96, 165, 250, 0.05)', borderRadius: '8px', border: '1px solid rgba(96, 165, 250, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={12} /> AI Insight: {post.aiAnalysis.topic || 'Social Update'}
                        </div>
                        {post.aiAnalysis.suggestedProduct && (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', fontWeight: '600' }}>
                            Rec: {post.aiAnalysis.suggestedProduct}
                          </span>
                        )}
                      </div>

                      {post.aiAnalysis.financialSignal && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          🎯 <strong>Planning Relevance:</strong> {post.aiAnalysis.financialSignal}
                        </div>
                      )}

                      {post.aiAnalysis.icebreaker && (
                        <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed rgba(96, 165, 250, 0.2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-primary)', flex: 1 }}>
                            💬 <strong>Starter:</strong> "{post.aiAnalysis.icebreaker}"
                          </div>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', flexShrink: 0 }}
                            onClick={() => handleCopyIcebreaker(post.aiAnalysis.icebreaker, `post-${post.id}`)}
                          >
                            <Copy size={11} /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Verification Modal */}
      <SocialDiscoveryModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        candidates={discoveredCandidates}
        client={currentClient}
        verificationSocials={verificationSocials}
        setVerificationSocials={setVerificationSocials}
        onConfirm={handleConfirmAndExtract}
        isEnriching={enrichLoading}
      />

      {/* 90-Day Pre-Meeting Brief Modal */}
      <PreMeetingBriefModal
        isOpen={isPreMeetingModalOpen}
        onClose={() => setIsPreMeetingModalOpen(false)}
        client={currentClient}
        briefData={preMeetingBriefData}
        isLoading={preMeetingLoading}
        onRegenerate={handleRegeneratePreMeetingBrief}
        meetingContext={meetingContext}
        setMeetingContext={setMeetingContext}
      />

      {/* Add Social Post Modal */}
      <AddSocialPostModal
        isOpen={isAddPostModalOpen}
        onClose={() => setIsAddPostModalOpen(false)}
        postForm={postForm}
        setPostForm={setPostForm}
        onSubmit={handleAnalyzeAndAddPost}
        postAnalyzing={postAnalyzing}
      />

    </div>
  );
}
