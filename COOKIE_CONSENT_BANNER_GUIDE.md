# How to Install and Configure Cookie Consent Banner

## Why This Is Required

**Google AdSense requires** websites to display a cookie consent banner to comply with GDPR and other privacy laws. This banner:
- Informs visitors about cookie usage
- Allows visitors to accept/reject cookies
- Is **MANDATORY** for AdSense approval

---

## Recommended Plugin: Cookie Notice & Compliance for GDPR / CCPA

This is the **#1 rated FREE cookie consent plugin** for WordPress.

---

## Step-by-Step Installation

### Step 1: Install the Plugin

1. **Log in to WordPress Admin**

2. **Go to**: Plugins → Add New

3. **In the search box**, type: **"Cookie Notice"**

4. **Find the plugin:** "Cookie Notice & Compliance for GDPR / CCPA" by dFactory

5. **Click**: "Install Now"

6. **Click**: "Activate" (after installation completes)

---

### Step 2: Configure Cookie Notice Settings

After activation, you'll be taken to the settings page. If not:

1. **Go to**: Settings → Cookie Notice

---

### Step 3: Configuration Tab Settings

Configure the following settings:

#### **General Settings**

**Message:**
```
We use cookies to ensure you get the best experience on our website. This includes cookies from Google AdSense and analytics services.
```

**Button Text (Accept):**
```
Accept
```

**Button Text (Reject):** (Optional but recommended)
```
Reject
```

**Privacy Policy:**
- **Enable**: "Privacy Policy"
- **Select your Privacy Policy page** from the dropdown
- **Link Text**: "Privacy Policy"

**Refuse Cookies:**
- **Enable**: "Give users the option to refuse cookies"
- This adds a "Reject" button

---

#### **Position & Style**

**Position:**
- Select: **Bottom** (recommended for AdSense)
- Or: **Top** if you prefer

**Animation:**
- Select: **Fade** or **Slide** (your preference)

**Button Style:**
- Select: **Button** (looks more professional)

**Colors:**
- **Background Color**: Choose to match your site (or keep default)
- **Text Color**: Make sure it's readable
- **Button Color**: Use your site's primary color
- **Accept Button**: Green (#00A300) or your brand color
- **Reject Button**: Red (#FF0000) or neutral color

---

### Step 4: Compliance Settings

**Compliance:**
- **Compliance Mode**: Select **Cookie Compliance** or **GDPR**

**Cookie Categories:** (if available in free version)
- Enable **Necessary** (always on)
- Enable **Functionality**
- Enable **Analytics**
- Enable **Advertising** ← **IMPORTANT for AdSense!**

**OnClick Scrolling:**
- Disable "Enable on scroll" for better compliance

**Redirection:**
- **After rejecting cookies, redirect to**: Leave blank or select a page

---

### Step 5: Advanced Settings

**Script Blocking:**
- **Enable**: "Block scripts before consent" ← **IMPORTANT!**
- This ensures cookies aren't set until user consents

**Cache:**
- If using a caching plugin, follow the plugin's instructions to exclude the cookie notice from caching

**Consent Settings:**
- **Cookie expiration**: 365 days (default is fine)
- **Revoke consent button**: Enable (allows users to change their mind later)

---

### Step 6: Save Settings

1. **Click**: "Save Changes" at the bottom

2. **View your website** in an incognito window

3. **Verify the cookie banner appears**

---

## Alternative Plugin Option: GDPR Cookie Consent

If you prefer a different plugin:

### Install GDPR Cookie Consent by WebToffee

1. **Go to**: Plugins → Add New

2. **Search for**: "GDPR Cookie Consent"

3. **Install and Activate**: "GDPR Cookie Consent" by WebToffee

4. **Configure**:
   - Go to: Settings → GDPR Cookie Consent
   - Enable consent banner
   - Add cookie categories (Necessary, Analytics, Advertising)
   - Link to Privacy Policy
   - Customize colors and position
   - Save settings

---

## Manual Code Option (Advanced)

If you don't want to use a plugin, you can add cookie consent code manually:

### Using Google's Consent Mode

1. **Go to**: Appearance → Theme File Editor

2. **Select**: header.php

3. **Add this code BEFORE the `</head>` tag:**

```html
<!-- Google Consent Mode -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});
</script>

<!-- Cookie Consent Banner -->
<div id="cookie-consent-banner" style="position: fixed; bottom: 0; left: 0; right: 0; background: #2C3E50; color: white; padding: 20px; text-align: center; z-index: 999999; display: none;">
  <p style="margin: 0 0 15px;">
    We use cookies to improve your experience. This includes cookies from Google AdSense and analytics.
    <a href="/privacy-policy/" style="color: #3498DB;">Privacy Policy</a>
  </p>
  <button onclick="acceptCookies()" style="background: #27AE60; color: white; padding: 10px 30px; border: none; margin-right: 10px; cursor: pointer; border-radius: 5px;">
    Accept
  </button>
  <button onclick="rejectCookies()" style="background: #E74C3C; color: white; padding: 10px 30px; border: none; cursor: pointer; border-radius: 5px;">
    Reject
  </button>
</div>

<script>
// Show banner if consent not given
if (!localStorage.getItem('cookieConsent')) {
  document.getElementById('cookie-consent-banner').style.display = 'block';
}

function acceptCookies() {
  localStorage.setItem('cookieConsent', 'accepted');
  gtag('consent', 'update', {
    'ad_storage': 'granted',
    'analytics_storage': 'granted'
  });
  document.getElementById('cookie-consent-banner').style.display = 'none';
}

function rejectCookies() {
  localStorage.setItem('cookieConsent', 'rejected');
  document.getElementById('cookie-consent-banner').style.display = 'none';
  window.location.href = '/'; // Redirect to homepage
}
</script>
```

4. **Click**: "Update File"

**⚠️ WARNING**: Only use this if you're comfortable with code. Plugins are safer!

---

## Testing Your Cookie Banner

1. **Open your site in incognito mode**

2. **The cookie banner should appear** at the bottom (or top)

3. **Test the Accept button:**
   - Click "Accept"
   - Banner should disappear
   - Cookies should be set

4. **Test the Reject button** (open new incognito window):
   - Click "Reject"
   - Banner should disappear
   - NO cookies should be set (except necessary ones)

5. **Verify cookie storage:**
   - After accepting, check browser cookies (F12 → Application → Cookies)
   - You should see cookies from your domain

---

## Mobile Testing

1. **Open your site on a mobile device**

2. **Verify:**
   - Cookie banner appears correctly
   - Text is readable
   - Buttons are tappable
   - Banner doesn't block important content

---

## Common Issues & Fixes

### Issue: Banner doesn't appear

**Solution:**
- Clear your browser cache
- Clear WordPress cache (if using a caching plugin)
- Check if the plugin is activated
- Try incognito mode

### Issue: Banner appears on every page load

**Solution:**
- Check browser cookies are enabled
- Plugin may not be saving consent properly
- Try a different plugin

### Issue: Banner conflicts with theme

**Solution:**
- Adjust z-index in plugin settings
- Change banner position (top vs. bottom)
- Customize colors to match your theme

---

## AdSense Requirements Checklist

For AdSense approval, your cookie banner MUST:

- [ ] Appear on first page visit
- [ ] Inform users about cookie usage
- [ ] Mention Google AdSense/advertising cookies specifically
- [ ] Provide "Accept" and "Reject" options
- [ ] Link to your Privacy Policy
- [ ] Actually block cookies until consent is given
- [ ] Work on mobile devices
- [ ] Be visible and easy to interact with

---

## Next Steps After Installation

1. **Test the banner** thoroughly (desktop + mobile)
2. **Update your Privacy Policy** to mention the cookie consent banner
3. **Take screenshots** showing the banner working
4. **Wait 24-48 hours** before applying to AdSense (to ensure everything is cached properly)

---

**Recommended Plugin Summary:**

✅ **Best Option**: Cookie Notice & Compliance for GDPR / CCPA (Free)
- Easy to set up
- AdSense compliant
- GDPR/CCPA ready
- Most popular (800,000+ active installations)

---

**Need help?** If you encounter issues, let me know and I can provide specific troubleshooting!
