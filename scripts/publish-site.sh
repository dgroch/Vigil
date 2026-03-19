#!/bin/sh
set -eu
cd /data/.openclaw/workspace/Vigil-site
node scripts/export-site.mjs
git add -A
if git diff --cached --quiet; then
  echo "VIGIL_SITE_NO_CHANGES"
else
  git commit -m "Publish Vigil site update"
  git push origin HEAD:main
  echo "VIGIL_SITE_PUBLISHED"
fi
