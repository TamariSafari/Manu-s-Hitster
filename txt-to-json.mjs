import fs from "node:fs/promises";

function makeId(n) {
  return `HIT-${String(n).padStart(4, "0")}`;
}

async function main() {
  const raw = await fs.readFile("./songs.txt", "utf-8");
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const out = [];
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const yearMatch = line.match(/\((\d{4})\)/);
    if (!yearMatch) {
      console.log(`⚠️ Kein Jahr gefunden in Zeile ${i + 1}: ${line}`);
      skipped++;
      continue;
    }
    const year = Number(yearMatch[1]);

    const withoutYear = line.replace(/\(\d{4}\)/, "").trim();

    const parts = withoutYear.split(" - ");
    if (parts.length < 2) {
      console.log(`⚠️ Kein ' - ' gefunden in Zeile ${i + 1}: ${line}`);
      skipped++;
      continue;
    }

    const artist = parts[0].trim();                 // LINKS = Artist
    const title  = parts.slice(1).join(" - ").trim(); // RECHTS = Titel

    out.push({
      id: makeId(out.length + 1),
      title,
      artist,
      year
    });
  }

  await fs.writeFile("./songs.json", JSON.stringify(out, null, 2), "utf-8");
  console.log(`\nFertig: ${out.length} Songs -> songs.json`);
  console.log(`Übersprungen: ${skipped}`);
}

main();
