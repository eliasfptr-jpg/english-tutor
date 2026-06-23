let currentLevel = 'B1';
let messages = [];
let isListening = false;
let recognition = null;
let speechSynth = window.speechSynthesis;
let isSpeaking = false;

const chatMessages = document.getElementById('chatMessages');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');

document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = btn.dataset.level;
    messages = [];
    chatMessages.innerHTML = '';
    addMessage('tutor', `Switched to ${currentLevel}. Let's practice ${currentLevel} English!`);
  });
});

sendBtn.addEventListener('click', sendMessage);
textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

micBtn.addEventListener('click', toggleListening);

function sendMessage() {
  const text = textInput.value.trim();
  if (!text) return;
  textInput.value = '';
  addMessage('user', text);
  messages.push({ role: 'user', content: text });
  getAIResponse();
}

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="avatar">${role === 'user' ? 'You' : 'AI'}</div>
    <div class="bubble">${content}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message tutor';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

async function getAIResponse() {
  addTypingIndicator();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, level: currentLevel }),
    });
    const data = await res.json();
    removeTypingIndicator();
    if (data.error) throw new Error(data.error);
    addMessage('tutor', data.reply);
    messages.push({ role: 'assistant', content: data.reply });
    speakText(data.reply);
  } catch (err) {
    removeTypingIndicator();
    addMessage('tutor', data?.error || 'Sorry, I had trouble connecting. Make sure opencode serve is running.');
    console.error(err);
  }
}

function toggleListening() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
    return;
  }

  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    textInput.value = transcript;
    stopListening();
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    stopListening();
    if (event.error === 'not-allowed') {
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  };

  recognition.onend = () => {
    stopListening();
  };

  try {
    recognition.start();
  } catch (e) {
    console.error(e);
  }
}

function stopListening() {
  isListening = false;
  micBtn.classList.remove('listening');
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = currentLevel === 'A1' ? 0.6 : currentLevel === 'A2' ? 0.7 : currentLevel === 'B1' ? 0.85 : currentLevel === 'B2' ? 0.95 : 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;
  isSpeaking = true;
  utterance.onend = () => { isSpeaking = false; };
  window.speechSynthesis.speak(utterance);
}
