#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Build the project
npm run build

# Navigate to the build output directory
cd dist

# Create a new git repository
git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# Push to gh-pages branch
git push -f git@github.com:daniel-alt-pages/credenciales-mini-2.git main:gh-pages

cd -
