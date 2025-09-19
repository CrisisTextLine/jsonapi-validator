import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Mock Server Validation Tests', () => {
  const testEndpoints = [
    {
      name: 'Valid Articles Collection',
      url: 'http://localhost:3001/api/articles',
      shouldPass: true
    },
    {
      name: 'Valid Individual Article',
      url: 'http://localhost:3001/api/articles/1',
      shouldPass: true
    },
    {
      name: 'Invalid - Missing JSONAPI Member',
      url: 'http://localhost:3001/api/invalid/no-jsonapi',
      shouldPass: false
    },
    {
      name: 'Invalid - Wrong Content Type',
      url: 'http://localhost:3001/api/invalid/wrong-content-type',
      shouldPass: false
    }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const endpoint of testEndpoints) {
    test(`should validate ${endpoint.name}`, async ({ page }) => {
      // Enter the endpoint URL
      await page.fill('input#apiUrl', endpoint.url);
      
      // Start validation
      await page.click('button:has-text("Start Validation")');
      
      // Wait for validation to complete
      await expect(page.locator('.progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
      
      // Check that we got some form of results
      const progressText = await page.locator('.progress-indicator').textContent();
      
      if (endpoint.shouldPass) {
        // Valid endpoints should have some passed tests
        expect(progressText).toMatch(/\d+ passed/);
      } else {
        // Invalid endpoints should show failed tests or warnings
        expect(progressText).toMatch(/\d+ failed|\d+ warnings/);
      }
      
      // Ensure results panel shows content
      await expect(page.locator('.card')).toBeVisible();
      
      // Should not show the empty state message
      await expect(page.getByText('Configure your API endpoint and click "Start Validation" to begin testing.')).not.toBeVisible();
    });
  }

  test('should test mock server health endpoint', async ({ page }) => {
    // This is a basic connectivity test
    await page.fill('input#apiUrl', 'http://localhost:3001/health');
    
    // Start validation
    await page.click('button:has-text("Start Validation")');
    
    // Should complete (though might fail validation since it's not a JSON:API endpoint)
    await expect(page.locator('.progress-indicator')).toContainText('Validation completed', { timeout: 5000 });
    
    // Should show some kind of results
    await expect(page.locator('.card')).toBeVisible();
  });
});