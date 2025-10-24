/**
 * Facebook Page Routing Configuration
 *
 * Routes posts to different Facebook pages based on category
 */

// Facebook page configurations with PERMANENT tokens
const FACEBOOK_PAGES = {
  NO_WAHALA_ZONE: {
    name: 'No Wahala Zone',
    pageId: '794703240393538',
    accessToken: 'EAAKznm6vOd8BP2mBw5DJvSP4eiRw0Ur5seq0rAAsSSewWUKdo5XlJViJAz3t06LftlMQMicVk3MvzxCo8xsStARmiOX7inQE7teCOQD5UrPsSUkepf2OLYKeGzlhk7ZA3cwZChf5JARmAvQHpFmi5s2L2WgWpMZASG00CGmyxP69dx8CoQegMCYigLZBdCnUrCqtJlZBc',
  },
  NIGERIACELEBRITIES: {
    name: 'Nigeriacelebrities',
    pageId: '2243952629209691',
    accessToken: 'EAAKznm6vOd8BP6W3W6SRRGff8rvml1dmBQBCYWynpwVCH5PQk8yHnInigR3kXZCZCayNwhrIRbOGIehvEBy7Se5hYZBZCeRCcpQZBPqc6Mxzn99QFigBp3ZCBDYZCskOVei4H29IsSUYJZBxuk9FbMD6dhPCSzsK2ZAUOGcApRZBOdvpYOtawycPdRfWNO6mfbP5bjPKO5UBcC',
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
