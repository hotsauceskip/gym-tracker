// Минимальный враппер над IndexedDB. Без внешних библиотек.
const DB_NAME = "gym-tracker";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("byDate", "date");
      }
      if (!db.objectStoreNames.contains("bodyWeight")) {
        db.createObjectStore("bodyWeight", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

const Store = {
  async put(storeName, value) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const r = store.put(value);
      r.onsuccess = () => resolve(value);
      r.onerror = (e) => reject(e.target.error);
    });
  },
  async delete(storeName, key) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const r = store.delete(key);
      r.onsuccess = () => resolve();
      r.onerror = (e) => reject(e.target.error);
    });
  },
  async get(storeName, key) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const r = store.get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = (e) => reject(e.target.error);
    });
  },
  async getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = (e) => reject(e.target.error);
    });
  },
};

// --- Удобные обёртки поверх Store ---

const DB = {
  async getAllSessions() {
    const all = await Store.getAll("sessions");
    return all.sort((a, b) => a.date.localeCompare(b.date));
  },
  async saveSession(session) {
    return Store.put("sessions", session);
  },
  async deleteSession(id) {
    return Store.delete("sessions", id);
  },
  async getExerciseHistory(exerciseId) {
    const all = await this.getAllSessions();
    const out = [];
    for (const s of all) {
      const e = s.exercises.find((x) => x.exerciseId === exerciseId);
      if (e) out.push({ date: s.date, sessionId: s.id, ...e });
    }
    return out;
  },
  async getLastExerciseInstance(exerciseId, beforeSessionId) {
    const hist = await this.getExerciseHistory(exerciseId);
    const filtered = beforeSessionId ? hist.filter((h) => h.sessionId !== beforeSessionId) : hist;
    return filtered.length ? filtered[filtered.length - 1] : null;
  },
  async getCyclePointer() {
    const v = await Store.get("kv", "cyclePointer");
    // Дефолт при первом запуске = реальная стартовая позиция (неделя 2, день 1 — seq 3).
    return v ? v.value : { seq: 3, cycleNumber: 1 };
  },
  async setCyclePointer(pointer) {
    return Store.put("kv", { key: "cyclePointer", value: pointer });
  },
  async getSetting(key, fallback) {
    const v = await Store.get("kv", "setting:" + key);
    return v ? v.value : fallback;
  },
  async setSetting(key, value) {
    return Store.put("kv", { key: "setting:" + key, value });
  },
  async getAllBodyWeights() {
    const all = await Store.getAll("bodyWeight");
    return all.sort((a, b) => a.date.localeCompare(b.date));
  },
  async saveBodyWeight(entry) {
    return Store.put("bodyWeight", entry);
  },
  async exportAll() {
    const sessions = await Store.getAll("sessions");
    const bodyWeight = await Store.getAll("bodyWeight");
    const kv = await Store.getAll("kv");
    return { exportedAt: new Date().toISOString(), sessions, bodyWeight, kv };
  },
  async importAll(data) {
    if (data.sessions) for (const s of data.sessions) await Store.put("sessions", s);
    if (data.bodyWeight) for (const b of data.bodyWeight) await Store.put("bodyWeight", b);
    if (data.kv) for (const k of data.kv) await Store.put("kv", k);
  },
};
