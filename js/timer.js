// Таймер отдыха — ЕДИНЫЙ на всё приложение (не привязан к конкретной кнопке/рендеру).
// Переход между вкладками (Сегодня/История/Цикл/Настройки) НЕ останавливает отсчёт —
// это один и тот же JS-документ (SPA), просто меняется, что нарисовано на экране.
// Останавливается только повторным тапом по активной кнопке.
// Считаем по метке времени окончания (endAt), а не декрементом — так отсчёт не
// "уплывает", даже если браузер притормозил интервал (например, при блокировке экрана).

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

const GlobalRestTimer = (function () {
  let exerciseId = null; // за какое упражнение сейчас идёт отдых
  let restSec = 0; // целевая длительность (для отображения в состоянии покоя)
  let endAt = 0; // Date.now() + restSec*1000 на момент старта
  let intervalId = null;

  function findButton(forExerciseId) {
    return document.querySelector(`[data-timer-for="${forExerciseId}"]`);
  }

  function paint(forExerciseId, btn) {
    const el = btn || findButton(forExerciseId);
    if (!el) return;
    if (intervalId && exerciseId === forExerciseId) {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      el.textContent = "⏱ " + formatTime(remaining) + " (тап — стоп)";
      el.classList.add("timer-running");
    } else {
      const shown = el.dataset.restSec ? parseInt(el.dataset.restSec, 10) : restSec;
      el.textContent = "⏱ Отдых " + formatTime(shown);
      el.classList.remove("timer-running");
    }
  }

  function tick() {
    const remaining = Math.round((endAt - Date.now()) / 1000);
    if (remaining <= 0) {
      finish();
    } else {
      paint(exerciseId);
    }
  }

  function finish() {
    stopInterval();
    paint(exerciseId);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    beep();
  }

  function stopInterval() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start(id, sec) {
    const prevId = exerciseId;
    stopInterval();
    exerciseId = id;
    restSec = sec;
    endAt = Date.now() + sec * 1000;
    intervalId = setInterval(tick, 1000);
    paint(id);
    if (prevId && prevId !== id) paint(prevId); // сбросить визуал прошлой кнопки, если она на экране
  }

  function cancel() {
    const id = exerciseId;
    stopInterval();
    paint(id);
  }

  // Тап по кнопке: если это активный таймер — стоп, иначе — запустить новый
  // (запуск нового автоматически останавливает предыдущий, если он был на другом упражнении).
  function toggle(forExerciseId, forRestSec) {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (intervalId && exerciseId === forExerciseId) {
      cancel();
    } else {
      start(forExerciseId, forRestSec);
    }
  }

  // Вызывается при создании/показе кнопки — сразу нарисовать правильное состояние.
  function syncButton(btn, forExerciseId, forRestSec) {
    btn.dataset.timerFor = forExerciseId;
    btn.dataset.restSec = String(forRestSec);
    paint(forExerciseId, btn);
  }

  return { toggle, syncButton };
})();
