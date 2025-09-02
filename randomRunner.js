import siteNames from './websites/sites.js';

const state = {};

// Helper function to get a random integer between 0 and max-1
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Function to get unused URLs for a given site variable
function getUnusedUrls(siteVar) {
  const used = state[siteVar] || [];
  const allUrls = siteNames[siteVar].siteUrl;
  return allUrls
    .map((url, idx) => ({ url, idx }))
    .filter(item => !used.includes(item.idx));
}

// Function to mark a URL as used
function markUrlUsed(siteVar, idx) {
  if (!state[siteVar]) state[siteVar] = [];
  state[siteVar].push(idx);
}

// Function to reset used URLs if all have been used
function resetIfAllUsed(siteVar) {
  if (
    state[siteVar] &&
    state[siteVar].length >= siteNames[siteVar].siteUrl.length
  ) {
    state[siteVar] = [];
  }
}

// Main function to run the random selection logic
export default async function runRandomUrls() {
  const eligibleVars = siteNames
    .map((site, idx) => ({ idx, urls: site.siteUrl }))
    .filter(site => site.urls && site.urls.length > 0)
    .map(site => site.idx);

    // If no eligible site variables, return empty result
  if (eligibleVars.length === 0) {
    return { siteVar: null, selectedUrls: [] };
  }
  // Select a random site variable
  const siteVar = eligibleVars[getRandomInt(eligibleVars.length)];

  // Initialize state for the site variable if not present
  if (!state[siteVar]) state[siteVar] = [];

  // Get unused URLs
  let unusedUrls = getUnusedUrls(siteVar);

  // If less than 2 unused URLs, reset the used list
  if (unusedUrls.length < 2) {
    resetIfAllUsed(siteVar);
    unusedUrls = getUnusedUrls(siteVar);
  }

  // Select up to 2 random unused URLs
  const selected = [];
  for (let i = 0; i < 2 && unusedUrls.length > 0; i++) {
    const idx = getRandomInt(unusedUrls.length);
    selected.push(unusedUrls[idx].idx); // Return the index of the URL
    markUrlUsed(siteVar, unusedUrls[idx].idx);
    unusedUrls.splice(idx, 1);
  }

  // Return the selected URLs
  return { siteVar, selectedUrls: selected };
}