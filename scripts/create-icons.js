const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create PNG versions of the logo for better social media compatibility
// This script uses ImageMagick convert command (install with: brew install imagemagick)

const publicDir = path.join(__dirname, '..', 'public');
const svgFile = path.join(publicDir, 'og-image.svg');

console.log('Creating PNG icons from SVG...');

try {
  // Check if ImageMagick is available
  execSync('which convert', { stdio: 'ignore' });
  
  // Create og-image.png (1200x630 for social sharing)
  console.log('Creating og-image.png...');
  execSync(`convert "${svgFile}" -resize 1200x630 "${path.join(publicDir, 'og-image.png')}"`);
  
  // Create favicon.ico (32x32)
  console.log('Creating favicon.ico...');
  execSync(`convert "${svgFile}" -resize 32x32 "${path.join(publicDir, 'favicon.ico')}"`);
  
  // Create various icon sizes
  console.log('Creating icon-192.png...');
  execSync(`convert "${svgFile}" -resize 192x192 "${path.join(publicDir, 'icon-192.png')}"`);
  
  console.log('Creating icon-512.png...');
  execSync(`convert "${svgFile}" -resize 512x512 "${path.join(publicDir, 'icon-512.png')}"`);
  
  console.log('Creating apple-touch-icon.png...');
  execSync(`convert "${svgFile}" -resize 180x180 "${path.join(publicDir, 'apple-touch-icon.png')}"`);
  
  console.log('✅ All icons created successfully!');
  
} catch (error) {
  console.log('ImageMagick not found. Creating simple PNG manually...');
  
  // Fallback: create a simple colored square icon if ImageMagick isn't available
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  
  // Create a simple gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1e293b');
  gradient.addColorStop(1, '#334155');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  
  // Add logo circle
  const logoGradient = ctx.createLinearGradient(100, 150, 260, 310);
  logoGradient.addColorStop(0, '#3b82f6');
  logoGradient.addColorStop(0.5, '#8b5cf6');
  logoGradient.addColorStop(1, '#06b6d4');
  
  ctx.fillStyle = logoGradient;
  ctx.beginPath();
  ctx.arc(180, 230, 70, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('KP', 180, 245);
  
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('KP Elite Sports', 320, 240);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px Arial';
  ctx.fillText('Fantasy Football AI Analytics', 320, 290);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), buffer);
  
  console.log('✅ Basic PNG icon created!');
}