import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main interface', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toHaveText('JSON:API Validator');
    
    // Check description
    await expect(page.getByText('Validate JSON:API v1.1 specification compliance')).toBeVisible();
    
    // Check main sections
    await expect(page.getByText('Configuration')).toBeVisible();
    await expect(page.getByText('Results')).toBeVisible();
  });

  test('should have configuration form elements', async ({ page }) => {
    // Check API URL input (specific type="url" to avoid ambiguity with header inputs)
    await expect(page.locator('input[type="url"]#apiUrl')).toBeVisible();
    
    // Check HTTP method selector
    await expect(page.locator('select#httpMethod')).toBeVisible();
    
    // Check authentication type selector
    await expect(page.locator('select#authType')).toBeVisible();
    
    // Check start validation button (TestRunner component)
    await expect(page.getByRole('button', { name: /start validation/i })).toBeVisible();
  });

  test('should show validation results area with empty state', async ({ page }) => {
    // Check that results panel exists
    await expect(page.locator('.results-panel')).toBeVisible();
    
    // Should show empty state initially
    await expect(page.getByText('Configure your API endpoint and click "Start Validation" to begin testing.')).toBeVisible();
    await expect(page.getByText('The validator will run comprehensive tests against the JSON:API v1.1 specification.')).toBeVisible();
  });

  test('should show loading state when validation is running', async ({ page }) => {
    // Fill in a URL that will take some time to validate
    await page.fill('input[type="url"]#apiUrl', 'http://localhost:3001/api/articles');
    
    // Start validation
    await page.click('button:has-text("Start Validation")');
    
    // Should show spinner and loading text briefly
    await expect(page.locator('.spinner')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Executing validation tests...')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Running comprehensive JSON:API validation suite...')).toBeVisible({ timeout: 2000 });
  });
});