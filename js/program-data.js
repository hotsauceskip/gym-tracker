// Данные программы тренировок (из PROGRAMMA NEW 1.xlsx).
// Неделя 3 тяжёлого блока = точная копия Недели 1 (та же структура, вес — по прогрессии).
// Каждое упражнение: warmup (или null), work — схема рабочих подходов, rir — целевое ПДО,
// restSec — отдых между подходами в секундах, note — комментарий тренера.

function ex(name, opts) {
  return {
    id: name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-"),
    name,
    warmup: opts.warmup || null, // {sets, reps}
    work: opts.work,             // {sets, reps} | {sets, pyramid:[reps,...]} | {sets, reps, dropsetOn:[setIdx,...]}
    rir: opts.rir,
    restSec: opts.restSec,
    note: opts.note || "",
    // Шаг прибавки веса при прогрессии — свой на упражнение (для бицепса/плеч мало
    // не значит мало для жима ногами). Если не задан — берётся общий шаг из настроек.
    incrementStep: opts.incrementStep,
    // Лёгкая неделя (памп) — веса намеренно снижены, авто-подсказку прогрессии не показываем.
    deload: opts.deload || false,
  };
}

const DAY1_CHEST_BACK_ARMS_A = {
  key: "chest-back-arms-a",
  title: "ГРУДЬ+СПИНА+РУКИ",
  exercises: [
    ex("Жим гантелей в наклоне", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "6-8" }, rir: 1, restSec: 180, incrementStep: 2, note: "Концентрация на груди. Своди лопатки, отключай плечи. Полная амплитуда" }),
    ex("Подтягивания", { warmup: { sets: 1, reps: "разминочный в блоке" }, work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 160, incrementStep: 2.5, note: "Широкий хват. Хотя бы +2.5 кг. Если не можешь — тяга блока" }),
    ex("Жим штанги лежа", { work: { sets: 3, reps: "10" }, rir: 2, restSec: 160, incrementStep: 2.5, note: "Концентрация на груди. Своди лопатки, отключай плечи. Полная амплитуда" }),
    ex("Тяга гантелей в наклоне", { work: { sets: 3, reps: "10" }, rir: 2, restSec: 140, incrementStep: 2, note: "Поочередно, фиксируешь в верхней точке. Отключай бицепс при тяге" }),
    ex("Разгибания на трицепс в блоке стоя c прямой рукоятью", { work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 90, incrementStep: 1.25, note: "Четкое выполнение. Без лишних движений" }),
    ex("Подъем гантелей на бицепс сидя на наклонной скамье", { work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 90, incrementStep: 1.25, note: "Без читинга. Полная амплитуда" }),
  ],
};

const DAY3_LEGS_SHOULDERS_A = {
  key: "legs-shoulders-a",
  title: "НОГИ+ПЛЕЧИ",
  exercises: [
    ex("Приседания в Смите", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "8" }, rir: 2, restSec: 180, incrementStep: 5, note: "Хорошая амплитуда. Контролируй отсутствие отказов" }),
    ex("Сгибания лежа в тренажере на бицепс бедра", { work: { sets: 2, reps: "12" }, rir: 2, restSec: 150, incrementStep: 2.5, note: "Равномерное движение в обе стороны" }),
    ex("Разгибания сидя в тренажере", { work: { sets: 1, reps: "12" }, rir: 3, restSec: 120, incrementStep: 2.5, note: "Равномерное движение в обе стороны" }),
    ex("Разведение гантелей в наклоне (задняя дельта)", { warmup: { sets: 1, reps: "20" }, work: { sets: 3, reps: "12" }, rir: 1, restSec: 90, incrementStep: 1, note: "Неполная амплитуда (только на дельту)" }),
    ex("Тяга блока к подбородку", { warmup: { sets: 1, reps: "20" }, work: { sets: 3, reps: "8-10" }, rir: 2, restSec: 120, incrementStep: 2.5, note: "Поднимай не выше уровня плеч. Тяни локтями, а не кистями" }),
    ex("Махи гантелей в стороны стоя", { work: { sets: 3, reps: "12" }, rir: 0, restSec: 90, incrementStep: 1, note: "Чёткая техника. Не поднимай трапециями" }),
    ex("Подъемы ног в висе", { work: { sets: 4, reps: "15" }, rir: 2, restSec: 60 }),
  ],
};

const DAY5_CHEST_BACK_ARMS_B = {
  key: "chest-back-arms-b",
  title: "ГРУДЬ+СПИНА+РУКИ",
  exercises: [
    ex("Вертикальная тяга блока широким хватом", { warmup: { sets: 1, reps: "20" }, work: { sets: 3, reps: "8-10" }, rir: 2, restSec: 150, incrementStep: 2.5, note: "Концентрация на спине. Без читинга, медленное выполнение" }),
    ex("Жим штанги в наклоне", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "8" }, rir: 1, restSec: 170, incrementStep: 2.5, note: "Своди лопатки, отключай плечи" }),
    ex("Горизонтальная тяга сидя в блоке (узкая рукоять)", { work: { sets: 2, reps: "10-12" }, rir: 1, restSec: 170, incrementStep: 2.5, note: "Работа спиной. Плечи опусти. В конечной точке прожимка" }),
    ex("Жим в Хаммере на верх груди", { work: { sets: 2, reps: "10" }, rir: 1, restSec: 150, incrementStep: 2.5, note: "Концентрация на верхе груди" }),
    ex("Подъем штанги на бицепс", { work: { sets: 3, pyramid: ["12", "10", "8"] }, rir: 1, restSec: 120, incrementStep: 2.5, note: "В каждом подходе повышаешь вес" }),
    ex("Разгибания с EZ-штангой из-за головы лежа в наклоне", { work: { sets: 3, pyramid: ["12", "10", "8"] }, rir: 1, restSec: 120, incrementStep: 1.25, note: "В каждом подходе повышаешь вес. Хорошая амплитуда" }),
    ex("Молитва в блоке", { work: { sets: 3, reps: "15" }, rir: 1, restSec: 60, incrementStep: 1.25 }),
  ],
};

const DAY1_LEGS_SHOULDERS_B = {
  key: "legs-shoulders-b",
  title: "НОГИ+ПЛЕЧИ",
  exercises: [
    ex("Жим ногами", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "12" }, rir: 2, restSec: 170, incrementStep: 10, note: "Полная амплитуда движения. Контролируй отсутствие отказов" }),
    ex("Разгибания сидя в тренажере", { work: { sets: 2, reps: "12" }, rir: 1, restSec: 150, incrementStep: 2.5, note: "Равномерное движение в обе стороны" }),
    ex("Мертвая тяга", { work: { sets: 1, reps: "10" }, rir: 3, restSec: 150, incrementStep: 5, note: "Соблюдай технику. Концентрация на бицепсе бедра" }),
    ex("Тяга штанги на заднюю дельту", { warmup: { sets: 1, reps: "20" }, work: { sets: 3, reps: "12" }, rir: 2, restSec: 120, incrementStep: 2, note: "Неполная амплитуда (только на заднюю дельту)" }),
    ex("Отведение рук в кроссовере (средняя дельта)", { warmup: { sets: 1, reps: "20" }, work: { sets: 3, reps: "10" }, rir: 0, restSec: 60, incrementStep: 1, note: "Чёткая техника. Концентрация на плечах" }),
    ex("Жим гантелей сидя", { work: { sets: 3, reps: "12" }, rir: 2, restSec: 120, incrementStep: 2, note: "Полная амплитуда" }),
    ex("Подъемы на носки стоя", { work: { sets: 7, reps: "20" }, rir: 1, restSec: 10, incrementStep: 5 }),
  ],
};

const DAY3_CHEST_BACK_ARMS_C = {
  key: "chest-back-arms-c",
  title: "ГРУДЬ+СПИНА+РУКИ",
  exercises: [
    ex("Жим штанги лежа", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "6-8" }, rir: 0, restSec: 180, incrementStep: 2.5, note: "В последнем подходе — отказ" }),
    ex("Подтягивания параллельным хватом", { warmup: { sets: 1, reps: "разминочный в блоке" }, work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 160, incrementStep: 2.5, note: "Хотя бы +2.5 кг. Если не можешь — тяга блока" }),
    ex("Сведение стоя в кроссовере", { work: { sets: 3, reps: "10" }, rir: 2, restSec: 160, incrementStep: 1.25, note: "Прожимка в конечной точке движения" }),
    ex("Тяга гантелей с упором в скамью", { work: { sets: 3, reps: "10" }, rir: 2, restSec: 140, incrementStep: 2, note: "Поочередно, фиксируешь в верхней точке" }),
    ex("Разгибания на трицепс в блоке стоя c прямой рукоятью", { work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 90, incrementStep: 1.25, note: "Четкое выполнение. Без лишних движений" }),
    ex("Подъем гантелей на бицепс сидя на наклонной скамье", { work: { sets: 3, reps: "8-10" }, rir: 1, restSec: 90, incrementStep: 1.25, note: "Без читинга. Полная амплитуда" }),
  ],
};

const DAY5_LEGS_SHOULDERS_C = {
  key: "legs-shoulders-c",
  title: "НОГИ+ПЛЕЧИ",
  exercises: [
    ex("Приседания в Смите с узкой постановкой ног", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "15" }, rir: 2, restSec: 180, incrementStep: 5, note: "Хорошая амплитуда. Контролируй отсутствие отказов" }),
    ex("Жим гантелей сидя", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "6-8" }, rir: 2, restSec: 120, incrementStep: 2, note: "Чёткая техника выполнения. Без отказов. Тяжёлые веса" }),
    ex("Тяга штанги к подбородку", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "8-10" }, rir: 3, restSec: 120, incrementStep: 2.5, note: "Широкий хват. Доводи локти до параллели. Идеальная техника!" }),
    ex("Разведение гантелей в наклоне (задняя дельта)", { work: { sets: 3, reps: "10-12" }, rir: 1, restSec: 120, incrementStep: 1, note: "Ограниченная амплитуда на заднюю дельту" }),
    ex("Отведение рук в кроссовере (средняя дельта)", { work: { sets: 2, reps: "12" }, rir: 0, restSec: 90, incrementStep: 1, note: "Поочередно, фиксируешь в верхней точке" }),
    ex("Тяга каната в блоке на заднюю дельту", { work: { sets: 2, reps: "12", dropsetOn: [2] }, rir: 2, restSec: 60, note: "Локти повыше, чтобы работала дельта. Во 2-м подходе — дропсет" }),
    ex("Скручивания", { work: { sets: 4, reps: "15" }, rir: 2, restSec: 60 }),
  ],
};

const LIGHT_A = {
  key: "light-a",
  title: 'Тренировка "А" (лёгкая неделя)',
  exercises: [
    ex("Жим ногами", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "15" }, rir: 8, restSec: 110, deload: true, note: "Максимально технично, медленно, без напряга — для пампа" }),
    ex("Вертикальная тяга блока широким хватом", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Жим штанги в наклоне", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Подъем гантелей на бицепс c супинацией", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Разгибания на трицепс в блоке стоя c канатом", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Махи гантелей в стороны стоя", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
  ],
};

const LIGHT_B = {
  key: "light-b",
  title: 'Тренировка "В" (лёгкая неделя)',
  exercises: [
    ex("Разгибания сидя в тренажере", { warmup: { sets: 2, reps: "20" }, work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Горизонтальная тяга сидя в блоке (широкая рукоять)", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Жим штанги лежа", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Подъем штанги на бицепс", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Разгибания обеих рук с одной гантелью из-за головы", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
    ex("Тяга штанги к подбородку", { work: { sets: 3, reps: "15" }, rir: 8, restSec: 90, deload: true, note: "Максимально технично, медленно, без напряга" }),
  ],
};

// Цикл: 4 позиции недели. week3 — точная копия week1 (та же структура дней).
const PROGRAM = {
  weeks: [
    { key: "week1", label: "Неделя 1 (тяжёлая)", days: [DAY1_CHEST_BACK_ARMS_A, DAY3_LEGS_SHOULDERS_A, DAY5_CHEST_BACK_ARMS_B] },
    { key: "week2", label: "Неделя 2 (тяжёлая)", days: [DAY1_LEGS_SHOULDERS_B, DAY3_CHEST_BACK_ARMS_C, DAY5_LEGS_SHOULDERS_C] },
    { key: "week3", label: "Неделя 3 (тяжёлая)", days: [DAY1_CHEST_BACK_ARMS_A, DAY3_LEGS_SHOULDERS_A, DAY5_CHEST_BACK_ARMS_B] },
    { key: "week4", label: "Неделя 4 (лёгкая/памп)", days: [LIGHT_A, LIGHT_B] },
  ],
};

// Плоский порядковый список (weekIndex, dayIndex) для указателя цикла.
function programSequence() {
  const seq = [];
  PROGRAM.weeks.forEach((w, wi) => {
    w.days.forEach((d, di) => seq.push({ weekIndex: wi, dayIndex: di }));
  });
  return seq;
}

// Все уникальные упражнения программы (для списка в разделе "История").
function allExercisesFlat() {
  const map = new Map();
  PROGRAM.weeks.forEach((w) => {
    w.days.forEach((d) => {
      d.exercises.forEach((ex) => {
        if (!map.has(ex.id)) map.set(ex.id, ex);
      });
    });
  });
  return Array.from(map.values());
}

// Разворачивает описание упражнения в плоский список подходов для рендера/ввода.
// Каждый элемент: { isWarmup, setNumber, targetReps, dropset }
function buildSetPlan(exerciseDef) {
  const plan = [];
  if (exerciseDef.warmup) {
    for (let i = 1; i <= exerciseDef.warmup.sets; i++) {
      plan.push({ isWarmup: true, setNumber: i, targetReps: exerciseDef.warmup.reps, dropset: false });
    }
  }
  const work = exerciseDef.work;
  for (let i = 1; i <= work.sets; i++) {
    const targetReps = work.pyramid ? work.pyramid[i - 1] : work.reps;
    const dropset = !!(work.dropsetOn && work.dropsetOn.includes(i));
    plan.push({ isWarmup: false, setNumber: i, targetReps, dropset });
  }
  return plan;
}
