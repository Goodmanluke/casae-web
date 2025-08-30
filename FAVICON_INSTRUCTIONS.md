# Favicon Setup Instructions

To set up the favicon for your CMAi application:

## Method 1: Online Converter (Recommended)
1. Go to https://favicon.io/favicon-converter/
2. Upload your `cmai-logo.png` file from the `public` folder
3. Download the generated `favicon.ico` file
4. Replace the placeholder file in `public/favicon.ico`

## Method 2: Using ImageMagick
If you have ImageMagick installed:
```bash
convert public/cmai-logo.png -resize 32x32 public/favicon.ico
```

## Method 3: Using GIMP or Photoshop
1. Open `cmai-logo.png` in GIMP or Photoshop
2. Resize to 32x32 pixels
3. Export as ICO format
4. Save as `public/favicon.ico`

## Verification
After creating the favicon:
1. Clear your browser cache
2. Refresh the page
3. You should see the CMAi logo in the browser tab

The favicon will automatically be used by Next.js when placed in the `public` folder.

