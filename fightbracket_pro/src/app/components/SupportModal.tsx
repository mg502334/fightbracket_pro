import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Headphones, Send, CheckCircle, AlertCircle, ChevronRight, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INQUIRY_TYPES = [
  { value: 'bracket', label: 'Tournament / Bracket Bug', icon: '🏆' },
  { value: 'oauth', label: 'OAuth / Sign-In Issue', icon: '🔐' },
  { value: 'privacy', label: 'Privacy / Account Data Deletion', icon: '🛡️' },
  { value: 'api', label: 'API / Integration Issue', icon: '⚙️' },
  { value: 'general', label: 'General Feedback', icon: '💬' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111118',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '2px',
  padding: '10px 12px',
  color: '#f0ede8',
  fontSize: '0.875rem',
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#6b7280',
  marginBottom: '6px',
};

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [inquiryType, setInquiryType] = useState('bracket');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isPrivacyRequest = inquiryType === 'privacy';

  const getFocusBorder = (field: string) =>
    focusedField === field
      ? { borderColor: '#00E5FF', boxShadow: '0 0 0 2px rgba(0,229,255,0.08)' }
      : {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_type: inquiryType,
          email,
          message,
        }),
      });

      if (res.ok) {
        setStatus('success');
        toast.success('Support ticket submitted! Check your inbox for confirmation.');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Server error');
      }
    } catch (err: any) {
      setStatus('error');
      toast.error(err.message || 'Failed to send. Please email support@fightbracketpro.com directly.');
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStatus('idle');
      setEmail('');
      setMessage('');
      setInquiryType('bracket');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              background: '#0c0c0e',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.05) 0%, transparent 60%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '2px',
                    background: 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5FF',
                    flexShrink: 0,
                  }}
                >
                  <Headphones size={16} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#f0ede8',
                      margin: 0,
                    }}
                  >
                    Help & Support Center
                  </h2>
                  <p style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                    support@fightbracketpro.com
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f0ede8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Success State */}
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center" style={{ padding: '48px 24px' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5FF',
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle size={26} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#f0ede8',
                    marginBottom: 8,
                  }}
                >
                  Ticket Received
                </h3>
                <p style={{ fontSize: '13px', color: '#8a8a9a', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
                  Check your inbox for an automated confirmation.{' '}
                  {isPrivacyRequest
                    ? 'Data deletion requests are processed within 7 business days.'
                    : 'Standard tickets are reviewed within 24–48 hours.'}
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    marginTop: 24,
                    padding: '10px 24px',
                    background: '#00E5FF',
                    color: '#050A14',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                {/* Privacy warning banner */}
                {isPrivacyRequest && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '2px',
                      padding: '10px 12px',
                      marginBottom: 20,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '11px', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', margin: 0, lineHeight: 1.5 }}>
                      Data deletion requests are irreversible. Include your registered email and User ID. Processing takes up to 7 business days.
                    </p>
                  </div>
                )}

                {/* Inquiry Type */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Inquiry Type</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {INQUIRY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setInquiryType(type.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 12px',
                          background: inquiryType === type.value ? 'rgba(0,229,255,0.08)' : '#111118',
                          border: `1px solid ${inquiryType === type.value ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '2px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{ fontSize: '13px' }}>{type.icon}</span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: inquiryType === type.value ? '#00E5FF' : '#8a8a9a',
                            flex: 1,
                          }}
                        >
                          {type.label}
                        </span>
                        {inquiryType === type.value && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5FF' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Your Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="fighter@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, ...getFocusBorder('email') }}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    {isPrivacyRequest ? 'Your User ID & Deletion Request *' : 'Message *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      isPrivacyRequest
                        ? 'Include your registered email and User ID (found in Account Settings → Profile). Describe the data you want deleted.'
                        : 'Describe your issue in detail. Include your browser, any error messages, and steps to reproduce...'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 100,
                      ...getFocusBorder('message'),
                    }}
                  />
                </div>

                {/* Direct email note */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 16,
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '2px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Mail size={11} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <p style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                    Or email directly:{' '}
                    <a
                      href="mailto:support@fightbracketpro.com"
                      style={{ color: '#00E5FF', textDecoration: 'none' }}
                    >
                      support@fightbracketpro.com
                    </a>
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: status === 'sending' ? 'rgba(0,229,255,0.4)' : '#00E5FF',
                    color: '#050A14',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (status !== 'sending') (e.currentTarget as HTMLButtonElement).style.background = '#00B3CC';
                  }}
                  onMouseLeave={(e) => {
                    if (status !== 'sending') (e.currentTarget as HTMLButtonElement).style.background = '#00E5FF';
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                      Transmitting...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Submit Request
                      <ChevronRight size={13} />
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <p style={{ fontSize: '11px', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', marginTop: 10 }}>
                    Submission failed — please email support@fightbracketpro.com directly.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
