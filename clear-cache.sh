#!/bin/bash

# Clear build cache for UI changes
echo "🧹 Clearing build cache..."
rm -rf node_modules/.vite && rm -rf dist

echo "✅ Cache cleared successfully!"
echo "💡 Now run 'npm run build' to rebuild with fresh cache"