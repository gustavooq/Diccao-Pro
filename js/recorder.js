/**
 * GRAVADOR DE VOZ REUTILIZÁVEL
 *
 * Qualquer lugar do app pode ter um gravador colocando no HTML:
 *   <div data-rec-slot="CHAVE" data-rec-label="Nome exibido"></div>
 *
 * Variantes (data-rec-variant):
 *   (padrão) -> botão Gravar/Parar/Ouvir + botão Regravar (↺)
 *   "play"   -> apenas botão de ouvir (usado na comparação Antes x Depois)
 *
 * As gravações ficam salvas no aparelho (IndexedDB) e sobrevivem ao fechar o app.
 */
const Gravacoes = (() => {
  const MAX_SECONDS = 120; // limite de 2 minutos por gravação
  const items = {}; // chave -> { url, seconds, date }
  let active = null; // gravação em andamento
  let player = null;
  let playingKey = null;
  let pendingReset = null;

  // ---------- Utilidades ----------
  function pickMime() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    return options.find((m) => MediaRecorder.isTypeSupported(m)) || '';
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function notify(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function emitChange() {
    document.dispatchEvent(new CustomEvent('gravacoes:changed'));
  }

  // ---------- Estado ----------
  function state(key) {
    if (active && active.key === key) return 'recording';
    if (items[key]) return 'recorded';
    return 'idle';
  }

  async function loadAll() {
    try {
      const all = await AudioDB.getAll();
      (all || []).forEach((r) => {
        if (r && r.blob) {
          items[r.key] = { url: URL.createObjectURL(r.blob), seconds: r.seconds, date: r.date };
        }
      });
    } catch (e) {
      console.warn('Não foi possível carregar as gravações:', e);
    }
    refresh();
    emitChange();
  }

  async function persist(key, blob, seconds) {
    if (items[key]) URL.revokeObjectURL(items[key].url);
    const secs = Math.max(1, seconds);
    items[key] = { url: URL.createObjectURL(blob), seconds: secs, date: new Date().toISOString() };
    try {
      await AudioDB.save(key, blob, secs);
    } catch (e) {
      console.warn(e);
      notify('Não foi possível salvar o áudio neste aparelho.');
    }
    emitChange();
  }

  // ---------- Gravação ----------
  async function start(key) {
    stopPlayback();
    if (active) await stop();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      notify('Seu navegador não permite gravar áudio.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      notify('Permita o acesso ao microfone para gravar.');
      return;
    }

    const mime = pickMime();
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const rec = { key, recorder, stream, chunks: [], seconds: 0, timer: null, done: null };

    rec.done = new Promise((resolve) => {
      recorder.onstop = async () => {
        clearInterval(rec.timer);
        stream.getTracks().forEach((t) => t.stop());
        if (active === rec) active = null;
        const blob = new Blob(rec.chunks, { type: recorder.mimeType || mime || 'audio/webm' });
        if (blob.size > 0) await persist(key, blob, rec.seconds);
        refresh(key);
        resolve();
      };
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) rec.chunks.push(e.data);
    };

    active = rec;
    recorder.start(250);

    rec.timer = setInterval(() => {
      rec.seconds++;
      const el = document.querySelector(`[data-rec-timer="${key}"]`);
      if (el) el.textContent = `🔴 Gravando... ${fmtTime(rec.seconds)}`;
      if (rec.seconds >= MAX_SECONDS) {
        stop();
        notify('Limite de 2 minutos atingido. Gravação salva!');
      }
    }, 1000);

    // Pede ao navegador para não apagar os dados salvos
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    refresh(key);
  }

  function stop() {
    if (!active) return Promise.resolve();
    const rec = active;
    if (rec.recorder.state !== 'inactive') rec.recorder.stop();
    return rec.done;
  }

  // ---------- Reprodução ----------
  function togglePlay(key) {
    const item = items[key];
    if (!item) return;
    if (playingKey === key) {
      stopPlayback();
      return;
    }
    stopPlayback();
    player = new Audio(item.url);
    playingKey = key;
    player.onended = () => {
      const k = playingKey;
      player = null;
      playingKey = null;
      refresh(k);
    };
    player.play().catch(() => {
      player = null;
      playingKey = null;
      refresh(key);
      notify('Não foi possível reproduzir o áudio.');
    });
    refresh(key);
  }

  function stopPlayback() {
    if (player) player.pause();
    player = null;
    const k = playingKey;
    playingKey = null;
    if (k) refresh(k);
  }

  // ---------- Ação do botão principal ----------
  function action(key) {
    const st = state(key);
    if (st === 'idle') start(key);
    else if (st === 'recording') stop();
    else togglePlay(key);
  }

  // ---------- Regravar (com aviso) ----------
  function askReset(key) {
    if (state(key) !== 'recorded') return;
    pendingReset = key;
    const slot = document.querySelector(`[data-rec-slot="${key}"]`);
    const label = slot && slot.dataset.recLabel ? `"${slot.dataset.recLabel}"` : 'esta gravação';
    document.getElementById('rerecord-modal-desc').innerHTML =
      `Ao regravar ${label}, o áudio anterior será <b>apagado permanentemente</b>. Deseja continuar?`;
    document.getElementById('rerecord-confirm-modal').classList.remove('hidden');
  }

  function cancelReset() {
    pendingReset = null;
    document.getElementById('rerecord-confirm-modal').classList.add('hidden');
  }

  async function confirmReset() {
    const key = pendingReset;
    cancelReset();
    if (!key) return;
    await remove(key);
    start(key);
  }

  async function remove(key) {
    if (playingKey === key) stopPlayback();
    if (items[key]) {
      URL.revokeObjectURL(items[key].url);
      delete items[key];
    }
    try {
      await AudioDB.remove(key);
    } catch (e) {
      console.warn(e);
    }
    refresh(key);
    emitChange();
  }

  async function clearAll() {
    stopPlayback();
    await stop();
    Object.keys(items).forEach((k) => {
      URL.revokeObjectURL(items[k].url);
      delete items[k];
    });
    try {
      await AudioDB.clear();
    } catch (e) {
      console.warn(e);
    }
    refresh();
    emitChange();
  }

  // ---------- Renderização ----------
  function template(key, variant) {
    const st = state(key);
    const item = items[key];
    const playing = playingKey === key;

    if (variant === 'play') {
      if (!item) {
        return `<div class="py-2.5 px-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-slate-500 text-xs text-center">Sem gravação</div>`;
      }
      return `
        <button onclick="Gravacoes.togglePlay('${key}')" class="w-full py-2.5 px-3 rounded-xl ${playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95">
          <span>${playing ? '⏸️' : '▶️'}</span><span>${playing ? 'Pausar' : 'Ouvir'} (${item.seconds}s)</span>
        </button>`;
    }

    let cls;
    let icon;
    let text;
    if (st === 'recording') {
      cls = 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 animate-pulse';
      icon = '⏹️';
      text = 'Parar gravação';
    } else if (st === 'recorded') {
      cls = playing ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500';
      icon = playing ? '⏸️' : '▶️';
      text = playing ? 'Pausar' : 'Ouvir minha gravação';
    } else {
      cls = 'bg-indigo-600 hover:bg-indigo-500';
      icon = '🎙️';
      text = 'Gravar áudio';
    }

    const canReset = st === 'recorded';
    let status;
    if (st === 'recording') {
      status = `<span class="text-rose-400 font-bold" data-rec-timer="${key}">🔴 Gravando... ${fmtTime(active.seconds)}</span>`;
    } else if (st === 'recorded') {
      status = `<span class="text-emerald-400 font-semibold">✓ Gravado em ${fmtDate(item.date)} (${item.seconds}s), fica salvo no aparelho</span>`;
    } else {
      status = `<span class="text-slate-400">Grave sua voz para se ouvir e avaliar</span>`;
    }

    return `
      <div class="flex items-center gap-2">
        <button onclick="Gravacoes.action('${key}')" class="flex-1 py-2.5 px-3 rounded-xl ${cls} text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md">
          <span>${icon}</span><span>${text}</span>
        </button>
        <button onclick="Gravacoes.askReset('${key}')" ${canReset ? '' : 'disabled'} title="Regravar" aria-label="Regravar áudio"
          class="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border shrink-0 transition ${
            canReset
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 active:scale-90'
              : 'bg-slate-800 text-slate-500 border-slate-700/60 opacity-50 cursor-not-allowed'
          }">↺</button>
      </div>
      <p class="text-[11px] mt-1.5 px-1">${status}</p>`;
  }

  function refresh(key) {
    const selector = key ? `[data-rec-slot="${key}"]` : '[data-rec-slot]';
    document.querySelectorAll(selector).forEach((slot) => {
      slot.innerHTML = template(slot.dataset.recSlot, slot.dataset.recVariant);
    });
  }

  return {
    loadAll,
    action,
    askReset,
    cancelReset,
    confirmReset,
    togglePlay,
    stop,
    stopPlayback,
    remove,
    clearAll,
    refresh,
    has: (key) => !!items[key],
    get: (key) => items[key]
  };
})();
