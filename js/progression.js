// Логика двойной прогрессии: подсказка веса/повторов на сегодня по прошлому разу.

function parseRepsRange(repsStr) {
  const m = String(repsStr).match(/(\d+)\s*-\s*(\d+)/);
  if (m) return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  const n = parseInt(repsStr, 10);
  if (!isNaN(n)) return { min: n, max: n };
  return null;
}

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

// exerciseDef — объект упражнения из program-data.js
// lastInstance — { sets: [{isWarmup, weight, reps, rir}], ... } | null
// incrementStep — шаг веса при прогрессии (кг)
function suggestNext(exerciseDef, lastInstance, defaultIncrementStep) {
  if (!lastInstance) return null;
  if (exerciseDef.deload) {
    // Лёгкая неделя — веса намеренно снижены для пампа, прогрессию тут не считаем.
    return null;
  }
  if (exerciseDef.work.pyramid || exerciseDef.work.dropsetOn) {
    // Пирамиды/дропсеты — без авторасчёта, просто показываем прошлый факт.
    return null;
  }
  const workingSets = (lastInstance.sets || []).filter(
    (s) => !s.isWarmup && s.weight != null && s.weight !== "" && s.reps != null && s.reps !== ""
  );
  if (!workingSets.length) return null;

  const ref = workingSets[0];
  const range = parseRepsRange(exerciseDef.work.reps);
  if (!range) return null;
  const weight = parseFloat(ref.weight);
  const reps = parseInt(ref.reps, 10);
  if (isNaN(weight) || isNaN(reps)) return null;

  if (reps < range.max) {
    return {
      weight,
      reps: reps + 1,
      text: `Прошлый раз: ${weight} кг × ${reps}${ref.rir != null ? ", ПДО " + ref.rir : ""}. Цель сегодня: тот же вес, +1 повтор.`,
    };
  }
  const step = exerciseDef.incrementStep || defaultIncrementStep || 1.25;
  const nextWeight = roundToStep(weight + step, 0.25);
  return {
    weight: nextWeight,
    reps: range.min,
    text: `Прошлый раз: ${weight} кг × ${reps}${ref.rir != null ? ", ПДО " + ref.rir : ""} — верх диапазона взят. Цель сегодня: ${nextWeight} кг × ${range.min}.`,
  };
}

// Тоннаж сессии: сумма (вес × повторы) по всем рабочим подходам всех упражнений.
function sessionTonnage(session) {
  let total = 0;
  for (const ex of session.exercises || []) {
    for (const s of ex.sets || []) {
      if (s.isWarmup) continue;
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      if (!isNaN(w) && !isNaN(r)) total += w * r;
    }
  }
  return Math.round(total);
}

// PR по упражнению: лучший вес и лучший вес*повторы среди всех рабочих подходов истории.
function exercisePRs(historyRows) {
  let bestWeight = null;
  let bestVolume = null;
  for (const row of historyRows) {
    for (const s of row.sets || []) {
      if (s.isWarmup) continue;
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      if (isNaN(w) || isNaN(r)) continue;
      if (!bestWeight || w > bestWeight.weight) bestWeight = { weight: w, reps: r, date: row.date };
      const vol = w * r;
      if (!bestVolume || vol > bestVolume.volume) bestVolume = { volume: vol, weight: w, reps: r, date: row.date };
    }
  }
  return { bestWeight, bestVolume };
}
