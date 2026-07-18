# Google AI Results Remover

Browser extension that hides AI-generated content from Google Search:

- **AI Overview** cards at the top of results
- **AI Mode** tab in the result-type bar

Works in Firefox-based browsers (Firefox, LibreWolf) and Chromium-based
browsers (Chrome, Brave, Edge) from the same codebase — Manifest V3.

## How it works

1. `hide.css` hides known AI containers at `document_start` (no flash).
2. `content.js` finds anything the CSS missed by matching the visible
   labels ("AI Overview", "AI Mode", plus translations) and hiding the
   enclosing result block. A `MutationObserver` re-runs the sweep as
   Google streams content into the page.

## Load in LibreWolf / Firefox (temporary)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` in this directory
4. Search something on Google that triggers an AI Overview
   (e.g. "why is the sky blue")

Temporary add-ons unload when the browser closes. For a permanent
install the extension must be signed via addons.mozilla.org (AMO) —
or use `xpinstall.signatures.required = false` in `about:config`,
which LibreWolf allows.

## Load in Chromium browsers

1. Open `chrome://extensions`, enable **Developer mode**
2. **Load unpacked** → select this directory

(Chrome may warn about the `browser_specific_settings` key; it is
ignored there and harmless.)

## Maintenance notes

Google rotates its obfuscated class names regularly. The text-label
heuristic in `content.js` is the durable layer; the selectors in
`hide.css` are best-effort speed-ups that may need refreshing. To
support more languages, extend `AI_HEADING_LABELS` / `AI_TAB_LABELS`
in `content.js`.
