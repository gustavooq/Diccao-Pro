/**
 * LÓGICA PRINCIPAL DO APLICATIVO (app.js)
 * Estado, progresso, abas, treinos, trava-línguas, kids, certificado e PWA.
 * Depende de: conteudo.js, db.js, recorder.js
 */

const STORAGE_KEY = 'diccao_app_state_v1';
const CFG = APP_CONTEUDO.config;
const TOTAL_DIAS = CFG.totalDiasDesafio;

const DEFAULT_STATE = {
  completedDays: [],
  completionDates: {}, // { [dia]: 'AAAA-MM-DD' } (data local em que concluiu)
  favoriteTravalinguas: [],
  tlRecords: {}, // { [id]: melhor tempo em segundos no Desafio 3x }
  kidsStars: 0,
  completedKids: [],
  userName: '',
  onboarded: false,
  accessGranted: false
};

let appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
let deferredPrompt = null;

// ==========================================
// DATAS (sempre no horário LOCAL do aparelho)
// ==========================================
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey() {
  return dateKey(new Date());
}

function formatDateBR(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

// ==========================================
// EFEITOS SONOROS (Web Audio API, sem arquivos)
// ==========================================
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
  },
  tone(freq, type, duration, volume, delay = 0, endFreq = null) {
    this.init();
    if (!this.ctx) return;
    setTimeout(() => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }, delay);
  },
  playCelebration() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 'triangle', 0.4, 0.15, i * 90));
  },
  playStar() {
    this.tone(880, 'sine', 0.3, 0.15, 0, 1760);
  },
  playTick() {
    this.tone(600, 'square', 0.05, 0.05);
  }
};

// ==========================================
// ESTADO: CARREGAR, MIGRAR E SALVAR
// ==========================================
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      appState = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
      // Migração da versão antiga (sem datas por dia)
      const fallback = saved.lastCompletedDate || todayKey();
      appState.completedDays.forEach((d) => {
        if (!appState.completionDates[d]) appState.completionDates[d] = fallback;
      });
      delete appState.streak;
      delete appState.lastCompletedDate;
    }
  } catch (e) {
    console.warn('Erro ao carregar dados locais', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Erro ao salvar dados locais', e);
  }
  updateUI();
}

// Sequência 🔥 = dias seguidos (até hoje ou ontem) com treino concluído
function computeStreak() {
  const dates = new Set(Object.values(appState.completionDates));
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (!dates.has(dateKey(d))) {
    d.setDate(d.getDate() - 1);
    if (!dates.has(dateKey(d))) return 0;
  }
  let streak = 0;
  while (dates.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ==========================================
// AVISOS RÁPIDOS (TOAST)
// ==========================================
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none'), 3000);
}

// ==========================================
// ABAS
// ==========================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.remove('text-indigo-400', 'font-bold');
    btn.classList.add('text-slate-400');
  });
  const content = document.getElementById(`tab-${tabName}`);
  const btn = document.getElementById(`btn-${tabName}`);
  if (content) content.classList.remove('hidden');
  if (btn) {
    btn.classList.add('text-indigo-400', 'font-bold');
    btn.classList.remove('text-slate-400');
  }
  Gravacoes.stopPlayback();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// INTERFACE GERAL
// ==========================================
function updateUI() {
  const done = appState.completedDays.length;
  const pct = Math.round((done / TOTAL_DIAS) * 100);

  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${pct}%`;
  setText('progress-text', `${done}/${TOTAL_DIAS} dias (${pct}%)`);
  setText('streak-count', `${computeStreak()}d`);
  setText('kids-stars-count', `${appState.kidsStars} ⭐`);
  setText('header-greeting', appState.userName ? `Olá, ${appState.userName} 👋` : 'Desafio diário');

  renderDesafioGrid();
  renderEvolucao();
  renderCertificadoCard();
}

// ==========================================
// DESAFIO 21 DIAS: LIBERAÇÃO DOS DIAS
// ==========================================
function isDone(n) {
  return appState.completedDays.includes(n);
}

/**
 * 'done'            -> concluído
 * 'open'            -> liberado para treinar
 * 'locked-seq'      -> precisa concluir o dia anterior
 * 'locked-tomorrow' -> anterior concluído hoje, libera amanhã (modo diário)
 */
function getDayStatus(n) {
  if (isDone(n)) return 'done';
  const mode = CFG.modoLiberacao || 'diario';
  if (mode === 'livre' || n === 1) return 'open';
  if (!isDone(n - 1)) return 'locked-seq';
  if (mode === 'diario' && appState.completionDates[n - 1] === todayKey()) return 'locked-tomorrow';
  return 'open';
}

function canUncheck(n) {
  return isDone(n) && !isDone(n + 1);
}

function renderDesafioGrid() {
  const container = document.getElementById('desafio-grid');
  if (!container) return;
  container.innerHTML = '';

  APP_CONTEUDO.desafio21.forEach((dia) => {
    const st = getDayStatus(dia.dia);
    const styles = {
      done: {
        card: 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400',
        icon: 'bg-emerald-500 text-white',
        symbol: '✓'
      },
      open: {
        card: 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 pulse-glow',
        badge: 'bg-indigo-500/30 text-indigo-300 font-bold',
        icon: 'bg-indigo-500 text-white',
        symbol: '▶'
      },
      'locked-tomorrow': {
        card: 'bg-slate-800/60 border-amber-500/40',
        badge: 'bg-amber-500/20 text-amber-300',
        icon: 'bg-amber-500/30 text-amber-200',
        symbol: '⏳'
      },
      'locked-seq': {
        card: 'bg-slate-800/40 border-slate-700/60 opacity-70',
        badge: 'bg-slate-700 text-slate-400',
        icon: 'bg-slate-700 text-slate-400',
        symbol: '🔒'
      }
    }[st];

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `w-full text-left p-4 rounded-2xl transition-all border ${styles.card}`;
    card.onclick = () => onDayClick(dia.dia);
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}">
          Dia ${String(dia.dia).padStart(2, '0')} • Semana ${dia.semana}
        </span>
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-sm ${styles.icon}">${styles.symbol}</div>
      </div>
      <h3 class="font-bold text-slate-100 text-sm mb-1 leading-snug">${dia.titulo}</h3>
      <div class="flex flex-wrap items-center text-xs text-slate-400 gap-x-2">
        <span>🎯 ${dia.foco}</span><span>•</span><span>⏱️ ${dia.duracao}</span>
        ${st === 'locked-tomorrow' ? '<span class="text-amber-300 font-semibold">• Libera amanhã</span>' : ''}
      </div>`;
    container.appendChild(card);
  });
}

function onDayClick(n) {
  const st = getDayStatus(n);
  if (st === 'locked-seq') {
    showToast(`🔒 Conclua o Dia ${n - 1} primeiro.`);
    return;
  }
  if (st === 'locked-tomorrow') {
    showToast('⏳ Volte amanhã! Um novo treino é liberado por dia.');
    return;
  }
  openDayModal(n);
}

// ==========================================
// MODAL DO TREINO DO DIA
// ==========================================
function openDayModal(n) {
  const data = APP_CONTEUDO.desafio21.find((d) => d.dia === n);
  if (!data) return;

  document.getElementById('modal-day-badge').textContent = `DIA ${data.dia} • SEMANA ${data.semana}`;
  document.getElementById('modal-title').textContent = data.titulo;
  document.getElementById('modal-focus').textContent = `Foco: ${data.foco} (${data.duracao})`;
  document.getElementById('modal-tip').textContent = data.dica;
  document.getElementById('modal-steps').innerHTML = data.passos
    .map((p) => `<li class="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 text-slate-200 text-sm leading-relaxed">${p}</li>`)
    .join('');
  document.getElementById('modal-training-phrase').textContent = `"${data.fraseTreino}"`;

  // Gravador do dia (salvo como "dia-N")
  const slot = document.getElementById('modal-rec-slot');
  slot.dataset.recSlot = `dia-${n}`;
  slot.dataset.recLabel = `Dia ${n}`;
  Gravacoes.refresh(`dia-${n}`);

  // Botão de conclusão
  const btn = document.getElementById('modal-complete-btn');
  const st = getDayStatus(n);
  btn.disabled = false;
  if (st === 'done') {
    if (canUncheck(n)) {
      btn.className = 'w-full py-3.5 px-4 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition';
      btn.textContent = '✓ Dia concluído (toque para desmarcar)';
    } else {
      btn.className = 'w-full py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-emerald-400 cursor-default';
      btn.textContent = `✓ Concluído em ${formatDateBR(appState.completionDates[n])}`;
      btn.disabled = true;
    }
  } else {
    btn.className =
      'w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 transition active:scale-95';
    btn.textContent = '🎉 Marcar dia como concluído!';
  }
  btn.onclick = () => toggleCompleteDay(n);

  resetWorkoutTimer();
  document.getElementById('day-modal').classList.remove('hidden');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.add('hidden');
  stopWorkoutTimer();
  Gravacoes.stop();
  Gravacoes.stopPlayback();
}

function toggleCompleteDay(n) {
  const st = getDayStatus(n);
  if (st === 'done') {
    if (!canUncheck(n)) return;
    appState.completedDays = appState.completedDays.filter((d) => d !== n);
    delete appState.completionDates[n];
  } else if (st === 'open') {
    appState.completedDays.push(n);
    appState.completedDays.sort((a, b) => a - b);
    appState.completionDates[n] = todayKey();
    SoundFX.playCelebration();
    triggerConfetti();
    if (n === TOTAL_DIAS) setTimeout(openCertificateModal, 900);
    else if ((CFG.modoLiberacao || 'diario') === 'diario') showToast('🔥 Treino concluído! O próximo libera amanhã.');
  } else {
    return;
  }
  saveState();
  closeDayModal();
}

// ==========================================
// CRONÔMETRO DE PRÁTICA (60s)
// ==========================================
let timerInterval = null;
let timerSeconds = 60;

function toggleWorkoutTimer() {
  if (timerInterval) stopWorkoutTimer();
  else startWorkoutTimer();
}

function startWorkoutTimer() {
  if (timerSeconds <= 0) timerSeconds = 60;
  const btn = document.getElementById('timer-btn');
  btn.textContent = 'Pausar';
  btn.classList.replace('bg-indigo-600', 'bg-amber-600');
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      stopWorkoutTimer();
      SoundFX.playCelebration();
      showToast('⏱️ 60 segundos concluídos!');
    } else if (timerSeconds <= 5) {
      SoundFX.playTick();
    }
  }, 1000);
}

function stopWorkoutTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  const btn = document.getElementById('timer-btn');
  if (btn) {
    btn.textContent = 'Iniciar';
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
  if (el) el.textContent = `${timerSeconds}s`;
}

// ==========================================
// MINHA EVOLUÇÃO (ANTES x DEPOIS)
// ==========================================
function renderEvolucao() {
  const box = document.getElementById('evolucao-card');
  if (!box) return;

  if (!Gravacoes.has('dia-1')) {
    box.innerHTML = '';
    return;
  }

  let latest = null;
  for (let n = TOTAL_DIAS; n > 1; n--) {
    if (Gravacoes.has(`dia-${n}`)) {
      latest = n;
      break;
    }
  }

  box.innerHTML = `
    <div class="p-4 rounded-3xl bg-slate-800/70 border border-slate-700/70 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-extrabold text-slate-100 flex items-center gap-2"><span>📈</span><span>Minha Evolução</span></h2>
        <span class="text-[11px] text-slate-400">Antes x Depois</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <p class="text-[11px] font-bold text-slate-400 uppercase mb-1.5">Dia 1 (antes)</p>
          <div data-rec-slot="dia-1" data-rec-variant="play"></div>
        </div>
        <div>
          <p class="text-[11px] font-bold text-emerald-400 uppercase mb-1.5">${latest ? `Dia ${latest} (agora)` : 'Agora'}</p>
          ${
            latest
              ? `<div data-rec-slot="dia-${latest}" data-rec-variant="play"></div>`
              : '<div class="py-2.5 px-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 text-[11px] text-center">Grave nos próximos dias</div>'
          }
        </div>
      </div>
      <p class="text-[11px] text-slate-400 mt-2.5">Ouça as duas gravações em sequência e perceba a diferença na clareza da sua fala.</p>
    </div>`;
  Gravacoes.refresh('dia-1');
  if (latest) Gravacoes.refresh(`dia-${latest}`);
}

// ==========================================
// CERTIFICADO DE CONCLUSÃO
// ==========================================
function renderCertificadoCard() {
  const box = document.getElementById('certificado-card');
  if (!box) return;
  if (!isDone(TOTAL_DIAS)) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `
    <button onclick="openCertificateModal()" class="w-full mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-left shadow-lg shadow-amber-500/20 active:scale-[0.98] transition flex items-center gap-3">
      <span class="text-3xl">🎓</span>
      <span class="flex-1">
        <span class="block font-black text-sm">Desafio concluído! Parabéns!</span>
        <span class="block text-xs font-semibold opacity-80">Toque para gerar e compartilhar seu certificado</span>
      </span>
      <span class="text-xl">›</span>
    </button>`;
}

let certificateBlob = null;

async function openCertificateModal() {
  const input = document.getElementById('cert-name');
  input.value = appState.userName || '';
  document.getElementById('certificate-modal').classList.remove('hidden');
  await updateCertificatePreview();
}

function closeCertificateModal() {
  document.getElementById('certificate-modal').classList.add('hidden');
}

async function updateCertificatePreview() {
  const name = document.getElementById('cert-name').value.trim();
  if (name && name !== appState.userName) {
    appState.userName = name;
    saveState();
  }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const canvas = drawCertificate(name || 'Aluno(a)');
  document.getElementById('cert-preview').src = canvas.toDataURL('image/png');
  certificateBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
}

function drawCertificate(name) {
  const c = document.createElement('canvas');
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext('2d');
  const font = '"Plus Jakarta Sans", system-ui, sans-serif';

  const bg = g.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.55, '#312e81');
  bg.addColorStop(1, '#581c87');
  g.fillStyle = bg;
  g.fillRect(0, 0, 1080, 1350);

  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 4;
  g.strokeRect(50, 50, 980, 1250);
  g.strokeStyle = 'rgba(251,191,36,0.6)';
  g.lineWidth = 2;
  g.strokeRect(70, 70, 940, 1210);

  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = `120px ${font}`;
  g.fillText('🎓', 540, 260);

  g.fillStyle = '#fbbf24';
  g.font = `800 42px ${font}`;
  g.fillText('CERTIFICADO DE CONCLUSÃO', 540, 370);

  g.fillStyle = '#c7d2fe';
  g.font = `500 36px ${font}`;
  g.fillText('Certificamos que', 540, 480);

  let size = 86;
  g.fillStyle = '#ffffff';
  do {
    g.font = `800 ${size}px ${font}`;
    size -= 4;
  } while (g.measureText(name).width > 880 && size > 36);
  g.fillText(name, 540, 600);

  g.strokeStyle = 'rgba(251,191,36,0.8)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(240, 640);
  g.lineTo(840, 640);
  g.stroke();

  g.fillStyle = '#e0e7ff';
  g.font = `500 38px ${font}`;
  g.fillText('concluiu com sucesso o', 540, 730);
  g.fillStyle = '#fbbf24';
  g.font = `800 46px ${font}`;
  g.fillText('Desafio de 21 Dias de Dicção', 540, 800);
  g.fillStyle = '#e0e7ff';
  g.font = `500 34px ${font}`;
  g.fillText('treinando articulação, ritmo, respiração', 540, 880);
  g.fillText('e projeção de voz.', 540, 930);

  g.fillStyle = '#a5b4fc';
  g.font = `700 32px ${font}`;
  g.fillText(`21 dias • ${appState.completedDays.length} treinos concluídos`, 540, 1040);
  const endDate = appState.completionDates[TOTAL_DIAS] || todayKey();
  g.font = `500 30px ${font}`;
  g.fillText(`Concluído em ${formatDateBR(endDate)}`, 540, 1095);

  g.fillStyle = '#ffffff';
  g.font = `800 36px ${font}`;
  g.fillText(`🎙️ ${CFG.nomeApp}`, 540, 1215);
  return c;
}

function downloadCertificate() {
  if (!certificateBlob) return;
  const url = URL.createObjectURL(certificateBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'certificado-desafio-21-dias.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function shareCertificate() {
  if (!certificateBlob) return;
  const file = new File([certificateBlob], 'certificado-desafio-21-dias.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Concluí o Desafio de 21 Dias de Dicção!',
        text: `Concluí o Desafio de 21 Dias de Dicção no ${CFG.nomeApp}! 🎙️🎓`
      });
    } catch (e) {
      /* usuário cancelou */
    }
  } else {
    downloadCertificate();
    showToast('Imagem baixada! Agora é só postar 😉');
  }
}

// ==========================================
// TRAVA-LÍNGUAS
// ==========================================
let travaLinguasFilter = 'todos';

const TL_FILTER_ON = 'tl-filter-btn px-3 py-1.5 rounded-full bg-indigo-600 text-white font-bold whitespace-nowrap transition';
const TL_FILTER_OFF = 'tl-filter-btn px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 font-semibold whitespace-nowrap transition';

function renderTravaLinguas() {
  const container = document.getElementById('travalinguas-list');
  if (!container) return;

  const search = (document.getElementById('tl-search')?.value || '').toLowerCase();
  const list = APP_CONTEUDO.travaLinguas.filter((item) => {
    const match = item.titulo.toLowerCase().includes(search) || item.texto.toLowerCase().includes(search) || item.fonema.toLowerCase().includes(search);
    if (!match) return false;
    if (travaLinguasFilter === 'todos') return true;
    if (travaLinguasFilter === 'favoritos') return appState.favoriteTravalinguas.includes(item.id);
    return item.dificuldade === travaLinguasFilter;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <p class="text-3xl mb-2">${travaLinguasFilter === 'favoritos' ? '⭐' : '🔍'}</p>
        <p class="font-medium text-sm">${travaLinguasFilter === 'favoritos' ? 'Toque na estrela de um trava-língua para salvá-lo aqui.' : 'Nenhum trava-língua encontrado.'}</p>
      </div>`;
    return;
  }

  const labels = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
  const colors = {
    facil: 'bg-emerald-500/20 text-emerald-400',
    medio: 'bg-amber-500/20 text-amber-400',
    dificil: 'bg-rose-500/20 text-rose-400'
  };

  container.innerHTML = list
    .map((item) => {
      const fav = appState.favoriteTravalinguas.includes(item.id);
      const best = appState.tlRecords[item.id];
      return `
      <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${colors[item.dificuldade]}">${labels[item.dificuldade]}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">Fonema ${item.fonema}</span>
          </div>
          <button onclick="toggleFavoriteTL('${item.id}')" aria-label="Favoritar" class="text-xl transition active:scale-125">${fav ? '⭐' : '☆'}</button>
        </div>
        <h4 class="font-bold text-slate-100 text-base mb-2">${item.titulo}</h4>
        <p class="text-slate-200 text-sm font-medium leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 selectable mb-3">"${item.texto}"</p>
        <p class="text-xs text-indigo-300/80 mb-4 flex items-start gap-1.5"><span>💡</span><span>${item.dica}</span></p>
        <div class="pt-3 border-t border-slate-700/40 space-y-3">
          <div data-rec-slot="tl-${item.id}" data-rec-label="${item.titulo}"></div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs ${best ? 'text-amber-300 font-bold' : 'text-slate-500'}">${best ? `🏆 Recorde: ${best}s` : 'Sem recorde ainda'}</span>
            <button onclick="startTLChallenge('${item.id}')" class="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition active:scale-95">
              <span>⚡</span><span>Desafio 3x</span>
            </button>
          </div>
        </div>
      </div>`;
    })
    .join('');

  Gravacoes.refresh();
}

function filterTravaLinguas(type) {
  travaLinguasFilter = type;
  document.querySelectorAll('.tl-filter-btn').forEach((btn) => {
    btn.className = btn.id === `filter-tl-${type}` ? TL_FILTER_ON : TL_FILTER_OFF;
  });
  renderTravaLinguas();
}

function toggleFavoriteTL(id) {
  const idx = appState.favoriteTravalinguas.indexOf(id);
  if (idx > -1) appState.favoriteTravalinguas.splice(idx, 1);
  else {
    appState.favoriteTravalinguas.push(id);
    SoundFX.playStar();
  }
  saveState();
  renderTravaLinguas();
}

// ---------- Desafio 3x (cronômetro + recorde) ----------
let challengeId = null;
let challengeInterval = null;
let challengeStart = 0;

function setChallengeButton(mode) {
  const btn = document.getElementById('challenge-action-btn');
  const base = 'w-full py-3.5 rounded-xl font-black text-white shadow-lg transition active:scale-95';
  if (mode === 'running') {
    btn.className = `${base} bg-rose-600 shadow-rose-600/30`;
    btn.textContent = 'Parei! (falei 3x)';
  } else {
    btn.className = `${base} bg-indigo-600 shadow-indigo-600/30`;
    btn.textContent = mode === 'again' ? 'Tentar de novo' : 'Começar a falar!';
  }
}

function showChallengeBest() {
  const best = appState.tlRecords[challengeId];
  document.getElementById('challenge-best').textContent = best ? `🏆 Seu recorde: ${best}s` : 'Primeira tentativa: crie seu recorde!';
}

function startTLChallenge(id) {
  const item = APP_CONTEUDO.travaLinguas.find((t) => t.id === id);
  if (!item) return;
  clearInterval(challengeInterval);
  challengeInterval = null;
  challengeId = id;
  Gravacoes.stopPlayback();

  document.getElementById('challenge-title').textContent = `Desafio 3x: ${item.titulo}`;
  document.getElementById('challenge-text').textContent = `"${item.texto}"`;
  document.getElementById('challenge-timer').textContent = '0.0s';
  document.getElementById('challenge-result').textContent = '';
  showChallengeBest();
  setChallengeButton('start');
  document.getElementById('challenge-modal').classList.remove('hidden');
}

function runTLChallengeTimer() {
  const timerEl = document.getElementById('challenge-timer');
  const resultEl = document.getElementById('challenge-result');

  if (!challengeInterval) {
    challengeStart = Date.now();
    resultEl.textContent = '';
    setChallengeButton('running');
    challengeInterval = setInterval(() => {
      timerEl.textContent = `${((Date.now() - challengeStart) / 1000).toFixed(1)}s`;
    }, 100);
    return;
  }

  clearInterval(challengeInterval);
  challengeInterval = null;
  const time = Math.round(((Date.now() - challengeStart) / 1000) * 10) / 10;
  timerEl.textContent = `${time.toFixed(1)}s`;
  setChallengeButton('again');

  if (time < 1.5) {
    resultEl.textContent = 'Rápido demais! Fale as 3 vezes completas 😉';
    return;
  }

  const best = appState.tlRecords[challengeId];
  if (!best || time < best) {
    appState.tlRecords[challengeId] = time;
    saveState();
    resultEl.textContent = best ? `🎉 Novo recorde! (antes: ${best}s)` : '🎉 Recorde registrado!';
    SoundFX.playCelebration();
    triggerConfetti();
  } else {
    resultEl.textContent = `Boa! Seu recorde continua ${best}s.`;
  }
  showChallengeBest();
  renderTravaLinguas();
}

function closeChallengeModal() {
  clearInterval(challengeInterval);
  challengeInterval = null;
  document.getElementById('challenge-modal').classList.add('hidden');
}

// ==========================================
// KIDS
// ==========================================
let kidsCategory = 'bichos';
const KIDS_BTN_ON = 'kids-cat-btn py-2.5 px-1 text-xs font-black rounded-2xl bg-amber-500 text-white shadow-md transition text-center';
const KIDS_BTN_OFF = 'kids-cat-btn py-2.5 px-1 text-xs font-bold rounded-2xl bg-white text-slate-600 border border-amber-200 transition text-center';

function switchKidsCategory(cat) {
  kidsCategory = cat;
  document.querySelectorAll('.kids-cat-btn').forEach((btn) => {
    btn.className = btn.id === `kids-btn-${cat}` ? KIDS_BTN_ON : KIDS_BTN_OFF;
  });
  renderKidsContent();
}

function renderKidsContent() {
  const container = document.getElementById('kids-content-list');
  if (!container) return;
  const source = {
    bichos: APP_CONTEUDO.kids.exerciciosBichos,
    respiracao: APP_CONTEUDO.kids.exerciciosRespiracao,
    travalinguas: APP_CONTEUDO.kids.travalinguasKids
  }[kidsCategory];

  container.innerHTML = source
    .map((item) => {
      const done = appState.completedKids.includes(item.id);
      return `
      <div class="p-4 rounded-3xl bg-white border-2 ${done ? 'border-emerald-300' : 'border-amber-200'} shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shrink-0">${item.emoji}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1 gap-2">
              <h4 class="font-black text-slate-800 text-base">${item.titulo}</h4>
              <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">${done ? '⭐ Ganhou!' : '+1 ⭐'}</span>
            </div>
            ${item.beneficio ? `<p class="text-xs text-slate-500 mb-2 font-medium">🎯 ${item.beneficio}</p>` : ''}
            <p class="text-slate-700 text-sm leading-relaxed mb-3 font-medium">${item.instrucao || `"${item.texto}"`}</p>
            <button onclick="completeKidsExercise('${item.id}')" class="w-full py-2.5 px-4 rounded-xl text-sm font-black transition active:scale-95 ${
              done ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
            }">${done ? '✓ Feito! Fazer de novo' : '🎈 Consegui!'}</button>
          </div>
        </div>
      </div>`;
    })
    .join('');
}

function completeKidsExercise(id) {
  SoundFX.playStar();
  if (appState.completedKids.includes(id)) {
    showToast('Muito bem! Treinar de novo deixa a fala ainda melhor! 🌟');
    return;
  }
  appState.completedKids.push(id);
  appState.kidsStars += 1;
  triggerConfetti();
  saveState();
  renderKidsContent();
}

// ==========================================
// CONFIGURAÇÕES, BACKUP E REINÍCIO
// ==========================================
function openSettingsModal() {
  document.getElementById('settings-name').value = appState.userName || '';
  const modes = { diario: '1 treino novo por dia', sequencial: 'Libera ao concluir o anterior', livre: 'Todos os dias liberados' };
  document.getElementById('settings-mode').textContent = modes[CFG.modoLiberacao] || modes.diario;
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  const name = document.getElementById('settings-name').value.trim().slice(0, 30);
  if (name !== appState.userName) {
    appState.userName = name;
    saveState();
  }
  document.getElementById('settings-modal').classList.add('hidden');
}

function exportBackup() {
  const data = { app: 'diccao-pro', version: 1, exportedAt: new Date().toISOString(), state: appState };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diccao-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  showToast('💾 Backup baixado! Guarde o arquivo em local seguro.');
}

function importBackup(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== 'diccao-pro' || !data.state || !Array.isArray(data.state.completedDays)) throw new Error('inválido');
      appState = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), data.state, { accessGranted: true, onboarded: true });
      saveState();
      renderTravaLinguas();
      renderKidsContent();
      closeSettingsModal();
      showToast('✅ Progresso restaurado com sucesso!');
    } catch (e) {
      showToast('❌ Arquivo de backup inválido.');
    }
  };
  reader.readAsText(file);
}

async function resetProgress() {
  if (!confirm('Apagar TODO o progresso, recordes, estrelas e gravações? Essa ação não pode ser desfeita.')) return;
  const keep = { userName: appState.userName, onboarded: true, accessGranted: appState.accessGranted };
  appState = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), keep);
  await Gravacoes.clearAll();
  saveState();
  renderTravaLinguas();
  renderKidsContent();
  closeSettingsModal();
  showToast('Progresso reiniciado.');
}

// ==========================================
// CÓDIGO DE ACESSO
// ==========================================
function needsAccessCode() {
  return CFG.codigoAcesso && CFG.codigoAcesso.ativo && !appState.accessGranted;
}

function submitAccessCode(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('gate-code');
  const code = input.value.trim().toUpperCase();
  const valid = (CFG.codigoAcesso.codigos || []).map((c) => c.trim().toUpperCase());
  const err = document.getElementById('gate-error');

  if (valid.includes(code)) {
    appState.accessGranted = true;
    saveState();
    document.getElementById('gate').classList.add('hidden');
    SoundFX.playCelebration();
    showOnboardingIfNeeded();
  } else {
    err.classList.remove('hidden');
    const card = document.getElementById('gate-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
}

// ==========================================
// BOAS-VINDAS (PRIMEIRO ACESSO)
// ==========================================
function showOnboardingIfNeeded() {
  if (!appState.onboarded) document.getElementById('onboarding').classList.remove('hidden');
}

function finishOnboarding(event) {
  if (event) event.preventDefault();
  appState.userName = document.getElementById('onboarding-name').value.trim().slice(0, 30);
  appState.onboarded = true;
  saveState();
  document.getElementById('onboarding').classList.add('hidden');
  if (!isStandalone()) setTimeout(openInstallModal, 400);
}

// ==========================================
// PWA: INSTALAÇÃO (Android + iOS)
// ==========================================
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function hideInstallUI() {
  ['install-btn', 'pwa-install-banner'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isStandalone()) document.getElementById('pwa-install-banner')?.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  hideInstallUI();
  closeInstallModal();
  showToast('📲 App instalado! Abra pela tela de início.');
});

function openInstallModal() {
  const ios = isIOS();
  document.getElementById('ios-install-guide').classList.toggle('hidden', !ios);
  document.getElementById('android-install-guide').classList.toggle('hidden', ios);
  document.getElementById('install-modal').classList.remove('hidden');
}

function closeInstallModal() {
  document.getElementById('install-modal')?.classList.add('hidden');
}

function installPWA() {
  if (!deferredPrompt) {
    showToast('Use o menu ⋮ do navegador > "Instalar aplicativo".');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choice) => {
    if (choice.outcome === 'accepted') hideInstallUI();
    deferredPrompt = null;
  });
}

// ==========================================
// CONFETES
// ==========================================
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
  const parts = Array.from({ length: 70 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 0.5) * 12 - 4,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 1
  }));

  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    parts.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.alpha -= 0.015;
      if (p.alpha > 0) {
        alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.log('SW error:', err));
  }

  loadState();
  if (isStandalone()) hideInstallUI();

  document.getElementById('legal-notice').textContent = CFG.avisoLegal;
  document.getElementById('settings-legal').textContent = CFG.avisoLegal;
  document.getElementById('onboarding-legal').textContent = CFG.avisoLegal;
  if (CFG.linkSuporte) {
    const link = document.getElementById('gate-support');
    link.href = CFG.linkSuporte;
    link.classList.remove('hidden');
  }

  if (needsAccessCode()) document.getElementById('gate').classList.remove('hidden');
  else showOnboardingIfNeeded();

  updateUI();
  renderTravaLinguas();
  renderKidsContent();
  Gravacoes.loadAll();

  document.getElementById('tl-search')?.addEventListener('input', renderTravaLinguas);
  document.addEventListener('gravacoes:changed', renderEvolucao);

  // Ao voltar para o app (ex.: no dia seguinte), atualiza liberação e sequência
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateUI();
  });
});
