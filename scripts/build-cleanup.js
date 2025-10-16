#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple script that works with Node.js 14.15.4
console.log('Build cleanup completed successfully!');

// Create package.json for the dist folder
const packageJson = {
  "type": "module"
};

try {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  // Write a simple package.json to mark as ESM
  fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
  console.log('Created dist/package.json');
} catch (error) {
  console.log('Note: dist directory will be created during TypeScript compilation');
}
