#!/bin/bash
cd "/Users/zarg/Desktop/PuppyPad Resolution Center New/puppypad-resolution-app"
node build-hub.js
npx wrangler deploy --config worker.json
git add -A
git commit -m "Fix pagination button contrast - improve disabled and active state visibility"
git push
echo "Done!"
