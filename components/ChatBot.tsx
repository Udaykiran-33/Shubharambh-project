'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnquiryForm {
  venueName: string;
  venueId: string;
  category: string;
  eventType: string;
  eventDate: string;
  guests: string;
  message: string;
}

const QUICK_ACTIONS = [
  { icon: '🏛️', label: 'Find Venues', message: 'Show me the best wedding venues available' },
  { icon: '💰', label: 'Budget Help', message: 'I need affordable venues under 3 lakh' },
  { icon: '📍', label: 'Hyderabad', message: 'Show venues in Hyderabad' },
  { icon: '📸', label: 'Photographers', message: 'I need a good wedding photographer' },
  { icon: '🍽️', label: 'Caterers', message: 'Show me caterers for a wedding of 300 guests' },
  { icon: '💄', label: 'Makeup', message: 'Find bridal makeup artists' },
];

const SUGGESTED_FOLLOWUPS: Record<string, string[]> = {
  default: [
    'Show me venues 🏛️',
    'Budget under 2 lakh',
    'Best decorators',
    'Compare top 3 venues',
  ],
  venue: [
    'What\'s the price range?',
    'Can I visit this venue?',
    'Send an enquiry',
  ],
  pricing: [
    'Show budget options',
    'Any premium venues?',
    'Compare prices',
  ],
};

// Parse markdown-like formatting into rich HTML with venue cards
function formatMessage(text: string): string {
  // First split by --- dividers to identify venue card blocks
  const sections = text.split(/\n?---\n?/);
  
  const formatted = sections.map(section => {
    const trimmed = section.trim();
    if (!trimmed) return '';
    
    // Check if this section looks like a venue card (has bold name + emoji-prefixed lines)
    const lines = trimmed.split('\n');
    const hasBoldTitle = lines.some(l => /^\*\*[🏛️📸🍽️💄🎵🎭💐✉️🕉️💃👗🎤🎶🏆📍💰👥⭐📌🎊🪷].*\*\*$/.test(l.trim()));
    const hasInfoLines = lines.filter(l => /^[📍💰👥⭐📌🏷️✨]/.test(l.trim())).length >= 2;
    
    if (hasBoldTitle || hasInfoLines) {
      // This is a venue/service card — render as a styled card
      const cardLines = lines.map(line => {
        const t = line.trim();
        
        // Bold venue name header: **🏛️ Venue Name**
        if (/^\*\*.*\*\*$/.test(t)) {
          const inner = t.replace(/^\*\*/, '').replace(/\*\*$/, '');
          return `<div style="font-weight:800;font-size:14px;color:#3b4c23;margin-bottom:4px;line-height:1.3">${inner}</div>`;
        }
        
        // Info lines with emojis
        if (/^[📍💰👥⭐📌🏷️✨🎊🏆]/.test(t)) {
          // Price lines — highlight
          if (t.startsWith('💰')) {
            const priceText = t.replace(/^💰\s*/, '');
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:12.5px;color:#556b2f;font-weight:700">💰 <span style="background:#f0f4e4;padding:2px 8px;border-radius:6px;color:#3b4c23">${priceText}</span></div>`;
          }
          // Rating lines — highlight stars
          if (t.startsWith('⭐')) {
            const ratingText = t.replace(/^⭐\s*/, '');
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:12.5px;color:#b45309;font-weight:600">⭐ ${ratingText}</div>`;
          }
          // Location
          if (t.startsWith('📍')) {
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:12px;color:#6b7c52">📍 ${t.replace(/^📍\s*/, '')}</div>`;
          }
          // Capacity
          if (t.startsWith('👥')) {
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:12px;color:#6b7c52">👥 ${t.replace(/^👥\s*/, '')}</div>`;
          }
          // Highlight/pin
          if (t.startsWith('📌') || t.startsWith('✨')) {
            const icon = t.charAt(0) === '📌' ? '📌' : '✨';
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:11.5px;color:#8b9a68;font-style:italic">${icon} ${t.replace(/^[📌✨]\s*/, '')}</div>`;
          }
          // Trophy / recommendation
          if (t.startsWith('🏆')) {
            return `<div style="display:flex;align-items:center;gap:6px;margin:6px 0 2px;font-size:13px;color:#b45309;font-weight:700">🏆 ${t.replace(/^🏆\s*/, '')}</div>`;
          }
          // Generic emoji line
          return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-size:12px;color:#6b7c52">${t}</div>`;
        }
        
        // Regular text inside card
        if (t) {
          return `<div style="font-size:12.5px;color:#556b2f;margin:2px 0;line-height:1.4">${t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
        }
        return '';
      }).filter(Boolean).join('');

      // Extract venue name for the enquiry button
      const nameMatch = cardLines.match(/font-weight:800[^>]*>([^<]+)</)?.[1] || '';
      // Clean the name (remove emoji prefix)
      const cleanName = nameMatch.replace(/^[^\w\s]+\s*/, '').trim();
      
      // Try to get category from card content
      const catHint = cleanName.toLowerCase().includes('photo') ? 'photographers'
        : cleanName.toLowerCase().includes('decor') ? 'decorators'
        : cleanName.toLowerCase().includes('cater') ? 'caterers'
        : cleanName.toLowerCase().includes('makeup') ? 'makeup'
        : 'venues';

      const enquiryBtn = cleanName
        ? `<button data-enquiry-venue="${cleanName}" data-enquiry-id="" data-enquiry-cat="${catHint}" style="display:flex;align-items:center;gap:6px;margin-top:8px;padding:7px 14px;border-radius:10px;border:1.5px solid #6b8e23;background:linear-gradient(135deg,#f0f4e4,#e8ecd8);color:#3b4c23;font-size:11.5px;font-weight:700;cursor:pointer;transition:all 0.2s;width:100%" onmouseover="this.style.background='linear-gradient(135deg,#6b8e23,#556b2f)';this.style.color='white'" onmouseout="this.style.background='linear-gradient(135deg,#f0f4e4,#e8ecd8)';this.style.color='#3b4c23'">📩 Send Enquiry</button>`
        : '';
      
      return `<div style="background:#f8faf3;border:1px solid #e2e8d0;border-radius:12px;padding:12px 14px;margin:6px 0;transition:all 0.2s">${cardLines}${enquiryBtn}</div>`;
    }
    
    // Not a card — format as regular text
    return trimmed.split('\n').map(line => {
      let l = line;
      // Bold
      l = l.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#3b4c23">$1</strong>');
      // Italic
      l = l.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      // Bullet points
      l = l.replace(/^[-•]\s(.*)/, '<div style="display:flex;gap:6px;margin:2px 0;font-size:12.5px"><span style="color:#6b8e23;font-weight:700">•</span><span>$1</span></div>');
      // Numbered list
      l = l.replace(/^(\d+)\.\s(.*)/, '<div style="display:flex;gap:6px;margin:2px 0;font-size:12.5px"><span style="color:#556b2f;font-weight:700;min-width:16px">$1.</span><span>$2</span></div>');
      // Trophy recommendation
      if (/^🏆/.test(l)) {
        l = `<div style="background:#fef8ee;border:1px solid #fde68a;border-radius:10px;padding:8px 12px;margin:8px 0;font-size:13px;color:#92400e;font-weight:600">${l}</div>`;
      }
      // If it's just text (not already wrapped in div)
      if (!l.startsWith('<div')) {
        l = `<div style="margin:2px 0;line-height:1.5">${l}</div>`;
      }
      return l;
    }).join('');
  }).filter(Boolean);

  return formatted.join('');
}

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'reception', label: 'Reception' },
  { value: 'pre-wedding', label: 'Pre-wedding' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'bachelor-party', label: 'Bachelor Party' },
  { value: 'baby-shower', label: 'Baby Shower' },
  { value: 'other', label: 'Other' },
];

export default function ChatBot() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! 🙏 I'm **Shubhi**, your personal event planning assistant at Shubharambh.\n\nI can help you find the perfect venues, decorators, caterers, photographers & more for your special occasion. I have real-time access to all our verified listings!\n\nWhat are you planning? 🎉",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [enquiryForm, setEnquiryForm] = useState<EnquiryForm | null>(null);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Pulse animation for new messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true);
      const timer = setTimeout(() => setHasNewMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isOpen]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setShowQuickActions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    // Simulate typing stages
    const typingStages = ['Searching our database...', 'Finding the best matches...', 'Preparing your answer...'];
    let stageIndex = 0;
    const typingInterval = setInterval(() => {
      if (stageIndex < typingStages.length) {
        setTypingText(typingStages[stageIndex]);
        stageIndex++;
      }
    }, 1200);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      clearInterval(typingInterval);
      setTypingText('');
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, timestamp: new Date() }]);
    } catch {
      clearInterval(typingInterval);
      setTypingText('');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I couldn't process that right now. Please try again! 🙏", timestamp: new Date() },
      ]);
    }

    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! 🙏 How can I help you today?",
      timestamp: new Date(),
    }]);
    setShowQuickActions(true);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Enquiry button handler (via event delegation) ────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-enquiry-venue]') as HTMLElement;
      if (!btn) return;
      const venueName = btn.getAttribute('data-enquiry-venue') || '';
      const venueId = btn.getAttribute('data-enquiry-id') || '';
      const category = btn.getAttribute('data-enquiry-cat') || 'venues';

      if (!session?.user) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🔒 Please **log in** first to send an enquiry. <a href="/login" target="_blank" style="color:#6b8e23;font-weight:700;text-decoration:underline">Click here to login →</a>',
          timestamp: new Date(),
        }]);
        return;
      }

      setEnquiryForm({
        venueName,
        venueId,
        category,
        eventType: '',
        eventDate: '',
        guests: '',
        message: `I'm interested in ${venueName} for my event.`,
      });
      setTimeout(scrollToBottom, 100);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [session, scrollToBottom]);

  // ─── Submit enquiry ──────────────────────────────────────────
  const submitEnquiry = async () => {
    if (!enquiryForm || !enquiryForm.eventType || !enquiryForm.eventDate || !enquiryForm.message) return;
    setEnquiryLoading(true);

    try {
      const res = await fetch('/api/chat-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: enquiryForm.venueId || undefined,
          venueName: enquiryForm.venueName,
          category: enquiryForm.category,
          eventType: enquiryForm.eventType,
          eventDate: enquiryForm.eventDate,
          guests: enquiryForm.guests,
          message: enquiryForm.message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Enquiry Sent Successfully!**\n\n📩 Your enquiry for **${enquiryForm.venueName}** has been sent to the vendor.\n\n${data.message}\n\n📊 Track it in your **Dashboard** → Quote Requests`,
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ ${data.error || 'Something went wrong. Please try again.'}`,
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Network error. Please check your connection and try again.',
        timestamp: new Date(),
      }]);
    }

    setEnquiryForm(null);
    setEnquiryLoading(false);
  };

  return (
    <>
      {/* ─── CSS Styles ─── */}
      <style jsx global>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes chatFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .chat-window {
          animation: chatSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chat-message {
          animation: chatFadeIn 0.3s ease-out;
        }
        .chat-typing-dot {
          animation: typingBounce 1.4s ease-in-out infinite;
        }
        .chat-btn-pulse {
          animation: chatFloat 3s ease-in-out infinite;
        }
        .chat-btn-ring {
          animation: pulseRing 2s ease-out infinite;
        }
        .chat-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .chat-gradient-header {
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
        }
        .chat-scrollbar::-webkit-scrollbar { width: 5px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: #c2ccae; border-radius: 10px; }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: #8b9a68; }
        .chat-list-num { font-weight: 700; color: #556b2f; }
        .chat-bullet { color: #6b8e23; font-weight: 700; margin-right: 4px; }
        .chat-input-glow:focus {
          box-shadow: 0 0 0 3px rgba(107, 142, 35, 0.15);
        }
      `}</style>

      {/* ─── Floating Chat Button ─── */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
        {/* Pulse ring when new message */}
        {hasNewMessage && !isOpen && (
          <div style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '20px',
            border: '2px solid #6b8e23',
          }} className="chat-btn-ring" />
        )}
        
        {/* Notification badge */}
        {!isOpen && hasNewMessage && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#dc2626',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            border: '2px solid white',
          }}>1</div>
        )}

        <button
          onClick={() => { setIsOpen(!isOpen); setHasNewMessage(false); }}
          className={!isOpen ? 'chat-btn-pulse' : ''}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: isOpen
              ? 'linear-gradient(135deg, #465a28, #556b2f)'
              : 'linear-gradient(135deg, #6b8e23, #556b2f)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px -4px rgba(107, 142, 35, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px -4px rgba(107, 142, 35, 0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px -4px rgba(107, 142, 35, 0.5)';
          }}
          aria-label="Chat with Shubhi"
        >
          {isOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 5.92 2 10.67c0 2.73 1.47 5.17 3.76 6.77L4.5 21.5l4.75-2.37c.89.24 1.82.37 2.75.37 5.52 0 10-3.92 10-8.83S17.52 2 12 2z" fill="currentColor" opacity="0.9"/>
              <circle cx="8" cy="10.5" r="1.2" fill="#fff"/>
              <circle cx="12" cy="10.5" r="1.2" fill="#fff"/>
              <circle cx="16" cy="10.5" r="1.2" fill="#fff"/>
            </svg>
          )}
        </button>
      </div>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          className="chat-window"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 9998,
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: isMinimized ? 'auto' : '600px',
            maxHeight: 'calc(100vh - 140px)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(107,142,35,0.1)',
            background: '#f7f8f5',
          }}
        >
          {/* ─── Header ─── */}
          <div
            className="chat-gradient-header"
            style={{
              background: 'linear-gradient(135deg, #556b2f 0%, #6b8e23 30%, #465a28 70%, #556b2f 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer overlay */}
            <div className="chat-shimmer" style={{ position: 'absolute', inset: 0 }} />
            
            {/* Avatar */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.15)',
              position: 'relative',
              zIndex: 1,
            }}>
              🪷
            </div>
            
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '16px',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}>Shubhi</h3>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ade80',
                  border: '2px solid rgba(255,255,255,0.3)',
                }} />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '12px',
                margin: 0,
                marginTop: '2px',
              }}>
                {loading ? '✨ Searching for you...' : 'Your event planning concierge'}
              </p>
            </div>

            {/* Header Actions */}
            <div style={{ display: 'flex', gap: '4px', position: 'relative', zIndex: 1 }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  {isMinimized ? (
                    <path d="M4 14h6v6M20 10h-6V4" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M20 20H4" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* ─── Messages Area ─── */}
          {!isMinimized && (
            <>
              <div
                ref={chatContainerRef}
                className="chat-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'linear-gradient(180deg, #f7f8f5 0%, #eef0e8 100%)',
                }}
              >
                {/* Date marker */}
                <div style={{
                  textAlign: 'center',
                  padding: '4px 0',
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#8b9a68',
                    background: '#eef0e8',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>Today</span>
                </div>

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="chat-message"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: '4px',
                    }}
                  >
                    {/* Avatar + name for assistant */}
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                        <span style={{ fontSize: '14px' }}>🪷</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#556b2f' }}>Shubhi</span>
                      </div>
                    )}
                    
                    <div
                      style={{
                        maxWidth: msg.role === 'user' ? '80%' : '92%',
                        padding: msg.role === 'user' ? '12px 16px' : '12px 14px',
                        borderRadius: msg.role === 'user' ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #6b8e23, #556b2f)'
                          : 'white',
                        color: msg.role === 'user' ? 'white' : '#3b4c23',
                        boxShadow: msg.role === 'user'
                          ? '0 2px 12px -2px rgba(107,142,35,0.35)'
                          : '0 1px 8px -2px rgba(0,0,0,0.08)',
                        fontSize: '13.5px',
                        lineHeight: '1.55',
                        wordBreak: 'break-word' as const,
                        border: msg.role === 'assistant' ? '1px solid #eef0e8' : 'none',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    
                    {/* Timestamp */}
                    <span style={{
                      fontSize: '10px',
                      color: '#a5b286',
                      marginTop: '-2px',
                      padding: msg.role === 'user' ? '0 4px 0 0' : '0 0 0 4px',
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                ))}

                {/* Typing Indicator */}
                {loading && (
                  <div className="chat-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                      <span style={{ fontSize: '14px' }}>🪷</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#556b2f' }}>Shubhi</span>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '14px 18px',
                      borderRadius: '18px 18px 18px 6px',
                      boxShadow: '0 1px 8px -2px rgba(0,0,0,0.08)',
                      border: '1px solid #eef0e8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="chat-typing-dot"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8b9a68, #6b8e23)',
                              animationDelay: `${i * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>
                      {typingText && (
                        <span style={{ fontSize: '11px', color: '#8b9a68', fontStyle: 'italic' }}>
                          {typingText}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

                {/* ─── Inline Enquiry Form ─── */}
                {enquiryForm && (
                  <div className="chat-message" style={{ animation: 'chatFadeIn 0.3s ease-out' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f4e4, #e8ecd8)',
                      border: '1.5px solid #c2ccae',
                      borderRadius: '18px',
                      padding: '16px',
                      maxWidth: '95%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>📩</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#3b4c23' }}>Enquiry for {enquiryForm.venueName}</span>
                        </div>
                        <button onClick={() => setEnquiryForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#8b9a68', padding: '2px' }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <select value={enquiryForm.eventType} onChange={e => setEnquiryForm({ ...enquiryForm, eventType: e.target.value })} style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #c2ccae', background: 'white', fontSize: '12.5px', color: '#3b4c23', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                          <option value="">Select Event Type *</option>
                          {EVENT_TYPES.map(et => (<option key={et.value} value={et.value}>{et.label}</option>))}
                        </select>
                        <input type="date" value={enquiryForm.eventDate} onChange={e => setEnquiryForm({ ...enquiryForm, eventDate: e.target.value })} min={new Date().toISOString().split('T')[0]} style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #c2ccae', background: 'white', fontSize: '12.5px', color: '#3b4c23', fontWeight: 600, outline: 'none' }} />
                        <input type="number" placeholder="Expected guests (optional)" value={enquiryForm.guests} onChange={e => setEnquiryForm({ ...enquiryForm, guests: e.target.value })} style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #c2ccae', background: 'white', fontSize: '12.5px', color: '#3b4c23', fontWeight: 600, outline: 'none' }} />
                        <textarea placeholder="Your requirements / message *" value={enquiryForm.message} onChange={e => setEnquiryForm({ ...enquiryForm, message: e.target.value })} rows={2} style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #c2ccae', background: 'white', fontSize: '12.5px', color: '#3b4c23', fontWeight: 600, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                        <button onClick={submitEnquiry} disabled={enquiryLoading || !enquiryForm.eventType || !enquiryForm.eventDate || !enquiryForm.message} style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', background: (enquiryLoading || !enquiryForm.eventType || !enquiryForm.eventDate || !enquiryForm.message) ? '#c2ccae' : 'linear-gradient(135deg, #6b8e23, #556b2f)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: (enquiryLoading || !enquiryForm.eventType || !enquiryForm.eventDate || !enquiryForm.message) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: (enquiryLoading || !enquiryForm.eventType || !enquiryForm.eventDate || !enquiryForm.message) ? 'none' : '0 4px 16px rgba(107,142,35,0.3)' }}>
                          {enquiryLoading ? 'Sending...' : '📨 Send Enquiry Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Quick Actions (shown on first load) ─── */}
              {showQuickActions && messages.length < 3 && (
                <div style={{
                  padding: '0 16px 8px',
                  background: 'linear-gradient(0deg, #eef0e8 0%, #f7f8f5 100%)',
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8b9a68',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    paddingLeft: '2px',
                  }}>
                    ✨ Quick Actions
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                  }}>
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.message)}
                        disabled={loading}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: '1px solid #dce1d1',
                          background: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                          opacity: loading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          if (!loading) {
                            (e.currentTarget as HTMLButtonElement).style.background = '#f7f8f5';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#6b8e23';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'white';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#dce1d1';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{action.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#556b2f', textAlign: 'center', lineHeight: '1.3' }}>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Suggested Follow-ups (after conversation starts) ─── */}
              {!showQuickActions && !loading && messages.length >= 3 && messages.length < 8 && (
                <div style={{
                  padding: '6px 16px 2px',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  background: 'linear-gradient(0deg, #eef0e8 0%, transparent 100%)',
                }}>
                  {SUGGESTED_FOLLOWUPS.default.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(text)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid #dce1d1',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#556b2f',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#6b8e23';
                        (e.currentTarget as HTMLButtonElement).style.color = 'white';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#6b8e23';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'white';
                        (e.currentTarget as HTMLButtonElement).style.color = '#556b2f';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#dce1d1';
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Input Area ─── */}
              <form
                onSubmit={handleSubmit}
                style={{
                  padding: '12px 16px 16px',
                  background: 'white',
                  borderTop: '1px solid #eef0e8',
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  <div style={{
                    flex: 1,
                    position: 'relative',
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={loading ? 'Shubhi is thinking...' : 'Ask about venues, prices, services...'}
                      disabled={loading}
                      className="chat-input-glow"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f7f8f5',
                        border: '2px solid #eef0e8',
                        borderRadius: '14px',
                        fontSize: '13.5px',
                        color: '#3b4c23',
                        outline: 'none',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#6b8e23'; e.target.style.background = 'white'; }}
                      onBlur={e => { e.target.style.borderColor = '#eef0e8'; e.target.style.background = '#f7f8f5'; }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: (!input.trim() || loading) 
                        ? '#dce1d1' 
                        : 'linear-gradient(135deg, #6b8e23, #556b2f)',
                      border: 'none',
                      color: 'white',
                      cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      boxShadow: (!input.trim() || loading) ? 'none' : '0 4px 12px -2px rgba(107,142,35,0.35)',
                    }}
                    onMouseEnter={e => {
                      if (input.trim() && !loading) {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                {/* Powered by */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '8px',
                  fontSize: '10px',
                  color: '#a5b286',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}>
                  <span>Powered by</span>
                  <span style={{ fontWeight: 700, color: '#8b9a68' }}>Shubharambh AI</span>
                  <span>•</span>
                  <span>Llama 3.3</span>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
