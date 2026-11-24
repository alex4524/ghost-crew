#!/usr/bin/env node
// Checks the design tokens against WCAG 2.1 AA (4.5:1 for body text). Exit 1 on failure.
const tokens = { ink: '#24202E', tarnish: '#55515D', verdigris: '#0A5E56', wax: '#8C1C2C', amber: '#7F470C' };
const grounds = { plate: '#D8D9D4', paper: '#EFEFEA' };

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failed = 0;
for (const [name, fg] of Object.entries(tokens)) {
  const cells = Object.entries(grounds).map(([g, bg]) => {
    const r = ratio(fg, bg);
    if (r < 4.5) failed += 1;
    return `${g} ${r.toFixed(2)}${r < 4.5 ? ' FAIL' : ''}`;
  });
  console.log(`${name.padEnd(10)} ${fg}  ${cells.join('  ')}`);
}
process.exitCode = failed ? 1 : 0;
