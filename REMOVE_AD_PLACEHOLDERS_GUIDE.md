# How to Remove Existing Ad Placeholders from WordPress

## Why This Is Important

AdSense policy limits you to **3 ad units per page**. Before applying for AdSense, you need to remove any existing ad placeholder code or widgets that are currently displaying "Advertisement" banners.

---

## Method 1: Check Widgets (EASIEST)

1. **Go to WordPress Admin Dashboard**
2. **Navigate to**: Appearance → Widgets
3. **Look for widgets named:**
   - "Advertisement"
   - "Ad Widget"
   - "Custom HTML" (that contains ad code)
   - "Text Widget" (that contains ad placeholders)

4. **Remove any ad-related widgets from:**
   - Sidebar
   - Header
   - Footer
   - Any other widget areas

5. **Click "Save" or "Update"**

---

## Method 2: Check Theme Customizer

1. **Go to**: Appearance → Customize
2. **Look through these sections:**
   - **Header Settings** → Check for "Advertisement" or "Ad Banner" options
   - **Sidebar Settings** → Look for ad placement toggles
   - **Footer Settings** → Check for ad sections
   - **Additional CSS** → Look for `.advertisement` or `.ad-banner` CSS code

3. **If you find ad-related settings:**
   - Disable or clear them
   - Click "Publish" to save changes

---

## Method 3: Check Your Theme's Ad Settings

Many WordPress themes have built-in ad management. Check your theme's options:

1. **Go to**: Appearance → Theme Options (or similar)
   - The exact name depends on your theme
   - Look for tabs like "Ads", "Monetization", "Advertisement"

2. **Common theme panels:**
   - If you're using **Astra**, check: Appearance → Astra Options
   - If you're using **GeneratePress**, check: Appearance → GeneratePress
   - If you're using **OceanWP**, check: Theme Panel → Ads

3. **Disable all ad placements:**
   - Header ads
   - Sidebar ads
   - Footer ads
   - In-content ads
   - Between post ads

4. **Save changes**

---

## Method 4: Check for Ad Insertion Plugins

1. **Go to**: Plugins → Installed Plugins

2. **Look for ad-related plugins:**
   - Ad Inserter
   - Advanced Ads
   - AdSense Plugin WP QUADS
   - Quick Adsense
   - Any plugin with "Ad" or "Advertisement" in the name

3. **For each ad plugin found, you have 2 options:**

   **Option A: Deactivate the plugin** (Recommended before AdSense approval)
   - Click "Deactivate"
   - DO NOT delete yet (you can reactivate later)

   **Option B: Disable all ad placements in the plugin**
   - Open the plugin settings
   - Disable or delete all ad blocks/placements
   - Save changes

---

## Method 5: Check for Custom Code in Theme Files

**⚠️ WARNING: Only do this if you're comfortable editing code**

1. **Go to**: Appearance → Theme File Editor

2. **Look for ad code in these files:**
   - `header.php`
   - `footer.php`
   - `sidebar.php`
   - `single.php`
   - `functions.php`

3. **Search for (Ctrl+F):**
   - `advertisement`
   - `ad-banner`
   - `google_ad`
   - `<ins class="adsbygoogle"`

4. **If found:**
   - **IMPORTANT**: Make a backup first!
   - Comment out or remove the ad code
   - Click "Update File"

**Better Alternative**: Hire a developer if you're not comfortable with code.

---

## Method 6: Check Page Builders (Elementor, WPBakery, etc.)

If you use a page builder:

### For Elementor:
1. **Go to**: Pages → All Pages
2. **Edit with Elementor** any page that shows ads
3. **Look for widgets:**
   - HTML widgets with ad code
   - Custom widgets labeled "Advertisement"
4. **Delete those widgets**
5. **Click "Update"**

### For WPBakery:
1. Edit pages in WPBakery
2. Look for "Raw HTML" or "Custom HTML" blocks
3. Check if they contain ad code
4. Delete and save

---

## Method 7: Check Specific Locations

The web analysis showed placeholders at:
- `consultstreet-pro`
- `aasta-pro`
- `ArileWP-Pro`
- `designexo-pro`

These sound like **theme demo content**. Here's how to remove them:

1. **Go to**: Appearance → Customize → Additional CSS

2. **Add this code to HIDE ad placeholders:**

```css
/* Hide demo ad placeholders */
.consultstreet-pro,
.aasta-pro,
.ArileWP-Pro,
.designexo-pro,
.advertisement,
.ad-banner,
.ad-space,
.google-ad-placeholder {
    display: none !important;
}
```

3. **Click "Publish"**

4. **Check your site** - Ad placeholders should now be hidden

---

## How to Verify Ad Placeholders Are Removed

1. **Open your website** in an incognito/private browser window
2. **Check these pages:**
   - Homepage
   - Any blog post
   - Category pages
   - About page

3. **Look for:**
   - Blank spaces where ads used to be
   - Text saying "Advertisement"
   - Empty banner sections

4. **If you still see placeholders:**
   - Go back through the methods above
   - Use browser "Inspect Element" (Right-click → Inspect) to find the ad code's location

---

## Final Check: View Page Source

1. **Right-click on your homepage** → View Page Source
2. **Search (Ctrl+F) for:**
   - `advertisement`
   - `google_ad`
   - `ad-banner`
   - `.ads`

3. **If found:**
   - Note the surrounding code to identify where it's coming from
   - Use the methods above to remove it

---

## ✅ When You're Done

After removing all ad placeholders:
1. Clear your website cache (if using a caching plugin)
2. View your site in incognito mode
3. Confirm NO ad placeholders are visible
4. Take screenshots for your records

---

**Need Help?** If you're stuck, share a screenshot of what you're seeing and I can provide more specific guidance!
