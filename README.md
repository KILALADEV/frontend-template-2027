# LP Production Template (Astro + TypeScript + SCSS + Playwright)

高品質な**ランディングページ（LP）・コーポレートサイト**制作のために標準化されたプロダクション用テンプレートです。**静的ビルド（Static Build）**、**TypeScript 7**、**SCSS（BEM設計）**、**Biome**、**Stylelint**、**カスタム ESLint（WCAG AAA & セマンティック SEO）**、および **Playwright E2E 監査**による自動品質管理パイプライン（CI/CD対応）を標準搭載しています。

---

## 1. 技術スタック・主要ツール

| カテゴリ               | ライブラリ / ツール      | バージョン            | 役割                                                                |
| :--------------------- | :----------------------- | :-------------------- | :------------------------------------------------------------------ |
| **コアフレームワーク** | Astro + React 19         | `^7.4.11` / `^19.3.1` | 静的サイト生成（SSG）、Islands アーキテクチャ、インタラクティブ UI  |
| **言語**               | TypeScript               | `^7.0.2`              | 厳格な静的型チェック                                                |
| **スタイリング**       | Sass Embedded (SCSS)     | `^1.108.2`            | BEM 設計（`c-`, `l-`, `p-`, `u-`）に基づくモジュラー CSS            |
| **Linter & Formatter** | Biome + Prettier         | `2.6.6` / `^3.10.1`   | 高速な JS/TS 静的解析およびコードフォーマット                       |
| **CSS Linter**         | Stylelint                | `^17.16.0`            | SCSS 構文チェックおよび CSS プロパティ記述順の自動整列              |
| **A11y & SEO Linter**  | ESLint 10 + Custom Rules | `^10.0.0`             | コーディング中の WCAG AAA・セマンティック SEO・HTML 構造検証        |
| **E2E & 自動監査**     | Playwright + Axe-Core    | `^1.65.0` / `^4.14.0` | 本番ビルドに対する WCAG AAA およびテクニカル SEO の自動スコアリング |

---

## 2. 動作環境（前提条件）

`engines` で指定されている以下の最小バージョン以上の Node.js と pnpm が必要です。

- **Node.js**: `>= 24.22.3`
- **pnpm**: `>= 10.0.0`（`pnpm@10.22.0` 推奨）
- **IDE**: Visual Studio Code (VS Code)

現在のローカル環境バージョン確認コマンド:

```bash
node -v
pnpm -v
```

---

## 3. セットアップ・起動手順

### ステップ 1: 依存パッケージのインストール

```bash
pnpm install
```

### ステップ 2: 推奨 VS Code 拡張機能の一括インストール

以下のコマンドを実行すると、`.vscode/extensions.json` に定義された必須拡張機能（Astro, ESLint, Biome, Stylelint, Prettier, EditorConfig）が自動的にインストールされます。

```bash
pnpm setup:extensions
```

### ステップ 3: 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:4321` にアクセスして確認します。

---

## 4. `package.json` スクリプト一覧

### 🚀 開発・ビルド

- `pnpm dev`: ホットリロード（HMR）対応のローカル開発サーバーを起動します。
- `pnpm build`: プロジェクト全体を静的ファイル（`dist/`）としてビルドします。
- `pnpm preview`: 本番ビルド（`dist/`）をローカル環境でプレビューします。
- `pnpm typecheck`: Astro の型同期（`astro sync`）と TypeScript の型チェック（`tsc --noEmit`）を実行します。

### 🧹 コード検証・自動整形（Lint & Format）

- `pnpm lint`: **JS/TS（`lint:js`）**、**SCSS（`lint:css`）**、**アクセシビリティ/SEO（`lint:a11y`）** の全チェックを一括実行します。
- `pnpm lint:js`: **Biome** を用いて JS/TS の構文・ルール違反を検証します。
- `pnpm lint:css`: **Stylelint** を用いて CSS/SCSS の構文およびプロパティ記述順を検証します。
- `pnpm lint:a11y`: **ESLint + カスタムルール**で全 `.astro` ファイルを走査し、WCAG AAA・セマンティック SEO・HTML ネスト構造を検証します。
- `pnpm fix`: 自動修正可能な JS・CSS のエラーをすべて修正し、コード全体をフォーマットします。
- `pnpm fix:js`: Biome で JS/TS のエラーを自動修正します。
- `pnpm fix:css`: Stylelint で SCSS のエラーを自動修正し、`recess-order` に従ってプロパティ順を整列します。
- `pnpm format`: Prettier で `.css`・`.scss`・`.astro` ファイルを一括整形します。
- `pnpm format:check`: コードフォーマットの統一性をチェックします（CI/CD でのマージ前検証用）。

### 🧪 自動テスト（Playwright E2E 監査）

- `pnpm test:a11y`: `@axe-core/playwright` を用いて **WCAG 2.1/2.2 レベル AAA** 基準のアクセシビリティ監査を実行します。
- `pnpm test:seo`: **テクニカル SEO・セマンティック構造**の監査（メタタグ、OGP、JSON-LD、見出しアウトライン、ランドマーク、画像サイズ指定など）を実行します。
- `pnpm test:audit`: 本番ビルド（`astro build`）を実行した上で、Playwright の全テストスイート（`e2e/`）を実行します。
- `pnpm check`: **納品・デプロイ前の最終総合チェックコマンド**（`typecheck` → `lint` → `format:check` → `test:audit` を順次実行します）。

---

## 5. 標準ディレクトリ構成

```text
├── .vscode/                 # VS Code ワークスペース設定および推奨拡張機能リスト
├── e2e/                     # Playwright 自動監査テストスイート
│   ├── a11y.spec.ts         # Axe-Core による WCAG AAA 自動監査
│   └── seo.spec.ts          # テクニカル SEO & セマンティック DOM 自動監査
├── eslint-rules/            # プロジェクト固有のカスタム ESLint ルール
│   └── wcag-seo-guide.js    # WCAG AAA・SEO・HTML ネスト構造の警告＆クイックフィックス
├── public/                  # 静的アセット・非バンドル画像（favicon, robots.txt, OGP画像, /images/...）
├── src/
│   ├── assets/              # import 経由で使用するアセット専用（Sharp 最適化画像, SCSS, フォント等）
│   │   └── styles/          # プロジェクト全体の SCSS アーキテクチャ
│   │       ├── global/      # 変数、関数、ミックスイン（flexbox, メディアクエリ等）
│   │       ├── foundation/  # リセット CSS、タイポグラフィ、ベーススタイル
│   │       ├── components/  # 再利用可能なコンポーネントスタイル（.c-*）
│   │       ├── layout/      # レイアウト構造スタイル（.l-header, .l-footer 等）
│   │       ├── page/        # ページ固有のスタイル（top.scss, about.scss 等）
│   │       └── common.scss  # サイト共通の CSS エントリー
│   ├── components/          # 再利用可能な UI コンポーネント（Button.astro, Header.astro, Footer.astro 等）
│   ├── data/                # サイト全体設定およびページ別メタデータ（site.ts, pages.ts）
│   ├── layouts/             # ページ共通レイアウト（Layout.astro, BaseHead.astro）
│   ├── pages/               # ルーティング対象ページ（index.astro, about/index.astro 等）
│   └── scripts/             # クライアントサイドのインタラクティブ JS/TS
│       ├── common.ts        # サイト共通スクリプト（ヘッダースクロール、モバイルメニュー等）
│       └── top.ts           # ページ固有スクリプト（pageScript="top" と紐付け）
├── astro.config.mjs         # Astro・Vite ビルド・Sharp 画像処理・CSS エントリー設定
├── biome.json               # Biome Linter / Formatter 設定
├── eslint.config.mjs        # ESLint v10 Flat Config 設定
├── playwright.config.ts     # Playwright テストランナーおよび webServer 設定
├── stylelint.config.mjs     # Stylelint SCSS 設定
└── tsconfig.json            # TypeScript コンパイラ設定
```

---

## 6. 機能開発・新規ページ追加ガイド

### 6.1. 新規ページの作成と `pageScript` によるページ固有 JS の読み込み

`src/pages/` 内の各ページは `<Layout>` を共通ラッパーとして使用します。他ページのバンドルサイズを増やさず特定ページ専用の JavaScript/TypeScript を読み込むには、`pageScript` プロパティを指定します。

1. **ページ専用スクリプトの作成**: `src/scripts/` 配下にファイルを作成します（例: `src/scripts/top.ts` や `src/scripts/about.ts`）。

   ```typescript
   // src/scripts/top.ts
   document.addEventListener("DOMContentLoaded", () => {
     console.log("Top page script initialized");
   });
   ```

   _（※ `astro.config.mjs` の Vite 設定により、ビルド時に `src/scripts/*.ts` の全エントリーが自動的に収集・バンドルされます）_

2. **`.astro` ファイルで `pageScript` を指定**:

   ```astro
   ---
   // src/pages/index.astro
   import Layout from "../layouts/Layout.astro";
   import "@/assets/styles/pages/top.scss";
   ---

   <Layout pageScript="top">
     <section class="p-top-hero">
       <h1>ページのメイン見出し</h1>
     </section>
   </Layout>
   ```

   - `pageScript="top"` を指定すると、対象ページの末尾に `src/scripts/top.ts` のバンドルが自動的に読み込まれます。
   - 固有の JS が不要なページでは `pageScript` プロパティを省略してください（ヘッダーやメニュー等の共通機能はグローバルスクリプトで自動的に動作します）。
   - 新規ルート（例: `/about/`）を追加した際は、Playwright が自動監査できるよう `e2e/seo.spec.ts`, `e2e/a11y.spec.ts` の `TARGET_ROUTES = ['/', '/about/']` にもルートを追加してください。

### 6.2. SCSS の記述・構成ルール

SCSS アーキテクチャは `src/assets/styles/` に集約されており、役割別のプレフィックスを用いた **BEM 設計**を厳守します。

- **クラス命名規則**:
  - `.l-*`: **Layout** — ページ全体の骨格構造（`.l-header`, `.l-footer`, `.l-main`, `.l-container`）
  - `.c-*`: **Component** — 複数箇所で再利用する UI パーツ（`.c-btn`, `.c-card`, `.c-breadcrumb`）
  - `.p-*`: **Page** — 特定ページ固有のセクション（`.p-top-hero`, `.p-about-company`）
  - `.u-*`: **Utility** — 補助用ユーティリティクラス（`.u-pc-only`, `.u-sp-only`, `.sr-only`）

- **新規ページ・コンポーネント用 SCSS の追加手順**:
  1. **ページ固有 SCSS**: `src/assets/styles/page/<ページ名>.scss`（例: `about.scss`）を作成し、ファイル先頭で `@use '../global' as *;` を読み込んだ上で、ページ側 `.astro` のフロントマターで直接インポートします（`import '../assets/styles/page/about.scss';`）。Astro/Vite によりページ専用の CSS ファイルとして分割出力されます。
  2. **コンポーネント用 SCSS**: `src/assets/styles/components/_<コンポーネント名>.scss`（例: `_button.scss`）を作成し、`src/assets/styles/components/_index.scss` に `@forward 'button';` を追記します（またはコンポーネントの `.astro` ファイル内で直接インポートします）。
  3. **自動フォーマット**: ファイル保存時（`Ctrl + S` / `Cmd + S`）に Stylelint と Prettier が自動実行され、`recess-order` に従って CSS プロパティ記述順が自動整列されます。

### 6.3. 画像・アセット管理ルール（`public/` と `src/assets/` の使い分け）

- **`public/`**: ルート相対パス（`/images/top/hero.jpg` など）で直接参照する静的画像（通常の `<img>` タグ、CSS の `background-image`、OGP 画像、favicon 等）を格納します。ビルド時にそのまま `dist/` へコピーされます。
- **`src/assets/`**: `.astro` や `.tsx` ファイル内で `import` して使用する画像専用です（例: `import heroImg from '../assets/images/hero.png'`）。Astro と Sharp により自動的に圧縮・リサイズ・WebP 変換され、ハッシュ付きファイル名でバンドルされます。

---

## 7. アクセシビリティ（WCAG AAA）＆ セマンティック SEO 規約

### 7.1. コーディング中のリアルタイム検証（カスタム ESLint ルール）

`.astro` ファイルのマークアップ記述時、以下のルール違反があると ESLint がコード例とクイックフィックス（自動修正候補）付きで警告を表示します。

- **画像・アイコン**: `<img>` には `alt` 属性（装飾画像の場合は `alt="" aria-hidden="true"`）が必須です。`<svg>` には `aria-hidden="true" focusable="false"` または `role="img" aria-label="..."` の明示が必要です。
- **ボタン・リンク**: `<button>` には `type="button"` または `type="submit"` の明示が必須です。`<a href="#">` や空リンク、非インタラクティブ要素（`<div>`・`<span>` 等）への `onClick` 付与は禁止されています。
- **フォーム要素**: `<input>`・`<select>`・`<textarea>` には `<label for="...">` との紐付け、または `aria-label` の指定が必須です。
- **見出し（Heading）階層**: 1ページにつき `<main>` 内に **`<h1>` を1つのみ**配置し、見出しレベルは階層を飛ばさず厳密に順序通り（`h1 → h2 → h3 → h4 → h5 → h6`）記述する必要があります。空の見出しや `aria-hidden="true"` による隠蔽は禁止です。
- **WHATWG HTML コンテンツモデル**: 不正なタグの入れ子構造を検出します（`<ul>`/`<ol>` 直下は `<li>` のみ、`<p>` 内のブロック要素配置禁止、`<a>`/`<button>` 同士のネスト禁止など）。

---

## 8. 納品・デプロイ前チェックリスト

ソースコードの納品や本番サーバーへのデプロイ前に、必ず以下の総合チェックコマンドを実行してください。

```bash
pnpm check
```

以下の全4工程が **エラー 0 件（PASS）** であることを確認します。

1. `typecheck`: TypeScript の型エラーやコンポーネントの Props 不整合がないこと。
2. `lint`: Biome・Stylelint・カスタム ESLint（WCAG AAA / SEO）の全ルールに準拠していること。
3. `format:check`: リポジトリ全体のコードフォーマットが統一されていること。
4. `test:audit`: `TARGET_ROUTES` に定義された全ページで **Technical SEO Score 100%**（Critical Errors 0件）および **WCAG AAA Violations 0件** を達成していること。
