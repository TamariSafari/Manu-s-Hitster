import fs from "node:fs/promises";

const START = 90;   // dann 20, 40, 60, 80
const COUNT = 20;


function norm(s) {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchITunesPreview(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=10&country=de`;


  const res = await fetch(url, {
  headers: {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0"
  }
});

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  const results = data.results ?? [];

  if (results.length === 0) return { found: false };

  const a = norm(artist);

  // Bevorzuge Treffer, deren artistName den gewünschten Artist enthält
  const best =
    results.find((r) => norm(r.artistName).includes(a)) ||
    results[0];

  if (!best?.previewUrl) return { found: false };

  return {
    found: true,
    previewUrl: best.previewUrl,
    trackId: best.trackId,
    trackName: best.trackName,
    artistName: best.artistName,
    collectionName: best.collectionName,
    releaseDate: best.releaseDate
  };
}

async function main() {
  const raw = await fs.readFile("./songs.json", "utf-8");
  const songs = JSON.parse(raw);

const slice = songs.slice(START, START + COUNT);

  const report = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < slice.length; i++) {
  const s = slice[i];
    const label = `${s.id} | ${s.title} — ${s.artist}`;

    try {
      const r = await searchITunesPreview(s.title, s.artist);

      if (!r.found) {
        report.push({ ...s, status: "NOT_FOUND" });
        fail++;
        console.log(`❌ NOT_FOUND: ${label}`);
      } else {
        // optional: Treffer-Qualität markieren, wenn Artist stark abweicht
        const match = norm(r.artistName).includes(norm(s.artist));
        report.push({
          ...s,
          status: match ? "OK" : "MAYBE_WRONG_MATCH",
          previewUrl: r.previewUrl,
          itunesTrackId: r.trackId,
          itunesTrackName: r.trackName,
          itunesArtistName: r.artistName
        });
        ok++;
        console.log(`${match ? "✅" : "⚠️"} ${match ? "OK" : "MAYBE"}: ${label}`);
      }
    } catch (e) {
      report.push({ ...s, status: "ERROR", error: String(e?.message ?? e) });
      fail++;
      console.log(`💥 ERROR: ${label} -> ${e?.message ?? e}`);
    }

    // freundlich zur API sein
    await sleep(1500);
  }

  await fs.writeFile("./preview-report.json", JSON.stringify(report, null, 2), "utf-8");
  console.log(`\nFertig. OK: ${ok}, Probleme: ${fail}`);
  console.log(`Report: preview-report.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
