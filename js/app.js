// Роутинг и bootstrap приложения.

function renderRoute() {
  RestTimer.stopAll(); // глушим таймеры прошлого экрана — иначе тикают в фоне вечно
  const hash = window.location.hash.replace(/^#/, "") || "today";
  const [route, param] = hash.split("/");
  const app = document.getElementById("app");
  app.innerHTML = "";

  document.querySelectorAll(".navbtn").forEach((b) => {
    b.classList.toggle("active", b.dataset.route === route);
  });

  const screens = {
    today: () => TodayScreen.render(app),
    history: () => HistoryScreen.render(app, param),
    cycle: () => CycleScreen.render(app),
    settings: () => SettingsScreen.render(app),
  };
  (screens[route] || screens.today)();
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => {
  renderRoute();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      /* офлайн-кэш — не критично для первого запуска */
    });
  }
});
