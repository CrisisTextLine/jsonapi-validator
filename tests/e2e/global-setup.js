import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Starting E2E test setup...');
  
  // Launch browser to verify services are running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for mock server to be ready by making actual requests
    console.log('⏳ Waiting for mock server...');
    let mockServerReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!mockServerReady && attempts < maxAttempts) {
      try {
        const response = await page.goto('http://localhost:3001/health', { 
          timeout: 2000,
          waitUntil: 'networkidle' 
        });
        if (response && response.ok()) {
          mockServerReady = true;
          console.log('✅ Mock server is ready');
        }
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Mock server attempt ${attempts}/${maxAttempts}...`);
      }
    }
    
    if (!mockServerReady) {
      throw new Error('Mock server failed to start after 30 seconds');
    }
    
    // Wait for dev server to be ready
    console.log('⏳ Waiting for dev server...');
    let devServerReady = false;
    attempts = 0;
    
    while (!devServerReady && attempts < maxAttempts) {
      try {
        await page.goto('http://localhost:3000', { 
          timeout: 5000,
          waitUntil: 'networkidle' 
        });
        await page.waitForSelector('h1', { timeout: 5000 });
        devServerReady = true;
        console.log('✅ Dev server is ready');
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Dev server attempt ${attempts}/${maxAttempts}...`);
      }
    }
    
    if (!devServerReady) {
      throw new Error('Dev server failed to start after 30 seconds');
    }
    
    console.log('✅ Application loaded successfully');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('🎉 E2E test setup complete!');
}

export default globalSetup;