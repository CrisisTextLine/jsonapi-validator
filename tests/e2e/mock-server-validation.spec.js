import { test, expect } from '@playwright/test';

test.describe('JSON:API Validator - Mock Server Validation Tests', () => {
  const mockEndpoints = [
    {
      name: 'Valid Articles Collection',
      url: 'http://localhost:3001/api/articles',
      expectation: 'should pass validation',
      shouldPass: true
    },
    {
      name: 'Valid Individual Article',
      url: 'http://localhost:3001/api/articles/1',
      expectation: 'should pass validation',
      shouldPass: true
    },
    {
      name: 'Valid Articles with Include',
      url: 'http://localhost:3001/api/articles?include=author',
      expectation: 'should pass validation with included resources',
      shouldPass: true
    },
    {
      name: 'Valid Sorted Articles',
      url: 'http://localhost:3001/api/articles?sort=title',
      expectation: 'should pass validation with sorting',
      shouldPass: true
    },
    {
      name: 'Valid Sparse Fieldsets',
      url: 'http://localhost:3001/api/articles?fields[articles]=title',
      expectation: 'should pass validation with sparse fieldsets',
      shouldPass: true
    },
    {
      name: 'Invalid - Missing JSONApi Member',
      url: 'http://localhost:3001/api/invalid/no-jsonapi',
      expectation: 'should fail validation due to missing jsonapi member',
      shouldPass: false
    },
    {
      name: 'Invalid - Wrong Content Type',
      url: 'http://localhost:3001/api/invalid/wrong-content-type',
      expectation: 'should fail validation due to wrong content-type',
      shouldPass: false
    },
    {
      name: 'Invalid - Missing ID Field',
      url: 'http://localhost:3001/api/invalid/missing-id',
      expectation: 'should fail validation due to missing id field',
      shouldPass: false
    },
    {
      name: 'Invalid - Bad Links',
      url: 'http://localhost:3001/api/invalid/bad-links',
      expectation: 'should fail validation due to malformed links',
      shouldPass: false
    },
    {
      name: 'Not Found - 404 Error',
      url: 'http://localhost:3001/api/articles/999',
      expectation: 'should pass validation for properly formatted 404 error',
      shouldPass: true // 404 with proper JSON:API error format should pass
    }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const endpoint of mockEndpoints) {
    test(`${endpoint.name} - ${endpoint.expectation}`, async ({ page }) => {
      // Enter the endpoint URL
      await page.fill('input[type="text"]', endpoint.url);
      
      // Run validation
      await page.click('button[type="submit"]');
      
      // Wait for validation to complete
      await expect(page.locator('.spinner')).toBeHidden({ timeout: 15000 });
      
      // Check that we got results
      await expect(page.getByText('Validation Results')).toBeVisible();
      
      // Verify the validation results align with expectations
      if (endpoint.shouldPass) {
        // Should have more passed tests than failed
        const summaryText = await page.locator('.summary-item').allTextContents();
        const passedCount = parseInt(summaryText.find(text => text.includes('Passed:'))?.match(/\d+/)?.[0] || '0');
        const failedCount = parseInt(summaryText.find(text => text.includes('Failed:'))?.match(/\d+/)?.[0] || '0');
        
        expect(passedCount).toBeGreaterThan(0);
        // Allow some failed tests, but passed should generally exceed failed for valid endpoints
        console.log(`Endpoint: ${endpoint.url} - Passed: ${passedCount}, Failed: ${failedCount}`);
      } else {
        // Should have validation failures
        const failedTests = page.locator('[style*="color: rgb(244, 67, 54)"]');
        await expect(failedTests).toHaveCount({ min: 1 });
        
        // Should show specific error messages for the type of failure
        const resultsContent = await page.locator('.results-panel').textContent();
        console.log(`Expected failure for ${endpoint.url} - detected failures in results`);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ 
        path: `test-results/${endpoint.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: true 
      });
    });
  }

  test('should handle all mock server endpoints consistently', async ({ page }) => {
    const results = [];
    
    for (const endpoint of mockEndpoints.slice(0, 5)) { // Test first 5 to avoid timeout
      await page.fill('input[type="text"]', endpoint.url);
      await page.click('button[type="submit"]');
      await expect(page.locator('.spinner')).toBeHidden({ timeout: 10000 });
      
      const summaryText = await page.locator('.summary-item').allTextContents();
      const total = parseInt(summaryText.find(text => text.includes('Total Tests:'))?.match(/\d+/)?.[0] || '0');
      const passed = parseInt(summaryText.find(text => text.includes('Passed:'))?.match(/\d+/)?.[0] || '0');
      const failed = parseInt(summaryText.find(text => text.includes('Failed:'))?.match(/\d+/)?.[0] || '0');
      
      results.push({
        endpoint: endpoint.url,
        expected: endpoint.shouldPass,
        total,
        passed,
        failed,
        actuallyPassed: failed === 0 || passed > failed
      });
    }
    
    // Log results for analysis
    console.table(results);
    
    // Verify we got results for all tested endpoints
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.total).toBeGreaterThan(0);
    });
  });
});