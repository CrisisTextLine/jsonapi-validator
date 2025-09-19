import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Endpoint Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should validate a valid JSON:API endpoint', async ({ page }) => {
    // Enter the mock server endpoint
    await page.fill('input[type="url"]#apiUrl', 'http://localhost:3001/api/articles');
    
    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');
    
    // Wait for validation to complete (should see the completed message)
    await expect(page.locator('.progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
    
    // Should show passed tests in the results
    await expect(page.getByText(/passed/i)).toBeVisible({ timeout: 2000 });
    
    // Should show validation results in the enhanced results panel
    await expect(page.locator('.results-panel')).toBeVisible();
  });

  test('should detect validation errors with invalid endpoint', async ({ page }) => {
    // Enter an invalid endpoint (missing jsonapi member)
    await page.fill('input[type="url"]#apiUrl', 'http://localhost:3001/api/invalid/no-jsonapi');
    
    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');
    
    // Wait for validation to complete
    await expect(page.locator('.progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
    
    // Should show some failed tests or warnings
    await expect(page.getByText(/failed|warning/i)).toBeVisible({ timeout: 2000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Enter a non-existent endpoint
    await page.fill('input[type="url"]#apiUrl', 'http://localhost:9999/nonexistent');
    
    // Click the Start Validation button
    await page.click('button:has-text("Start Validation")');
    
    // Should show an error message
    await expect(page.locator('.progress-indicator.error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Validation Error')).toBeVisible({ timeout: 2000 });
  });

  test('should require valid URL input', async ({ page }) => {
    // Enter invalid URL
    await page.fill('input[type="url"]#apiUrl', 'not-a-url');
    
    // Try to click Start Validation - button should be disabled or show error
    const startButton = page.locator('button:has-text("Start Validation")');
    
    // Button should be disabled with invalid URL
    await expect(startButton).toBeDisabled({ timeout: 2000 });
  });

  test('should show loading state during validation', async ({ page }) => {
    // Enter a valid endpoint
    await page.fill('input[type="url"]#apiUrl', 'http://localhost:3001/api/articles');
    
    // Start validation
    await page.click('button:has-text("Start Validation")');
    
    // Should show loading state
    await expect(page.locator('button:has-text("Validating...")')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('.progress-indicator')).toContainText('Running JSON:API validation tests', { timeout: 2000 });
    
    // Eventually should complete
    await expect(page.locator('.progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
  });
});