import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Endpoint Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should validate a valid JSON:API endpoint', async ({ page }) => {
    // Enter the mock server endpoint
    await page.fill('input[type="text"]', 'http://localhost:3001/api/articles');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Check for successful validation results
    await expect(page.getByText('Validation Results')).toBeVisible();
    
    // Should show passed tests
    await expect(page.locator('[style*="color: rgb(76, 175, 80)"]')).toBeVisible();
    
    // Should show summary statistics
    await expect(page.getByText(/Total Tests:/)).toBeVisible();
    await expect(page.getByText(/Passed:/)).toBeVisible();
  });

  test('should detect validation errors with invalid endpoint', async ({ page }) => {
    // Enter an invalid endpoint (missing jsonapi member)
    await page.fill('input[type="text"]', 'http://localhost:3001/api/invalid/no-jsonapi');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should show failed tests
    await expect(page.locator('[style*="color: rgb(244, 67, 54)"]')).toBeVisible();
    
    // Should detect missing jsonapi member
    await expect(page.getByText(/jsonapi/i)).toBeVisible();
  });

  test('should validate individual resource endpoint', async ({ page }) => {
    // Enter individual resource endpoint
    await page.fill('input[type="text"]', 'http://localhost:3001/api/articles/1');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should show validation results
    await expect(page.getByText('Validation Results')).toBeVisible();
    
    // Should validate individual resource structure
    await expect(page.getByText(/resource/i)).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Enter a non-existent endpoint
    await page.fill('input[type="text"]', 'http://localhost:9999/api/nonexistent');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible();
    await expect(page.getByText(/failed/i)).toBeVisible();
  });

  test('should validate pagination endpoint', async ({ page }) => {
    // Enter paginated endpoint
    await page.fill('input[type="text"]', 'http://localhost:3001/api/articles?page[number]=1&page[size]=5');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should validate pagination structure
    await expect(page.getByText(/pagination/i)).toBeVisible();
  });

  test('should validate sparse fieldsets', async ({ page }) => {
    // Enter endpoint with sparse fieldsets
    await page.fill('input[type="text"]', 'http://localhost:3001/api/articles?fields[articles]=title,body');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should validate fieldsets
    await expect(page.getByText(/field/i)).toBeVisible();
  });

  test('should validate included resources', async ({ page }) => {
    // Enter endpoint with included resources
    await page.fill('input[type="text"]', 'http://localhost:3001/api/articles?include=author');
    
    // Run validation
    await page.click('button[type="submit"]');
    
    // Wait for validation to complete
    await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
    
    // Should validate included resources
    await expect(page.getByText(/include/i)).toBeVisible();
  });
});