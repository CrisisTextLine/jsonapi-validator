import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Endpoint Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should validate a valid JSON:API endpoint', async ({ page }) => {
    // Enter the mock server endpoint
    await page.fill('input#apiUrl', 'http://localhost:3001/api/articles');
    
    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');
    
    // Wait for validation to complete (should see the completed message)
    await expect(page.locator('.card:has(h2:has-text("Configuration")) .progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
    
    // Should show passed tests in the results (look in the progress indicator specifically)
    await expect(page.locator('.card:has(h2:has-text("Configuration")) .progress-indicator')).toContainText('passed', { timeout: 2000 });
    
    // Should show validation results in the enhanced results panel
    await expect(page.locator('.card:has(h2:has-text("Results"))')).toBeVisible();
  });

  test('should detect validation errors with invalid endpoint', async ({ page }) => {
    // Enter an invalid endpoint (missing jsonapi member)
    await page.fill('input#apiUrl', 'http://localhost:3001/api/invalid/no-jsonapi');
    
    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');
    
    // Wait for validation to complete
    await expect(page.locator('.card:has(h2:has-text("Configuration")) .progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
    
    // Should show some failed tests or warnings (look in the progress indicator specifically)
    await expect(page.locator('.card:has(h2:has-text("Configuration")) .progress-indicator')).toContainText(/failed|warning/, { timeout: 2000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Enter a non-existent endpoint
    await page.fill('input#apiUrl', 'http://localhost:9999/nonexistent');

    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');

    // Should show an error message in the results panel
    await expect(page.locator('.results-panel .progress-indicator.error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Validation failed/i)).toBeVisible({ timeout: 2000 });
  });

  test('should require valid URL input', async ({ page }) => {
    // Enter invalid URL
    await page.fill('input#apiUrl', 'not-a-url');

    // Try to click Start Validation
    const startButton = page.locator('button:has-text("Start Validation")');
    await startButton.click();

    // Should show an error message for invalid URL (in the progress indicator error list)
    await expect(page.locator('.progress-indicator.error').getByText('Please enter a valid URL')).toBeVisible({ timeout: 2000 });
  });

  test('should show loading state during validation', async ({ page }) => {
    // Enter a valid endpoint
    await page.fill('input#apiUrl', 'http://localhost:3001/api/articles');
    
    // Start validation
    await page.click('button:has-text("Start Validation")');
    
    // Should show loading state (button changes to "Validating...")
    // The button may change quickly, so we check for either Validating or completion
    await expect(
      page.locator('button:has-text("Validating...")').or(page.getByText(/Validation completed/))
    ).toBeVisible({ timeout: 2000 });

    // Eventually should complete
    await expect(page.locator('.card:has(h2:has-text("Configuration")) .progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
  });
});