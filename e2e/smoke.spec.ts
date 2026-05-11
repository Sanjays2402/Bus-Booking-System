import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke test for the BusGo booking flow.
 *
 * Boundary: this test depends on the seeded demo data (Seattle <-> Portland is
 * one of the seeded routes) and on the server being reachable at the API
 * proxy configured by Vite. It explicitly does NOT exercise admin actions
 * because those require a privileged seeded user.
 */

const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

test('home page renders the hero and search form', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/bus|booking|busgo/i);
  // Search form fields are visible
  await expect(page.getByPlaceholder(/from/i).first()).toBeVisible();
  await expect(page.getByPlaceholder(/to/i).first()).toBeVisible();
});

test('user can register a new account', async ({ page }) => {
  const email = `e2e+${uniq()}@example.com`;
  await page.goto('/auth');

  // Switch to register
  await page.getByRole('button', { name: /sign up|create/i }).first().click();

  await page.getByPlaceholder(/name/i).fill('E2E User');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill('s3cret-pw-123');

  await page
    .getByRole('button', { name: /create account|sign up/i })
    .first()
    .click();

  // After register the app routes home; navbar should show profile link.
  await expect(page).toHaveURL(/\/$|\/profile/);
});

test('help and pricing pages load', async ({ page }) => {
  await page.goto('/help');
  await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();

  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
});

test('unknown route renders the 404 page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
});
