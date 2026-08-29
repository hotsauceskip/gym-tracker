// Таймер отдыха между подходами. Тап — старт/стоп (тумблер).
// Один звук-сигнал по завершении (Web Audio, генерируется на лету — без файлов).

let sharedAudioCtx = null;
function getAudioCtx() {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

function beep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch (e) {
    /* тихо игнорируем — звук не критичен */
  }
}

function formatTime(totalSec) {
  const t = Math.max(0, totalSec);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Реестр всех живых таймеров — чтобы гарантированно глушить их при уходе с экрана
// (иначе setInterval прежнего рендера продолжает тикать в фоне бесконечно).
const activeTimers = [];

class RestTimer {
  constructor(buttonEl, restSec) {
    this.buttonEl = buttonEl;
    this.restSec = restSec;
    this.remaining = restSec;
    this.interval = null;
    this._render();
    this.buttonEl.addEventListener("click", () => this._onClick());
    activeTimers.push(this);
  }
  _onClick() {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (this.interval) {
      this.cancel(); // тап во время отсчёта — остановить
    } else {
      this.start(); // тап в состоянии покоя — запустить
    }
  }
  start() {
    this._stopInterval();
    this.remaining = this.restSec;
    this._render();
    this.interval = setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this._finish();
      } else {
        this._render();
      }
    }, 1000);
  }
  cancel() {
    this._stopInterval();
    this.remaining = this.restSec;
    this._render();
  }
  _finish() {
    this._stopInterval();
    this.remaining = 0;
    this._render();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    beep();
  }
  _stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  _render() {
    if (this.interval) {
      this.buttonEl.textContent = "⏱ " + formatTime(this.remaining) + " (тап — стоп)";
      this.buttonEl.classList.add("timer-running");
    } else {
      this.buttonEl.textContent = "⏱ Отдых " + formatTime(this.restSec);
      this.buttonEl.classList.remove("timer-running");
    }
  }
}

// Останавливает и забывает все таймеры, созданные на предыдущем экране.
RestTimer.stopAll = function () {
  while (activeTimers.length) {
    const t = activeTimers.pop();
    t._stopInterval();
  }
};
