# LP Production Template (Astro + TypeScript + SCSS + Playwright)

A standardized production template for high-craft **Landing Pages (LP) & Corporate Websites**, featuring an automated quality assurance pipeline (CI/CD-ready): **Static Build**, **TypeScript 7**, **SCSS (BEM)**, **Biome**, **Stylelint**, **Custom ESLint (WCAG AAA & Semantic SEO)**, and **Playwright E2E Audits**.

---

## 1. Tech Stack & Core Tooling

| Category               | Library / Tool           | Version               | Purpose                                                         |
| :--------------------- | :----------------------- | :-------------------- | :-------------------------------------------------------------- |
| **Core Framework**     | Astro + React 19         | `^7.4.11` / `^19.3.1` | Static Site Generation, Island Architecture & Interactive UI    |
| **Language**           | TypeScript               | `^7.0.2`              | Strict static type checking                                     |
| **Styling**            | Sass Embedded (SCSS)     | `^1.108.2`            | Modular CSS architecture following BEM (`c-`, `l-`, `p-`, `u-`) |
| **Linter & Formatter** | Biome + Prettier         | `2.6.6` / `^3.10.1`   | Ultra-fast JS/TS linting & code formatting                      |
| **CSS Linter**         | Stylelint                | `^17.16.0`            | SCSS syntax enforcement & automated CSS property sorting        |
| **A11y & SEO Linter**  | ESLint 10 + Custom Rules | `^10.0.0`             | Real-time WCAG AAA, Semantic SEO & HTML structure checks        |
| **E2E & Audit**        | Playwright + Axe-Core    | `^1.65.0` / `^4.14.0` | Automated WCAG AAA & Technical SEO scoring on production builds |

---

## 2. Prerequisites

This project requires the minimum Node.js and pnpm versions specified in `engines`:

- **Node.js**: `>= 24.22.3`
- **pnpm**: `>= 10.0.0` (`pnpm@10.22.0` recommended)
- **IDE**: Visual Studio Code (VS Code)

Verify your current local versions:

```bash
node -v
pnpm -v
```

---

## 3. Installation & Quick Start

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Auto-Install Recommended VS Code Extensions

Run the following script to automatically install all required extensions (Astro, ESLint, Biome, Stylelint, Prettier, EditorConfig) from `.vscode/extensions.json`:

```bash
pnpm setup:extensions
```

### Step 3: Start the Development Server

```bash
pnpm dev
```

Open `http://localhost:4321` in your browser.

---

## 4. `package.json` Scripts Reference

### 🚀 Development & Build

- `pnpm dev`: Starts the local development server with Hot Module Replacement (HMR).
- `pnpm build`: Builds the entire project into static assets (`dist/`).
- `pnpm preview`: Previews the production build locally.
- `pnpm typecheck`: Syncs Astro types (`astro sync`) and runs TypeScript type checking (`tsc --noEmit`).

### 🧹 Code Linting & Auto-Formatting

- `pnpm lint`: Runs all linters across **JS/TS (`lint:js`)**, **SCSS (`lint:css`)**, and **Accessibility/SEO (`lint:a11y`)**.
- `pnpm lint:js`: Checks JS/TS logic and rules using **Biome**.
- `pnpm lint:css`: Checks CSS/SCSS syntax and property order using **Stylelint**.
- `pnpm lint:a11y`: Scans all `.astro` files with **ESLint + Custom Rules** (WCAG AAA, Semantic SEO, and HTML nesting validation).
- `pnpm fix`: Auto-fixes all fixable JS and CSS issues and formats the entire codebase.
- `pnpm fix:js`: Auto-fixes JS/TS issues with Biome.
- `pnpm fix:css`: Auto-fixes SCSS issues and sorts CSS properties using `recess-order`.
- `pnpm format`: Formats all `.css`, `.scss`, and `.astro` files with Prettier.
- `pnpm format:check`: Verifies code formatting (used in CI/CD before merging).

### 🧪 Automated Testing (Playwright E2E Audits)

- `pnpm test:a11y`: Runs **WCAG 2.1/2.2 Level AAA** accessibility audits via `@axe-core/playwright`.
- `pnpm test:seo`: Runs **Technical SEO & Semantic Hierarchy** audits (Meta tags, Open Graph, JSON-LD, Heading outline, Landmarks, Image dimensions, etc.).
- `pnpm test:audit`: Builds the production bundle (`astro build`) and runs the full Playwright test suite (`e2e/`).
- `pnpm check`: **Pre-delivery / pre-deployment verification command** (sequentially runs `typecheck` → `lint` → `format:check` → `test:audit`).

---

## 5. Standard Directory Structure

```text
├── .vscode/                 # VS Code workspace settings & recommended extensions
├── e2e/                     # Playwright automated audit test suites
│   ├── a11y.spec.ts         # WCAG AAA audit powered by Axe-Core
│   └── seo.spec.ts          # Technical SEO & Semantic DOM audit
├── eslint-rules/            # Project-specific custom ESLint rules
│   └── wcag-seo-guide.js    # WCAG AAA, SEO & HTML nesting diagnostics with quick fixes
├── public/                  # Static assets & unbundled images (favicon, robots.txt, OG images, /images/...)
├── src/
│   ├── assets/              # Imported assets only (images optimized via Sharp, SCSS, fonts...)
│   │   └── styles/          # Global SCSS architecture
│   │       ├── global/      # Variables, functions, mixins (flexbox, media queries...)
│   │       ├── foundation/  # Reset, typography, base styles
│   │       ├── components/  # Reusable component styles (.c-*)
│   │       ├── layout/      # Layout structure styles (.l-header, .l-footer...)
│   │       ├── page/        # Page-specific styles (top.scss, about.scss...)
│   │       └── common.scss  # Site-wide shared CSS entry
│   ├── components/          # Reusable UI components (Button.astro, Header.astro, Footer.astro...)
│   ├── data/                # Site configuration & page-level metadata (site.ts, pages.ts)
│   ├── layouts/             # Page layout shells (Layout.astro, BaseHead.astro)
│   ├── pages/               # File-based routing pages (index.astro, about/index.astro...)
│   └── scripts/             # Client-side interactive JavaScript/TypeScript
│       ├── common.ts        # Site-wide shared scripts (header scroll, mobile menu...)
│       └── top.ts           # Page-specific script (mapped via pageScript="top")
├── astro.config.mjs         # Astro, Vite build, Sharp image & CSS entry configuration
├── biome.json               # Biome linter & formatter rules
├── eslint.config.mjs        # ESLint v10 Flat Config
├── playwright.config.ts     # Playwright test runner & webServer configuration
├── stylelint.config.mjs     # Stylelint SCSS configuration
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 6. Feature Development & Adding New Pages

### 6.1. Creating a New Page & Attaching Page-Specific JS via `pageScript`

Every page inside `src/pages/` wraps its content in `<Layout>`. To load JavaScript/TypeScript exclusively for a specific page without bloating other pages, pass the `pageScript` prop:

1. **Create the page script** in `src/scripts/` (e.g., `src/scripts/top.ts` or `src/scripts/about.ts`):

   ```typescript
   // src/scripts/top.ts
   document.addEventListener("DOMContentLoaded", () => {
     console.log("Top page script initialized");
   });
   ```

   _(Note: Vite in `astro.config.mjs` is configured to automatically collect all entries matching `src/scripts/*.ts` during build)._

2. **Declare `pageScript` in your `.astro` page**:

   ```astro
   ---
   // src/pages/index.astro
   import Layout from "../layouts/Layout.astro";
   import "@/assets/styles/pages/top.scss";
   ---

   <Layout pageScript="top">
     <section class="p-top-hero">
       <h1>Main Page Heading</h1>
     </section>
   </Layout>
   ```

   - `pageScript="top"` automatically injects the bundled `src/scripts/top.ts` at the end of that page.
   - If a page requires no custom JS, simply omit the `pageScript` prop (shared behaviors such as header and navigation remain active via the global script).
   - Whenever you add a new route (e.g., `/about/`), update `TARGET_ROUTES = ['/', '/about/']` in `e2e/seo.spec.ts` and `e2e/a11y.spec.ts` so Playwright audits it automatically.

### 6.2. Writing & Organizing SCSS

The SCSS architecture resides in `src/assets/styles/` and strictly follows **BEM** conventions with namespace prefixes:

- **Class Naming Conventions**:
  - `.l-*`: **Layout** — Structural wrappers (`.l-header`, `.l-footer`, `.l-main`, `.l-container`).
  - `.c-*`: **Component** — Reusable UI blocks (`.c-btn`, `.c-card`, `.c-breadcrumb`).
  - `.p-*`: **Page** — Page-specific sections (`.p-top-hero`, `.p-about-company`).
  - `.u-*`: **Utility** — Helper classes (`.u-pc-only`, `.u-sp-only`, `.sr-only`).

- **Adding SCSS for a New Page or Component**:
  1. **Page-specific SCSS**: Create `src/assets/styles/page/<page-name>.scss` (e.g., `about.scss`), import variables/mixins with `@use '../global' as *;` at the top, and import the stylesheet in the page's frontmatter (`import '../assets/styles/page/about.scss';`). Astro/Vite automatically bundles it into a dedicated CSS chunk for that page.
  2. **Component SCSS**: Create `src/assets/styles/components/_<component-name>.scss` (e.g., `_button.scss`) and register `@forward 'button';` in `src/assets/styles/components/_index.scss` (or import it directly inside the component's `.astro` file).
  3. **Auto-Formatting**: Saving a file (`Ctrl + S` / `Cmd + S`) automatically runs Stylelint and Prettier to format and sort CSS properties according to `recess-order`.

### 6.3. Asset & Image Management (`public/` vs `src/assets/`)

- **`public/`**: Stores static project images referenced directly via root-relative URLs (e.g., `/images/top/hero.jpg` in standard `<img>` tags, CSS `background-image`, OG images, and favicons). Files here are copied as-is into `dist/` during build.
- **`src/assets/`**: Reserved exclusively for images imported directly into `.astro` or `.tsx` files (e.g., `import heroImg from '../assets/images/hero.png'`) so Astro and Sharp can compress, resize, and convert them to WebP with hashed filenames.

---

## 7. Accessibility (WCAG AAA) & Semantic SEO Standards

### 7.1. Real-Time Code Diagnostics (ESLint Custom Rules)

While authoring `.astro` markup, ESLint provides real-time warnings with inline examples and quick fixes for any violations:

- **Images & Icons**: `<img>` must include an `alt` attribute (or `alt="" aria-hidden="true"` if decorative); `<svg>` must specify `aria-hidden="true" focusable="false"` or `role="img" aria-label="..."`.
- **Buttons & Links**: `<button>` must explicitly declare `type="button"` or `type="submit"`; `<a href="#">` and empty links are prohibited; attaching `onClick` to non-interactive elements (`<div>`, `<span>`) is disallowed.
- **Forms**: `<input>`, `<select>`, and `<textarea>` must be paired with a `<label for="...">` or provide an `aria-label`.
- **Heading Hierarchy**: Each page must have **only one `<h1>`** inside `<main>`, and headings must follow strict sequential order (`h1 → h2 → h3 → h4 → h5 → h6`) without skipping levels, leaving headings empty, or hiding them with `aria-hidden="true"`.
- **WHATWG HTML Content Model**: Catches invalid tag nesting (`<ul>/<ol>` only accept `<li>`, `<p>` cannot wrap block elements, and interactive elements `<a>`/`<button>` cannot be nested inside one another).

---

## 8. Pre-Deployment Checklist

Before packaging source code or deploying to production, run the full verification suite:

```bash
pnpm check
```

Confirm that all four stages pass with **0 errors**:

1. `typecheck`: Zero TypeScript errors or mismatched component prop types.
2. `lint`: 100% compliance with Biome, Stylelint, and custom ESLint WCAG AAA / SEO rules.
3. `format:check`: Consistent code formatting across the repository.
4. `test:audit`: **100% Technical SEO Score** (0 Critical Errors) and **0 WCAG AAA Violations** across all routes defined in `TARGET_ROUTES`.
