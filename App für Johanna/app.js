document.getElementById("status")?.textContent = "JS läuft…";
// --- Admin-Modus (versteckt + PIN) ---
const ADMIN_PIN = "1234"; // <-- ÄNDERN
const ADMIN_KEY = "fh_admin_unlocked";

const adminPanel = document.getElementById("adminPanel");
const adminTrigger = document.getElementById("adminTrigger");
const adminOverlay = document.getElementById("adminOverlay");
const adminPin = document.getElementById("adminPin");
const adminUnlockBtn = document.getElementById("adminUnlockBtn");
const adminCancelBtn = document.getElementById("adminCancelBtn");
const adminMsg = document.getElementById("adminMsg");

function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "1";
}

function setAdmin(val) {
  localStorage.setItem(ADMIN_KEY, val ? "1" : "0");
}

function applyAdminUI() {
  if (!adminPanel) return;
  adminPanel.style.display = isAdmin() ? "block" : "none";
}

function openAdminOverlay() {
  if (!adminOverlay) return;
  adminOverlay.style.display = "grid";
  if (adminMsg) adminMsg.textContent = "";
  if (adminPin) adminPin.value = "";
  adminPin?.focus();
}

function closeAdminOverlay() {
  if (!adminOverlay) return;
  adminOverlay.style.display = "none";
}

// Start: Admin standardmäßig AUS
applyAdminUI();

adminTrigger?.addEventListener("click", () => {
  openAdminOverlay();
});


// PIN prüfen
adminUnlockBtn?.addEventListener("click", () => {
  const pin = adminPin?.value ?? "";
  if (pin === ADMIN_PIN) {
    setAdmin(true);
    closeAdminOverlay();
    applyAdminUI();
  } else {
    if (adminMsg) adminMsg.textContent = "❌ Falscher PIN.";
  }
});

adminCancelBtn?.addEventListener("click", () => {
  closeAdminOverlay();
});

// Tippen auf den dunklen Hintergrund schließt
adminOverlay?.addEventListener("click", (e) => {
  if (e.target === adminOverlay) closeAdminOverlay();
});

let songs = [];
let qrScanner = null;
let currentSong = null;

const songSelect = document.getElementById("songSelect");
const makeQrBtn = document.getElementById("makeQrBtn");
const qrOut = document.getElementById("qrOut");

const video = document.getElementById("video");
const startScanBtn = document.getElementById("startScanBtn");
const stopScanBtn = document.getElementById("stopScanBtn");
const revealBtn = document.getElementById("revealBtn");
const hideBtn = document.getElementById("hideBtn");

const audio = document.getElementById("audio");
const statusEl = document.getElementById("status");
const revealArea = document.getElementById("revealArea");

function setStatus(msg) { statusEl.textContent = msg; }

async function loadSongs() {
  const res = await fetch("./songs.json");
  songs = await res.json();

  setStatus("Songs geladen: " + songs.length);


  songSelect.innerHTML = "";
  for (const s of songs) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.title} – ${s.artist} (${s.year})`;
    songSelect.appendChild(opt);
  }
}

function findSongById(id) {
  return songs.find(s => s.id === id) || null;
}

async function fetchPreviewUrl(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
  const res = await fetch(url);
  const data = await res.json();
  const first = data.results?.[0];
  return first?.previewUrl || null;
}

async function playNoSpoiler(song) {
  revealArea.innerHTML = "";
  revealBtn.disabled = false;
  hideBtn.disabled = false;

  setStatus("Suche Preview…");
  const previewUrl = await fetchPreviewUrl(song.title, song.artist);

  if (!previewUrl) {
    setStatus("Keine Preview gefunden (Titel/Artist prüfen).");
    return;
  }

  audio.src = previewUrl;

  try {
    await audio.play();
    setStatus("🎵 Läuft (No Spoiler).");
  } catch {
    setStatus("Audio blockiert. Drück Play im Audio-Player.");
  }
}

makeQrBtn.addEventListener("click", () => {
  const id = songSelect.value;
  qrOut.innerHTML = "";

  // Option 1: api.qrserver.com (meist zuverlässig)
  const url = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodeURIComponent(id);

  const img = document.createElement("img");
  img.src = url;
  img.width = 260;
  img.height = 260;
  img.alt = "QR Code";

  qrOut.appendChild(img);
  setStatus("QR erstellt für: " + id);
});





startScanBtn.addEventListener("click", async () => {
  if (!window.QrScanner) { setStatus("QR-Scanner lädt noch…"); return; }
  if (qrScanner) { setStatus("Scanner läuft schon."); return; }

  setStatus("Kamera startet…");
  qrScanner = new window.QrScanner(
    video,
    async (result) => {
     const raw = (typeof result === "string") ? result : result.data;

// 1) QR-Inhalt bereinigen
let id = raw?.trim();

// Falls QR eine URL enthält
try {
  if (id.startsWith("http")) {
    const u = new URL(id);
    id = u.searchParams.get("id") || u.hash.replace("#", "") || id;
  }
} catch (_) {}

// Sicherheitshalber Leerzeichen entfernen
id = id.split(/[ \n\r\t]/)[0];

setStatus(`Code erkannt: ${raw} → ID: ${id}`);

const song = findSongById(id);
if (!song) {
  setStatus(`Unbekannte ID: ${id}`);
  return;
}

currentSong = song;
await playNoSpoiler(song);

    },
    { returnDetailedScanResult: true }
  );

  await qrScanner.start();
  setStatus("Scanner aktiv. QR vor die Kamera halten.");
});

stopScanBtn.addEventListener("click", async () => {
  if (!qrScanner) return;
  await qrScanner.stop();
  qrScanner.destroy();
  qrScanner = null;
  setStatus("Scanner gestoppt.");
});

revealBtn.addEventListener("click", () => {
  if (!currentSong) return;
  revealArea.innerHTML = `
    <div style="border:1px solid #ddd;border-radius:12px;padding:12px;">
      <strong>${currentSong.title}</strong><br>
      ${currentSong.artist} • ${currentSong.year}
    </div>
  `;
});

hideBtn.addEventListener("click", () => {
  revealArea.innerHTML = "";
});

loadSongs().then(() => setStatus("Bereit. QR erstellen oder scannen."));
document.getElementById("adminLockBtn")?.addEventListener("click", () => {
  setAdmin(false);
  applyAdminUI();
});

