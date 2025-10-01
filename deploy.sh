#!/bin/bash

# Fantasy Football AI Deployment Script
echo "🚀 Creating deployment package for KP Elite Sports Fantasy Football AI..."

# Create deployment directory
mkdir -p deployment

# Copy necessary files for production deployment
echo "📦 Copying production files..."

# Core Next.js files
cp -r .next deployment/
cp -r public deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.ts deployment/

# Environment files (you'll need to create .env.production for your server)
echo "⚠️  Remember to create .env.production on your server with:"
echo "   NEXT_PUBLIC_SITE_URL=https://your-domain.com"
echo "   And any other required environment variables"

# Create a simple start script
cat > deployment/start.sh << 'EOF'
#!/bin/bash
echo "Starting KP Elite Sports Fantasy Football AI..."
npm ci --production
npm start
EOF

chmod +x deployment/start.sh

# Create a simple README for deployment
cat > deployment/README.md << 'EOF'
# KP Elite Sports Fantasy Football AI - Deployment

## Server Requirements
- Node.js 18+ 
- NPM 8+
- At least 2GB RAM recommended

## Deployment Steps

1. Upload all files to your server
2. Create `.env.production` with your environment variables
3. Install dependencies: `npm ci --production`
4. Start the application: `npm start`

The app will run on port 3000 by default.

## Features Included
- Real-time Sleeper Fantasy Football integration
- AI-powered lineup optimization  
- Multi-league portfolio analysis
- Retro Tecmo Bowl theme
- Mobile-responsive design
- Live scoring and updates

## Environment Variables Needed
```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
# Add any other required variables
```

## Social Sharing
The app includes a custom social sharing image (og-image.svg) for link previews.
EOF

echo "✅ Deployment package created in './deployment/' directory"
echo ""
echo "🌐 Social sharing image created: public/og-image.svg"
echo ""
echo "📁 Files ready for deployment:"
echo "   - .next/ (Next.js build output)"
echo "   - public/ (static assets including social image)"
echo "   - package.json & package-lock.json"
echo "   - next.config.ts"
echo "   - start.sh (startup script)"
echo "   - README.md (deployment instructions)"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload the 'deployment' folder contents to your Dreamhost server"
echo "   2. Set up Node.js environment on Dreamhost"
echo "   3. Configure environment variables"
echo "   4. Run: npm ci --production && npm start"
echo ""
echo "💡 Note: For static hosting, you would need to modify the app to remove server-side features"