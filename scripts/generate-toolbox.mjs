import fs from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "its-me-mayday";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "User-Agent": "hawkins-github-toolbox",
  Accept: "application/vnd.github+json",
};

async function githubJson(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} for ${path}: ${text}`);
  }
  return res.json();
}

// Colori presi dal mondo GitHub (semplificati)
const languageColors = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Ruby: "#701516",
  Rust: "#dea584",
  Lua: "#000080",
  HCL: "#844FBA",
  Kotlin: "#A97BFF",
  Swift: "#ffac45",
  "Objective-C": "#438eff",
  Scala: "#c22d40",
  PHP: "#4F5D95",
};

function getLangColor(name) {
  return languageColors[name] || "#a1003b";
}

async function getTopLanguages(max = 6) {
  let page = 1;
  const totals = {};

  while (true) {
    const repos = await githubJson(
      `/users/${username}/repos?per_page=100&page=${page}`
    );
    if (!repos.length) break;

    for (const repo of repos) {
      if (repo.fork) continue;

      const langs = await githubJson(
        `/repos/${repo.owner.login}/${repo.name}/languages`
      );
      for (const [lang, bytes] of Object.entries(langs)) {
        totals[lang] = (totals[lang] || 0) + bytes;
      }
    }

    page++;
  }

  const entries = Object.entries(totals);
  const totalBytes = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / totalBytes) * 100),
      color: getLangColor(name),
    }));
}

function buildToolboxSvg(languages) {
  const badgesSvg = languages
    .map((lang, idx) => {
      const startX = 40 + idx * 78; 
      const width = 72;
      const centerX = startX + width / 2;
      const y = 70;
      const gradientId = `badgeGrad${idx}`;
      const glowId = `badgeGlow${idx}`;

      return `
    <!-- Badge ${lang.name} -->
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${lang.color}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#05040a" stop-opacity="0.9"/>
      </linearGradient>
      <filter id="${glowId}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${lang.color}" flood-opacity="0.9"/>
      </filter>
    </defs>

    <g>
      <rect x="${startX}" y="${y}" rx="12" ry="12" width="${width}" height="46"
            fill="url(#${gradientId})"
            stroke="${lang.color}"
            stroke-width="1"
            filter="url(#${glowId})"/>

      <text x="${centerX}" y="${y + 22}"
            text-anchor="middle"
            font-family="Georgia, 'Times New Roman', Times, serif"
            font-size="12"
            font-weight="700"
            fill="#f5f7ff">
        ${lang.name}
      </text>

      <text x="${centerX}" y="${y + 36}"
            text-anchor="middle"
            font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            font-size="11"
            fill="#d6def5">
        ${lang.percent}%
      </text>
    </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="520" height="150" viewBox="0 0 520 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradientToolbox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05040a"/>
      <stop offset="40%" stop-color="#0b0f1f"/>
      <stop offset="100%" stop-color="#020309"/>
    </linearGradient>

    <linearGradient id="borderGradientToolbox" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff1133"/>
      <stop offset="50%" stop-color="#ff3355"/>
      <stop offset="100%" stop-color="#ff1133"/>
    </linearGradient>

    <filter id="outerGlowToolbox" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="#ff1133" flood-opacity="0.75"/>
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#a1003b" flood-opacity="0.75"/>
    </filter>

    <linearGradient id="vignetteToolbox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff1133" stop-opacity="0.18"/>
      <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#35c0ff" stop-opacity="0.18"/>
    </linearGradient>

    <filter id="noiseToolbox">
      <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="noStitch"/>
      <feColorMatrix type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 .32 0"/>
    </filter>
  </defs>

  <rect x="8" y="8" rx="22" ry="22" width="504" height="134"
        fill="url(#bgGradientToolbox)"
        stroke="url(#borderGradientToolbox)"
        stroke-width="2"
        filter="url(#outerGlowToolbox)"/>

  <rect x="8" y="8" rx="22" ry="22" width="504" height="134"
        fill="url(#vignetteToolbox)" />
  <rect x="8" y="8" rx="22" ry="22" width="504" height="134"
        filter="url(#noiseToolbox)" opacity="0.35"/>

  <text x="30" y="42"
        font-family="Georgia, 'Times New Roman', Times, serif"
        font-size="18"
        font-weight="700"
        letter-spacing="5"
        fill="#ff3355">
    My Toolbox
  </text>

  ${badgesSvg}
</svg>`;
}

async function main() {
  console.log(`Generating toolbox for ${username}...`);
  const languages = await getTopLanguages(6);
  console.log(languages);
  const svg = buildToolboxSvg(languages);
  await fs.writeFile("toolbox.svg", svg, "utf8");
  console.log("toolbox.svg updated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
