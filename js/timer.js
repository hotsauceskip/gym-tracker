// Таймер отдыха — ЕДИНЫЙ на всё приложение (не привязан к конкретной кнопке/рендеру).
// Переход между вкладками (Сегодня/История/Цикл/Настройки) НЕ останавливает отсчёт —
// это один и тот же JS-документ (SPA), просто меняется, что нарисовано на экране.
// Останавливается только повторным тапом по активной кнопке.
// Считаем по метке времени окончания (endAt), а не декрементом — так отсчёт не
// "уплывает", даже если браузер притормозил интервал (например, при блокировке экрана).
// По достижении нуля таймер НЕ останавливается сам — уходит в овертайм (счёт "+мм:сс"),
// чтобы было видно, сколько отдохнул сверх плана. Останавливается только тапом.

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

const REST_TIMER_STORAGE_KEY = "gym-tracker-rest-timer";

const OVERTIME_STALE_SEC = 3 * 60 * 60; // старше 3ч в овертайме при восстановлении — считаем мусором, чистим

const GlobalRestTimer = (function () {
  let exerciseId = null; // за какое упражнение сейчас идёт отдых
  let restSec = 0; // целевая длительность (для отображения в состоянии покоя)
  let endAt = 0; // Date.now() + restSec*1000 на момент старта
  let intervalId = null;
  let beeped = false; // бип/вибро при пересечении нуля — только один раз за подход

  // Состояние дублируем в localStorage — переживает перезагрузку JS-контекста
  // (на iOS в standalone-режиме переход между "вкладками" иногда всё же
  // перезапускает страницу, даже если это чисто hash-роутинг в рамках SPA).
  function persist() {
    try {
      if (exerciseId && intervalId) {
        localStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify({ exerciseId, restSec, endAt }));
      } else {
        localStorage.removeItem(REST_TIMER_STORAGE_KEY);
      }
    } catch (e) {
      /* localStorage недоступен — не критично, просто нет персистентности */
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(REST_TIMER_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || !saved.exerciseId || !saved.endAt) return;
      const overtimeSec = Math.round((Date.now() - saved.endAt) / 1000);
      if (overtimeSec > OVERTIME_STALE_SEC) {
        // Забытое состояние (например, после долгого перерыва) — не тащим за собой, чистим.
        localStorage.removeItem(REST_TIMER_STORAGE_KEY);
        return;
      }
      exerciseId = saved.exerciseId;
      restSec = saved.restSec;
      endAt = saved.endAt;
      beeped = overtimeSec >= 0; // уже прошли ноль раньше — бип не повторяем
      intervalId = setInterval(tick, 1000);
    } catch (e) {
      /* битые данные в сторадже — игнорируем */
    }
  }

  function findButton(forExerciseId) {
    return document.querySelector(`[data-timer-for="${forExerciseId}"]`);
  }

  function paint(forExerciseId, btn) {
    const el = btn || findButton(forExerciseId);
    if (!el) return;
    if (intervalId && exerciseId === forExerciseId) {
      const remaining = Math.round((endAt - Date.now()) / 1000);
      if (remaining >= 0) {
        el.textContent = "⏱ " + formatTime(remaining) + " (тап — стоп)";
        el.classList.add("timer-running");
        el.classList.remove("timer-overtime");
      } else {
        el.textContent = "⏱ +" + formatTime(-remaining) + " сверх (тап — стоп)";
        el.classList.add("timer-running", "timer-overtime");
      }
    } else {
      const shown = el.dataset.restSec ? parseInt(el.dataset.restSec, 10) : restSec;
      el.textContent = "⏱ Отдых " + formatTime(shown);
      el.classList.remove("timer-running", "timer-overtime");
    }
  }

  function tick() {
    const remaining = Math.round((endAt - Date.now()) / 1000);
    if (remaining <= 0 && !beeped) {
      beeped = true;
      persist();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      beep();
    }
    paint(exerciseId); // не останавливаем интервал — считаем дальше в овертайм, пока не тапнут
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
    beeped = false;
    intervalId = setInterval(tick, 1000);
    persist();
    paint(id);
    if (prevId && prevId !== id) paint(prevId); // сбросить визуал прошлой кнопки, если она на экране
  }

  function cancel() {
    const id = exerciseId;
    stopInterval();
    persist();
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

  restore(); // если таймер уже шёл на момент загрузки скрипта — подхватываем его как есть

  return { toggle, syncButton };
})();
