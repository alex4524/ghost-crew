// @ts-check

/**
 * Turn a target a person would say ("Book now", "Guest name") into a locator.
 * Order: exact role names, labels, placeholders, then visible text.
 * `css:<selector>` skips the guessing.
 * @param {import('playwright-core').Page} page
 * @param {string} target
 * @returns {Promise<import('playwright-core').Locator | null>}
 */
export async function locate(page, target) {
  if (target.startsWith('css:')) {
    const l = page.locator(target.slice(4)).first();
    return (await l.count()) ? l : null;
  }
  const tries = [
    () => page.getByRole('button', { name: target, exact: true }),
    () => page.getByRole('link', { name: target, exact: true }),
    () => page.getByLabel(target, { exact: true }),
    () => page.getByPlaceholder(target, { exact: true }),
    () => page.getByRole('textbox', { name: target }),
    () => page.getByRole('button', { name: target }),
    () => page.getByRole('link', { name: target }),
    () => page.getByLabel(target),
    () => page.getByText(target, { exact: true }),
    () => page.getByText(target),
  ];
  for (const t of tries) {
    const l = t().first();
    if (await l.count().catch(() => 0)) return l;
  }
  return null;
}
