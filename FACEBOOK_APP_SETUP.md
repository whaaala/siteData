# Facebook App Configuration for Instagram

## Problem: "No configuration available" when selecting permissions

This means your Facebook App needs to have Instagram permissions added.

## Solution: Configure Your Facebook App

### Step 1: Add Instagram Product to Your App

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Click on your app
3. In the left sidebar, look for **"Add Product"** or **"Products"**
4. Find **"Instagram"** and click **"Set Up"**
5. Follow the prompts to add Instagram to your app

### Step 2: Configure Instagram Basic Display (if available)

1. In your app dashboard, click **Instagram → Basic Display**
2. Click **"Create New App"**
3. Fill in the required fields
4. Click **"Create App"**

### Step 3: Add Required Permissions

1. Go to **App Review → Permissions and Features**
2. Request these permissions:
   - `instagram_basic` - Click "Request Advanced Access"
   - `instagram_content_publish` - Click "Request Advanced Access"
   - `pages_show_list` - Should already be available
   - `pages_read_engagement` - Should already be available
   - `pages_manage_posts` - Should already be available

**Note:** For development/testing, you can use these permissions WITHOUT App Review approval if:
- You're an admin/developer/tester of the app
- Your app is in "Development Mode"

### Step 4: Make Sure App is in Development Mode

1. Go to **Settings → Basic**
2. At the top, check the app status
3. If it says "Live", switch to **"Development"** for testing
4. Development mode allows you to test with your own accounts without App Review

---

## Alternative: Use Access Token Tool (EASIER!)

Instead of Graph API Explorer, use the **Access Token Tool**:

### Method 1: Using Meta Business Suite

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click on your **Facebook Page** ("Nowahala Lounge")
3. Go to **Settings → Instagram**
4. Connect your Instagram account
5. You'll get a Page Access Token automatically

### Method 2: Using Facebook Developer Console

1. Go to your app: https://developers.facebook.com/apps/
2. Click **Tools → Access Token Tool**
3. Find your Facebook Page in the list
4. Copy the **Page Access Token** (not User Access Token)
5. This token already has all page permissions

---

## Simplest Method: Let the Script Do It

Actually, we can simplify this! Let me create a script that helps you get the token directly.

### What You Need:

Just two things:
1. **Your Facebook User Access Token** (from Graph API Explorer, even without Instagram permissions)
2. **Admin access to your Facebook Page**

The script will:
- Use your User Access Token to get your Page Access Token
- The Page Access Token will have the permissions your app has for that page
- Show you what Instagram account (if any) is linked

Let me create this simplified script...
