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
      <stop offset="0%" stop-color="#0a0b10"/>
      <stop offset="50%" stop-color="#0f1220"/>
      <stop offset="100%" stop-color="#05060a"/>
    </linearGradient>

    <filter id="shadowGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ff1133" flood-opacity="0.75"/>
    </filter>

    <radialGradient id="innerCircle" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#1b1f2e"/>
      <stop offset="100%" stop-color="#05060a"/>
    </radialGradient>

    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff1133"/>
      <stop offset="50%" stop-color="#ff3355"/>
      <stop offset="100%" stop-color="#a1003b"/>
    </linearGradient>
  </defs>

  <rect x="6" y="6" rx="16" ry="16" width="508" height="178"
        fill="url(#bgGradient)"
        stroke="#ff1133"
        stroke-width="1.5"
        filter="url(#shadowGlow)"/>

  <text x="26" y="42"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="16"
        letter-spacing="3"
        fill="#ff3355">
    ${displayName}'s GitHub Stats
  </text>

  <line x1="26" y1="52" x2="320" y2="52" stroke="#25293a" stroke-width="1"/>

  <text x="32" y="82"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="14"
        fill="#ffdf5d">★</text>
  <text x="60" y="82"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#98a3b3">
    Total Stars Earned:
  </text>
  <text x="240" y="82"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#e8ecf2">
    ${stars}
  </text>

  <text x="32" y="112"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="14"
        fill="#35c0ff">⏱</text>
  <text x="60" y="112"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#98a3b3">
    Total Commits (last year):
  </text>
  <text x="260" y="112"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#e8ecf2">
    ${commits}
  </text>

  <text x="32" y="142"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="14"
        fill="#ff3355">!</text>
  <text x="60" y="142"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#98a3b3">
    Total Issues:
  </text>
  <text x="240" y="142"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="13"
        fill="#e8ecf2">
    ${issues}
  </text>

  <g transform="translate(360, 45)">
    <circle cx="0" cy="0" r="52" fill="none" stroke="url(#ringGradient)" stroke-width="10"/>
    <circle cx="0" cy="0" r="36" fill="url(#innerCircle)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="-18" y="7"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          font-size="24"
          letter-spacing="3"
          fill="#e8ecf2">
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
