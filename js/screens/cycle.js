// Экран "Цикл" — обзор позиции в мезоцикле + ручная коррекция.

const CycleScreen = {
  async render(root) {
    const pointer = await DB.getCyclePointer();
    const seq = programSequence();

    const wrap = document.createElement("div");
    wrap.className = "screen screen-cycle";
    wrap.innerHTML = `<h1>Цикл</h1>`;

    const info = document.createElement("div");
    info.className = "cycle-info";
    const pos = seq[pointer.seq % seq.length];
    const week = PROGRAM.weeks[pos.weekIndex];
    const day = week.days[pos.dayIndex];
    info.innerHTML = `
      <p>Текущий цикл: <b>№${pointer.cycleNumber}</b></p>
      <p>Следующая тренировка: <b>${week.label} — ${day.title}</b></p>
    `;
    wrap.appendChild(info);

    const listTitle = document.createElement("h2");
    listTitle.textContent = "Весь цикл (4 недели)";
    wrap.appendChild(listTitle);

    const list = document.createElement("div");
    list.className = "cycle-day-list";
    const currentFlatIndex = pointer.seq % seq.length;
    let flatIndex = 0;
    PROGRAM.weeks.forEach((w) => {
      const weekHeading = document.createElement("h3");
      weekHeading.className = "cycle-week-heading";
      weekHeading.textContent = w.label;
      list.appendChild(weekHeading);

      w.days.forEach((d, dayInWeekIdx) => {
        const i = flatIndex; // фиксируем текущий индекс для замыкания клика
        const row = document.createElement("button");
        row.type = "button";
        row.className = "cycle-day-item" + (i === currentFlatIndex ? " current" : "");
        row.textContent = `${dayInWeekIdx + 1}. ${d.title}`;
        row.addEventListener("click", async () => {
          if (!confirm(`Установить указатель на «${w.label} — ${d.title}»?`)) return;
          await DB.setCyclePointer({ seq: i, cycleNumber: pointer.cycleNumber });
          location.hash = "#today";
          renderRoute();
        });
        list.appendChild(row);
        flatIndex++;
      });
    });
    wrap.appendChild(list);

    const cycleNumRow = document.createElement("div");
    cycleNumRow.className = "cycle-number-edit";
    cycleNumRow.innerHTML = `<label>Номер текущего цикла (для истории/статистики)</label>`;
    const cycleNumInput = document.createElement("input");
    cycleNumInput.type = "number";
    cycleNumInput.className = "set-input";
    cycleNumInput.value = pointer.cycleNumber;
    cycleNumInput.addEventListener("change", async () => {
      await DB.setCyclePointer({ seq: pointer.seq, cycleNumber: parseInt(cycleNumInput.value, 10) || 1 });
    });
    cycleNumRow.appendChild(cycleNumInput);
    wrap.appendChild(cycleNumRow);

    root.appendChild(wrap);
  },
};
