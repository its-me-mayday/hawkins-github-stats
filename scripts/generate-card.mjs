import fs from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "its-me-mayday";
const displayName = process.env.GITHUB_DISPLAY_NAME || "Luca Maggio";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(1);
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "User-Agent": "hawkins-github-stats",
  "Accept": "application/vnd.github+json",
};

async function githubJson(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} for ${path}: ${text}`);
  }
  return res.json();
}

async function getTotalStars() {
  let page = 1;
  let total = 0;

  while (true) {
    const repos = await githubJson(
      `/users/${username}/repos?per_page=100&page=${page}`
    );
    if (!repos.length) break;
    for (const r of repos) {
      total += r.stargazers_count || 0;
    }
    page++;
  }

  return total;
}

async function getTotalIssues() {
  const q = encodeURIComponent(`author:${username} type:issue`);
  const result = await githubJson(`/search/issues?q=${q}&per_page=1`);
  return result.total_count || 0;
}

async function getCommitsLastYear() {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const sinceStr = since.toISOString().split("T")[0];

  const q = encodeURIComponent(`author:${username} committer-date:>${sinceStr}`);
  const result = await githubJson(
    `/search/commits?q=${q}&per_page=1`
  );
  return result.total_count || 0;
}

function computeGrade(commits) {
  // Cambiala come vuoi, per ora giusto un giochetto
  if (commits >= 1000) return "A+";
  if (commits >= 700) return "A";
  if (commits >= 400) return "B+";
  if (commits >= 250) return "B";
  if (commits >= 100) return "C+";
  return "C";
}

function buildSvg({ stars, commits, issues, grade }) {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="520" height="190" viewBox="0 0 520 190" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#05040a"/>
        <stop offset="40%" stop-color="#0b0f1f"/>
        <stop offset="100%" stop-color="#020309"/>
      </linearGradient>
  
      <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff1133"/>
        <stop offset="50%" stop-color="#ff3355"/>
        <stop offset="100%" stop-color="#ff1133"/>
      </linearGradient>
  
      <filter id="outerGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="#ff1133" flood-opacity="0.75"/>
        <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#a1003b" flood-opacity="0.75"/>
      </filter>
  
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="noStitch"/>
        <feColorMatrix type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 .30 0"/>
      </filter>
  
      <radialGradient id="innerCircle" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#141828"/>
        <stop offset="100%" stop-color="#020309"/>
      </radialGradient>
  
      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff1133"/>
        <stop offset="45%" stop-color="#ff3355"/>
        <stop offset="100%" stop-color="#35c0ff"/>
      </linearGradient>
    </defs>
  
    <rect x="8" y="8" rx="22" ry="22" width="504" height="174"
          fill="url(#bgGradient)"
          stroke="url(#borderGradient)"
          stroke-width="2"
          filter="url(#outerGlow)"/>
  
    <linearGradient id="vignetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff1133" stop-opacity="0.24"/>
      <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#35c0ff" stop-opacity="0.24"/>
    </linearGradient>
    <rect x="8" y="8" rx="22" ry="22" width="504" height="174"
          fill="url(#vignetteGrad)" />
  
    <rect x="8" y="8" rx="22" ry="22" width="504" height="174"
          filter="url(#noiseFilter)" opacity="0.40"/>
  
    <text x="30" y="48"
          font-family="Georgia, 'Times New Roman', Times, serif"
          font-size="18"
          font-weight="700"
          letter-spacing="5"
          text-rendering="geometricPrecision"
          fill="#ff3355">
      ${displayName}'s GitHub Stats
    </text>
  
    <line x1="30" y1="56" x2="340" y2="56" stroke="#25293a" stroke-width="1"/>
  
    <text x="38" y="88"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="16"
          fill="#ffdf5d">★</text>
    <text x="68" y="88"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="13"
          font-weight="500"
          fill="#98a3b3">
      Total Stars Earned:
    </text>
    <text x="305" y="88"
          text-anchor="end"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          font-size="14"
          font-weight="600"
          fill="#e8ecf2">
      ${stars}
    </text>
  
    <text x="38" y="118"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="16"
          fill="#35c0ff">🕒</text>
    <text x="68" y="118"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="13"
          font-weight="500"
          fill="#98a3b3">
      Total Commits (last year):
    </text>
    <text x="305" y="118"
          text-anchor="end"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          font-size="14"
          font-weight="600"
          fill="#e8ecf2">
      ${commits}
    </text>
  
    <!-- issues -->
    <text x="38" y="148"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="16"
          fill="#ff3355">!</text>
    <text x="68" y="148"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="13"
          font-weight="500"
          fill="#98a3b3">
      Total Issues:
    </text>
    <text x="305" y="148"
          text-anchor="end"
          font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          font-size="14"
          font-weight="600"
          fill="#e8ecf2">
      ${issues}
    </text>
  
    <g transform="translate(410, 102)">
      <circle cx="0" cy="0" r="60" fill="#ff1133" opacity="0.09"/>
      <circle cx="0" cy="0" r="50" fill="none" stroke="url(#ringGradient)" stroke-width="9"/>
      <circle cx="0" cy="0" r="36" fill="url(#innerCircle)" stroke="rgba(255,255,255,0.15)" stroke-width="1.2"/>
      <text x="0" y="6"
            text-anchor="middle"
            font-family="Georgia, 'Times New Roman', Times, serif"
            font-size="26"
            font-weight="700"
            letter-spacing="5"
            fill="#f5f7ff">
        ${grade}
      </text>
    </g>
  </svg>`;
  }  
  
async function main() {
  console.log(`Generating stats for ${username}...`);
  const [stars, issues, commits] = await Promise.all([
    getTotalStars(),
    getTotalIssues(),
    getCommitsLastYear(),
  ]);

  const grade = computeGrade(commits);

  console.log({ stars, issues, commits, grade });

  const svg = buildSvg({ stars, commits, issues, grade });
  await fs.writeFile("card.svg", svg, "utf8");
  console.log("card.svg updated");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
