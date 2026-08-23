import React from 'react';
import { Newspaper, Sparkles, X, Image, Link, Calendar } from 'lucide-react';
import DatePicker from './DatePicker';

export default function AddSocialPostModal({
  isOpen,
  onClose,
  postForm,
  setPostForm,
  onSubmit,
  postAnalyzing
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(96, 165, 250, 0.25)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Newspaper size={20} color="#60a5fa" />
            Add / Import Social Post
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Paste an Instagram caption, LinkedIn article, TikTok caption, tweet, or news update. Gemini AI will automatically extract topic milestones, financial planning signals, and conversation openers.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Platform *</label>
              <select 
                className="input-field" 
                style={{ width: '100%' }}
                value={postForm.platform}
                onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="X / Twitter">X / Twitter</option>
                <option value="Facebook">Facebook</option>
                <option value="YouTube">YouTube</option>
                <option value="Company News">Company News / Article</option>
                <option value="General">Other / General</option>
              </select>
            </div>

            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Post Date</label>
              <DatePicker 
                value={postForm.date} 
                onChange={(e) => setPostForm({ ...postForm, date: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '8px' }}>Post Text / Caption *</label>
            <textarea 
              required
              rows={5}
              className="input-field" 
              style={{ width: '100%', resize: 'none', lineHeight: '1.5', fontSize: '13px' }} 
              placeholder="Paste the caption or post content here (e.g. 'Excited to share our Series B announcement!' or 'Completed my first full marathon in Tokyo today! 42km of grit...')" 
              value={postForm.content} 
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Link size={13} color="var(--text-muted)" /> Post / Article URL (Optional)
            </label>
            <input 
              type="text" 
              className="input-field" 
              style={{ width: '100%' }} 
              placeholder="https://instagram.com/p/... or https://linkedin.com/posts/..." 
              value={postForm.url} 
              onChange={(e) => setPostForm({ ...postForm, url: e.target.value })} 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Image size={13} color="var(--text-muted)" /> Post Image / Photo Link (Optional)
            </label>
            <input 
              type="text" 
              className="input-field" 
              style={{ width: '100%' }} 
              placeholder="https://images.unsplash.com/... or direct image link" 
              value={postForm.imageUrl || ''} 
              onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ backgroundColor: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }} 
              onClick={onClose}
              disabled={postAnalyzing}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              disabled={postAnalyzing}
            >
              <Sparkles size={14} style={{ animation: postAnalyzing ? 'spin 1s linear infinite' : 'none' }} />
              {postAnalyzing ? 'Analyzing Post with AI...' : 'Analyze & Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
