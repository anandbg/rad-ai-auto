# AI Radiologist Landing Page

Complete landing page package for AI-powered radiology reporting platform. This folder contains all the components, styles, assets, and configuration needed to recreate the landing page in another project.

## 📦 Package Contents

```
landing/
├── README.md                          # This file - setup guide
├── components/
│   └── landing/
│       ├── landing-page.tsx          # Main landing page component
│       └── demo-animation.tsx        # Interactive demo carousel
├── styles/
│   ├── globals.css                   # Base styles and utilities
│   └── tokens.css                    # CSS custom properties (theme)
├── public/
│   └── demo-screenshots/             # 14 demo screenshots (PNG)
│       ├── 1-transcribe home.png
│       ├── 2-file upload.png
│       ├── 3-recording in progress.png
│       ├── 4-transribing.png
│       ├── 5-select template.png
│       ├── 6-choose template.png
│       ├── 7-ready to generate.png
│       ├── 8-generating report.png
│       ├── 9-generated report.png
│       ├── 10-templates library.png
│       ├── 11-create template.png
│       ├── 12-create template from blank using AI.png
│       ├── 13-macro library.png
│       └── 14-create marco.png
└── tailwind.config.ts                # Tailwind configuration
```

## 🚀 Quick Start

### Prerequisites

- Next.js 13+ (with App Router)
- React 18+
- Tailwind CSS 3+
- TypeScript

### Step 1: Install Dependencies

```bash
# Using npm
npm install lucide-react

# Using pnpm
pnpm add lucide-react

# Using yarn
yarn add lucide-react
```

### Step 2: Copy Files to Your Project

#### Option A: Manual Copy

1. **Copy component files:**
   ```bash
   cp -r landing/components/landing your-project/components/
   ```

2. **Copy demo screenshots:**
   ```bash
   cp -r landing/public/demo-screenshots your-project/public/
   ```

3. **Copy or merge style files:**
   ```bash
   # If you don't have existing styles, copy directly:
   cp landing/styles/globals.css your-project/styles/
   cp landing/styles/tokens.css your-project/styles/

   # If you have existing styles, merge the contents manually
   ```

4. **Merge Tailwind configuration:**
   ```bash
   # Merge landing/tailwind.config.ts with your existing config
   # See "Tailwind Configuration" section below
   ```

#### Option B: Automated Script

Create a file `copy-landing.sh` in your target project:

```bash
#!/bin/bash

# Set source and destination
SOURCE="/path/to/landing"
DEST="."

# Copy components
mkdir -p "$DEST/components/landing"
cp -r "$SOURCE/components/landing/"* "$DEST/components/landing/"

# Copy screenshots
mkdir -p "$DEST/public/demo-screenshots"
cp -r "$SOURCE/public/demo-screenshots/"* "$DEST/public/demo-screenshots/"

# Copy styles (backup existing if they exist)
mkdir -p "$DEST/styles"
if [ -f "$DEST/styles/globals.css" ]; then
  cp "$DEST/styles/globals.css" "$DEST/styles/globals.css.backup"
fi
if [ -f "$DEST/styles/tokens.css" ]; then
  cp "$DEST/styles/tokens.css" "$DEST/styles/tokens.css.backup"
fi

cp "$SOURCE/styles/globals.css" "$DEST/styles/"
cp "$SOURCE/styles/tokens.css" "$DEST/styles/"

echo "✅ Landing page files copied successfully!"
echo "⚠️  Remember to merge tailwind.config.ts manually"
```

Then run:
```bash
chmod +x copy-landing.sh
./copy-landing.sh
```

### Step 3: Import Styles in Your App

In your `app/layout.tsx` or main entry point:

```tsx
import "@/styles/globals.css";
```

Make sure `globals.css` imports `tokens.css`:
```css
@import "./tokens.css";
```

### Step 4: Use the Landing Page Component

```tsx
// app/page.tsx or wherever you want the landing page
import { LandingPage } from "@/components/landing/landing-page";

export default function HomePage() {
  return <LandingPage />;
}
```

## ⚙️ Configuration

### Tailwind Configuration

Merge the provided `tailwind.config.ts` with your existing configuration. Key sections to include:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // ... your existing content paths
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)"
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)"
        },
        foreground: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          invert: "rgb(var(--text-invert) / <alpha-value>)"
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)"
        },
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          strong: "rgb(var(--brand-strong) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          light: "rgb(var(--brand-light) / <alpha-value>)",
          foreground: "rgb(var(--brand-foreground) / <alpha-value>)"
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          light: "rgb(var(--success-light) / <alpha-value>)"
        },
        // ... other colors
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        // ... other animations
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        // ... other keyframes
      }
    }
  },
  plugins: []
};

export default config;
```

### Routing Configuration

Update the navigation links to match your routing:

```tsx
// In components/landing/landing-page.tsx

// Current links:
<Link href="/sign-up">Try Platform Free</Link>
<Link href="/sign-in">Sign In</Link>
<Link href="/billing">Subscribe</Link>

// Update these to match your routes:
<Link href="/auth/signup">Try Platform Free</Link>
<Link href="/auth/login">Sign In</Link>
<Link href="/pricing">Subscribe</Link>
```

## 🎨 Customization

### Colors & Branding

Edit `styles/tokens.css` to change the color scheme:

```css
:root {
  /* Brand Colors - Customize these */
  --brand: 99 102 241;        /* Primary brand color (purple-blue) */
  --brand-strong: 79 70 229;  /* Darker variant */
  --brand-light: 238 242 255; /* Lighter variant */

  /* Or use your brand colors (RGB format): */
  --brand: 255 0 0;           /* Example: Red */
  --brand-strong: 200 0 0;    /* Example: Dark red */
  --brand-light: 255 230 230; /* Example: Light red */
}
```

### Content

Edit `components/landing/landing-page.tsx`:

1. **Hero Section** (lines 24-65)
   - Change headline, description, CTA buttons

2. **Demo Screenshots** (lines 68-214)
   - Update screenshot paths
   - Modify descriptions and marketing copy

3. **Features Grid** (lines 216-300)
   - Add/remove/edit features

4. **Benefits Section** (lines 302-349)
   - Update statistics and benefits

5. **Pricing Section** (lines 351-486)
   - Modify pricing tiers and features

6. **Privacy Section** (lines 488-529)
   - Update privacy/compliance messaging

### Demo Animation

Customize the carousel in `components/landing/demo-animation.tsx`:

```tsx
// Adjust timing
transitionDuration={4000}  // 4 seconds per slide
autoPlay={true}           // Auto-advance slides
loop={true}               // Loop continuously

// Customize appearance
className="rounded-3xl border-2 border-brand/20"
```

## 🖼️ Screenshots

### Adding/Replacing Screenshots

1. Add images to `public/demo-screenshots/`
2. Update the `screenshots` array in `landing-page.tsx`:

```tsx
screenshots={[
  {
    id: "unique-id",
    imageSrc: "/demo-screenshots/your-image.png",
    title: "Section Name",
    marketingTitle: "Main Headline",
    marketingDescription: "Description of what this shows...",
    marketingBenefit: "How this helps the user...",
    duration: 4500,
    zoomFocus: { x: 50, y: 45 }, // Optional zoom center
  },
  // ... more screenshots
]}
```

### Image Optimization

For best performance:
- Use Next.js Image Optimization (already configured)
- Compress PNGs (use tools like TinyPNG)
- Recommended dimensions: 1920x1080 or 2560x1440

## 🔧 Troubleshooting

### Issue: Styles Not Applying

**Solution:**
1. Ensure `globals.css` is imported in your root layout
2. Verify `tokens.css` is imported in `globals.css`
3. Check that Tailwind content paths include your components

### Issue: Images Not Loading

**Solution:**
1. Verify images are in `public/demo-screenshots/`
2. Check image paths start with `/demo-screenshots/` (not `./`)
3. Ensure Next.js `public` directory is correctly configured

### Issue: TypeScript Errors

**Solution:**
1. Install required types: `npm install -D @types/react @types/node`
2. Ensure `tsconfig.json` has proper path aliases:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

### Issue: Tailwind Classes Not Working

**Solution:**
1. Verify Tailwind is installed: `npm install -D tailwindcss postcss autoprefixer`
2. Run `npx tailwindcss init -p` if missing config
3. Ensure `tailwind.config.ts` content paths include all component files

## 📝 Features Included

### Components
- ✅ Responsive hero section with gradient background
- ✅ Interactive demo carousel with 14 screenshots
- ✅ Features grid (6 feature cards)
- ✅ Benefits section with statistics
- ✅ Pricing table (4 tiers)
- ✅ Privacy/compliance section
- ✅ Multiple CTAs (Call-to-Action buttons)

### Functionality
- ✅ Auto-playing demo carousel
- ✅ Manual navigation (arrows + dots)
- ✅ Pause on hover
- ✅ Smooth transitions and animations
- ✅ Lazy loading for performance
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessibility features (ARIA labels, keyboard navigation)

### Styling
- ✅ Custom design system with CSS variables
- ✅ Dark mode support (via CSS variables)
- ✅ Consistent spacing and typography
- ✅ Modern gradients and shadows
- ✅ Hover states and transitions

## 🎯 Next Steps

After setup, consider:

1. **Update Routes** - Customize sign-up, sign-in, and billing links
2. **Add Analytics** - Track conversions and user behavior
3. **SEO Optimization** - Add meta tags, structured data
4. **Performance** - Optimize images, lazy load components
5. **A/B Testing** - Test different headlines and CTAs
6. **Accessibility** - Test with screen readers
7. **Internationalization** - Add multi-language support

## 📄 License

This landing page is part of the AI Radiologist project. Please ensure you have the appropriate rights to use it in your project.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the original project structure
3. Verify all dependencies are installed

---

**Created:** 2026-01-18
**Version:** 1.0.0
**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide Icons
