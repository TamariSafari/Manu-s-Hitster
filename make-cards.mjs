import fs from "node:fs/promises";

const SITE_URL = "https://DEINE-SEITE.netlify.app"; // <-- HIER ändern

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  const raw = await fs.readFile("./songs.json", "utf-8");
  const songs = JSON.parse(raw);

  const cards = songs.map(s => {
    const target = `${SITE_URL}/?id=${encodeURIComponent(s.id)}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(target)}`;

    // Vorderseite: nur QR + ID (No Spoiler). Titel/Artist NICHT drauf.
    return `
      <div class="card">
        <img class="qr" src="${qr}" alt="QR ${esc(s.id)}">
        <div class="id">${esc(s.id)}</div>
      </div>
    `;
  }).join("");

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hitster Cards</title>
<style>
  @page { margin: 10mm; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; }
  .card { border: 1px solid #000; border-radius: 4mm; padding: 6mm; text-align: center; }
  .qr { width: 100%; height: auto; }
  .id { margin-top: 4mm; font-size: 12px; letter-spacing: 0.5px; }
  /* Karten nicht zerschneiden beim Drucken */
  .card { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>
<h1 style="font-size:16px; margin:0 0 6mm 0;">Friend Hitster – QR Karten</h1>
<div class="grid">
${cards}
</div>
</body>
</html>`;

  await fs.writeFile("./cards.html", html, "utf-8");
  console.log("✅ cards.html erstellt. Öffnen und drucken.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
