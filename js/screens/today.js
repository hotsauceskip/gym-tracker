// Экран "Сегодня" — текущая тренировка по указателю цикла.

const TodayScreen = {
  async render(root) {
    const pointer = await DB.getCyclePointer();
    const seq = programSequence();
    const pos = seq[pointer.seq % seq.length];
    const week = PROGRAM.weeks[pos.weekIndex];
    const day = week.days[pos.dayIndex];
    const sessionId = `s-${pointer.cycleNumber}-${pointer.seq}`;

    let session = await DB.getAllSessions().then((all) => all.find((s) => s.id === sessionId));
    if (!session) {
      session = {
        id: sessionId,
        date: new Date().toISOString().slice(0, 10),
        cycleNumber: pointer.cycleNumber,
        weekKey: week.key,
        dayKey: day.key,
        completed: false,
        bodyWeight: null,
        exercises: day.exercises.map((ex) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: buildSetPlan(ex).map((sp) => ({ ...sp, weight: "", reps: "", rir: "" })),
        })),
      };
    }

    const incrementStep = await DB.getSetting("weightIncrement", 1.25);

    const wrap = document.createElement("div");
    wrap.className = "screen screen-today";

    const header = document.createElement("div");
    header.className = "today-header";
    header.innerHTML = `
      <div class="cycle-badge">Цикл ${pointer.cycleNumber} · ${week.label}</div>
      <h1>${day.title}</h1>
    `;
    wrap.appendChild(header);

    const tonnageEl = document.createElement("div");
    tonnageEl.className = "tonnage-line";
    wrap.appendChild(tonnageEl);

    const list = document.createElement("div");
    list.className = "exercise-list";
    wrap.appendChild(list);

    function updateTonnage() {
      tonnageEl.textContent = `Тоннаж сессии: ${sessionTonnage(session)} кг`;
    }

    for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
      const exDef = day.exercises[exIdx];
      const sessEx = session.exercises[exIdx];

      const card = document.createElement("div");
      card.className = "exercise-card";

      const nameRow = document.createElement("div");
      nameRow.className = "exercise-name-row";
      const nameBtn = document.createElement("a");
      nameBtn.href = `#history/${exDef.id}`;
      nameBtn.className = "exercise-name-link";
      nameBtn.textContent = exDef.name;
      nameRow.appendChild(nameBtn);
      card.appendChild(nameRow);

      if (exDef.note) {
        const note = document.createElement("div");
        note.className = "exercise-note";
        note.textContent = exDef.note;
        card.appendChild(note);
      }

      const prLine = document.createElement("div");
      prLine.className = "pr-line";
      card.appendChild(prLine);
      const suggestionLine = document.createElement("div");
      suggestionLine.className = "suggestion-line";
      card.appendChild(suggestionLine);

      // История/подсказка/PR — без ожидания блокировки рендера остального
      DB.getExerciseHistory(exDef.id).then((hist) => {
        const histExcl = hist.filter((h) => h.sessionId !== session.id);
        // Прогрессию считаем только по истории ТОГО ЖЕ дня цикла (dayKey) — неделя 1
        // и неделя 3 используют один и тот же объект дня (это осознанный повтор с
        // прогрессией), а разные дни внутри одной недели с тем же упражнением, но
        // другой целью по повторам/ПДО — это разные слоты, мешать их нельзя.
        const sameSlot = histExcl.filter((h) => h.dayKey === day.key);
        const last = sameSlot.length ? sameSlot[sameSlot.length - 1] : null;
        const suggestion = suggestNext(exDef, last, incrementStep);
        if (suggestion) {
          suggestionLine.textContent = "💡 " + suggestion.text;
        } else if (last) {
          const ws = (last.sets || []).filter((s) => !s.isWarmup && s.weight !== "");
          if (ws.length) {
            suggestionLine.textContent =
              "Прошлый раз: " + ws.map((s) => `${s.weight}×${s.reps}`).join(", ");
          }
        }
        const { bestWeight, bestVolume } = exercisePRs(histExcl, exDef);
        if (bestWeight) {
          prLine.textContent = `Рекорд: ${bestWeight.weight} кг × ${bestWeight.reps} (лучший тоннаж подхода: ${bestVolume.volume} кг)`;
        }
      });

      const restBtnWrap = document.createElement("div");
      restBtnWrap.className = "rest-timer-wrap";
      const restBtn = document.createElement("button");
      restBtn.type = "button";
      restBtn.className = "rest-timer-btn";
      restBtnWrap.appendChild(restBtn);
      card.appendChild(restBtnWrap);
      GlobalRestTimer.syncButton(restBtn, exDef.id, exDef.restSec);
      restBtn.addEventListener("click", () => GlobalRestTimer.toggle(exDef.id, exDef.restSec));

      const setsTable = document.createElement("div");
      setsTable.className = "sets-table";
      let prevWeightInput = null;
      let prevRepsInput = null;
      sessEx.sets.forEach((setState, setIdx) => {
        const isLastSet = setIdx === sessEx.sets.length - 1;
        const row = document.createElement("div");
        row.className = "set-row" + (setState.isWarmup ? " warmup" : "");

        const label = document.createElement("div");
        label.className = "set-label";
        label.textContent = setState.isWarmup
          ? `Разм. ${setState.setNumber}`
          : `Подход ${setState.setNumber}` + (setState.dropset ? " +дроп" : "");
        row.appendChild(label);

        const targetEl = document.createElement("div");
        targetEl.className = "set-target";
        // ПДО — только ориентир для последнего рабочего подхода (отказ наступает
        // один раз на упражнение, а не на каждом подходе).
        targetEl.textContent = `${setState.targetReps} повт.` + (isLastSet ? `, ПДО ${exDef.rir}` : "");
        row.appendChild(targetEl);

        const weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.inputMode = "decimal";
        weightInput.step = "0.25";
        weightInput.placeholder = "кг";
        weightInput.className = "set-input weight-input";
        weightInput.value = setState.weight;
        row.appendChild(weightInput);

        const repsInput = document.createElement("input");
        repsInput.type = "number";
        repsInput.inputMode = "numeric";
        repsInput.placeholder = "повт";
        repsInput.className = "set-input reps-input";
        repsInput.value = setState.reps;
        row.appendChild(repsInput);

        let rirSelect = null;
        if (isLastSet) {
          rirSelect = document.createElement("select");
          rirSelect.className = "set-input rir-input";
          const emptyOpt = document.createElement("option");
          emptyOpt.value = "";
          emptyOpt.textContent = "ПДО";
          rirSelect.appendChild(emptyOpt);
          for (let r = 0; r <= 10; r++) {
            const opt = document.createElement("option");
            opt.value = String(r);
            opt.textContent = String(r);
            rirSelect.appendChild(opt);
          }
          rirSelect.value = setState.rir;
          row.appendChild(rirSelect);
        } else {
          row.appendChild(document.createElement("div"));
        }

        const persist = async () => {
          setState.weight = weightInput.value;
          setState.reps = repsInput.value;
          setState.rir = rirSelect ? rirSelect.value : "";
          updateTonnage();
          await DB.saveSession(session);
        };
        weightInput.addEventListener("change", persist);
        repsInput.addEventListener("change", persist);
        if (rirSelect) rirSelect.addEventListener("change", persist);

        if (setIdx > 0) {
          const dupBtn = document.createElement("button");
          dupBtn.type = "button";
          dupBtn.className = "dup-btn";
          dupBtn.textContent = "⟲";
          dupBtn.title = "Повторить вес и повторы из прошлого подхода";
          const fromWeightInput = prevWeightInput;
          const fromRepsInput = prevRepsInput;
          dupBtn.addEventListener("click", () => {
            weightInput.value = fromWeightInput.value;
            repsInput.value = fromRepsInput.value;
            persist();
          });
          row.appendChild(dupBtn);
        } else {
          row.appendChild(document.createElement("div"));
        }

        setsTable.appendChild(row);
        prevWeightInput = weightInput;
        prevRepsInput = repsInput;
      });
      card.appendChild(setsTable);
      list.appendChild(card);
    }

    updateTonnage();

    const bwRow = document.createElement("div");
    bwRow.className = "bodyweight-row";
    bwRow.innerHTML = `<label>Вес тела сегодня (кг, необязательно)</label>`;
    const bwInput = document.createElement("input");
    bwInput.type = "number";
    bwInput.inputMode = "decimal";
    bwInput.step = "0.1";
    bwInput.className = "set-input";
    bwInput.value = session.bodyWeight || "";
    bwInput.addEventListener("change", async () => {
      session.bodyWeight = bwInput.value;
      await DB.saveSession(session);
    });
    bwRow.appendChild(bwInput);
    wrap.appendChild(bwRow);

    const finishBtn = document.createElement("button");
    finishBtn.type = "button";
    finishBtn.className = "finish-btn";
    finishBtn.textContent = "Завершить тренировку";
    finishBtn.addEventListener("click", async () => {
      if (!confirm("Завершить тренировку и перейти к следующему дню?")) return;
      session.completed = true;
      session.date = new Date().toISOString().slice(0, 10);
      await DB.saveSession(session);
      if (session.bodyWeight) {
        await DB.saveBodyWeight({ id: "bw-" + session.date + "-" + session.id, date: session.date, weight: parseFloat(session.bodyWeight) });
      }
      const total = seq.length;
      let nextSeq = pointer.seq + 1;
      let nextCycle = pointer.cycleNumber;
      if (nextSeq >= total) {
        nextSeq = 0;
        nextCycle += 1;
      }
      await DB.setCyclePointer({ seq: nextSeq, cycleNumber: nextCycle });
      alert("Тренировка сохранена! Отличная работа 💪");
      location.hash = "#today";
      renderRoute();
    });
    wrap.appendChild(finishBtn);

    root.appendChild(wrap);
  },
};
