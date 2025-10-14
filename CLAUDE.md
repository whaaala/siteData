# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an automated news aggregation and content publishing system that scrapes articles from multiple Nigerian and international news websites, rewrites them using AI (OpenAI), and publishes them to a WordPress site. The system runs continuously via a scheduler and operates in a 3-stage pipeline: scrape → rewrite → publish.

## Running the Application

### Development Commands
```bash
# Start the scheduler (production mode)
npm start

# Install Playwright browsers (required after npm install)
npm run postinstall
```

### Key Entry Points
- **scheduler.js** - Main orchestrator that runs crawer.js every 5 minutes during active hours (5am-11pm)
- **crawer.js** - Core processing logic that executes the 3-stage pipeline for a single post

### Environment Variables
Required in `.env`:
- `MONGO_URI` - MongoDB connection string
- `WORDPRESS_URL` - Target WordPress site URL
- `WORDPRESS_USERNAME` - WordPress admin username
- `WORDPRESS_PASSWORD` - WordPress application password
- `OPENAI_API_KEY` - OpenAI API key for content rewriting

## Architecture Overview

### 3-Stage Processing Pipeline

The system processes each scraped article through three distinct stages:

1. **Stage 1: Scrape Raw Content** (`scrapeRaw.js`)
   - Scrapes a single post from a source website
   - Extracts title, content, images, author, date, category
   - Cleans HTML (removes ads, social share buttons, site-specific elements)
   - Uploads featured image to WordPress immediately
   - Saves raw data to MongoDB with `processingStage: 'raw'`

2. **Stage 2: Rewrite Content** (`rewriteStage.js`)
   - Uses OpenAI API to rewrite title and content
   - Checks for duplicate content before rewriting
   - Updates MongoDB record with `processingStage: 'rewritten'`
   - Skips posts with empty content or duplicates

3. **Stage 3: Publish to WordPress** (`publishStage.js`)
   - Processes images (rehosts all images to WordPress)
   - Embeds social media content (Instagram, Twitter/X, TikTok, Facebook, YouTube)
   - Adds custom CSS for responsive layouts
   - Maps categories to WordPress category IDs
   - Randomly assigns WordPress author IDs per category
   - Posts to WordPress and updates MongoDB with `processingStage: 'posted'`

### Database Schema

MongoDB collection `Post` (defined in `db.js`):
- `url` - Original article URL (used for deduplication)
- `title` - Original title
- `rewrittenTitle` - AI-rewritten title
- `postDetails` - Original HTML content
- `rewrittenDetails` - AI-rewritten HTML content
- `website` - Source website domain
- `category` - Normalized category (News, Entertainment, Sports, etc.)
- `imageLink` - WordPress-hosted featured image URL
- `wpFeaturedMediaId` - WordPress media ID
- `wpPostId` - WordPress post ID (after publishing)
- `wpPostUrl` - Published WordPress URL
- `processingStage` - Current pipeline stage (raw/rewritten/posted/skipped_*)
- `dateRetrieved`, `timePosted`, `author`, `excerpt`
- **[NEW]** `fbPostId` - Facebook post ID
- **[NEW]** `fbPostUrl` - Facebook post URL
- **[NEW]** `fbModerationStatus` - Moderation result (approved/blocked/posted/etc.)
- **[NEW]** `fbModerationReason` - Why post was blocked (if applicable)
- **[NEW]** `fbModerationFlags` - OpenAI moderation API response
- **[NEW]** `fbModerationDate` - When moderation was performed

### Site Configuration System

The `websites/sites.js` file contains configuration objects for each news source. Each site object defines:
- `siteUrl` - Array of category URLs to scrape
- `listings` - CSS selectors for post listing pages
- `post` - CSS selectors for individual post pages
- `titleEl`, `imageEl`, `categoryEl`, `authorEl`, `datePostedEl` - Element selectors
- `elToReFromPostEl` - Array of CSS selectors for elements to remove during scraping

**To add a new site:**
1. Create a new site configuration object in `websites/sites.js`
2. Define all required selectors by inspecting the target site's HTML
3. Add the site object to the `siteNames` array export at the bottom
4. Test scraping by temporarily using `const siteNames = [yourNewSite]` (line 2507)

### Category Mapping

Categories are normalized and mapped to WordPress in `categoryMap.js`:
- `normalizeCategory()` in `normalizeCategory.js` converts raw category strings to standard categories
- Standard categories: News, Entertainment, Sports, Lifestyle, HealthAndFitness, FoodAndDrink, Gists
- Each category maps to a WordPress category ID and a pool of author IDs
- Authors are randomly selected from the category pool for each post

### Scraping Flow

1. **scheduler.js** runs `crawer.js` every 5 minutes during active hours
2. **crawer.js** calls `findRandomToScrape()` to pick an unscraped URL from `ScrapeStatus` collection
3. **postListing()** extracts post listings from the category page
4. Filters posts to only those from today and after last visit time
5. Finds first unprocessed post (not in `Post` collection)
6. Executes 3-stage pipeline on that single post
7. **[NEW]** After WordPress publish, moderates content and posts to Facebook if approved
8. Marks URL as scraped in `ScrapeStatus` when all posts processed
9. Cycle repeats; when all URLs scraped, `ScrapeStatus` is cleared and scraping starts over

### Facebook Posting with Content Moderation

After successful WordPress publication, posts go through a moderation pipeline before Facebook:

1. **Configuration Check** (`moderationConfig.js`)
   - Category allowlist (default: blocks "Gists")
   - Source blocklist
   - URL pattern filtering (/obituary/, etc.)

2. **AI Content Moderation** (`contentModeration.js`)
   - OpenAI Moderation API analyzes title + excerpt
   - Blocks: violence/graphic, sexual, hate speech, self-harm
   - Warns: non-graphic violence (acceptable for news)

3. **Keyword Analysis**
   - Scans for high-risk phrases
   - Context-aware (news can discuss sensitive topics)

4. **Quality Checks**
   - Requires featured image
   - Title length validation
   - Clickbait detection

5. **Post to Facebook** (`facebook.js`)
   - Posts image with title caption
   - Includes WordPress URL
   - Tracks post ID in database

**Moderation Statuses:**
- `approved` - Passed all checks
- `posted` - Successfully posted to Facebook
- `blocked` - Failed moderation (reason logged)
- `skipped_pattern_match` - Matched skip rule
- `failed_to_post` - API error

All moderation results saved to MongoDB with reason and OpenAI flags.

### Memory Management

The system is optimized for long-running operation on memory-constrained environments (e.g., Heroku):
- Playwright routes block stylesheets and fonts to reduce memory
- `global.gc()` is called after each scrape cycle
- Browser instances are closed after each post
- 5-minute delays between scrape cycles
- 10-minute delays during inactive hours (11pm-5am)

### Image Handling

Images are processed in multiple places:
1. **scrapeRaw.js**: Featured image is downloaded, converted to JPG/PNG, and uploaded to WordPress
2. **publishStage.js**: All inline images in content are rehosted to WordPress via `rehostAllImagesInContent()`
3. **utils.js**: `downloadImageAsJpgOrPngForUpload()` handles image conversion using Sharp library
4. Images are centered, made responsive, and height-limited to 30rem via inline CSS

### Social Media Embedding

The `embedSocialLinksInContent()` function in `utils.js` converts social media URLs into embeds:
- Instagram: `<blockquote class="instagram-media">` with embed script
- Twitter/X: oEmbed API via `https://publish.twitter.com/oembed`
- TikTok: `<blockquote class="tiktok-embed">` with embed script
- Facebook: `<div class="fb-post">` or `<div class="fb-video">`
- YouTube: Extracts video ID and creates `<iframe>` embed

Special handling:
- TikTok URLs are deduplicated in `publishStage.js`
- Custom CSS centers all embeds with `margin: 0 auto`
- Social media scripts are injected at the end of content

### Site-Specific Logic

Many sites require custom handling (search for site names in `scrapeRaw.js` and `publishStage.js`):
- **pulse.ng/pulse.com.gh**: Uses Playwright for dynamic content extraction instead of Cheerio
- **notjustok.com**: Category is hardcoded based on URL (Sports vs Entertainment)
- **yabaleftonline**: Extracts full title from content page (listing pages truncate with "...")
- **healthwise.punchng.com**: Uses `imageLink` from listing page instead of post page
- **theguardian.com**: Category hardcoded to "Recipes"
- **motorverso, girlracer, bestsellingcarsblog**: Category hardcoded to "Cars"
- **legit.ng**: Removes duplicate featured image from content, handles multi-line categories
- **.gh domains**: Adds "Ghana - " prefix to titles (except Health/Lifestyle categories)

### Duplicate Detection

Multiple mechanisms prevent duplicate content:
1. **URL deduplication**: `Post.findOne({ url })` checks before scraping
2. **ScrapeStatus**: Tracks which URLs have been fully processed
3. **Content similarity check**: `areContentsSimilar()` in `wordpress.js` compares titles and content before rewriting
4. **WordPress API check**: `wordpressPostExists()` checks for existing posts by title and image

### Content Cleaning

Extensive HTML cleaning in `scrapeRaw.js`:
- Removes ads, social share buttons, related posts, affiliate disclaimers
- Strips site-specific navigation elements
- Removes copyright notices and attribution paragraphs
- Replaces source site names with neutral text via `replaceSiteNamesInPostDetails()`
- Removes all `<strong>` tags (except for pulse, brila, healthsa, theguardian, motorverso, girlracer, notjustok)
- Adds `<br>` spacing after sections for pulse.com.gh
- Removes last `<p>` if it contains social media calls-to-action (notjustok)

### CSS and Styling

Final content includes inline CSS for:
- `.post-content { padding: 0 !important; text-align: justify !important; }`
- All images: centered, responsive (`max-width: 100%`), height-limited to 30rem
- All iframes/embeds: `display: block; margin: 0 auto;`
- Videos: `max-height:36rem; min-height:30rem; width:50rem;`
- Twitter iframes: handled by WordPress oEmbed (no custom sizing)
- TikTok embeds: No custom sizing (native responsive)
- Paragraph bottom margin: `margin-bottom:0.5rem;`

## Important Implementation Details

### Playwright vs Cheerio
- Most sites use Cheerio for HTML parsing (faster, less memory)
- Pulse sites require Playwright because content is dynamically loaded
- Playwright is used for all page navigation and initial HTML fetching

### OpenAI Integration
The `openai.js` module handles content rewriting:
- `rewriteTitle()`: Generates SEO-friendly headlines
- `rewriteContent()`: Rewrites full article while preserving HTML structure
- Uses GPT-4 models (check `openai.js` for specific model versions)

### Error Handling
- Uncaught exceptions and unhandled rejections are logged by scheduler.js
- Failed scrapes skip to next URL without crashing the process
- Image upload failures mark posts as `skipped_image_upload_failed`
- Empty content marks posts as `skipped_empty_content`
- Duplicate content marks posts as `skipped_due_to_duplicate`

### Testing Individual Sites
To test a specific site without running the full scraper:
1. In `websites/sites.js`, modify line 2507: `const siteNames = [yourSiteObject]`
2. Run `node crawer.js` (not through scheduler)
3. Check MongoDB for the scraped post
4. Revert changes to `sites.js` when done

## Common Tasks

### Adding a New Category
1. Add category name to `wpCategoryMap` in `categoryMap.js` with WordPress category ID
2. Add author IDs to `wpAuthorMap` for that category
3. Update `normalizeCategory()` in `normalizeCategory.js` with raw category variations
4. Test with a site that publishes in that category

### Debugging Scraping Issues
1. Check browser console: `page.content()` in scrapeRaw.js line 57
2. Verify selectors match the site's HTML structure
3. Test with a single site: modify sites.js line 2507
4. Check `ScrapeStatus` collection: posts may be marked as scraped
5. Check `Post` collection: posts may be marked as skipped with reason

### Modifying Content Processing
- HTML cleaning: `scrapeRaw.js` lines 54-909
- Image processing: `utils.js` `processContentImages()` and `publishStage.js`
- Social embeds: `utils.js` `embedSocialLinksInContent()`
- CSS styling: `publishStage.js` lines 465-485

### Handling WordPress Authentication
WordPress uses application passwords (not regular passwords):
1. Generate in WordPress: Users → Profile → Application Passwords
2. Store in `.env` as `WORDPRESS_USERNAME` and `WORDPRESS_PASSWORD`
3. Format: `username` and `xxxx xxxx xxxx xxxx xxxx xxxx` (with spaces)

## File Organization

### Core Processing
- `crawer.js` - Main entry point for scraping
- `scrapeRaw.js` - Stage 1: Raw content extraction
- `rewriteStage.js` - Stage 2: AI rewriting
- `publishStage.js` - Stage 3: WordPress publishing

### Configuration & Data
- `websites/sites.js` - Site-specific scraping configurations (2500+ lines)
- `categoryMap.js` - Category-to-WordPress mapping
- `normalizeCategory.js` - Category normalization logic
- `db.js` - MongoDB schema definitions

### Utilities
- `utils.js` - Image processing, social embeds, text utilities
- `wordpress.js` - WordPress API interactions
- `openai.js` - OpenAI API for content rewriting
- `functions.js` - Generic DOM extraction helpers
- `scraperUtils.js` - Last visit time tracking
- `puppeteerPreparation.js` - Playwright browser setup

### Facebook & Moderation
- `facebook.js` - Facebook Graph API integration
- `contentModeration.js` - AI-powered content moderation with OpenAI
- `moderationConfig.js` - User-configurable moderation rules
- `testFacebook.js` - Facebook integration test script
- `testModeration.js` - Content moderation test suite

### Infrastructure
- `scheduler.js` - Continuous operation orchestrator
- `scrapeStatus.js` - MongoDB model for tracking scraped URLs
- `timeConverter.js` - Date/time utilities

## MongoDB Collections

1. **posts** - Main content storage
2. **scrapestatuses** - Tracks which URLs have been fully processed (cleared when all sites complete)

## Deployment Notes

This system is designed for Heroku deployment:
- `engines.node: "20.x"` in package.json
- Playwright browsers installed via `heroku-postbuild` script
- Expects MongoDB Atlas connection string
- Scheduler runs continuously (no cron needed)
