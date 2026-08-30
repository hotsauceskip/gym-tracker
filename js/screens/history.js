// Экран "История" — список упражнений, и детальная история/график по одному упражнению.

const HistoryScreen = {
  async render(root, exerciseId) {
    if (exerciseId) return this.renderDetail(root, exerciseId);
    return this.renderList(root);
  },

  async renderList(root) {
    const wrap = document.createElement("div");
    wrap.className = "screen screen-history-list";
    wrap.innerHTML = `<h1>История</h1>`;

    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Поиск упражнения…";
    search.className = "history-search";
    wrap.appendChild(search);

    const list = document.createElement("div");
    list.className = "history-exercise-list";
    wrap.appendChild(list);

    const all = allExercisesFlat();

    function renderItems(filterText) {
      list.innerHTML = "";
      const q = (filterText || "").toLowerCase();
      all
        .filter((ex) => ex.name.toLowerCase().includes(q))
        .forEach((ex) => {
          const a = document.createElement("a");
          a.href = `#history/${ex.id}`;
          a.className = "history-exercise-item";
          a.textContent = ex.name;
          list.appendChild(a);
        });
    }
    renderItems("");
    search.addEventListener("input", () => renderItems(search.value));

    root.appendChild(wrap);
  },

  async renderDetail(root, exerciseId) {
    const exDef = allExercisesFlat().find((e) => e.id === exerciseId);
    const wrap = document.createElement("div");
    wrap.className = "screen screen-history-detail";

    const backLink = document.createElement("a");
    backLink.href = "#history";
    backLink.className = "back-link";
    backLink.textContent = "← Все упражнения";
    wrap.appendChild(backLink);

    const h1 = document.createElement("h1");
    h1.textContent = exDef ? exDef.name : exerciseId;
    wrap.appendChild(h1);

    const hist = await DB.getExerciseHistory(exerciseId);
    const completed = hist.filter((h) => h.sets && h.sets.some((s) => !s.isWarmup && s.weight !== ""));

    if (!completed.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Пока нет записей по этому упражнению.";
      wrap.appendChild(empty);
      root.appendChild(wrap);
      return;
    }

    const { bestWeight, bestVolume } = exercisePRs(completed, exDef);
    const prBlock = document.createElement("div");
    prBlock.className = "pr-block";
    prBlock.innerHTML = `
      <div>🏆 Лучший вес: <b>${bestWeight ? bestWeight.weight + " кг × " + bestWeight.reps : "—"}</b></div>
      <div>🏆 Лучший тоннаж подхода: <b>${bestVolume ? bestVolume.volume + " кг" : "—"}</b></div>
    `;
    wrap.appendChild(prBlock);

    // График рабочего веса (первый рабочий подход каждой сессии) по времени — простой SVG, без библиотек.
    const points = completed
      .map((row) => {
        const ws = row.sets.filter((s) => !s.isWarmup && s.weight !== "");
        if (!ws.length) return null;
        return { date: row.date, weight: parseFloat(ws[0].weight) };
      })
      .filter(Boolean);

    if (points.length >= 2) {
      wrap.appendChild(renderChart(points));
    }

    const table = document.createElement("div");
    table.className = "history-table";
    completed
      .slice()
      .reverse()
      .forEach((row) => {
        const rowEl = document.createElement("div");
        rowEl.className = "history-row";
        const setsStr = row.sets
          .filter((s) => s.weight !== "")
          .map((s) => (s.isWarmup ? `разм ${s.weight}×${s.reps}` : `${s.weight}×${s.reps}${s.rir !== "" ? " (ПДО " + s.rir + ")" : ""}`))
          .join(" · ");
        rowEl.innerHTML = `<div class="history-date">${row.date}</div><div class="history-sets">${setsStr}</div>`;
        table.appendChild(rowEl);
      });
    wrap.appendChild(table);

    root.appendChild(wrap);
  },
};

function renderChart(points) {
  const width = 320;
  const height = 140;
  const padding = 24;
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const x = (i) => padding + (i / (points.length - 1)) * (width - padding * 2);
  const y = (w) => height - padding - ((w - min) / range) * (height - padding * 2);

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.weight).toFixed(1)}`).join(" ");
  const dots = points
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.weight).toFixed(1)}" r="3" class="chart-dot" />`)
    .join("");

  const svgWrap = document.createElement("div");
  svgWrap.className = "chart-wrap";
  svgWrap.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="progress-chart" role="img" aria-label="График рабочего веса">
      <text x="${padding}" y="14" class="chart-label">${max} кг</text>
      <text x="${padding}" y="${height - 6}" class="chart-label">${min} кг</text>
      <path d="${pathD}" class="chart-line" fill="none" />
      ${dots}
    </svg>
  `;
  return svgWrap;
}
