import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const css = readFileSync('src/style.css', 'utf8');

// Sample the actual CSS curve rather than a separate animation configuration.
function progressAt(time, [x1, y1, x2, y2]) {
  const cubic = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (cubic(mid, x1, x2) < time) low = mid;
    else high = mid;
  }
  return cubic((low + high) / 2, y1, y2);
}

test('wheel and labels sustain visible motion before a gentle stop', () => {
  const match = css.match(/\.wheel,\.sector-text\{transition-timing-function:cubic-bezier\(([^)]+)\)/);
  expect(match).not.toBeNull();
  const curve = match[1].split(',').map(Number);
  // Avoid spending most of the twelve seconds almost stationary.
  expect(1 - progressAt(0.5, curve)).toBeGreaterThan(0.25);
  expect(1 - progressAt(0.75, curve)).toBeGreaterThan(0.07);
  expect(curve[3]).toBe(1); // Zero terminal velocity: no abrupt stop.
  let previous = 0;
  for (let i = 1; i <= 100; i++) {
    const progress = progressAt(i / 100, curve);
    expect(progress).toBeGreaterThanOrEqual(previous);
    expect(progress).toBeLessThanOrEqual(1);
    previous = progress;
  }
});
