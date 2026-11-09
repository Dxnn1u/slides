import { test, expect, type Page } from '@playwright/test';
import { slides } from '../../decks/backend-workshop/src/deck';

const viewer = '/backend-workshop';
const stage = '.stage[data-present="true"]';
const key = 'slides:backend-workshop:progress';
async function jump(page: Page, id: number) {
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await page.keyboard.press('o'); await page.locator(`[data-target="${id}"]`).click();
  await expect(page.locator(stage)).toHaveAttribute('data-slide', String(id));
}

test('the collection shows nine real static previews without starting playback or leaking themes', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#collection');
  const card = page.locator('[data-gallery-deck="backend-workshop"]');
  await expect(card.locator('.slide-preview')).toHaveCount(9);
  await page.evaluate(() => document.fonts.ready);
  expect(await card.locator('.stage').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-slide'))))).toEqual([11,16,18,1,49,23001,30001,39,41]);
  await expect(card.getByRole('heading', { name: 'Backend Workshop' })).toBeVisible();
  await expect(card.locator('.deck-meta')).toHaveText(`${slides.length} 頁`);
  await expect(card.locator('.mosaic-grid')).toHaveCSS('transition-duration', '0s');
  expect(await card.locator('.mosaic-grid').evaluate(element => {
    const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.atan2(transform.b, transform.a) * 180 / Math.PI;
  })).toBeCloseTo(12, 1);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  expect(await card.locator('.mosaic-grid').evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(245, 245, 247)');
  await page.locator('[data-gallery-deck="example"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-gallery-deck="example"] .example-slide').first()).toHaveCSS('background-color', 'rgb(40, 32, 70)');
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(card.getByRole('link', { name: '播放投影片', exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`gallery-${viewport.width}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('two-column gallery reveals later rows with scroll and keeps them visible', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#collection');
  await expect.poll(() => page.locator('#collection').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
  const cards = page.locator('.deck-card');
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(first!.y).toBe(second!.y);
  expect(second!.x).toBeGreaterThan(first!.x + first!.width);
  expect(first!.y + first!.height).toBeLessThanOrEqual(900);
  expect(second!.y + second!.height).toBeLessThanOrEqual(900);
  await expect(cards.nth(0).locator('.deck-surface')).toHaveCSS('opacity', '1');
  await expect(cards.nth(1).locator('.deck-surface')).toHaveCSS('opacity', '1');
  // Start above the collection so the second row has not begun revealing.
  await page.goto('/');
  const card = page.locator('[data-gallery-deck="example"]');
  const surface = card.locator('.deck-surface');
  const top = await card.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await expect(surface).toHaveCSS('opacity', '0');
  for (const progress of [.25, .5, 1]) {
    await page.evaluate(position => window.scrollTo(0, position), Math.ceil(top - 900 * (.95 - progress * .3)));
    await expect.poll(() => surface.evaluate(element => Number(getComputedStyle(element).opacity))).toBeCloseTo(progress, 2);
  }
  await expect(card.locator('.slide-preview')).toHaveCount(2);
  expect(await card.locator('.mosaic-grid').evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  })).toBeCloseTo(12, 1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(surface).toHaveCSS('opacity', '1');
  await page.screenshot({ path: info.outputPath('portfolio-desktop.png'), fullPage: true });
  await page.reload();
  await expect(surface).toHaveCSS('opacity', '0');
  await card.getByRole('link', { name: '播放投影片', exact: true }).focus();
  await expect(surface).toHaveCSS('opacity', '1');
  await expect(card.getByRole('link', { name: '播放投影片', exact: true })).toHaveCSS('outline-style', 'solid');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.deck-surface').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1' && getComputedStyle(element).transform === 'none'))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 1440, height: 650 }]) {
    await page.setViewportSize(viewport);
    const columns = await page.locator('.deck-collection').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.width < 900 ? 1 : 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`portfolio-${viewport.width}.png`), fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => window.scrollTo(0, 0));
  const mobileTop = await card.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(position => window.scrollTo(0, position), mobileTop - 844 * .8);
  await expect.poll(() => surface.evaluate(element => Number(getComputedStyle(element).opacity))).toBeCloseTo(.5, 2);
});

test('gallery reserves its artwork while previews load and keeps playback available on failure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const fail of [false, true]) {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/assets/definition-*.js', async route => { await gate; await (fail ? route.abort() : route.continue()); });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const card = page.locator('[data-gallery-deck="backend-workshop"]');
    const artwork = card.locator('.deck-artwork');
    let before;
    try {
      await expect(card.getByRole('status')).toHaveText('載入投影片預覽…');
      await expect(card.getByRole('link', { name: '播放投影片', exact: true })).toBeVisible();
      before = await artwork.boundingBox();
    } finally { release(); }
    if (fail) await expect(card.getByRole('status')).toHaveText('預覽暫時無法載入');
    else await expect(card.locator('.slide-preview')).toHaveCount(9);
    expect(await artwork.boundingBox()).toEqual(before);
    await page.unroute('**/assets/definition-*.js');
  }
});

test('gallery entries start fresh, reload resumes, tabs remain independent, and the one-shot query is consumed', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('[data-gallery-deck="backend-workshop"]').getByRole('link', { name: '播放投影片', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${viewer}$`));
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '49');
  await jump(page, 26); await page.keyboard.press('ArrowRight');
  await page.reload();
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '26');
  await expect(page.locator(stage)).toHaveAttribute('data-step', '1');
  const peer = await context.newPage(); await peer.goto(viewer);
  await expect(peer.locator(stage)).toHaveAttribute('data-slide', '49');
  await peer.keyboard.press('PageDown');
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '26');
  await page.evaluate(() => sessionStorage.setItem('slides:backend-workshop:rest', JSON.stringify({ elapsed: 120000, started: null, autoStarted: true })));
  await page.getByRole('link', { name: '返回首頁', exact: true }).click();
  await page.locator('[data-gallery-deck="backend-workshop"]').getByRole('link', { name: '播放投影片', exact: true }).click();
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '49');
  await expect(page.locator(stage)).toHaveAttribute('data-step', '0');
  expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!).slideId, key)).toBe(49);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('slides:backend-workshop:rest')!))).toEqual({ elapsed: 0, started: null, autoStarted: false });
  await expect(page.getByRole('link', { name: /講者|提詞/ })).toHaveCount(0);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog')).not.toContainText('授課計時');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a separate deck has its own ratio, colors, navigation and transition', async ({ page }) => {
  await page.goto(viewer); await jump(page, 26); await page.keyboard.press('ArrowRight');
  await page.goto('/example?start=1');
  await expect(page.locator('.example-slide')).toHaveCSS('background-color', 'rgb(40, 32, 70)');
  const rect = await page.locator('.example-slide').boundingBox();
  expect(rect!.width / rect!.height).toBeCloseTo(4/3, 3);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.example-slide')).toHaveAttribute('data-step', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.keyboard.press('PageDown');
  await expect(page.locator('.page-transition')).toHaveAttribute('data-transition', 'example-slide');
  await expect(page.locator('.page-transition')).toHaveAttribute('data-transition', 'none');
  await expect(page.locator('.example-slide')).toHaveAttribute('data-example-slide', 'closing');
  await page.goto(viewer);
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '26');
  await expect(page.locator(stage)).toHaveAttribute('data-step', '1');
});

test('a delayed deck download keeps the fresh-start signal until initialization completes', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/definition-*.js', async route => { await gate; await route.continue(); });
  try {
    await page.goto(viewer + '?start=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status')).toHaveText('載入 Backend Workshop…');
    await expect(page).toHaveURL(/\?start=1$/);
  } finally { release(); }
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '49');
  await expect(page).toHaveURL(new RegExp(`${viewer}$`));
});

test('old presenter and unknown routes have usable destinations', async ({ page }) => {
  await page.goto('/presenter'); await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Dxnn1u', level: 1 })).toBeVisible();
  for (const path of ['/missing', '/missing/nested']) {
    await page.goto(path); await expect(page.getByRole('heading', { name: '找不到頁面' })).toBeVisible();
    await page.getByRole('link', { name: '返回首頁 →' }).click();
    await expect(page.getByRole('heading', { name: 'Dxnn1u', level: 1 })).toBeVisible();
  }
});

test('storage restrictions and damaged progress do not prevent playback', async ({ page, context }) => {
  await context.addInitScript(() => {
    sessionStorage.setItem('slides:backend-workshop:progress', '{bad-json');
    sessionStorage.setItem('slides:backend-workshop:rest', '{}');
  });
  await page.goto(viewer);
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '49');
  await page.keyboard.press('PageDown');
  await expect(page.locator(stage)).toHaveAttribute('data-slide', '1');
  const locked = await context.newPage();
  await locked.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('blocked'); } }));
  await locked.goto(viewer); await expect(locked.locator(stage)).toHaveAttribute('data-slide', '49');
  await locked.keyboard.press('PageDown'); await expect(locked.locator(stage)).toHaveAttribute('data-slide', '1');
});
