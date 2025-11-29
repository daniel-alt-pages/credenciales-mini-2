#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Build the project
npm run build

# Navigate to the build output directory
cd dist

# Create .nojekyll to prevent GitHub Pages from ignoring files starting with _
touch .nojekyll

# Create a new git repository
git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# Push to gh-pages branch
git push -f https://github.com/daniel-alt-pages/credenciales-mini-2.git gh-pages

cd -
