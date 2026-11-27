import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve 'vite' and 'sharp' directly from Astro's internal dependencies
const astroRequire = createRequire(require.resolve('astro/config'));
const { build: viteBuild } = astroRequire('vite');
const sharp = astroRequire('sharp');

// 1. Automatically collect all .ts/.js entry scripts in src/assets/scripts/
const scriptsDir = path.resolve(__dirname, 'src/assets/scripts');
const scriptEntries = {};
const IGNORE_DIRS = new Set(['module', 'modules', 'utils', 'components', 'types']);

const collectScripts = (dir, prefix = '') => {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name.toLowerCase())) continue;
      collectScripts(path.join(dir, entry.name), `${prefix}${entry.name}/`);
    } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.startsWith('_')) {
      const entryName = `${prefix}${path.parse(entry.name).name}`;
      scriptEntries[entryName] = path.join(dir, entry.name);
    }
  }
};

collectScripts(scriptsDir);

// 2. Automatically collect common.scss + all page stylesheets in src/assets/styles/pages/
const stylesDir = path.resolve(__dirname, 'src/assets/styles');
const styleEntries = {};

const collectStyles = () => {
  const commonScss = path.join(stylesDir, 'common.scss');
  if (fs.existsSync(commonScss)) {
    styleEntries.common = commonScss;
  }

  const pagesStylesDir = path.join(stylesDir, 'pages');
  if (!fs.existsSync(pagesStylesDir)) return;

  for (const entry of fs.readdirSync(pagesStylesDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.scss') && !entry.name.startsWith('_')) {
      const entryName = path.parse(entry.name).name;
      styleEntries[entryName] = path.join(pagesStylesDir, entry.name);
    }
  }
};

collectStyles();

// Resolve all page SCSS imports directly from the corresponding src/pages/*.astro file
const getPageCssNamesFromAstroSource = (relHtmlPath) => {
  const candidates =
    relHtmlPath === 'index.html'
      ? [path.resolve(__dirname, 'src/pages/index.astro')]
      : [
          path.resolve(__dirname, 'src/pages', relHtmlPath.replace(/\.html$/, '.astro')),
          path.resolve(__dirname, 'src/pages', relHtmlPath.replace(/\/index\.html$/, '.astro')),
        ];

  const astroFile = candidates.find((filePath) => fs.existsSync(filePath));
  if (!astroFile) return [];

  const source = fs.readFileSync(astroFile, 'utf-8');
  const frontmatterMatch = source.match(/^---\s*([\s\S]*?)\s*---/);
  if (!frontmatterMatch) return [];

  // Match all imports pointing to styles/pages/<name>.scss in exact import order
  const matches = [...frontmatterMatch[1].matchAll(/styles\/pages\/_?([^/'";\s]+)\.scss/g)];
  return [...new Set(matches.map((m) => m[1]))];
};

// Replace temporary _discard CSS links in built HTML with clean /assets/css/common.css + all imported page CSS files
const rewriteCssLinksInHtml = (dir, rootOutDir = dir) => {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteCssLinksInHtml(fullPath, rootOutDir);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = fs.readFileSync(fullPath, 'utf-8');
      const relHtmlPath = path.relative(rootOutDir, fullPath).replace(/\\/g, '/');

      // Collect common.css + every page SCSS imported in the .astro file
      const pageCssList = getPageCssNamesFromAstroSource(relHtmlPath);
      const cssTags = ['<link rel="stylesheet" href="/assets/css/common.css">'];

      for (const cssName of pageCssList) {
        if (styleEntries[cssName] && cssName !== 'common') {
          cssTags.push(`<link rel="stylesheet" href="/assets/css/${cssName}.css">`);
        }
      }

      const cssBlock = cssTags.join('\n');

      // Remove all temporary _discard <link> tags
      let updatedHtml = html.replace(
        /<link\b[^>]*href=["']\/assets\/css\/_discard\/[^"']+["'][^>]*>\s*/gi,
        '',
      );

      // Inject clean CSS <link> tags right before common.js script (or </head> / <body>)
      if (updatedHtml.includes('<script type="module" src="/assets/js/common.js">')) {
        updatedHtml = updatedHtml.replace(
          '<script type="module" src="/assets/js/common.js">',
          `${cssBlock}\n<script type="module" src="/assets/js/common.js">`,
        );
      } else if (updatedHtml.includes('</head>')) {
        updatedHtml = updatedHtml.replace('</head>', `${cssBlock}\n</head>`);
      } else if (/<body\b/i.test(updatedHtml)) {
        updatedHtml = updatedHtml.replace(/<body\b/i, `${cssBlock}\n<body`);
      }

      if (updatedHtml !== html) {
        fs.writeFileSync(fullPath, updatedHtml, 'utf-8');
      }
    }
  }
};

// Scan, compress original images, and generate parallel .webp versions in dist/assets/images/
const optimizeImagesInDir = async (dir, rootOutDir = dir) => {
  if (!fs.existsSync(dir)) return;

  const formatKB = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await optimizeImagesInDir(fullPath, rootOutDir);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) continue;

    const inputBuffer = fs.readFileSync(fullPath);
    const relPath = path.relative(rootOutDir, fullPath).replace(/\\/g, '/');

    let pipeline = sharp(inputBuffer);
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 9, palette: true });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 80 });
    } else if (ext === '.avif') {
      pipeline = pipeline.avif({ quality: 65 });
    }

    const outputBuffer = await pipeline.toBuffer();
    if (outputBuffer.length < inputBuffer.length) {
      fs.writeFileSync(fullPath, outputBuffer);
      const savedPercent = (
        ((inputBuffer.length - outputBuffer.length) / inputBuffer.length) *
        100
      ).toFixed(1);
      console.log(
        `\x1b[32m✓\x1b[0m assets/images/${relPath}: ${formatKB(inputBuffer.length)} → \x1b[36m${formatKB(outputBuffer.length)}\x1b[0m (-${savedPercent}%)`,
      );
    } else {
      console.log(
        `\x1b[90m• assets/images/${relPath}: ${formatKB(inputBuffer.length)} (unchanged)\x1b[0m`,
      );
    }

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const webpPath = fullPath.replace(/\.(jpe?g|png)$/i, '.webp');
      const webpRelPath = relPath.replace(/\.(jpe?g|png)$/i, '.webp');

      if (!fs.existsSync(webpPath)) {
        const webpBuffer = await sharp(inputBuffer).webp({ quality: 80 }).toBuffer();
        fs.writeFileSync(webpPath, webpBuffer);
        const webpSavedPercent = (
          ((inputBuffer.length - webpBuffer.length) / inputBuffer.length) *
          100
        ).toFixed(1);
        console.log(
          `\x1b[35m+ WebP\x1b[0m assets/images/${webpRelPath}: \x1b[36m${formatKB(webpBuffer.length)}\x1b[0m (-${webpSavedPercent}% vs original)`,
        );
      }
    }
  }
};

export default defineConfig({
  build: {
    assets: 'assets',
    inlineStylesheets: 'never',
  },
  integrations: [
    {
      name: 'build-page-assets',
      hooks: {
        'astro:build:start': () => {
          const distDir = path.resolve(__dirname, 'dist');
          if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true, force: true });
          }
        },
        'astro:build:done': async ({ dir }) => {
          const outDir = fileURLToPath(dir);

          // 1. Remove duplicate auto-generated CSS artifacts & rewrite clean <link> tags in HTML
          const discardDir = path.join(outDir, 'assets/css/_discard');
          if (fs.existsSync(discardDir)) {
            fs.rmSync(discardDir, { recursive: true, force: true });
          }
          rewriteCssLinksInHtml(outDir);

          // 2. Bundle standalone entry scripts into dist/assets/js/
          if (Object.keys(scriptEntries).length > 0) {
            await viteBuild({
              configFile: false,
              resolve: {
                alias: {
                  '@': path.resolve(__dirname, 'src'),
                },
              },
              build: {
                outDir,
                emptyOutDir: false,
                assetsInlineLimit: 0,
                rollupOptions: {
                  input: scriptEntries,
                  output: {
                    entryFileNames: 'assets/js/[name].js',
                    chunkFileNames: 'assets/js/[name].js',
                    assetFileNames: 'assets/[name][extname]',
                  },
                },
              },
            });
          }

          // 3. Compile each SCSS entry cleanly & independently into dist/assets/css/[name].css
          for (const [cssName, scssPath] of Object.entries(styleEntries)) {
            await viteBuild({
              configFile: false,
              resolve: {
                alias: {
                  '@': path.resolve(__dirname, 'src'),
                },
              },
              css: {
                transformer: 'lightningcss',
                preprocessorOptions: {
                  scss: {
                    api: 'modern-compiler',
                    loadPaths: [path.resolve(__dirname, 'src')],
                    silenceDeprecations: ['if-function'],
                  },
                },
              },
              build: {
                outDir,
                emptyOutDir: false,
                cssMinify: 'lightningcss',
                assetsInlineLimit: 0,
                rollupOptions: {
                  input: { [cssName]: scssPath },
                  output: {
                    assetFileNames: `assets/css/${cssName}.css`,
                  },
                },
              },
            });
          }

          // 4. Compress images and generate WebP variants after build completes
          await optimizeImagesInDir(path.join(outDir, 'assets/images'));
        },
      },
    },
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      {
        name: 'dev-webp-on-the-fly',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const urlPath = req.url?.split('?')[0] ?? '';
            if (!urlPath.endsWith('.webp')) return next();

            const candidateDirs = [
              path.resolve(__dirname, 'public'),
              path.resolve(__dirname, 'src'),
            ];

            for (const baseDir of candidateDirs) {
              if (fs.existsSync(path.join(baseDir, urlPath))) {
                return next();
              }
            }

            const baseNoExt = urlPath.replace(/\.webp$/i, '');
            const sourceExts = ['.png', '.jpg', '.jpeg'];

            for (const baseDir of candidateDirs) {
              for (const ext of sourceExts) {
                const sourcePath = path.join(baseDir, `${baseNoExt}${ext}`);
                if (fs.existsSync(sourcePath)) {
                  try {
                    const webpBuffer = await sharp(sourcePath).webp({ quality: 80 }).toBuffer();
                    res.setHeader('Content-Type', 'image/webp');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(webpBuffer);
                    return;
                  } catch {
                    return next();
                  }
                }
              }
            }

            next();
          });
        },
      },
    ],
    css: {
      transformer: 'lightningcss',
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          loadPaths: [path.resolve(__dirname, 'src')],
          silenceDeprecations: ['if-function'],
        },
      },
    },
    build: {
      cssMinify: 'lightningcss',
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';

            // Send Astro's auto-bundled CSS to _discard (clean CSS files are compiled independently in step 3)
            if (name.endsWith('.css')) {
              return 'assets/css/_discard/[name][extname]';
            }

            // Preserve original filenames and subfolder structure for images in src/assets/images/
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
              const firstOrig = (assetInfo.originalFileNames?.[0] ?? '').replace(/\\/g, '/');
              const match = firstOrig.match(/src\/assets\/images\/(.+)$/);
              if (match) {
                return `assets/images/${match[1]}`;
              }
              return 'assets/images/[name][extname]';
            }

            return 'assets/[name][extname]';
          },
        },
      },
    },
  },
  devToolbar: {
    enabled: false,
  },
});
