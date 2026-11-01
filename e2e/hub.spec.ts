import { expect, test } from '@playwright/test'

test('landing page renders the hero and featured demos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /Browse the catalog|Explore demos/i }).first()).toBeVisible()
})

test('catalog search narrows results', async ({ page }) => {
  await page.goto('/demos')
  const search = page.getByRole('searchbox').or(page.getByLabel(/search/i)).first()
  await search.fill('digital euro')
  await expect(page.getByText('Digital Euro Single View Audit').first()).toBeVisible()
  await expect(page.getByText('Atlas Document Hub')).toHaveCount(0)
})

test('capability explorer lists only matching demos', async ({ page }) => {
  await page.goto('/capabilities/atlas-infinite')
  await expect(page.getByText(/Atlas Infinite: Scale Without Limits/i).first()).toBeVisible()
  await expect(page.getByText('Digital Euro Single View Audit')).toHaveCount(0)
})

test('detail page shows template instructions, never as verified', async ({ page }) => {
  await page.goto('/demos/atlas-document-hub')
  await expect(page.getByText(/Awaiting verified repository instructions|TEMPLATE/i).first()).toBeVisible()
  await expect(page.getByText(/^Verified from repository$/)).toHaveCount(0)
})

test('copy buttons copy code snippets', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-only')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/getting-started')
  const snippet = page.getByTestId('code-snippet').first()
  await snippet.getByRole('button', { name: /copy/i }).click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied.length).toBeGreaterThan(0)
})

test('Atlas Infinite diagram shows exactly two compute nodes', async ({ page }) => {
  await page.goto('/demos/atlas-infinite-scale-without-limits')
  await expect(page.getByTestId('atlas-infinite-compute-node')).toHaveCount(2)
  await expect(page.getByTestId('atlas-infinite-node-count')).toHaveText('2')
  await expect(page.getByTestId('atlas-core-node-count')).toHaveText('9')
})

test('migration simulation makes no infrastructure requests', async ({ page }) => {
  const mutating: string[] = []
  page.on('request', (r) => {
    if (r.method() !== 'GET' && !r.url().includes('/_next/')) mutating.push(`${r.method()} ${r.url()}`)
  })
  await page.goto('/demos/atlas-infinite-scale-without-limits')
  const start = page.getByRole('button', { name: /simulation/i }).first()
  await start.click()
  await expect(page.getByText(/simulation/i).first()).toBeVisible()
  expect(mutating).toEqual([])
})

test('admin routes deny unauthenticated visitors', async ({ page, request }) => {
  await page.goto('/admin')
  await expect(page.getByText(/sign in|not configured|access/i).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Save changes|Create demo/ })).toHaveCount(0)
  const res = await request.post('/api/demos', { data: { slug: 'x' }, headers: { origin: new URL(page.url()).origin } })
  expect([401, 403, 503]).toContain(res.status())
  const settings = await request.get('/api/settings')
  expect([401, 403, 503]).toContain(settings.status())
})

test('health endpoint reports configuration without secrets', async ({ request }) => {
  const res = await request.get('/api/health')
  const body = await res.text()
  expect(body).not.toMatch(/mongodb(\+srv)?:\/\/[^"]*@/)
  expect(body).not.toMatch(/BEGIN (RSA )?PRIVATE KEY/)
})
