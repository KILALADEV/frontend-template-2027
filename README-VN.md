# LP Production Template (Astro + TypeScript + SCSS + Playwright)

Template chuẩn hóa dành cho các dự án **Landing Page (LP) & Corporate Website** chất lượng cao, tích hợp sẵn quy trình kiểm soát chất lượng tự động (CI/CD-ready): **Static Build**, **TypeScript 7**, **SCSS (BEM)**, **Biome**, **Stylelint**, **Custom ESLint (WCAG AAA & Semantic SEO)** và **Playwright E2E Audits**.

---

## 1. Tech Stack & Công cụ chính

| Nhóm công nghệ         | Thư viện / Công cụ       | Phiên bản             | Vai trò                                                        |
| :--------------------- | :----------------------- | :-------------------- | :------------------------------------------------------------- |
| **Core Framework**     | Astro + React 19         | `^7.4.11` / `^19.3.1` | Static Site Generation, Island Architecture & Interactive UI   |
| **Language**           | TypeScript               | `^7.0.2`              | Kiểm tra kiểu dữ liệu nghiêm ngặt                              |
| **Styling**            | Sass Embedded (SCSS)     | `^1.108.2`            | Kiến trúc CSS theo chuẩn BEM (`c-`, `l-`, `p-`, `u-`)          |
| **Linter & Formatter** | Biome + Prettier         | `2.6.6` / `^3.10.1`   | Format code & kiểm tra lỗi JS/TS siêu tốc                      |
| **CSS Linter**         | Stylelint                | `^17.16.0`            | Chuẩn hóa cú pháp SCSS & tự động sắp xếp thứ tự thuộc tính CSS |
| **A11y & SEO Linter**  | ESLint 10 + Custom Rules | `^10.0.0`             | Bắt lỗi WCAG AAA, Semantic SEO & cấu trúc HTML ngay khi code   |
| **E2E & Audit**        | Playwright + Axe-Core    | `^1.65.0` / `^4.14.0` | Tự động chấm điểm WCAG AAA & Technical SEO trên bản build thật |

---

## 2. Yêu cầu môi trường (Prerequisites)

Dự án yêu cầu phiên bản Node.js và pnpm tối thiểu như khai báo trong `engines`:

- **Node.js**: `>= 24.22.3`
- **pnpm**: `>= 10.0.0` (khuyến nghị `pnpm@10.22.0`)
- **IDE**: Visual Studio Code (VS Code)

Kiểm tra nhanh phiên bản hiện tại trên máy:

```bash
node -v
pnpm -v
```

---

## 3. Cài đặt & Khởi chạy nhanh

### Bước 1: Cài đặt thư viện

```bash
pnpm install
```

### Bước 2: Cài đặt tự động các VS Code Extensions khuyến nghị

Chạy lệnh sau để tự động cài đặt toàn bộ extension cần thiết (Astro, ESLint, Biome, Stylelint, Prettier, EditorConfig) từ `.vscode/extensions.json`:

```bash
pnpm setup:extensions
```

### Bước 3: Chạy môi trường phát triển (Development)

```bash
pnpm dev
```

Truy cập địa chỉ mặc định tại `http://localhost:4321`.

---

## 4. Danh sách Scripts trong `package.json`

### 🚀 Phát triển & Build

- `pnpm dev`: Khởi chạy server phát triển local với Hot Module Replacement (HMR).
- `pnpm build`: Build toàn bộ dự án ra file tĩnh (thư mục `dist/`).
- `pnpm preview`: Xem trước bản build production ở local.
- `pnpm typecheck`: Đồng bộ kiểu dữ liệu Astro (`astro sync`) và kiểm tra lỗi TypeScript (`tsc --noEmit`).

### 🧹 Kiểm tra & Tự động sửa lỗi Code (Lint & Format)

- `pnpm lint`: Chạy toàn bộ kiểm tra **JS/TS (`lint:js`)**, **SCSS (`lint:css`)** và **Accessibility/SEO (`lint:a11y`)**.
- `pnpm lint:js`: Kiểm tra lỗi logic & quy tắc JS/TS bằng **Biome**.
- `pnpm lint:css`: Kiểm tra cú pháp & thứ tự thuộc tính CSS/SCSS bằng **Stylelint**.
- `pnpm lint:a11y`: Quét toàn bộ file `.astro` bằng **ESLint + Custom Rules** (kiểm tra WCAG AAA, Semantic SEO và cấu trúc lồng thẻ HTML).
- `pnpm fix`: Tự động sửa toàn bộ lỗi có thể fix được của JS, CSS và format lại toàn bộ code.
- `pnpm fix:js`: Tự động sửa lỗi JS/TS bằng Biome.
- `pnpm fix:css`: Tự động sửa lỗi SCSS và sắp xếp thuộc tính CSS theo chuẩn `recess-order`.
- `pnpm format`: Format toàn bộ file `.css`, `.scss`, `.astro` bằng Prettier.
- `pnpm format:check`: Kiểm tra định dạng code (thường dùng trong CI/CD trước khi merge).

### 🧪 Kiểm thử tự động (Playwright E2E Audits)

- `pnpm test:a11y`: Chạy kiểm thử tiêu chuẩn truy cập **WCAG 2.1/2.2 Level AAA** bằng `@axe-core/playwright`.
- `pnpm test:seo`: Chạy kiểm thử **Technical SEO & Semantic Hierarchy** (Meta tags, OpenGraph, JSON-LD, Heading outline, Landmark, Image dimensions...).
- `pnpm test:audit`: Build bản production (`astro build`) và chạy toàn bộ bộ test Playwright (`e2e/`).
- `pnpm check`: **Lệnh tổng kiểm tra trước khi bàn giao / deploy** (chạy tuần tự `typecheck` → `lint` → `format:check` → `test:audit`).

---

## 5. Cấu trúc thư mục chuẩn

```text
├── .vscode/                 # Cấu hình VS Code settings & danh sách extensions
├── e2e/                     # Kịch bản kiểm thử tự động Playwright
│   ├── a11y.spec.ts         # Audit WCAG AAA bằng Axe-Core
│   └── seo.spec.ts          # Audit Technical SEO & Semantic DOM
├── eslint-rules/            # Bộ luật ESLint tùy chỉnh cho dự án
│   └── wcag-seo-guide.js    # Cảnh báo & Quick-fix WCAG AAA, SEO, HTML Nesting
├── public/                  # Tài nguyên tĩnh & ảnh gốc (favicon, robots.txt, OG images, /images/...)
├── src/
│   ├── assets/              # Tài nguyên dùng qua cơ chế import (ảnh tối ưu qua Sharp, SCSS, fonts...)
│   │   └── styles/          # Kiến trúc SCSS toàn dự án
│   │       ├── global/      # Variables, functions, mixins (flexbox, media queries...)
│   │       ├── foundation/  # Reset, typography, base styles
│   │       ├── components/  # Style cho từng component (.c-*)
│   │       ├── layout/      # Style cho khung trang (.l-header, .l-footer...)
│   │       ├── page/        # Style riêng cho từng trang (top.scss, about.scss...)
│   │       └── common.scss  # Entry CSS dùng chung toàn site
│   ├── components/          # Các UI Component tái sử dụng (Button.astro, Header.astro, Footer.astro...)
│   ├── data/                # Dữ liệu cấu hình site, metadata từng trang (site.ts, pages.ts)
│   ├── layouts/             # Khung bố cục trang (Layout.astro, BaseHead.astro)
│   ├── pages/               # Các trang định tuyến (index.astro, about/index.astro...)
│   └── scripts/             # JavaScript/TypeScript xử lý tương tác client
│       ├── common.ts        # Script dùng chung toàn site (Header scroll, menu mobile...)
│       └── top.ts           # Script riêng cho từng trang (map với prop pageScript="top")
├── astro.config.mjs         # Cấu hình Astro, Vite build, Sharp image & CSS entry
├── biome.json               # Cấu hình Biome linter/formatter
├── eslint.config.mjs        # Cấu hình ESLint v10 Flat Config
├── playwright.config.ts     # Cấu hình Playwright test runner & webServer
├── stylelint.config.mjs     # Cấu hình Stylelint SCSS
└── tsconfig.json            # TypeScript compiler configuration
```

---

## 6. Hướng dẫn phát triển tính năng & Thêm trang mới

### 6.1. Tạo trang mới và gắn JS riêng qua `pageScript`

Mỗi trang trong `src/pages/` sử dụng `<Layout>` làm khung bao ngoài. Để tải JavaScript/TypeScript riêng cho một trang mà không làm phình dung lượng các trang khác, hãy truyền prop `pageScript`:

1. **Tạo file script cho trang** tại `src/scripts/` (ví dụ `src/scripts/top.ts` hoặc `src/scripts/about.ts`):

   ```typescript
   // src/scripts/top.ts
   document.addEventListener("DOMContentLoaded", () => {
     console.log("Top page script initialized");
   });
   ```

   _(Lưu ý: Vite trong `astro.config.mjs` đã được cấu hình tự động thu thập toàn bộ entry trong `src/scripts/*.ts` khi build)._

2. **Khai báo `pageScript` trong file `.astro`**:
   ```astro
   ---
   // src/pages/index.astro
   import Layout from "../layouts/Layout.astro";
   import "@/assets/styles/pages/top.scss";
   ---

   <Layout pageScript="top">
     <section class="p-top-hero">
       <h1>Tiêu đề chính của trang</h1>
     </section>
   </Layout>
   ```
   - `pageScript="top"` sẽ tự động nhúng bundle của `src/scripts/top.ts` vào cuối trang tương ứng.
   - Nếu trang không cần JS riêng, chỉ cần bỏ qua prop `pageScript` (các chức năng dùng chung như menu/header vẫn chạy tự động qua script global).
   - Khi thêm route mới (ví dụ `/about/`), nhớ cập nhật mảng `TARGET_ROUTES = ['/', '/about/']` trong `e2e/seo.spec.ts` và `e2e/a11y.spec.ts` để Playwright tự động kiểm thử.

### 6.2. Hướng dẫn viết & tổ chức SCSS

Hệ thống SCSS nằm trong `src/assets/styles/` và tuân thủ chặt chẽ quy chuẩn **BEM** kết hợp tiền tố phân lớp:

- **Quy tắc đặt tên class**:
  - `.l-*`: **Layout** — Khung cấu trúc chính (`.l-header`, `.l-footer`, `.l-main`, `.l-container`).
  - `.c-*`: **Component** — Thành phần dùng lại ở nhiều nơi (`.c-btn`, `.c-card`, `.c-breadcrumb`).
  - `.p-*`: **Page** — Khối giao diện đặc thù chỉ xuất hiện ở 1 trang (`.p-top-hero`, `.p-about-company`).
  - `.u-*`: **Utility** — Class hỗ trợ nhanh (`.u-pc-only`, `.u-sp-only`, `.sr-only`).

- **Cách tạo SCSS cho trang mới hoặc component mới**:
  1. **SCSS riêng cho từng trang**: Tạo file tại `src/assets/styles/page/<tên-trang>.scss` (ví dụ `about.scss`), nạp các biến/mixin bằng `@use '../abstracts' as *;` ở đầu file, sau đó import trực tiếp trong frontmatter của trang (`import '../assets/styles/page/about.scss';`). Astro/Vite sẽ tự động tách thành file CSS riêng cho trang đó.
  2. **SCSS cho Component**: Tạo file tại `src/assets/styles/components/_<tên-component>.scss` (ví dụ `_button.scss`) và đăng ký `@forward 'button';` trong `src/assets/styles/components/_index.scss` (hoặc import trực tiếp trong file `.astro` của component).
  3. **Tự động định dạng**: Khi nhấn lưu file (`Ctrl + S`), VS Code tự động chạy Stylelint và Prettier để sắp xếp thứ tự thuộc tính CSS chuẩn theo `recess-order`.

### 6.3. Quy chuẩn quản lý Hình ảnh (`public/` vs `src/assets/`)

- **`public/`**: Lưu toàn bộ hình ảnh tĩnh của dự án (gọi trực tiếp qua đường dẫn tuyệt đối từ root như `/images/top/hero.jpg`, dùng cho thẻ `<img>` thuần, CSS `background-image`, OG image, favicon). Các file trong `public/` được copy nguyên bản sang `dist/` khi build.
- **`src/assets/`**: Chỉ chứa hình ảnh khi cần `import` trực tiếp vào file `.astro` / `.tsx` (ví dụ `import heroImg from '../assets/images/hero.png'`) để Astro & Sharp tự động nén, resize và chuyển đổi sang định dạng WebP (kèm hash tên file khi bundle).

---

## 7. Quy chuẩn Accessibility (WCAG AAA) & Semantic SEO

### 7.1. Kiểm tra tự động ngay khi code (ESLint Custom Rules)

Khi viết markup trong `.astro`, ESLint sẽ tự động cảnh báo kèm ví dụ sửa lỗi (Quick Fix) nếu vi phạm:

- **Hình ảnh & Icon**: `<img>` bắt buộc có `alt` (hoặc `alt="" aria-hidden="true"` nếu trang trí); `<svg>` bắt buộc có `aria-hidden="true" focusable="false"` hoặc `role="img" aria-label="..."`.
- **Nút bấm & Liên kết**: `<button>` bắt buộc khai báo rõ `type="button"` hoặc `type="submit"`; cấm `<a href="#">` hoặc liên kết rỗng; cấm gắn `onClick` lên thẻ tĩnh (`<div>`, `<span>`).
- **Form**: `<input>`, `<select>`, `<textarea>` bắt buộc liên kết `<label for="...">` hoặc có `aria-label`.
- **Cấu trúc Heading**: Mỗi trang chỉ có duy nhất **1 thẻ `<h1>`** nằm trong `<main>`, thứ tự phân cấp phải tuần tự nghiêm ngặt (`h1 → h2 → h3 → h4 → h5 → h6`), không được nhảy cóc cấp độ, không để heading rỗng hoặc ẩn bằng `aria-hidden="true"`.
- **Cấu trúc HTML chuẩn WHATWG**: Bắt lỗi lồng thẻ sai quy cách (`<ul>/<ol>` chỉ chứa `<li>`, `<p>` không chứa thẻ block, không lồng `<a>` hoặc `<button>` bên trong nhau).

---

## 8. Quy trình bàn giao (Pre-Deployment Checklist)

Trước khi đóng gói source code hoặc deploy lên server production, hãy chạy lệnh tổng kiểm tra:

```bash
pnpm check
```

Đảm bảo tất cả các bước sau đều đạt **0 lỗi (PASS)**:

1. `typecheck`: Không có lỗi TypeScript hoặc sai kiểu props của component.
2. `lint`: Vượt qua 100% quy tắc Biome, Stylelint và ESLint WCAG AAA / SEO.
3. `format:check`: Toàn bộ mã nguồn đồng nhất định dạng.
4. `test:audit`: Điểm **Technical SEO Score đạt 100%** (0 Critical Errors) và **WCAG AAA đạt 0 Violations** trên tất cả các route khai báo trong `TARGET_ROUTES`.
