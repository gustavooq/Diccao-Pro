/**
 * LOGICA PRINCIPAL DO APLICATIVO (app.js)
 * Gerencia estado local, abas, timer, som, PWA e eventos
 */

// Chave do localStorage
const STORAGE_KEY = 'diccao_app_state_v1';

// Estado da Aplicação
let appState = {
  completedDays: [],
  streak: 0,
  lastCompletedDate: null,
  favoriteTravalinguas: [],
  kidsStars: 0,
  completedKids: []
};

// Variável para o prompt de instalação PWA
let deferredPrompt = null;

// ==========================================
// EFEITOS SONOROS VIA WEB AUDIO API (Nativo, sem arquivos externos)
// ==========================================
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  },
  playCelebration() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, index * 90);
    });
  },
  playStar() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  },
  playTick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
};

// ==========================================
// CARREGAR E SALVAR ESTADO
// ==========================================
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appState = Object.assign(appState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Erro ao carregar dados locais", e);
  }
  checkStreak();
  updateUI();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn("Erro ao salvar dados locais", e);
  }
  updateUI();
}

// Verifica e atualiza a sequência diária (Streak 🔥)
function checkStreak() {
  if (!appState.lastCompletedDate) return;
  const today = new Date().toISOString().split('T')[0];
  const last = appState.lastCompletedDate;
  
  const diffDays = Math.round((new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) {
    // Quebrou a sequência
    appState.streak = 0;
  }
}

// ==========================================
// RENDERIZAÇÃO DAS TELAS E ABAS
// ==========================================
let currentTab = 'desafio';

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-indigo-400', 'border-indigo-400', 'font-bold');
    btn.classList.add('text-slate-400');
  });

  const activeContent = document.getElementById(`tab-${tabName}`);
  const activeBtn = document.getElementById(`btn-${tabName}`);
  if (activeContent) activeContent.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('text-indigo-400', 'font-bold');
    activeBtn.classList.remove('text-slate-400');
  }

  // Rolar suave para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Atualizar interface geral (Progresso, Streak, Estrelas)
function updateUI() {
  // Progresso do Desafio
  const totalDias = APP_CONTEUDO.config.totalDiasDesafio;
  const concluidos = appState.completedDays.length;
  const pct = Math.round((concluidos / totalDias) * 100);

  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const streakCount = document.getElementById('streak-count');
  const kidsStarsCount = document.getElementById('kids-stars-count');

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressText) progressText.innerText = `${concluidos}/${totalDias} Dias (${pct}%)`;
  if (streakCount) streakCount.innerText = `${appState.streak}d`;
  if (kidsStarsCount) kidsStarsCount.innerText = `${appState.kidsStars} ⭐`;

  renderDesafioGrid();
}

// Renderiza a grade dos 21 dias do desafio
function renderDesafioGrid() {
  const container = document.getElementById('desafio-grid');
  if (!container) return;

  container.innerHTML = '';

  APP_CONTEUDO.desafio21.forEach((diaData) => {
    const isCompleted = appState.completedDays.includes(diaData.dia);
    // O dia atual é o primeiro não concluído
    const isCurrent = !isCompleted && (diaData.dia === 1 || appState.completedDays.includes(diaData.dia - 1));

    const card = document.createElement('div');
    card.className = `p-4 rounded-2xl cursor-pointer transition-all border ${
      isCompleted 
        ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400' 
        : isCurrent 
          ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 pulse-glow' 
          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500 opacity-90'
    }`;

    card.onclick = () => openDayModal(diaData.dia);

    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${
          isCompleted 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : isCurrent 
              ? 'bg-indigo-500/30 text-indigo-300 font-bold' 
              : 'bg-slate-700 text-slate-400'
        }">
          Dia ${diaData.dia.toString().padStart(2, '0')} • Sem ${diaData.semana}
        </span>
        <div class="w-7 h-7 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
        }">
          ${isCompleted ? '✓' : isCurrent ? '▶' : '🔒'}
        </div>
      </div>
      <h3 class="font-bold text-slate-100 text-sm mb-1 leading-snug">${diaData.titulo}</h3>
      <div class="flex items-center text-xs text-slate-400 gap-2">
        <span>🎯 ${diaData.foco}</span>
        <span>•</span>
        <span>⏱️ ${diaData.duracao}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ==========================================
// GRAVADOR DE VOZ PARA AUTOAVALIAÇÃO
// ==========================================
let mediaRecorder = null;
let audioStream = null;
let recordedAudioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let recordTimerInterval = null;
let recordSeconds = 0;
let recordState = 'idle'; // 'idle' | 'recording' | 'recorded'
let isPlayingRecordedAudio = false;

function resetRecorderUI() {
  stopActiveRecording();
  stopActivePlayback();

  if (recordedAudioUrl) {
    URL.revokeObjectURL(recordedAudioUrl);
    recordedAudioUrl = null;
  }
  recordedAudioBlob = null;
  recordedAudioChunks = [];
  recordSeconds = 0;
  recordState = 'idle';

  const recordBtn = document.getElementById('modal-record-btn');
  const recordIcon = document.getElementById('record-btn-icon');
  const recordText = document.getElementById('record-btn-text');
  const statusLabel = document.getElementById('record-status-label');
  const rerecordBtn = document.getElementById('modal-rerecord-btn');

  if (recordBtn) {
    recordBtn.className = "flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md";
  }
  if (recordIcon) recordIcon.innerText = "🎙️";
  if (recordText) recordText.innerText = "Gravar Áudio";
  if (statusLabel) {
    statusLabel.innerText = "Grave sua fala";
    statusLabel.className = "text-[10px] font-semibold text-slate-400";
  }
  if (rerecordBtn) {
    rerecordBtn.className = "w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center text-xl font-bold transition border border-slate-700/60 opacity-50 cursor-not-allowed shrink-0";
  }
}

function handleRecordAction() {
  if (recordState === 'idle') {
    startVoiceRecording();
  } else if (recordState === 'recording') {
    stopVoiceRecording();
  } else if (recordState === 'recorded') {
    togglePlayRecordedAudio();
  }
}

async function startVoiceRecording() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta gravação de áudio direta.");
      return;
    }

    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Suporte aos formatos comuns de áudio em navegadores
    let mimeType = 'audio/webm';
    if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }

    mediaRecorder = new MediaRecorder(audioStream, { mimeType: mimeType });
    recordedAudioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedAudioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedAudioBlob = new Blob(recordedAudioChunks, { type: mimeType });
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
      
      const audioEl = document.getElementById('modal-recorded-audio');
      if (audioEl) {
        audioEl.src = recordedAudioUrl;
        audioEl.onended = () => {
          isPlayingRecordedAudio = false;
          updateRecordedPlayUI();
        };
      }

      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }

      recordState = 'recorded';
      updateRecordedPlayUI();
    };

    mediaRecorder.start(200);
    recordState = 'recording';
    recordSeconds = 0;

    const recordBtn = document.getElementById('modal-record-btn');
    const recordIcon = document.getElementById('record-btn-icon');
    const recordText = document.getElementById('record-btn-text');
    const statusLabel = document.getElementById('record-status-label');
    const rerecordBtn = document.getElementById('modal-rerecord-btn');

    if (recordBtn) {
      recordBtn.className = "flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-rose-600/30 animate-pulse";
    }
    if (recordIcon) recordIcon.innerText = "⏹️";
    if (recordText) recordText.innerText = "Parar Gravação";
    if (rerecordBtn) {
      rerecordBtn.className = "w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-xl font-bold transition border border-slate-600 active:scale-90 shrink-0";
    }

    recordTimerInterval = setInterval(() => {
      recordSeconds++;
      const mins = Math.floor(recordSeconds / 60);
      const secs = recordSeconds % 60;
      if (statusLabel) {
        statusLabel.innerText = `🔴 Gravando... ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        statusLabel.className = "text-[10px] font-bold text-rose-400";
      }
    }, 1000);

  } catch (err) {
    console.error("Erro ao acessar microfone:", err);
    alert("Não foi possível acessar o microfone. Verifique as permissões de áudio do seu navegador.");
  }
}

function stopVoiceRecording() {
  if (recordTimerInterval) {
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

function updateRecordedPlayUI() {
  const recordBtn = document.getElementById('modal-record-btn');
  const recordIcon = document.getElementById('record-btn-icon');
  const recordText = document.getElementById('record-btn-text');
  const statusLabel = document.getElementById('record-status-label');
  const rerecordBtn = document.getElementById('modal-rerecord-btn');

  if (recordBtn) {
    recordBtn.className = isPlayingRecordedAudio 
      ? "flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
      : "flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md";
  }
  if (recordIcon) recordIcon.innerText = isPlayingRecordedAudio ? "⏸️" : "▶️";
  if (recordText) recordText.innerText = isPlayingRecordedAudio ? "Pausar Áudio" : "Ouvir Minha Gravação";
  
  if (statusLabel) {
    statusLabel.innerText = `✓ Gravado (${recordSeconds}s)`;
    statusLabel.className = "text-[10px] font-bold text-emerald-400";
  }

  if (rerecordBtn) {
    rerecordBtn.className = "w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center text-xl font-bold transition border border-slate-600 active:scale-90 shrink-0";
  }
}

function togglePlayRecordedAudio() {
  const audioEl = document.getElementById('modal-recorded-audio');
  if (!audioEl || !recordedAudioUrl) return;

  if (isPlayingRecordedAudio) {
    audioEl.pause();
    isPlayingRecordedAudio = false;
  } else {
    audioEl.play().catch(e => console.log('Audio playback error:', e));
    isPlayingRecordedAudio = true;
  }
  updateRecordedPlayUI();
}

function stopActiveRecording() {
  if (recordTimerInterval) {
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch(e){}
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
}

function stopActivePlayback() {
  const audioEl = document.getElementById('modal-recorded-audio');
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  isPlayingRecordedAudio = false;
}

// ==========================================
// AVISO E CONFIRMAÇÃO DE REGRAVAR (↺)
// ==========================================
function promptResetRecording() {
  // Se ainda estiver no estado idle, não há gravação para apagar
  if (recordState === 'idle') {
    return;
  }
  // Abre o modal de aviso
  const modal = document.getElementById('rerecord-confirm-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeRerecordModal() {
  const modal = document.getElementById('rerecord-confirm-modal');
  if (modal) modal.classList.add('hidden');
}

function confirmAndRerecord() {
  closeRerecordModal();
  resetRecorderUI();
  // Inicia automaticamente uma nova gravação limpa
  startVoiceRecording();
}

// ==========================================
// MODAL DO TREINO DO DIA
// ==========================================
let activeModalDay = null;

function openDayModal(dayNumber) {
  const data = APP_CONTEUDO.desafio21.find(d => d.dia === dayNumber);
  if (!data) return;
  activeModalDay = dayNumber;

  const modal = document.getElementById('day-modal');
  const isCompleted = appState.completedDays.includes(dayNumber);

  document.getElementById('modal-day-badge').innerText = `DIA ${data.dia} • SEMANA ${data.semana}`;
  document.getElementById('modal-title').innerText = data.titulo;
  document.getElementById('modal-focus').innerText = `Foco: ${data.foco} (${data.duracao})`;
  document.getElementById('modal-tip').innerText = data.dica;
  
  // Passos
  const stepsContainer = document.getElementById('modal-steps');
  stepsContainer.innerHTML = data.passos.map(step => `
    <li class="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 text-slate-200 text-sm leading-relaxed">${step}</li>
  `).join('');

  // Frase de Treino
  document.getElementById('modal-training-phrase').innerText = `"${data.fraseTreino}"`;

  // Resetar gravador de voz para o treino do dia
  resetRecorderUI();

  // Botão de Conclusão
  const completeBtn = document.getElementById('modal-complete-btn');
  if (isCompleted) {
    completeBtn.className = "w-full py-3.5 px-4 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition";
    completeBtn.innerText = "✓ Dia Concluído (Toque para desmarcar)";
    completeBtn.onclick = () => toggleCompleteDay(dayNumber);
  } else {
    completeBtn.className = "w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 transition transform active:scale-95";
    completeBtn.innerText = "🎉 Marcar Dia como Concluído!";
    completeBtn.onclick = () => toggleCompleteDay(dayNumber);
  }

  // Resetar o timer de treino
  resetWorkoutTimer();

  modal.classList.remove('hidden');
}

function closeDayModal() {
  const modal = document.getElementById('day-modal');
  modal.classList.add('hidden');
  stopWorkoutTimer();
  stopActiveRecording();
  stopActivePlayback();
  window.speechSynthesis.cancel();
}

function toggleCompleteDay(dayNumber) {
  const index = appState.completedDays.indexOf(dayNumber);
  const today = new Date().toISOString().split('T')[0];

  if (index > -1) {
    // Desmarcar
    appState.completedDays.splice(index, 1);
  } else {
    // Marcar como concluído
    appState.completedDays.push(dayNumber);
    appState.completedDays.sort((a, b) => a - b);

    // Atualiza Streak
    if (appState.lastCompletedDate !== today) {
      appState.streak += 1;
      appState.lastCompletedDate = today;
    }

    // Tocar comemoração e soltar confetes
    SoundFX.playCelebration();
    triggerConfetti();
  }

  saveState();
  closeDayModal();
}

// Síntese de voz com dicção clara para a frase
function playTrainingSpeech(text, customAudio) {
  if (customAudio && customAudio.trim() !== '') {
    const audio = new Audio(customAudio);
    audio.play().catch(e => console.log('Audio file fallback:', e));
    return;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.85; // Velocidade ligeiramente pausada para clareza
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// ==========================================
// CRONÔMETRO INTERATIVO DE TREINO (60s)
// ==========================================
let timerInterval = null;
let timerSeconds = 60;
let isTimerRunning = false;

function toggleWorkoutTimer() {
  if (isTimerRunning) {
    stopWorkoutTimer();
  } else {
    startWorkoutTimer();
  }
}

function startWorkoutTimer() {
  isTimerRunning = true;
  document.getElementById('timer-btn').innerText = "Pausar";
  document.getElementById('timer-btn').classList.replace('bg-indigo-600', 'bg-amber-600');

  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
      SoundFX.playTick();
    } else {
      stopWorkoutTimer();
      SoundFX.playCelebration();
    }
  }, 1000);
}

function stopWorkoutTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  const btn = document.getElementById('timer-btn');
  if (btn) {
    btn.innerText = "Iniciar 60s";
    btn.classList.replace('bg-amber-600', 'bg-indigo-600');
  }
}

function resetWorkoutTimer() {
  stopWorkoutTimer();
  timerSeconds = 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (el) el.innerText = `${timerSeconds}s`;
}

// ==========================================
// SEÇÃO: TRAVA-LÍNGUAS
// ==========================================
let travaLinguasFilter = 'todos';

function renderTravaLinguas() {
  const container = document.getElementById('travalinguas-list');
  if (!container) return;

  const searchVal = (document.getElementById('tl-search')?.value || '').toLowerCase();

  const filtered = APP_CONTEUDO.travaLinguas.filter(item => {
    const matchSearch = item.titulo.toLowerCase().includes(searchVal) || item.texto.toLowerCase().includes(searchVal);
    if (!matchSearch) return false;

    if (travaLinguasFilter === 'todos') return true;
    if (travaLinguasFilter === 'favoritos') return appState.favoriteTravalinguas.includes(item.id);
    return item.dificuldade === travaLinguasFilter || item.fonema === travaLinguasFilter;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p class="text-3xl mb-2">🔍</p>
        <p class="font-medium">Nenhum trava-língua encontrado.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const isFav = appState.favoriteTravalinguas.includes(item.id);
    const card = document.createElement('div');
    card.className = "p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-indigo-500/50 transition";

    const badgeColor = item.dificuldade === 'facil' 
      ? 'bg-emerald-500/20 text-emerald-400' 
      : item.dificuldade === 'medio' 
        ? 'bg-amber-500/20 text-amber-400' 
        : 'bg-rose-500/20 text-rose-400';

    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${badgeColor}">
            ${item.dificuldade}
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            Fonema ${item.fonema}
          </span>
        </div>
        <button onclick="toggleFavoriteTL('${item.id}')" class="text-xl transition transform active:scale-125">
          ${isFav ? '⭐' : '☆'}
        </button>
      </div>

      <h4 class="font-bold text-slate-100 text-base mb-2">${item.titulo}</h4>
      <p class="text-slate-200 text-sm font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 selectable mb-3">
        "${item.texto}"
      </p>

      <p class="text-xs text-indigo-300/80 mb-4 flex items-center gap-1.5">
        <span>💡</span> <span>${item.dica}</span>
      </p>

      <div class="flex items-center gap-2 pt-2 border-t border-slate-700/40">
        <button onclick="playTrainingSpeech('${item.texto.replace(/'/g, "\\'")}')" class="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition">
          <span>🔊</span> <span>Ouvir Dicção</span>
        </button>
        <button onclick="startTLChallenge('${item.id}')" class="flex-1 py-2 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition">
          <span>⚡</span> <span>Desafio 3x</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterTravaLinguas(type) {
  travaLinguasFilter = type;
  document.querySelectorAll('.tl-filter-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600', 'text-white');
    btn.classList.add('bg-slate-800', 'text-slate-300');
  });
  const activeBtn = document.getElementById(`filter-tl-${type}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-indigo-600', 'text-white');
    activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
  }
  renderTravaLinguas();
}

function toggleFavoriteTL(id) {
  const idx = appState.favoriteTravalinguas.indexOf(id);
  if (idx > -1) {
    appState.favoriteTravalinguas.splice(idx, 1);
  } else {
    appState.favoriteTravalinguas.push(id);
    SoundFX.playStar();
  }
  saveState();
  renderTravaLinguas();
}

// Mini cronômetro do desafio 3x
let tlTimerInterval = null;
let tlStartTime = null;

function startTLChallenge(id) {
  const item = APP_CONTEUDO.travaLinguas.find(t => t.id === id);
  if (!item) return;

  const modal = document.getElementById('challenge-modal');
  document.getElementById('challenge-title').innerText = `Desafio 3x: ${item.titulo}`;
  document.getElementById('challenge-text').innerText = item.texto;
  document.getElementById('challenge-timer').innerText = "0.0s";
  document.getElementById('challenge-action-btn').innerText = "Começar a Falar!";
  document.getElementById('challenge-action-btn').onclick = () => runTLChallengeTimer();

  modal.classList.remove('hidden');
}

function runTLChallengeTimer() {
  const btn = document.getElementById('challenge-action-btn');
  const timerEl = document.getElementById('challenge-timer');

  if (tlTimerInterval) {
    // Parar timer
    clearInterval(tlTimerInterval);
    tlTimerInterval = null;
    const finalTime = ((Date.now() - tlStartTime) / 1000).toFixed(1);
    btn.innerText = "Novo Desafio!";
    btn.onclick = () => runTLChallengeTimer();
    SoundFX.playCelebration();
    triggerConfetti();
    timerEl.innerText = `${finalTime}s 🎉`;
  } else {
    // Iniciar timer
    tlStartTime = Date.now();
    btn.innerText = "Parei! (Falei 3x)";
    btn.classList.replace('bg-indigo-600', 'bg-rose-600');
    tlTimerInterval = setInterval(() => {
      const elapsed = ((Date.now() - tlStartTime) / 1000).toFixed(1);
      timerEl.innerText = `${elapsed}s`;
    }, 100);
  }
}

function closeChallengeModal() {
  if (tlTimerInterval) clearInterval(tlTimerInterval);
  tlTimerInterval = null;
  document.getElementById('challenge-modal').classList.add('hidden');
}

// ==========================================
// SEÇÃO: KIDS
// ==========================================
let kidsCategory = 'bichos';

function switchKidsCategory(cat) {
  kidsCategory = cat;
  document.querySelectorAll('.kids-cat-btn').forEach(btn => {
    btn.classList.remove('bg-amber-500', 'text-slate-900', 'font-black');
    btn.classList.add('bg-slate-800', 'text-slate-300');
  });

  const activeBtn = document.getElementById(`kids-btn-${cat}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-amber-500', 'text-slate-900', 'font-black');
    activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
  }

  renderKidsContent();
}

function renderKidsContent() {
  const container = document.getElementById('kids-content-list');
  if (!container) return;

  container.innerHTML = '';

  let items = [];
  if (kidsCategory === 'bichos') items = APP_CONTEUDO.kids.exerciciosBichos;
  if (kidsCategory === 'respiracao') items = APP_CONTEUDO.kids.exerciciosRespiracao;
  if (kidsCategory === 'travalinguas') items = APP_CONTEUDO.kids.travalinguasKids;

  items.forEach(item => {
    const isDone = appState.completedKids.includes(item.id);
    const card = document.createElement('div');
    card.className = "p-5 rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-amber-500/30 shadow-lg relative overflow-hidden";

    card.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shrink-0">
          ${item.emoji}
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h4 class="font-black text-amber-300 text-base">${item.titulo}</h4>
            <span class="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">+1 ⭐</span>
          </div>
          ${item.beneficio ? `<p class="text-xs text-slate-400 mb-2 font-medium">🎯 ${item.beneficio}</p>` : ''}
          <p class="text-slate-200 text-sm leading-relaxed mb-4 font-medium">
            ${item.instrucao || `"${item.texto}"`}
          </p>

          <button onclick="completeKidsExercise('${item.id}', '${(item.instrucao || item.texto).replace(/'/g, "\\'")}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-black transition transform active:scale-95 flex items-center justify-center gap-2 ${
            isDone 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
          }">
            <span>${isDone ? '✓ Concluído!' : '🎈 Concluir Exercício!'}</span>
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function completeKidsExercise(id, spokenText) {
  if (!appState.completedKids.includes(id)) {
    appState.completedKids.push(id);
    appState.kidsStars += 1;
    SoundFX.playStar();
    triggerConfetti();
    saveState();
    renderKidsContent();
  } else {
    // Já fez, apenas reproduz incentivo sonoro
    SoundFX.playStar();
  }
}

// ==========================================
// PWA: INSTALAÇÃO INTELIGENTE (Android + iOS)
// ==========================================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBanner = document.getElementById('pwa-install-banner');
  if (installBanner) installBanner.classList.remove('hidden');
});

function openInstallModal() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const modal = document.getElementById('install-modal');
  const iosGuide = document.getElementById('ios-install-guide');
  const androidGuide = document.getElementById('android-install-guide');

  if (isIOS) {
    if (iosGuide) iosGuide.classList.remove('hidden');
    if (androidGuide) androidGuide.classList.add('hidden');
  } else {
    if (androidGuide) androidGuide.classList.remove('hidden');
    if (iosGuide) iosGuide.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeInstallModal() {
  document.getElementById('install-modal').classList.add('hidden');
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) installBanner.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  } else {
    // Abre guia manual
    openInstallModal();
  }
}

// ==========================================
// EFEITO DE CONFETES (Canvas nativo simples)
// ==========================================
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravidade
      p.alpha -= 0.015;

      if (p.alpha > 0) {
        active = true;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });

    if (active) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  frame();
}

// ==========================================
// INICIALIZAÇÃO GERAL AO CARREGAR
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('PWA Service Worker Ativo!'))
      .catch(err => console.log('SW Error:', err));
  }

  loadState();
  renderTravaLinguas();
  renderKidsContent();

  // Busca em tempo real nos trava-línguas
  const searchInput = document.getElementById('tl-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderTravaLinguas());
  }
});
