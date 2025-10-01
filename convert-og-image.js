// Simple SVG to PNG conversion for social sharing
const fs = require('fs');
const path = require('path');

// For now, just copy the SVG as is - browsers support SVG for social sharing
const svgPath = path.join(__dirname, 'public', 'og-image.svg');
const deploymentSvgPath = path.join(__dirname, 'deployment', 'public', 'og-image.svg');

if (fs.existsSync(svgPath)) {
  // Make sure deployment/public directory exists
  const deploymentPublicDir = path.join(__dirname, 'deployment', 'public');
  if (!fs.existsSync(deploymentPublicDir)) {
    fs.mkdirSync(deploymentPublicDir, { recursive: true });
  }
  
  // Copy SVG to deployment
  fs.copyFileSync(svgPath, deploymentSvgPath);
  console.log('✅ Social sharing image copied to deployment/public/og-image.svg');
  
  // Create a simple fallback meta tag file
  const metaContent = `
<!-- Add this to your HTML head for social sharing -->
<meta property="og:title" content="KP Elite Sports - Fantasy Football AI Analytics" />
<meta property="og:description" content="Real-time Sleeper integration, AI-powered lineup optimization, and multi-league portfolio analysis with retro Tecmo Bowl theme." />
<meta property="og:image" content="/og-image.svg" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="KP Elite Sports - Fantasy Football AI" />
<meta name="twitter:description" content="Advanced fantasy football analytics platform with real-time data and AI insights." />
<meta name="twitter:image" content="/og-image.svg" />
`;
  
  fs.writeFileSync(path.join(__dirname, 'deployment', 'social-meta-tags.html'), metaContent);
  console.log('✅ Social meta tags created in deployment/social-meta-tags.html');
} else {
  console.log('❌ SVG file not found');
}