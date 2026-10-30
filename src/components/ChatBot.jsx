import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, ArrowUpRight } from 'lucide-react';
import { answerQuestion, welcomeMessage } from '../chatbot/knowledgeBase';
import { whatsAppContact, whatsAppLink } from '../data/agencyData';
import WhatsAppIcon from './WhatsAppIcon';
import './ChatBot.css';

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
