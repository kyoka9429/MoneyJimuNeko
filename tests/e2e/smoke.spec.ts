import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared setup helpers
// ---------------------------------------------------------------------------

/**
 * Register an account via the settings form UI.
 * Navigates to /settings/accounts/new, fills the form, and submits.
 * On success the router pushes to /settings/accounts — we wait for that.
 */
async function createAccount(
  page: Page,
  opts: { name: string; type?: 'bank' | 'cash' | 'other' },
): Promise<void> {
  await page.goto('/settings/accounts/new');
  await page.getByLabel('口座名').fill(opts.name);
  if (opts.type && opts.type !== 'bank') {
    await page.getByLabel('種別').selectOption(opts.type);
  }
  await page.getByRole('button', { name: '口座を追加' }).click();
  // Wait until the router redirect to the list page completes (trailingSlash: true 対応)
  await page.waitForURL(/\/settings\/accounts\/?$/);
}

/**
 * Register an income item via the settings form UI.
 */
async function createIncome(
  page: Page,
  opts: { name: string; amount: string; payDay: string; source: string },
): Promise<void> {
  await page.goto('/settings/incomes/new');
  await page.getByLabel('名称').fill(opts.name);
  await page.getByLabel('金額（円）').fill(opts.amount);
  await page.getByLabel('入金日').fill(opts.payDay);
  await page.getByLabel('収入源').fill(opts.source);
  await page.getByRole('button', { name: '収入項目を追加' }).click();
  await page.waitForURL(/\/settings\/incomes\/?$/);
}

/**
 * Register an expense item via the settings form UI.
 * The account must already exist; the select will default to the first option.
 */
async function createExpense(
  page: Page,
  opts: {
    name: string;
    amount: string;
    category?: string;
    frequency?: string;
  },
): Promise<void> {
  await page.goto('/settings/expenses/new');
  // Wait for the form to load (it fetches account list from IndexedDB)
  await page.getByLabel('名称').waitFor({ state: 'visible' });
  await page.getByLabel('名称').fill(opts.name);
  await page.getByLabel('金額（円）').fill(opts.amount);
  if (opts.category) {
    await page.getByLabel('カテゴリ').selectOption(opts.category);
  }
  if (opts.frequency) {
    await page.getByLabel('周期').selectOption(opts.frequency);
  }
  await page.getByRole('button', { name: '支出項目を追加' }).click();
  await page.waitForURL(/\/settings\/expenses\/?$/);
}

/**
 * Full golden-path setup: account → income → expense.
 * Returns once the user is at the dashboard (/).
 */
async function setupGoldenPath(page: Page): Promise<void> {
  await createAccount(page, { name: 'みずほ', type: 'bank' });
  await createIncome(page, {
    name: '月給',
    amount: '280000',
    payDay: '25',
    source: '給与',
  });
  await createExpense(page, {
    name: '電気代',
    amount: '8000',
    category: 'utilities',
    frequency: 'monthly',
  });
  await page.goto('/');
  // Wait for the dashboard to finish loading IndexedDB data
  await page.waitForSelector('[aria-label="今月のあと余り"]', { timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Spec 1: 初回起動時の空状態
// ---------------------------------------------------------------------------

test('Spec 1: 初回起動時に空状態メッセージと設定画面へのリンクが表示される', async ({ page }) => {
  await page.goto('/');

  // Empty state message (from DashboardClient EmptyView)
  // IndexedDB read is async so we wait for the element to appear
  await expect(
    page.getByText('まだ口座が登録されていません'),
  ).toBeVisible({ timeout: 10000 });

  // Sub-message
  await expect(
    page.getByText('設定画面から口座と支出項目を登録してください'),
  ).toBeVisible();

  // Link to settings
  const settingsLink = page.getByRole('link', { name: '設定画面へ' });
  await expect(settingsLink).toBeVisible();
  await settingsLink.click();
  await expect(page).toHaveURL(/\/settings\/?$/);
});

// ---------------------------------------------------------------------------
// Spec 2: 口座→収入→支出を登録するとダッシュボードに余りと口座カードが出る
// ---------------------------------------------------------------------------

test('Spec 2: 口座・収入・支出を登録するとダッシュボードに余りと口座カードが表示される', async ({
  page,
}) => {
  await setupGoldenPath(page);

  // Hero section visible
  const hero = page.locator('[aria-label="今月のあと余り"]');
  await expect(hero).toBeVisible();

  // Remaining amount: 280000 - 8000 = 272000 → ¥272,000
  await expect(hero).toContainText('¥272,000');

  // Account card for みずほ
  const card = page.getByRole('link', { name: /みずほ の振り分け詳細/ });
  await expect(card).toBeVisible();

  // Account card shows 必要額 / 確保済 / 不足 labels
  await expect(card.getByText('必要額')).toBeVisible();
  await expect(card.getByText('確保済')).toBeVisible();

  // Planned amount ¥8,000 should appear in the card detail row
  await expect(card).toContainText('¥8,000');
});

// ---------------------------------------------------------------------------
// Spec 3: チェックリストでタスクを完了するとカードが OK 状態になる
// ---------------------------------------------------------------------------

test('Spec 3: チェックリストで電気代を完了するとカードが OK バッジになる', async ({
  page,
}) => {
  await setupGoldenPath(page);

  // Navigate to the checklist page by clicking the account card
  // 動的ルート → クエリ文字列に変更: /accounts/[id] → /account?id=...
  const card = page.getByRole('link', { name: /みずほ の振り分け詳細/ });
  await card.click();
  await page.waitForURL(/\/account\/?\?id=.+/);

  // Wait for the checklist to finish loading
  // ChecklistRow uses role="checkbox" with text content
  const taskRow = page.locator('[role="checkbox"]').first();
  await taskRow.waitFor({ state: 'visible', timeout: 10000 });

  // The row shows 電気代 text
  await expect(page.getByText('電気代')).toBeVisible();

  // Click the checkbox row to mark done
  await taskRow.click();

  // ニャ！ toast should appear
  await page.getByText('ニャ！').waitFor({ state: 'visible', timeout: 5000 });

  // Navigate back to the dashboard
  await page.goto('/');
  await page.waitForSelector('[aria-label="今月のあと余り"]', { timeout: 10000 });

  // みずほ card should now show OK badge
  const updatedCard = page.getByRole('link', { name: /みずほ の振り分け詳細/ });
  await expect(updatedCard).toBeVisible();
  await expect(updatedCard.getByText('OK')).toBeVisible();
});

// ---------------------------------------------------------------------------
// Spec 4: BottomNav の各タブが期待のルートへ遷移する
// ---------------------------------------------------------------------------

test('Spec 4: BottomNav のタブ操作でホーム・振り分け・設定に遷移できる', async ({
  page,
}) => {
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: 'メインナビゲーション' });
  await expect(nav).toBeVisible();

  // BottomNav に 3 ボタンが表示されている
  await expect(nav.getByRole('link', { name: 'ホーム' })).toBeVisible();
  await expect(nav.getByRole('link', { name: '振り分け' })).toBeVisible();
  await expect(nav.getByRole('link', { name: '設定' })).toBeVisible();

  // 振り分けタップ → /allocate
  await nav.getByRole('link', { name: '振り分け' }).click();
  await expect(page).toHaveURL(/\/allocate\/?$/);
  // PageHeader title
  await expect(page.getByRole('heading', { name: '振り分け' })).toBeVisible();

  // 設定タップ → /settings
  await nav.getByRole('link', { name: '設定' }).click();
  await expect(page).toHaveURL(/\/settings\/?$/);
  await expect(page.getByRole('heading', { name: '設定', level: 1 })).toBeVisible();

  // ホームタップ → /
  await nav.getByRole('link', { name: 'ホーム' }).click();
  await expect(page).toHaveURL(/\/$/);
});
