# Figcaption Styling - Centered and Responsive

## Overview

Image captions (figcaption elements) are now fully styled to be **centered, responsive, and professional-looking** across all WordPress posts and devices.

## Implementation

### Location
`publishStage.js` - Lines 547-571

### CSS Styling Applied

```css
/* Figcaption styling - centered and responsive */
figcaption {
  display: block !important;
  text-align: center !important;
  margin: 0.5rem auto 1rem auto !important;
  padding: 0.5rem 1rem !important;
  max-width: 100% !important;
  font-size: 0.9rem !important;
  font-style: italic !important;
  color: #666 !important;
  line-height: 1.4 !important;
}

/* Responsive figcaptions for mobile */
@media (max-width: 768px) {
  figcaption {
    font-size: 0.85rem !important;
    padding: 0.4rem 0.5rem !important;
  }
}

/* Figure container styling */
figure {
  margin: 1rem auto !important;
  text-align: center !important;
  max-width: 100% !important;
}
```

## Features

### 1. Centered Alignment
- **`text-align: center`** - Text is centered horizontally
- **`margin: 0.5rem auto 1rem auto`** - Element is centered in its container
- **`display: block`** - Ensures proper block-level rendering

### 2. Responsive Design
- **`max-width: 100%`** - Never overflows container
- **Mobile breakpoint** - Smaller font and padding on screens < 768px
- **Fluid sizing** - Uses rem units for scalability

### 3. Professional Styling
- **Font size**: 0.9rem (desktop), 0.85rem (mobile)
- **Font style**: Italic for caption differentiation
- **Color**: #666 (medium gray) for subtle appearance
- **Line height**: 1.4 for readability
- **Padding**: Comfortable spacing around text

### 4. Figure Container
- **Centered**: `margin: auto` and `text-align: center`
- **Responsive**: `max-width: 100%`
- **Proper spacing**: Top and bottom margins

## Visual Examples

### Desktop View
```
┌─────────────────────────────────────────┐
│                                         │
│          [Feature Image]                │
│                                         │
├─────────────────────────────────────────┤
│  Caption text centered and styled       │
│           in italic gray                │
└─────────────────────────────────────────┘
```

### Mobile View (< 768px)
```
┌──────────────────────┐
│                      │
│   [Feature Image]    │
│                      │
├──────────────────────┤
│ Smaller caption text │
│   centered below     │
└──────────────────────┘
```

## Benefits

### 1. Consistent Design
- ✅ All figcaptions look the same across all posts
- ✅ Professional appearance maintained
- ✅ Matches modern web design standards

### 2. Readability
- ✅ Centered text is easier to associate with image above
- ✅ Italic style differentiates captions from body text
- ✅ Gray color reduces visual noise
- ✅ Proper line height improves multi-line captions

### 3. Responsive Behavior
- ✅ Automatically adjusts to screen size
- ✅ Smaller text on mobile saves space
- ✅ Never breaks layout or causes horizontal scroll
- ✅ Works on all devices (desktop, tablet, mobile)

### 4. Professional Polish
- ✅ Subtle italic styling looks sophisticated
- ✅ Consistent spacing creates visual harmony
- ✅ Gray color doesn't compete with content
- ✅ Centered alignment feels balanced

## Technical Details

### CSS Specificity
All styles use `!important` to ensure they override:
- WordPress theme styles
- Plugin styles
- Default browser styles
- Inline styles from scraped content

### Rem Units
- **0.9rem** ≈ 14.4px (on default 16px base)
- **0.5rem** ≈ 8px spacing
- **1rem** ≈ 16px spacing
- Scales proportionally with browser zoom

### Media Query
- **Breakpoint**: 768px (standard tablet/mobile cutoff)
- **Mobile adjustments**: Smaller font, reduced padding
- **Why 768px?**: Industry standard for responsive design

## Applied To

This styling applies to:
- ✅ All WordPress posts
- ✅ All scraped sites (pulse.ng, legit.ng, daily post, etc.)
- ✅ All categories (News, Entertainment, Sports, etc.)
- ✅ All images with captions
- ✅ Future posts automatically

## Examples of Affected Elements

### HTML Structure
```html
<figure>
  <img src="image.jpg" alt="Image description">
  <figcaption>This caption will be centered and styled</figcaption>
</figure>
```

### Result
The figcaption will display:
- Centered horizontally
- In italic gray text
- With comfortable padding
- Responsive to screen size
- Professional appearance

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Opera
- ✅ Mobile browsers (Chrome, Safari, Samsung Internet)

## WordPress Theme Compatibility

The `!important` declarations ensure styling works with:
- Any WordPress theme
- Gutenberg blocks
- Classic editor
- Custom post types
- Page builders

## Testing Checklist

To verify figcaptions are working correctly:

### Desktop Test
1. ✅ Open WordPress post with images
2. ✅ Check figcaptions are centered below images
3. ✅ Verify italic gray text
4. ✅ Confirm proper spacing

### Mobile Test
1. ✅ Open post on mobile device (or use browser DevTools)
2. ✅ Check figcaptions are still centered
3. ✅ Verify smaller font size (should be readable, not tiny)
4. ✅ Confirm no horizontal scrolling

### Responsive Test
1. ✅ Resize browser window from wide to narrow
2. ✅ Observe figcaption adjusts at 768px breakpoint
3. ✅ Verify no layout breaks at any size

## Related Styling

### Images
Images are also styled for consistency:
- Centered: `display: block; margin: 0 auto`
- Responsive: `max-width: 100%`
- Height limited: `max-height: 30rem`

### Figure Container
Figure elements wrap both image and caption:
- Centered: `margin: auto`
- Responsive: `max-width: 100%`
- Proper spacing: Top and bottom margins

## Future Enhancements

Potential improvements:
1. Dark mode support (lighter gray for dark backgrounds)
2. Animation on hover
3. Click to expand caption for long text
4. Different styling per category
5. Optional caption position (top/bottom/overlay)

## Maintenance

No maintenance required - styling is applied automatically to all posts during the publishing stage.

## Rollback

If issues occur, the styling can be removed by deleting lines 547-571 in `publishStage.js`. However, this is not recommended as the styling follows web design best practices.

## Related Files

- **`publishStage.js`** (lines 547-571) - CSS styling
- **`publishStage.js`** (lines 338-346) - Inline margin backup

## Summary

Figcaptions are now:
- ✅ **Centered** horizontally below images
- ✅ **Responsive** on all screen sizes
- ✅ **Styled** professionally with italic gray text
- ✅ **Optimized** for mobile with smaller font
- ✅ **Consistent** across all posts and sites
- ✅ **Automatic** - no manual work needed

All future WordPress posts will have beautifully styled, centered, and responsive figcaptions!
