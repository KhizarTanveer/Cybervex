import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, ArrowUpRight } from 'lucide-react';
import { answerQuestion, welcomeMessage } from '../chatbot/knowledgeBase';
import { whatsAppContact, whatsAppLink } from '../data/agencyData';
import './ChatBot.css';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="#25D366"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>
);

// Render **bold** segments and line breaks from the knowledge-base replies
const renderRichText = (text) =>
  text.split('\n\n').map((paragraph, pIdx) => (
    <p key={pIdx}>
      {paragraph.split('\n').map((line, lIdx) => (
        <React.Fragment key={lIdx}>
          {lIdx > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
          )}
        </React.Fragment>
      ))}
    </p>
  ));

const openWhatsApp = (message) => {
  window.open(whatsAppLink(message), '_blank', 'noopener,noreferrer');
};

let messageId = 0;
const createMessage = (from, content) => ({ id: ++messageId, from, ...content });

// Site-wide assistant: AI chat answered from the services knowledge base, plus a direct WhatsApp option
export default function ChatBot({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [createMessage('bot', welcomeMessage)]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const replyTimer = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const close = useCallback(() => {
    setIsOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  const ask = useCallback(
    (question) => {
      const trimmed = question.trim();
      if (!trimmed || isTyping) return;
      setMessages((prev) => [...prev, createMessage('user', { text: trimmed })]);
      setInput('');
      setIsTyping(true);
      // Short natural pause before the assistant replies
      replyTimer.current = setTimeout(() => {
        setMessages((prev) => [...prev, createMessage('bot', answerQuestion(trimmed))]);
        setIsTyping(false);
      }, 550 + Math.min(trimmed.length * 12, 600));
    },
    [isTyping]
  );

  const handleAction = (action) => {
    switch (action.type) {
      case 'ask':
        ask(action.value);
        break;
      case 'whatsapp':
        openWhatsApp(action.value);
        break;
      case 'email':
        window.location.assign(`mailto:${action.value}`);
        break;
      case 'navigate':
        if (onNavigate) onNavigate(action.value);
        close();
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className={`chatbot ${isOpen ? 'chatbot--open' : ''}`}>
      {isOpen && (
        <section className="chatbot__panel" role="dialog" aria-modal="false" aria-label="Cybervex Digital chat assistant">
          <header className="chatbot__header">
            <div className="chatbot__brand">
              <span className="chatbot__avatar" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="chatbot__name">Cybervex Assistant</p>
                <p className="chatbot__status">
                  <span className="chatbot__status-dot" aria-hidden="true" />
                  Online · replies instantly
                </p>
              </div>
            </div>
            <button type="button" className="chatbot__close" onClick={close} aria-label="Close chat">
              <X size={18} />
            </button>
          </header>

          {/* Two options: AI chat (this panel) or a direct WhatsApp DM */}
          <div className="chatbot__modes" role="group" aria-label="Chat options">
            <button type="button" className="chatbot__mode chatbot__mode--active" aria-pressed="true">
              <Sparkles size={15} />
              <span>AI Chat</span>
            </button>
            <button
              type="button"
              className="chatbot__mode chatbot__mode--whatsapp"
              onClick={() => openWhatsApp()}
              aria-label={`Chat on WhatsApp (${whatsAppContact.display}) — opens in a new tab`}
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp</span>
              <ArrowUpRight size={13} className="chatbot__mode-external" />
            </button>
          </div>

          <div className="chatbot__messages" ref={listRef} aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot__msg chatbot__msg--${msg.from}`}>
                <div className="chatbot__bubble">
                  {renderRichText(msg.text)}
                  {msg.bullets && (
                    <ul className="chatbot__bullets">
                      {msg.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {msg.actions && (
                  <div className="chatbot__actions">
                    {msg.actions.map((action) => (
                      <button
                        key={`${action.type}-${action.label}`}
                        type="button"
                        className={`chatbot__chip ${action.type === 'whatsapp' ? 'chatbot__chip--whatsapp' : ''}`}
                        onClick={() => handleAction(action)}
                      >
                        {action.type === 'whatsapp' && <WhatsAppIcon size={14} />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chatbot__msg chatbot__msg--bot">
                <div className="chatbot__bubble chatbot__typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <form className="chatbot__composer" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our services…"
              aria-label="Type your question"
              maxLength={300}
              className="chatbot__input"
            />
            <button type="submit" className="chatbot__send" disabled={!input.trim() || isTyping} aria-label="Send">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="chatbot__launcher"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-label={isOpen ? 'Close chat' : 'Chat with Cybervex Digital'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
