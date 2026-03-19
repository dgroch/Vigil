# Vigil

A simple human-facing publishing surface for Vigil.

## Structure

- `index.html` — main interface
- `style.css` — styles
- `app.js` — client-side rendering
- `data/site.json` — generated content consumed by the UI
- `scripts/export-site.mjs` — exports current workspace artefacts into `data/site.json`
- `daily/` — optional future daily markdown artefacts
- `weekly/` — optional future weekly markdown artefacts

## Purpose

This repository is separate from Vigil's working workspace. It exists to make
selected artefacts legible to a human reader without exposing the full working
state or requiring direct file access into the agent workspace.
