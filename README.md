# Deal Drip — Beyond the Screen

An interactive, premium 3D eCommerce storefront powered by **Next.js 16 (App Router)**, **React 19**, **Three.js**, **TypeScript**, and **Vanilla CSS**.

---

## ✨ Features & Highlights

- **Pinned 3D Scroll Story**:
  - 5 interactive chapters featuring Draco-compressed 3D GLB models (*Speaker & Charging Dock*, *Scarlett Solo 3rd Gen*, *TWOLF TF200 Keyboard*, *Precision Mouse*, *Foldable Silicone Bottle*).
  - WebGL rendering with PBR `RoomEnvironment` HDR-style lighting.
  - Interactive horizontal drag and arrow-key model rotation with smooth momentum lerping.
  - Dynamic ambient backdrop gradients and scroll progress synchronization.
- **11-Product Curated Catalog**:
  - Filterable by category (*All objects*, *Audio*, *Gaming*, *Everyday*).
  - Hover zoom previews, quickview triggers, and direct bag addition.
- **3D Product Quickview Dialog**:
  - Full 360° interactive rotation stage for all 11 Draco 3D models.
  - Accessible modal dialogs with escape key handling, quantity selector, and color swatches.
- **Session Shopping Bag & Checkout**:
  - Slide-out shopping bag drawer with line items, quantities, removal, and live NPR subtotal calculation.
  - Order review modal for reviewing total selections.
- **Interactive TF200 3D Typing Demo ("Make it click")**:
  - Real-time keyboard controller that triggers 105 actual keypress animations (`Press_${name}`) from the GLTF model.
- **WebMCP Agent Tool Integration**:
  - Registers storefront tools (`list_products`, `add_products_to_bag`) with supporting AI browser agents via `window.modelContext` / `document.modelContext`.
- **Graceful Fallbacks**:
  - High-fidelity raster previews and WebGL capability detection for lower-power devices.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) with Draco GLTF Loader
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with modern design tokens & glassmorphism aesthetics
- **Fonts**: Space Grotesk & Manrope

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

### 4. Linting
```bash
npm run lint
```

---

## 📁 Project Structure

```
├── public/
│   └── assets/
│       ├── draco/          # Draco WebAssembly decoders
│       ├── models/         # 11 optimized 3D GLB models
│       ├── previews/       # WebP/PNG preview fallbacks
│       └── *.woff2         # Space Grotesk & Manrope font assets
├── src/
│   ├── app/
│   │   ├── globals.css     # Complete Deal Drip design system
│   │   ├── layout.tsx      # Root layout, fonts, providers, global dialogs
│   │   └── page.tsx        # Storefront page structure & scroll reveals
│   ├── components/
│   │   ├── BagDialog.tsx         # Shopping bag flyout drawer
│   │   ├── CheckoutDialog.tsx    # Order review modal
│   │   ├── ClosingSection.tsx    # Bottom CTA section
│   │   ├── CollectionSection.tsx # 11-product catalog grid with category filters
│   │   ├── Footer.tsx            # Footer navigation & back-to-top
│   │   ├── Header.tsx            # Sticky header with navigation & bag counter
│   │   ├── HeroStory3D.tsx       # Pinned 5-chapter 3D scroll story
│   │   ├── KeyboardDemo3D.tsx    # Interactive TF200 3D typing stage
│   │   ├── ProductDialog.tsx     # 3D quickview modal with drag controls
│   │   ├── Toast.tsx             # Notification toast
│   │   └── WebMCPBridge.tsx      # Model Context Protocol browser agent tools
│   ├── context/
│   │   └── StoreContext.tsx      # Global cart, filter, and modal state
│   └── data/
│       └── catalog.ts            # Typed product data, chapters, and helper utilities
└── dist/                         # Static export bundle
```

---

## 📄 License

MIT
