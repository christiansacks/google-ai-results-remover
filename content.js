/*
 * Google AI Results Remover
 *
 * Strategy:
 *  1. hide.css hides known AI containers instantly (no flash).
 *  2. This script catches everything else with text-based heuristics,
 *     because Google's obfuscated class names change frequently while the
 *     visible labels ("AI Overview", "AI Mode") stay stable.
 *  3. A MutationObserver re-runs the sweep as Google streams the AI block
 *     into the page after the initial load.
 */

"use strict";

// Visible labels that mark an AI block, per language Google serves them in.
// Extend this list to support more locales.
const AI_HEADING_LABELS = [
  "ai overview",
  "ai overviews",
  "search labs | ai overview",
  "ki-übersicht",        // German
  "aperçu ia",           // French
  "resumen de ia",       // Spanish
  "panoramica ai",       // Italian
  "visão geral de ia",   // Portuguese
  "ai-overzicht",        // Dutch
];

const AI_TAB_LABELS = [
  "ai mode",
  "ki-modus",
  "mode ia",
  "modo ia",
  "modalità ai",
];

const HIDDEN_ATTR = "data-gair-hidden";

function normalize(text) {
  return (text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Climb from a matched heading to the whole AI block: the nearest ancestor
// that is a direct child of the results column (#rso / #rcnt / #center_col),
// so we remove the entire card and not just its title.
function findBlockRoot(el) {
  const containers = ["#rso", "#center_col", "#rcnt", "#main"];
  let node = el;
  while (node && node.parentElement) {
    const parent = node.parentElement;
    if (containers.some((sel) => parent.matches?.(sel))) {
      return node;
    }
    node = parent;
  }
  return null;
}

function hide(el, reason) {
  if (!el || el.getAttribute(HIDDEN_ATTR)) return;
  el.setAttribute(HIDDEN_ATTR, "1");
  el.style.setProperty("display", "none", "important");
  console.debug(`[AI Results Remover] hid block (${reason})`, el);
}

function hideAiOverviews(root) {
  // Headings Google uses for the AI Overview card.
  const headings = root.querySelectorAll(
    'div[role="heading"], h1, h2, strong'
  );
  for (const heading of headings) {
    const label = normalize(heading.textContent);
    if (!AI_HEADING_LABELS.some((l) => label === l || label.startsWith(l + " "))) {
      continue;
    }
    const block = findBlockRoot(heading);
    if (block) {
      hide(block, `heading "${label}"`);
    } else {
      // Fallback: hide the closest sizeable wrapper.
      hide(heading.closest("div[jscontroller]") || heading, `heading-fallback "${label}"`);
    }
  }
}

function hideAiModeTab(root) {
  // The "AI Mode" entry in the result-type tab bar (All / Images / AI Mode / …).
  const navs = root.querySelectorAll('[role="navigation"], #hdtb, .crJ18e');
  for (const nav of navs) {
    for (const link of nav.querySelectorAll("a, div[role='listitem'], div[role='tab']")) {
      const label = normalize(link.textContent);
      if (AI_TAB_LABELS.includes(label)) {
        hide(link.closest("[role='listitem']") || link, `tab "${label}"`);
      }
    }
  }
}

function sweep(root = document) {
  if (!root.querySelectorAll) return;
  hideAiOverviews(root);
  hideAiModeTab(root);
}

// Debounce: Google mutates the DOM constantly while streaming results.
let sweepQueued = false;
function queueSweep() {
  if (sweepQueued) return;
  sweepQueued = true;
  requestAnimationFrame(() => {
    sweepQueued = false;
    sweep();
  });
}

function start() {
  sweep();
  const observer = new MutationObserver(queueSweep);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
