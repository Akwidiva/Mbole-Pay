'use strict';
// Render proper UML use case diagram to PNG using bundled puppeteer
const puppeteer = require('C:/Users/fongu/AppData/Local/npm-cache/_npx/668c188756b835f3/node_modules/puppeteer');
const path = require('path');

const OUTPUT = path.join(__dirname, 'Use Case Diagram.png');

const html = `<!DOCTYPE html>
<html>
<head><style>*{margin:0;padding:0}body{background:white}</style></head>
<body>
<svg width="1000" height="800" xmlns="http://www.w3.org/2000/svg">

  <!-- White background -->
  <rect width="1000" height="800" fill="white"/>

  <!-- ═══ CONNECTION LINES (drawn first — behind ellipses) ═══ -->

  <!-- User → left use cases (from right arm tip ~112,310) -->
  <line x1="112" y1="304" x2="242" y2="118" stroke="black" stroke-width="1.3"/>
  <line x1="112" y1="307" x2="242" y2="198" stroke="black" stroke-width="1.3"/>
  <line x1="112" y1="310" x2="242" y2="283" stroke="black" stroke-width="1.3"/>
  <line x1="111" y1="314" x2="242" y2="363" stroke="black" stroke-width="1.3"/>
  <line x1="110" y1="319" x2="242" y2="443" stroke="black" stroke-width="1.3"/>
  <line x1="108" y1="324" x2="242" y2="523" stroke="black" stroke-width="1.3"/>

  <!-- Admin → right use cases (from left arm tip ~898,200) -->
  <line x1="898" y1="196" x2="758" y2="118" stroke="black" stroke-width="1.3"/>
  <line x1="898" y1="200" x2="758" y2="215" stroke="black" stroke-width="1.3"/>

  <!-- Super Admin → right use cases (from left arm tip ~898,440) -->
  <line x1="898" y1="435" x2="758" y2="335" stroke="black" stroke-width="1.3"/>
  <line x1="898" y1="440" x2="758" y2="435" stroke="black" stroke-width="1.3"/>
  <line x1="897" y1="446" x2="758" y2="518" stroke="black" stroke-width="1.3"/>

  <!-- Smart Contract → Receive Payout  «Include» dashed -->
  <line x1="466" y1="645" x2="336" y2="467" stroke="black" stroke-width="1.3" stroke-dasharray="7,4"/>

  <!-- ═══ SYSTEM BOUNDARY ═══ -->
  <rect x="185" y="45" width="630" height="565" fill="none" stroke="black" stroke-width="2"/>
  <!-- Title box (white fill covers lines) -->
  <rect x="372" y="561" width="256" height="46" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="500" y="579" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="bold" fill="black">Mbole Pay</text>
  <text x="500" y="598" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="black">Community Savings &amp; Loan Manager</text>

  <!-- ═══ LEFT USE CASES — Member ═══ -->

  <ellipse cx="330" cy="118" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="118" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Register / Login</text>

  <ellipse cx="330" cy="198" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="198" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Create / Join Group</text>

  <ellipse cx="330" cy="283" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="283" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Contribute to Group</text>

  <ellipse cx="330" cy="363" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="363" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Vote in Disputes</text>

  <ellipse cx="330" cy="443" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="443" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Receive Payout</text>

  <ellipse cx="330" cy="523" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="330" y="523" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">File Dispute</text>

  <!-- ═══ RIGHT USE CASES — Admin / Super Admin ═══ -->

  <ellipse cx="670" cy="118" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="670" y="118" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Manage Group</text>

  <ellipse cx="670" cy="215" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="670" y="215" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">View Reports</text>

  <ellipse cx="670" cy="335" rx="88" ry="30" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="670" y="326" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Approve / Reject</text>
  <text x="670" y="344" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Member</text>

  <ellipse cx="670" cy="435" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="670" y="435" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Resolve Dispute</text>

  <ellipse cx="670" cy="518" rx="88" ry="24" fill="white" stroke="black" stroke-width="1.5"/>
  <text x="670" y="518" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="13" fill="black">Manage Users</text>

  <!-- ═══ ACTOR: User / Member (x=85, head_cy=270) ═══ -->
  <circle cx="85" cy="270" r="16" fill="none" stroke="black" stroke-width="1.8"/>
  <line x1="85" y1="286" x2="85" y2="348" stroke="black" stroke-width="1.8"/>
  <line x1="58"  y1="310" x2="112" y2="310" stroke="black" stroke-width="1.8"/>
  <line x1="85"  y1="348" x2="63"  y2="385" stroke="black" stroke-width="1.8"/>
  <line x1="85"  y1="348" x2="107" y2="385" stroke="black" stroke-width="1.8"/>
  <text x="85" y="403" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="black">User</text>
  <text x="85" y="419" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="black">(Member)</text>

  <!-- ═══ ACTOR: Admin (x=925, head_cy=162) ═══ -->
  <circle cx="925" cy="162" r="16" fill="none" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="178" x2="925" y2="240" stroke="black" stroke-width="1.8"/>
  <line x1="898" y1="200" x2="952" y2="200" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="240" x2="903" y2="277" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="240" x2="947" y2="277" stroke="black" stroke-width="1.8"/>
  <text x="925" y="294" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="black">Admin</text>

  <!-- ═══ ACTOR: Super Admin (x=925, head_cy=402) ═══ -->
  <circle cx="925" cy="402" r="16" fill="none" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="418" x2="925" y2="480" stroke="black" stroke-width="1.8"/>
  <line x1="898" y1="440" x2="952" y2="440" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="480" x2="903" y2="517" stroke="black" stroke-width="1.8"/>
  <line x1="925" y1="480" x2="947" y2="517" stroke="black" stroke-width="1.8"/>
  <text x="925" y="534" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="black">Super Admin</text>

  <!-- ═══ ACTOR: Smart Contract System (x=490, head_cy=658) ═══ -->
  <circle cx="490" cy="658" r="16" fill="none" stroke="black" stroke-width="1.8"/>
  <line x1="490" y1="674" x2="490" y2="728" stroke="black" stroke-width="1.8"/>
  <line x1="463" y1="694" x2="517" y2="694" stroke="black" stroke-width="1.8"/>
  <line x1="490" y1="728" x2="468" y2="760" stroke="black" stroke-width="1.8"/>
  <line x1="490" y1="728" x2="512" y2="760" stroke="black" stroke-width="1.8"/>
  <text x="490" y="776" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="black">Smart Contract</text>
  <text x="490" y="792" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="black">System</text>

  <!-- ═══ «Include» label — midpoint of dashed line (~401,556) moved up ═══ -->
  <rect x="358" y="502" width="88" height="18" fill="white"/>
  <text x="402" y="511" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="12" font-style="italic" fill="black">«Include»</text>

</svg>
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 800 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: OUTPUT, clip: { x: 0, y: 0, width: 1000, height: 800 } });
  await browser.close();
  console.log('Saved:', OUTPUT);
})().catch(e => { console.error(e.message); process.exit(1); });
