# Security Checklist Before Pushing to Git

## 🔒 CRITICAL SECURITY FIXES COMPLETED

### ✅ What Was Fixed

1. **facebookPageRouter.js** - FIXED ✓
   - ❌ **BEFORE**: Hardcoded Facebook access tokens in lines 12 & 17
   - ✅ **AFTER**: Now uses environment variables
   - **Action taken**: Replaced hardcoded tokens with `process.env` variables

2. **.gitignore** - VERIFIED ✓
   - ✅ Contains `.env` (your secrets file won't be committed)
   - ✅ Contains `node_modules/`
   - ✅ Contains `.vscode/`

3. **.env.example** - UPDATED ✓
   - ✅ Added new Facebook page token variables
   - ✅ Contains ONLY placeholder values (safe to commit)

---

## ⚠️ FILES YOU MUST DELETE FROM GIT HISTORY

If you previously pushed any of these files with real credentials, they're STILL in Git history!

**Files that HAD hardcoded credentials:**
- `facebookPageRouter.js` (FIXED NOW, but old version may be in history)
- `getLongLivedToken.js` (GitGuardian detected this)

**You MUST either:**
1. **Delete the entire GitHub repo** and create a new one (SAFEST)
2. **OR** Rewrite Git history to remove sensitive files (COMPLEX)

---

## 📋 PRE-PUSH SECURITY CHECKLIST

Before pushing to GitHub, verify ALL these items:

### STEP 1: Update Your Local .env File

**IMPORTANT**: Your `.env` file needs new variables after fixing `facebookPageRouter.js`

1. **Open your `.env` file** (NOT .env.example)

2. **Add these new variables** with YOUR REAL tokens:

```bash
# Facebook Multi-Page Configuration
# No Wahala Zone Page
NO_WAHALA_ZONE_PAGE_ID=794703240393538
NO_WAHALA_ZONE_ACCESS_TOKEN=your_real_token_here

# Nigeriacelebrities Page
NIGERIACELEBRITIES_PAGE_ID=2243952629209691
NIGERIACELEBRITIES_ACCESS_TOKEN=your_real_token_here
```

3. **Save the file**

4. **Test your app** to make sure it still works

---

### STEP 2: Verify .env is NOT Being Tracked

Run this command in your terminal:

```bash
git status
```

**YOU SHOULD NOT SEE `.env` in the list!**

- ✅ **GOOD**: `.env` is not listed
- ❌ **BAD**: `.env` appears in "Changes to be committed" or "Untracked files"

**If `.env` appears:**
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

### STEP 3: Search for Hardcoded Secrets

Run these searches in your project:

```bash
# Search for Facebook tokens (should ONLY find .env.example and docs)
grep -r "EAA" --include="*.js" .

# Search for API keys
grep -r "sk-proj" --include="*.js" .
grep -r "sk-" --include="*.js" .
```

**What to look for:**
- ✅ **SAFE**: Found in `.env.example`, documentation files (`*.md`)
- ❌ **DANGER**: Found in actual code files (`*.js`, `*.ts`, `*.py`)

---

### STEP 4: Review Files to Be Committed

Before `git push`, check what you're about to commit:

```bash
git diff --cached
```

**Review the output carefully!**

Look for:
- ❌ Access tokens starting with `EAA`
- ❌ API keys starting with `sk-`
- ❌ MongoDB URIs with real passwords
- ❌ WordPress passwords
- ❌ Any credentials or secrets

**If you see ANY secrets:**
1. **DON'T PUSH!**
2. Remove the secret from the file
3. Move it to `.env`
4. Update the code to use `process.env.VARIABLE_NAME`
5. Commit again

---

### STEP 5: Check Specific Files

These files are safe to commit (they use environment variables correctly):

**✅ SAFE FILES** (verified):
- `facebook.js` - Uses `process.env`
- `instagram.js` - Uses `process.env`
- `x.js` - Uses `process.env`
- `openai.js` - Uses `process.env`
- `wordpress.js` - Uses `process.env`
- `db.js` - Uses `process.env`
- `facebookPageRouter.js` - **NOW FIXED** - Uses `process.env`

**✅ SAFE TO COMMIT** (contain placeholder examples only):
- `.env.example` - Safe (placeholder values only)
- `*.md` files - Safe (documentation with examples)

**❌ NEVER COMMIT**:
- `.env` - Contains REAL secrets (already in `.gitignore`)
- `config.js` - May contain secrets (already in `.gitignore`)
- Any file with `*token*.js` pattern

---

### STEP 6: Final Git Commands Before Push

**OPTION A: If this is a NEW repo (no previous pushes)**

```bash
# 1. Add files (will respect .gitignore)
git add .

# 2. Check what's being added
git status

# 3. Verify no secrets
git diff --cached | grep -i "token\|key\|password"

# 4. Commit
git commit -m "Secure: Remove hardcoded credentials, use environment variables"

# 5. Push
git push origin main
```

**OPTION B: If you PREVIOUSLY pushed secrets**

**🚨 DO NOT USE OPTION A!**

The secrets are still in Git history. You MUST:

1. **Delete the GitHub repo**:
   - Go to: https://github.com/whaaala/siteData/settings
   - Scroll to "Danger Zone"
   - Click "Delete this repository"
   - Confirm deletion

2. **Create a NEW repository**:
   ```bash
   # Remove old Git history
   rm -rf .git

   # Initialize new repo
   git init
   git add .
   git commit -m "Initial commit with proper security"

   # Create new GitHub repo and push
   git remote add origin https://github.com/whaaala/NEW-REPO-NAME.git
   git push -u origin main
   ```

---

## 🔐 SECURITY BEST PRACTICES GOING FORWARD

### 1. NEVER Hardcode Credentials

❌ **BAD**:
```javascript
const token = 'EAABsbCS1iHgBO...'
```

✅ **GOOD**:
```javascript
const token = process.env.FACEBOOK_ACCESS_TOKEN
```

### 2. Always Use .env for Secrets

**What belongs in `.env`:**
- API keys
- Access tokens
- Passwords
- MongoDB URIs
- Any sensitive data

**What can be in code:**
- Public configuration
- URLs (unless they contain secrets)
- Page IDs (they're not secret)
- Logic and algorithms

### 3. Update .env.example

When you add new environment variables:
1. Add them to `.env` with REAL values
2. Add them to `.env.example` with PLACEHOLDER values
3. Commit ONLY `.env.example` to Git

### 4. Review Before Every Commit

```bash
# Always check what you're committing
git status
git diff

# Search for potential secrets
git diff | grep -i "EAA\|sk-\|password\|secret"
```

### 5. Use Git Hooks (Optional but Recommended)

Install a pre-commit hook to check for secrets:

```bash
npm install --save-dev husky
npx husky init
```

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
if git diff --cached | grep -q "EAA\|sk-proj\|mongodb+srv://.*:.*@"; then
  echo "❌ ERROR: Detected potential secrets in commit!"
  exit 1
fi
```

---

## ✅ FINAL CHECKLIST

Before pushing to GitHub:

- [ ] Fixed `facebookPageRouter.js` to use environment variables ✓
- [ ] Updated local `.env` with new Facebook page token variables
- [ ] Verified `.env` is in `.gitignore` ✓
- [ ] Verified `.env` is NOT in `git status`
- [ ] Searched code for hardcoded secrets (found none) ✓
- [ ] Checked `git diff --cached` for secrets
- [ ] Decided on repo strategy:
  - [ ] **NEW REPO**: Safe to push
  - [ ] **EXISTING REPO WITH HISTORY**: Deleted old repo, creating new one
- [ ] Tested app still works after changes
- [ ] Ready to push!

---

## 🆘 IF GITGUARDIAN ALERTS YOU AGAIN

1. **STOP** - Don't push again
2. **Revoke the tokens** immediately
3. **Check what was exposed** (GitGuardian will tell you)
4. **Fix the code** (use environment variables)
5. **Delete the repo** or rewrite history
6. **Generate new tokens**
7. **Update `.env`** with new tokens
8. **Push again** (after fixes)

---

## 📞 REMEMBER

**Security First, Always:**
- Leaked credentials can never be "unleaked"
- Once on GitHub, assume they're compromised
- Always revoke and regenerate after exposure
- Prevention is 1000x easier than cleanup

**Stay Safe! 🔒**
