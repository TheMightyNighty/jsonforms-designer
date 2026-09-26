/**
 * Vendoring-Schritt für das Verwaltungs-Designsystem KERN.
 *
 * KERN wird bewusst NICHT als Laufzeit-Abhängigkeit geführt (ADR 0004):
 * Das Paket @kern-ux/native bringt 6,8 MB CSS, Fonts und eigene Komponenten
 * mit, von denen der Designer nur die Design-Token und drei Schriftschnitte
 * braucht. Dieses Skript zieht das Paket einmalig, schreibt die aufgelösten
 * Token als TypeScript-Modul ins Repo und kopiert die benötigten Fonts —
 * dasselbe Vorgehen wie bei der Tabler-Icon-Schrift.
 *
 * Aufruf (nur bei einem KERN-Update nötig, nicht Teil des Builds):
 *   node scripts/vendor-kern.mjs [version]
 *
 * Ergebnis:
 *   packages/editor/src/theme/kernTokens.ts       generierte Token
 *   packages/app/src/assets/kern/fira-sans/*.woff2 Schriftschnitte
 *   packages/app/src/assets/kern/kern-fonts.css    getrimmtes @font-face-CSS
 *   packages/app/src/assets/kern/LICENSE.md        EUPL-1.2 des Pakets
 *   packages/app/src/assets/kern/HERKUNFT.md       Version und Vorgehen
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = process.argv[2] ?? '2.8.2';
const PAKET = `@kern-ux/native@${VERSION}`;

/** Schriftschnitte, die der Designer tatsächlich nutzt (regular/medium/semibold). */
const SCHNITTE = [
  { datei: 'FiraSans-Regular.woff2', gewicht: 400 },
  { datei: 'FiraSans-Medium.woff2', gewicht: 500 },
  { datei: 'FiraSans-SemiBold.woff2', gewicht: 600 },
];

// ---------------------------------------------------------------------------
// CSS einlesen und Token auflösen
// ---------------------------------------------------------------------------

/**
 * Sammelt die Custom-Properties aus den Blöcken, die für das helle Theme
 * gelten: alle `:root`-Blöcke außerhalb von @media sowie `.kern-light`.
 * Spätere Deklarationen gewinnen — dieselbe Regel wie im Browser.
 */
function leseToken(css) {
  // Kommentare entfernen — sonst hängen sie am Selektor des Folgeblocks.
  const ohneKommentare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // @media-Blöcke entfernen: sie tragen nur Dark-Mode und adaptive Größen.
  const ohneMedia = ohneKommentare.replace(
    /@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,
    '',
  );

  const token = new Map();
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let treffer;
  while ((treffer = blockRe.exec(ohneMedia)) !== null) {
    const selektor = treffer[1].trim();
    const istHell =
      /(^|,)\s*:root\s*$/.test(selektor) || selektor.includes('.kern-light');
    if (!istHell) continue;
    for (const [, name, wert] of treffer[2].matchAll(
      /(--kern-[a-z0-9-]+)\s*:\s*([^;]+);/g,
    )) {
      token.set(name, wert.trim());
    }
  }
  return token;
}

/** Löst `var(--x)`-Verweise auf, bis ein konkreter Wert übrig bleibt. */
function aufloesen(token, name, tiefe = 0) {
  if (tiefe > 20) throw new Error(`Zyklischer Token-Verweis bei ${name}`);
  const wert = token.get(name);
  if (wert === undefined) throw new Error(`Unbekanntes Token: ${name}`);
  const varTreffer = /^var\((--kern-[a-z0-9-]+)\)$/.exec(wert);
  return varTreffer ? aufloesen(token, varTreffer[1], tiefe + 1) : wert;
}

// ---------------------------------------------------------------------------
// Farbumrechnung oklch → sRGB-Hex
// ---------------------------------------------------------------------------

/**
 * KERN definiert seine Farben in oklch. MUI rechnet intern mit Farben
 * (alpha/darken/lighten) und versteht oklch nicht, deshalb wird hier einmalig
 * nach sRGB-Hex umgerechnet. Werte außerhalb des sRGB-Farbraums werden
 * kanalweise beschnitten; das betrifft die hier genutzten Token nicht.
 */
function oklchZuHex(wert) {
  const treffer = /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(
    wert.trim(),
  );
  if (!treffer) return null;
  const L = parseFloat(treffer[1]) / (wert.includes('%') ? 100 : 1);
  const C = parseFloat(treffer[2]);
  const hGrad = parseFloat(treffer[3]);

  const h = (hGrad * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  const kanal = (c) => {
    const geklemmt = Math.min(1, Math.max(0, c));
    const gamma =
      geklemmt <= 0.0031308
        ? 12.92 * geklemmt
        : 1.055 * geklemmt ** (1 / 2.4) - 0.055;
    return Math.round(gamma * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${linear.map(kanal).join('')}`.toUpperCase();
}

/** Farb-Token → Hex; `white`/`black` sind in KERN eigene Token. */
function farbe(token, name) {
  const wert = aufloesen(token, name);
  if (wert === 'white' || wert === '#fff' || wert === '#ffffff')
    return '#FFFFFF';
  if (wert === 'black' || wert === '#000' || wert === '#000000')
    return '#000000';
  const hex = oklchZuHex(wert);
  if (!hex) throw new Error(`Farbe nicht umrechenbar: ${name} = ${wert}`);
  return hex;
}

/** Maß-Token → Pixelzahl. */
function px(token, name) {
  const wert = aufloesen(token, name);
  const treffer = /^([\d.]+)(px|rem)?$/.exec(wert);
  if (!treffer) throw new Error(`Maß nicht lesbar: ${name} = ${wert}`);
  const zahl = parseFloat(treffer[1]);
  return treffer[2] === 'rem' ? zahl * 16 : zahl;
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

const arbeit = mkdtempSync(join(tmpdir(), 'kern-vendor-'));
try {
  console.log(`Ziehe ${PAKET} …`);
  const tarball = execFileSync('npm', ['pack', PAKET, '--silent'], {
    cwd: arbeit,
    encoding: 'utf-8',
  }).trim();
  execFileSync('tar', ['xzf', tarball], { cwd: arbeit });
  const quelle = join(arbeit, 'package');

  const css = readFileSync(join(quelle, 'dist/kern.css'), 'utf-8');
  const token = leseToken(css);

  const farben = {
    aktion: farbe(token, '--kern-color-action-default'),
    aufAktion: farbe(token, '--kern-color-action-on-default'),
    fokus: farbe(token, '--kern-color-action-focus-default'),
    besucht: farbe(token, '--kern-color-action-visited'),
    hintergrund: farbe(token, '--kern-color-layout-background-default'),
    hintergrundGetoent: farbe(token, '--kern-color-layout-background-hued'),
    flaeche: farbe(token, '--kern-color-layout-background-level-1'),
    text: farbe(token, '--kern-color-layout-text-default'),
    textGedaempft: farbe(token, '--kern-color-layout-text-muted'),
    textInvers: farbe(token, '--kern-color-layout-text-inverse'),
    rahmen: farbe(token, '--kern-color-layout-border'),
    rahmenDekorativ: farbe(token, '--kern-color-decorative-border-default'),
    feldHintergrund: farbe(token, '--kern-color-form-input-background'),
    feldRahmen: farbe(token, '--kern-color-form-input-border'),
    gefahr: farbe(token, '--kern-color-feedback-danger'),
    gefahrHintergrund: farbe(token, '--kern-color-feedback-danger-background'),
    warnung: farbe(token, '--kern-color-feedback-warning'),
    warnungHintergrund: farbe(
      token,
      '--kern-color-feedback-warning-background',
    ),
    erfolg: farbe(token, '--kern-color-feedback-success'),
    erfolgHintergrund: farbe(token, '--kern-color-feedback-success-background'),
    info: farbe(token, '--kern-color-feedback-info'),
    infoHintergrund: farbe(token, '--kern-color-feedback-info-background'),
  };

  const abstaende = {
    xs: px(token, '--kern-metric-space-x-small'),
    s: px(token, '--kern-metric-space-small'),
    m: px(token, '--kern-metric-space-default'),
    l: px(token, '--kern-metric-space-large'),
    xl: px(token, '--kern-metric-space-x-large'),
  };

  const radien = {
    klein: px(token, '--kern-metric-border-radius-small'),
    standard: px(token, '--kern-metric-border-radius-default'),
    gross: px(token, '--kern-metric-border-radius-large'),
  };

  const rahmenbreiten = {
    leicht: px(token, '--kern-metric-border-width-light'),
    standard: px(token, '--kern-metric-border-width-default'),
  };

  const schrift = {
    familie: aufloesen(token, '--kern-typography-font-family-default'),
    gewichtRegulaer: Number(
      aufloesen(token, '--kern-typography-font-weight-regular'),
    ),
    gewichtMittel: Number(
      aufloesen(token, '--kern-typography-font-weight-medium'),
    ),
    gewichtHalbfett: Number(
      aufloesen(token, '--kern-typography-font-weight-semi-bold'),
    ),
    groesseKlein: px(token, '--kern-typography-font-size-small-static'),
    groesseMittel: px(token, '--kern-typography-font-size-medium-static'),
    groesseGross: px(token, '--kern-typography-font-size-large-static'),
    zeilenhoeheMittel: px(token, '--kern-typography-line-height-medium-static'),
    zeilenhoeheGross: px(token, '--kern-typography-line-height-large-static'),
  };

  // Primitive Schriftgrößen (--kern-font-size-N) als Skala mitnehmen: die
  // drei statischen Stufen reichen für eine Oberfläche mit drei Spalten
  // nicht aus, die Zwischenstufen sind aber ebenfalls KERN-Token.
  const groessen = Object.fromEntries(
    [...token.keys()]
      .map((name) => /^--kern-font-size-(\d+)$/.exec(name))
      .filter((t) => t !== null)
      .map((t) => [`g${t[1]}`, px(token, t[0])])
      .sort((a, b) => a[1] - b[1]),
  );

  const alsQuelltext = (objekt, einrueckung = '  ') =>
    Object.entries(objekt)
      .map(
        ([k, v]) =>
          `${einrueckung}${k}: ${typeof v === 'string' ? `'${v}'` : v},`,
      )
      .join('\n');

  const ziel = join(REPO, 'packages/editor/src/theme');
  mkdirSync(ziel, { recursive: true });
  writeFileSync(
    join(ziel, 'kernTokens.ts'),
    `/**
 * KERN-Design-Token — GENERIERT, nicht von Hand ändern.
 *
 * Quelle: @kern-ux/native@${VERSION} (EUPL-1.2), helles Theme.
 * Erzeugt von scripts/vendor-kern.mjs; dort steht auch, warum KERN
 * vendored und nicht als Laufzeit-Abhängigkeit geführt wird (ADR 0004).
 *
 * KERN definiert seine Farben in oklch. Die Werte sind hier einmalig nach
 * sRGB-Hex umgerechnet, weil MUI intern mit Farben rechnet (alpha, darken)
 * und oklch nicht versteht.
 */

export const KERN_FARBEN = {
${alsQuelltext(farben)}
} as const;

/** Abstands-Skala in Pixeln (KERN metric-space). */
export const KERN_ABSTAND = {
${alsQuelltext(abstaende)}
} as const;

/** Eckenradien in Pixeln (KERN metric-border-radius). */
export const KERN_RADIUS = {
${alsQuelltext(radien)}
} as const;

/** Rahmenbreiten in Pixeln (KERN metric-border-width). */
export const KERN_RAHMENBREITE = {
${alsQuelltext(rahmenbreiten)}
} as const;

/** Typografie (KERN typography, statische Stufen). */
export const KERN_SCHRIFT = {
${alsQuelltext(schrift)}
} as const;

/** Primitive Schriftgrößen in Pixeln (KERN font-size-Skala). */
export const KERN_SCHRIFTGROESSEN = {
${alsQuelltext(groessen)}
} as const;

/** Version des Pakets, aus dem diese Token stammen. */
export const KERN_VERSION = '${VERSION}';
`,
  );
  console.log('geschrieben: packages/editor/src/theme/kernTokens.ts');

  // Fonts + Lizenz + Herkunft
  const fontZiel = join(REPO, 'packages/app/src/assets/kern');
  mkdirSync(join(fontZiel, 'fira-sans'), { recursive: true });
  for (const { datei } of SCHNITTE) {
    copyFileSync(
      join(quelle, 'dist/fonts/fira-sans', datei),
      join(fontZiel, 'fira-sans', datei),
    );
  }
  writeFileSync(
    join(fontZiel, 'kern-fonts.css'),
    `/* Getrimmtes @font-face-CSS aus @kern-ux/native@${VERSION} (EUPL-1.2).
   Nur die drei Schnitte, die der Designer nutzt, nur woff2 — erzeugt von
   scripts/vendor-kern.mjs. */
${SCHNITTE.map(
  ({ datei, gewicht }) => `@font-face {
  font-family: 'Fira Sans';
  src: url('./fira-sans/${datei}') format('woff2');
  font-weight: ${gewicht};
  font-style: normal;
  font-display: swap;
}`,
).join('\n\n')}
`,
  );
  copyFileSync(join(quelle, 'LICENSE.md'), join(fontZiel, 'LICENSE.md'));
  writeFileSync(
    join(fontZiel, 'HERKUNFT.md'),
    `# Herkunft der KERN-Dateien

Quelle: [\`@kern-ux/native\`](https://www.npmjs.com/package/@kern-ux/native)
Version ${VERSION}, Lizenz EUPL-1.2 (siehe \`LICENSE.md\`).

KERN ist **keine Laufzeit-Abhängigkeit** des Projekts. Das Paket bringt
6,8 MB CSS, Fonts und eigene Web-Komponenten mit; der Designer braucht
davon die Design-Token und drei Schriftschnitte. Beides liegt deshalb
vendored im Repo — dasselbe Vorgehen wie bei der Tabler-Icon-Schrift
(CHANGELOG 0.3.0) und aus demselben Grund: Intranet-Fähigkeit, kein
Laufzeit-CDN, überschaubare Lieferkette.

Vendored sind:

| Datei | Inhalt |
|---|---|
| \`fira-sans/*.woff2\` | Fira Sans Regular/Medium/SemiBold, nur woff2 |
| \`kern-fonts.css\` | getrimmtes \`@font-face\`-CSS für genau diese Schnitte |
| \`../../../../editor/src/theme/kernTokens.ts\` | aufgelöste Token des hellen Themes |

Aktualisieren:

\`\`\`bash
node scripts/vendor-kern.mjs <version>
\`\`\`

Danach \`npm run lint\`, \`npm run format\` und die Screenshots neu erzeugen.
`,
  );
  console.log('geschrieben: packages/app/src/assets/kern/');
} finally {
  rmSync(arbeit, { recursive: true, force: true });
}
