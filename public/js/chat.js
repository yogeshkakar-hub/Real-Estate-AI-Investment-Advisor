// chat.js — Chat interface: sessions sidebar + message UI

let currentSessionId = null;

// Marked.js is loaded via CDN — renders markdown in AI responses
function renderMarkdown(text) {
  if (window.marked) {
    return marked.parse(text);
  }
  // Fallback: convert basic markdown
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function appendMessage(role, content, animate = false) {
  const container = document.getElementById('chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;

  if (role === 'user') {
    msgEl.innerHTML = `
      <div class="message-avatar user-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
      </div>
      <div class="message-bubble user-bubble">${escapeHtml(content)}</div>
    `;
  } else {
    const html = renderMarkdown(content);
    msgEl.innerHTML = `
      <div class="message-avatar ai-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
      </div>
      <div class="message-bubble ai-bubble ${animate ? 'animate-in' : ''}">
        <div class="ai-response-content">${html}</div>
      </div>
    `;
  }

  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
  return msgEl;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'chat-message ai-message typing-indicator-wrapper';
  el.id = 'typing-indicator';
  el.innerHTML = `
    <div class="message-avatar ai-avatar">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
    </div>
    <div class="message-bubble ai-bubble typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

async function sendChatMessage(message) {
  if (!message.trim()) return;

  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  appendMessage('user', message);
  showTypingIndicator();

  try {
    const data = await api.sendMessage(message, currentSessionId);
    currentSessionId = data.sessionId;
    removeTypingIndicator();
    appendMessage('model', data.response, true);
    loadSessions(); // refresh sidebar
  } catch (err) {
    removeTypingIndicator();
    appendMessage('model', `❌ Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

async function loadSessions() {
  try {
    const { sessions } = await api.getSessions();
    const sidebar = document.getElementById('sessions-list');
    sidebar.innerHTML = '';

    if (!sessions.length) {
      sidebar.innerHTML = '<p class="no-sessions">No conversations yet. Start chatting!</p>';
      return;
    }

    sessions.forEach(s => {
      const el = document.createElement('div');
      el.className = `session-item ${s.id === currentSessionId ? 'active' : ''}`;
      el.dataset.id = s.id;
      el.innerHTML = `
        <div class="session-title">${escapeHtml(s.title)}</div>
        <div class="session-meta">${formatDate(s.updated_at)}</div>
        <button class="session-delete-btn" data-sid="${s.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      `;

      el.addEventListener('click', (e) => {
        if (e.target.closest('.session-delete-btn')) return;
        loadSessionMessages(s.id);
      });

      el.querySelector('.session-delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this conversation?')) {
          await api.deleteSession(s.id);
          if (currentSessionId === s.id) {
            currentSessionId = null;
            document.getElementById('chat-messages').innerHTML = '';
            renderWelcomeChips();
          }
          loadSessions();
        }
      });

      sidebar.appendChild(el);
    });
  } catch (err) {
    console.error('Failed to load sessions:', err);
  }
}

async function loadSessionMessages(sessionId) {
  try {
    const { session, messages } = await api.getSession(sessionId);
    currentSessionId = sessionId;

    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    messages.forEach(m => appendMessage(m.role, m.content));

    // Update active session in sidebar
    document.querySelectorAll('.session-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.id) === sessionId);
    });
  } catch (err) {
    console.error('Failed to load session:', err);
  }
}

function renderWelcomeChips() {
  const container = document.getElementById('chat-messages');
  const user = Auth.getUser();
  const firstName = escapeHtml(user?.name?.split(' ')[0] || 'Investor');

  container.innerHTML = `
    <div class="chat-welcome">
      <div class="welcome-glow-ring">
        <div class="welcome-icon">🏠</div>
      </div>
      <h2 class="welcome-title">Welcome back, <span class="welcome-name-highlight">${firstName}</span></h2>
      <p>Your AI-powered real estate advisor for India's fastest-growing markets. Ask me anything about locations, ROI, or investment strategy.</p>
      <div class="quick-chips">
        <button class="chip" data-msg="What are the best locations to invest ₹1 Cr in India right now? Compare top 3 areas with ROI estimates.">
          <span class="chip-icon">💰</span>
          <span class="chip-text">
            <strong>₹1 Cr Investment</strong>
            <span>Best locations right now</span>
          </span>
        </button>
        <button class="chip" data-msg="Compare Noida Sector 150 vs Gurgaon Dwarka Expressway for real estate investment in 2025. Include ROI, rental yield and growth potential.">
          <span class="chip-icon">⚖️</span>
          <span class="chip-text">
            <strong>Noida vs Gurgaon</strong>
            <span>Side-by-side ROI comparison</span>
          </span>
        </button>
        <button class="chip" data-msg="Which city in India offers the highest rental yield in 2024-2025? Give top 3 with specific areas and yield percentages.">
          <span class="chip-icon">📈</span>
          <span class="chip-text">
            <strong>Highest Rental Yield</strong>
            <span>Top cities ranked by yield</span>
          </span>
        </button>
        <button class="chip" data-msg="Is Hyderabad HITECH City still a good investment in 2025? Analyze growth drivers, risks and expected returns.">
          <span class="chip-icon">🔥</span>
          <span class="chip-text">
            <strong>Hyderabad Outlook</strong>
            <span>HITECH City deep dive</span>
          </span>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendChatMessage(chip.dataset.msg);
    });
  });
}


function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const newChatBtn = document.getElementById('new-chat-btn');

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  });

  // Send on Enter (Shift+Enter for newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage(input.value.trim());
    }
  });

  sendBtn.addEventListener('click', () => {
    sendChatMessage(input.value.trim());
  });

  newChatBtn.addEventListener('click', () => {
    currentSessionId = null;
    document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
    renderWelcomeChips();
    input.focus();
  });

  renderWelcomeChips();
  loadSessions();
}

window.initChat = initChat;
window.loadSessions = loadSessions;
