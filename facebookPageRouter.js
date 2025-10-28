/**
 * Facebook Page Routing Configuration
 *
 * Routes posts to different Facebook pages based on category
 */

import dotenv from 'dotenv'
dotenv.config()

// Facebook page configurations - tokens loaded from environment variables
const FACEBOOK_PAGES = {
  NO_WAHALA_ZONE: {
    name: 'No Wahala Zone',
    pageId: process.env.NO_WAHALA_ZONE_PAGE_ID || '794703240393538',
    accessToken: process.env.NO_WAHALA_ZONE_ACCESS_TOKEN,
  },
  NIGERIACELEBRITIES: {
    name: 'Nigeriacelebrities',
    pageId: process.env.NIGERIACELEBRITIES_PAGE_ID || '2243952629209691',
    accessToken: process.env.NIGERIACELEBRITIES_ACCESS_TOKEN,
  },
}

/**
 * Get Facebook pages to post to based on category
 *
 * Rules:
 * - Entertainment & Gists → Post to BOTH Nigeriacelebrities AND No Wahala Zone
 * - All other categories → Post to No Wahala Zone only
 *
 * @param {string} category - Normalized category (e.g., "Entertainment", "Gists", "News")
 * @returns {Array} Array of page configurations to post to
 */
export function getFacebookPagesForCategory(category) {
  const pages = []

  // Entertainment and Gists go to BOTH pages
  if (category === 'Entertainment' || category === 'Gists') {
    pages.push(FACEBOOK_PAGES.NIGERIACELEBRITIES)
    pages.push(FACEBOOK_PAGES.NO_WAHALA_ZONE)
  } else {
    // All other categories go to No Wahala Zone only
    pages.push(FACEBOOK_PAGES.NO_WAHALA_ZONE)
  }

  return pages
}

/**
 * Get page name for logging
 * @param {string} pageId - Facebook page ID
 * @returns {string} Page name
 */
export function getPageName(pageId) {
  if (pageId === FACEBOOK_PAGES.NIGERIACELEBRITIES.pageId) {
    return FACEBOOK_PAGES.NIGERIACELEBRITIES.name
  }
  if (pageId === FACEBOOK_PAGES.NO_WAHALA_ZONE.pageId) {
    return FACEBOOK_PAGES.NO_WAHALA_ZONE.name
  }
  return 'Unknown Page'
}
