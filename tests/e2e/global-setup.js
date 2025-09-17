const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting E2E test setup...');
  
  // Launch browser to verify services are running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for mock server to be ready
    console.log('⏳ Waiting for mock server...');
    await page.waitForResponse('http://localhost:3001/health', { timeout: 30000 });
    console.log('✅ Mock server is ready');
    
    // Wait for dev server to be ready
    console.log('⏳ Waiting for dev server...');
    await page.goto('http://localhost:3000', { timeout: 30000 });
    console.log('✅ Dev server is ready');
    
    // Verify the app loads
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Application loaded successfully');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 E2E test setup complete!');
}

module.exports = globalSetup;