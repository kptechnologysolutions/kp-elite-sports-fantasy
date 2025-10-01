// Test script to clear local storage and test import
const puppeteer = require('puppeteer');

async function testImport() {
  console.log('Starting browser test...');
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const page = await browser.newPage();
  
  // Clear localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
  });
  
  // Navigate to app
  console.log('Navigating to app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click on Import Teams
  console.log('Going to import page...');
  await page.goto('http://localhost:3000/teams', { waitUntil: 'networkidle0' });
  
  // Wait a bit to see the result
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Test complete! Check the browser to import teams.');
  // Keep browser open for manual testing
}

testImport().catch(console.error);