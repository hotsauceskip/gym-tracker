// Экран "Настройки" — вес тела, шаг прогрессии, экспорт/импорт бэкапа.

const SettingsScreen = {
  async render(root) {
    const wrap = document.createElement("div");
    wrap.className = "screen screen-settings";
    wrap.innerHTML = `<h1>Настройки</h1>`;

    // Шаг прогрессии по весу
    const stepBlock = document.createElement("div");
    stepBlock.className = "settings-block";
    stepBlock.innerHTML = `<label>Шаг прибавки веса при прогрессии (кг)</label>`;
    const stepInput = document.createElement("input");
    stepInput.type = "number";
    stepInput.step = "0.25";
    stepInput.className = "set-input";
    stepInput.value = await DB.getSetting("weightIncrement", 1.25);
    stepInput.addEventListener("change", async () => {
      await DB.setSetting("weightIncrement", parseFloat(stepInput.value) || 1.25);
    });
    stepBlock.appendChild(stepInput);
    wrap.appendChild(stepBlock);

    // Вес тела
    const bwBlock = document.createElement("div");
    bwBlock.className = "settings-block";
    bwBlock.innerHTML = `<h2>Вес тела</h2>`;
    const bwHistory = await DB.getAllBodyWeights();
    if (bwHistory.length >= 2) {
      const points = bwHistory.map((b) => ({ date: b.date, weight: b.weight }));
      bwBlock.appendChild(renderChart(points));
    }
    const bwList = document.createElement("div");
    bwList.className = "history-table";
    bwHistory
      .slice()
      .reverse()
      .slice(0, 10)
      .forEach((b) => {
        const row = document.createElement("div");
        row.className = "history-row";
        row.innerHTML = `<div class="history-date">${b.date}</div><div class="history-sets">${b.weight} кг</div>`;
        bwList.appendChild(row);
      });
    bwBlock.appendChild(bwList);

    const bwAddRow = document.createElement("div");
    bwAddRow.className = "bodyweight-row";
    const bwInput = document.createElement("input");
    bwInput.type = "number";
    bwInput.step = "0.1";
    bwInput.placeholder = "кг сегодня";
    bwInput.className = "set-input";
    const bwBtn = document.createElement("button");
    bwBtn.type = "button";
    bwBtn.className = "secondary-btn";
    bwBtn.textContent = "Записать вес тела";
    bwBtn.addEventListener("click", async () => {
      const val = parseFloat(bwInput.value);
      if (isNaN(val)) return;
      const date = new Date().toISOString().slice(0, 10);
      await DB.saveBodyWeight({ id: "bw-" + date, date, weight: val });
      renderRoute();
    });
    bwAddRow.appendChild(bwInput);
    bwAddRow.appendChild(bwBtn);
    bwBlock.appendChild(bwAddRow);
    wrap.appendChild(bwBlock);

    // Бэкап
    const backupBlock = document.createElement("div");
    backupBlock.className = "settings-block";
    backupBlock.innerHTML = `<h2>Бэкап</h2><p class="hint">Данные хранятся только на этом телефоне. Сохраняй бэкап время от времени — на случай смены телефона.</p>`;

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "secondary-btn";
    exportBtn.textContent = "Экспортировать бэкап (JSON)";
    exportBtn.addEventListener("click", async () => {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
    backupBlock.appendChild(exportBtn);

    const importLabel = document.createElement("label");
    importLabel.className = "file-import-label";
    importLabel.textContent = "Импортировать бэкап";
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.className = "file-import-input";
    importInput.addEventListener("change", async () => {
      const file = importInput.files[0];
      if (!file) return;
      if (!confirm("Импорт добавит/перезапишет записи с теми же id. Продолжить?")) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        await DB.importAll(data);
        alert("Бэкап импортирован");
        renderRoute();
      } catch (e) {
        alert("Не удалось прочитать файл: " + e.message);
      }
    });
    importLabel.appendChild(importInput);
    backupBlock.appendChild(importLabel);

    wrap.appendChild(backupBlock);
    root.appendChild(wrap);
  },
};
