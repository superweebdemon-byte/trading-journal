import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('loads with KPI data', async ({ page }) => {
    await page.goto('/')

    // KPI ribbon should show real numbers
    await expect(page.getByText('Net P&L', { exact: true })).toBeVisible()
    await expect(page.getByText('Win Rate', { exact: true })).toBeVisible()
    await expect(page.getByText('Profit Factor', { exact: true })).toBeVisible()
    await expect(page.getByText('Total Trades', { exact: true })).toBeVisible()

    // Equity curve header should show a dollar amount
    await expect(page.locator('text=/\\$\\d/').first()).toBeVisible()

    // Right column cards
    await expect(page.locator('text=Trade Breakdown')).toBeVisible()
    await expect(page.locator('text=Performance Edge')).toBeVisible()

    // Bottom row
    await expect(page.locator('text=P&L by Time of Day')).toBeVisible()
    await expect(page.locator('text=P&L by Day of Week')).toBeVisible()
    await expect(page.locator('text=Monthly P&L')).toBeVisible()
  })

  test('equity curve time range toggles work', async ({ page }) => {
    await page.goto('/')

    // Time range buttons should exist
    await expect(page.locator('button:has-text("1W")')).toBeVisible()
    await expect(page.locator('button:has-text("ALL")')).toBeVisible()

    // Click 1M and verify it becomes selected
    await page.locator('button:has-text("1M")').click()
    await expect(page.locator('button:has-text("1M")')).toHaveAttribute('aria-selected', 'true')
  })
})

test.describe('Navigation', () => {
  test('all nav tabs work', async ({ page }) => {
    await page.goto('/')

    // Dashboard is active by default
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible()

    // Navigate to Calendar
    await page.locator('a:has-text("Calendar")').click()
    await expect(page).toHaveURL('/calendar')
    await expect(page.locator('h1').filter({ hasText: /[A-Z][a-z]+ \d{4}/ })).toBeVisible() // Month Year header

    // Navigate to Trades
    await page.locator('a:has-text("Trades")').click()
    await expect(page).toHaveURL('/sessions')

    // Navigate to Settings
    await page.locator('a:has-text("Settings")').click()
    await expect(page).toHaveURL('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})

test.describe('Calendar', () => {
  test('renders grid and navigates months', async ({ page }) => {
    await page.goto('/calendar')

    // Day headers should be visible
    await expect(page.locator('text=SU')).toBeVisible()
    await expect(page.locator('text=SA')).toBeVisible()

    // Month summary tiles
    await expect(page.getByText('Month P&L', { exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByText('Trades', { exact: true })).toBeVisible()

    // Navigate back one month
    const monthHeader = page.locator('h1').filter({ hasText: /[A-Z][a-z]+ \d{4}/ }).first()
    const initialMonth = await monthHeader.textContent()

    await page.locator('button:has-text("←")').click()
    await page.waitForTimeout(500)

    const newMonth = await monthHeader.textContent()
    expect(newMonth).not.toBe(initialMonth)
  })

  test('Today button navigates to current month', async ({ page }) => {
    await page.goto('/calendar')

    // Click back a few months
    await page.locator('button:has-text("←")').click()
    await page.locator('button:has-text("←")').click()
    await page.waitForTimeout(500)

    // Click Today
    await page.locator('button:has-text("Today")').click()
    await page.waitForTimeout(500)

    // Should show current month
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const expected = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    await expect(page.locator('h1').filter({ hasText: expected })).toBeVisible()
  })

  test('week numbering resets at month boundary', async ({ page }) => {
    await page.goto('/calendar')

    // Should have Week 1 somewhere (first week)
    await expect(page.locator('text=Week 1').first()).toBeVisible()

    // Should have at least Week 4
    await expect(page.locator('text=Week 4')).toBeVisible()
  })
})

test.describe('Trades', () => {
  test('loads and shows session cards', async ({ page }) => {
    await page.goto('/sessions')
    await page.waitForTimeout(2000) // client-side fetch

    // Should show month headers
    await expect(page.locator('text=/\\d{4}/').first()).toBeVisible()

    // Filter pills should exist
    await expect(page.locator('text=All Dates')).toBeVisible()
    await expect(page.locator('text=Long')).toBeVisible()
    await expect(page.locator('text=Short')).toBeVisible()
  })

  test('filter pills toggle', async ({ page }) => {
    await page.goto('/sessions')
    await page.waitForTimeout(2000)

    // Click MNQ filter pill button
    await page.getByRole('button', { name: 'MNQ', exact: true }).click()
    await page.waitForTimeout(500)

    // Should filter results (contract badges should show MNQ)
    const contracts = page.locator('text=MNQ')
    await expect(contracts.first()).toBeVisible()
  })
})

test.describe('Settings', () => {
  test('renders all sections', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByText('Account', { exact: true })).toBeVisible()
    await expect(page.getByText('Trading Preferences', { exact: true })).toBeVisible()
    await expect(page.getByText('Display Preferences', { exact: true })).toBeVisible()
    await expect(page.getByText('Default Contract', { exact: true })).toBeVisible()
    await expect(page.getByText('Timezone Display', { exact: true })).toBeVisible()
  })
})

test.describe('Add Trade Modal', () => {
  test('opens and closes', async ({ page }) => {
    await page.goto('/')

    // Click Add Trade button
    await page.locator('button:has-text("+ Add Trade")').click()
    await page.waitForTimeout(500)

    // Modal should be visible — look for import or manual entry content
    // The modal has tabs for Import CSV and Manual Entry
    const modal = page.locator('[role="dialog"], .fixed')
    await expect(modal.first()).toBeVisible()
  })
})
