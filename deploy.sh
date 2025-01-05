#!/bin/bash

# Build the application locally
npm run build

# Create deployment directory
mkdir -p deploy

# Copy necessary files and directories
cp -r .next deploy/
cp -r public deploy/
cp package.json deploy/
cp package-lock.json deploy/

# Create an ecosystem file for PM2
cat > deploy/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'boardgame-collection',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: '3000'
    }
  }]
}
EOL

echo "Deployment files prepared in 'deploy' directory"
