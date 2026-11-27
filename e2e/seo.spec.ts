import { expect, test } from '@playwright/test';

interface SeoCheckResult {
  category:
    | 'Core Meta'
    | 'Indexing & URL'
    | 'Social & OpenGraph'
    | 'Semantic Structure'
    | 'Media & Performance';
  rule: string;
  passed: boolean;
  actual: string;
  recommendation: string;
  critical: boolean;
}

const TARGET_ROUTES = ['/'];

/**
 * Formats SEO & Semantic evaluation metrics and issues into a clean terminal report.
 */
function buildSeoReport(route: string, checks: SeoCheckResult[]) {
  const passedCount = checks.filter((c) => c.passed).length;
  const failedChecks = checks.filter((c) => !c.passed);
  const criticalFailures = failedChecks.filter((c) => c.critical);
  const score = Math.round((passedCount / checks.length) * 100);

  let status = '🏆 SEO EXCELLENT (Production Ready)';
  if (criticalFailures.length > 0) {
    status = '❌ SEO CRITICAL ISSUES FOUND';
  } else if (failedChecks.length > 0) {
    status = '⚠️ SEO WARNINGS (Optimization Recommended)';
  }

  let output = `
================================================================================
                        TECHNICAL SEO AUDIT REPORT (${route})
================================================================================
AUDIT STATUS      : ${status}
OVERALL SEO SCORE : ${score}% (${passedCount}/${checks.length} checks passed)
CRITICAL ERRORS   : ${criticalFailures.length}
WARNINGS          : ${failedChecks.length - criticalFailures.length}
================================================================================
`;

  if (failedChecks.length > 0) {
    output += `\nLIST OF ${failedChecks.length} SEO ISSUE(S) FOUND:\n`;
    failedChecks.forEach((item, idx) => {
      output += `
--------------------------------------------------------------------------------
#${idx + 1}. [${item.critical ? 'CRITICAL' : 'WARNING'}] [${item.category}] ${item.rule}
Actual Value   : ${item.actual}
Recommendation : ${item.recommendation}
--------------------------------------------------------------------------------`;
    });
  }

  return { output, criticalFailures };
}

test.describe('Technical SEO & Semantic Audits', () => {
  for (const route of TARGET_ROUTES) {
    test(`Page "${route}" must satisfy Technical SEO & Semantic Hierarchy`, async ({ page }) => {
      const response = await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      const statusCode = response?.status() ?? 0;

      const seoData = await page.evaluate(() => {
        const getMeta = (selector: string) =>
          document.querySelector(selector)?.getAttribute('content')?.trim() || '';

        const htmlLang = document.documentElement.getAttribute('lang')?.trim() || '';
        const charset =
          document.querySelector('meta[charset]')?.getAttribute('charset')?.trim() || '';
        const viewport = getMeta('meta[name="viewport"]');
        const title = document.title.trim();
        const description = getMeta('meta[name="description"]');
        const robots = getMeta('meta[name="robots"]');
        const canonical =
          document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';

        // Open Graph & Twitter
        const ogTitle = getMeta('meta[property="og:title"]');
        const ogDescription = getMeta('meta[property="og:description"]');
        const ogImage = getMeta('meta[property="og:image"]');
        const ogUrl = getMeta('meta[property="og:url"]');
        const ogType = getMeta('meta[property="og:type"]');
        const twitterCard = getMeta('meta[name="twitter:card"]');

        // --- 1. Heading Outline, Empty Headings, Order & Strict Hierarchy (1 -> 2 -> 3 -> 4 -> 5 -> 6) ---
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
          (el) => {
            const imgAlt = Array.from(el.querySelectorAll('img'))
              .map((img) => img.getAttribute('alt')?.trim() || '')
              .join(' ')
              .trim();
            const ariaLabel = el.getAttribute('aria-label')?.trim() || '';
            const visibleText = el.textContent?.replace(/\s+/g, ' ').trim() || '';
            const accessibleText = visibleText || ariaLabel || imgAlt;
            const style = window.getComputedStyle(el);
            const isHidden =
              el.getAttribute('aria-hidden') === 'true' ||
              style.display === 'none' ||
              style.visibility === 'hidden';

            return {
              level: Number(el.tagName.replace('H', '')),
              tag: el.tagName.toLowerCase(),
              text: accessibleText,
              isHidden,
              insideMain: Boolean(el.closest('main')),
              insideHeaderOrFooter: Boolean(el.closest('header, footer, nav')),
            };
          },
        );

        const h1List = headings.filter((h) => h.level === 1);
        const emptyHeadings = headings.filter((h) => !h.text);
        const hiddenHeadings = headings.filter((h) => h.isHidden);
        const headingsInChrome = headings.filter((h) => h.insideHeaderOrFooter);
        const tooLongHeadings = headings.filter((h) => h.text.length > 120);

        // Enforce strict heading hierarchy: must start with <h1> and progress sequentially (1 -> 2 -> 3 -> 4 -> 5 -> 6)
        const hierarchyErrors: string[] = [];

        if (headings.length > 0 && headings[0].level !== 1) {
          hierarchyErrors.push(
            `First heading on page is <${headings[0].tag}> ("${headings[0].text.slice(0, 25)}") instead of <h1>`,
          );
        }

        for (let i = 1; i < headings.length; i++) {
          const prev = headings[i - 1];
          const curr = headings[i];
          if (curr.level > prev.level + 1) {
            hierarchyErrors.push(
              `<${prev.tag}> ("${prev.text.slice(0, 25) || 'EMPTY'}") -> <${curr.tag}> ("${curr.text.slice(0, 25) || 'EMPTY'}") (expected <= <h${prev.level + 1}>)`,
            );
          }
        }

        // --- 2. Semantic Landmarks & HTML Tag Nesting ---
        const mainElements = Array.from(document.querySelectorAll('main'));
        const nestedMain = mainElements.some((m) =>
          Boolean(m.closest('header, footer, nav, aside')),
        );
        const hasHeader = Boolean(document.querySelector('header'));
        const hasFooter = Boolean(document.querySelector('footer'));
        const navElements = Array.from(document.querySelectorAll('nav'));
        const unlabeledNavs =
          navElements.length > 1
            ? navElements.filter(
                (n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'),
              ).length
            : 0;

        // Validate HTML tag nesting rules
        const invalidNestings: string[] = [];
        document
          .querySelectorAll(
            'ul > :not(li):not(script):not(template), ol > :not(li):not(script):not(template), menu > :not(li):not(script):not(template)',
          )
          .forEach((el) => {
            invalidNestings.push(
              `<${el.parentElement?.tagName.toLowerCase()}> > <${el.tagName.toLowerCase()}>`,
            );
          });
        document
          .querySelectorAll('dl > :not(dt):not(dd):not(div):not(script):not(template)')
          .forEach((el) => {
            invalidNestings.push(`<dl> > <${el.tagName.toLowerCase()}>`);
          });
        document.querySelectorAll('a a, a button, button a, button button').forEach((el) => {
          invalidNestings.push(`Nested interactive <${el.tagName.toLowerCase()}>`);
        });

        // <section> & <article> missing a heading or aria-label
        const unlabeledSections = Array.from(document.querySelectorAll('section, article')).filter(
          (sec) => !sec.querySelector('h1, h2, h3, h4, h5, h6'),
        ).length;

        // Non-semantic <div>, <p>, or <span> styled with large bold text to mimic headings
        const fakeHeadings = Array.from(
          document.querySelectorAll('main div, main p, main span'),
        ).filter((el) => {
          if (el.children.length > 0) return false;
          const text = el.textContent?.trim() || '';
          if (text.length < 4 || text.length > 80) return false;
          const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
          const fontWeight = parseInt(window.getComputedStyle(el).fontWeight, 10);
          return fontSize >= 24 && fontWeight >= 600;
        }).length;

        // Empty or generic/vague anchor texts
        const emptyAnchorTexts = Array.from(document.querySelectorAll('a')).filter((a) => {
          const text = a.textContent?.trim() || '';
          const ariaLabel = a.getAttribute('aria-label')?.trim() || '';
          const imgAlt = a.querySelector('img')?.getAttribute('alt')?.trim() || '';
          return !text && !ariaLabel && !imgAlt;
        }).length;

        const genericLinkTexts = [
          'click here',
          'read more',
          'more',
          'here',
          'link',
          'こちら',
          '詳細',
          'もっと見る',
        ];
        const vagueLinks = Array.from(document.querySelectorAll('a')).filter((a) => {
          const text = (a.getAttribute('aria-label') || a.textContent || '').trim().toLowerCase();
          return genericLinkTexts.includes(text);
        }).length;

        // Duplicate IDs on the same page
        const allIds = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
        const duplicateIds = allIds.filter((id, idx) => allIds.indexOf(id) !== idx);

        // Images
        const images = Array.from(document.querySelectorAll('img'));
        const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt')).length;
        const imagesWithoutDimensions = images.filter(
          (img) => !img.getAttribute('width') || !img.getAttribute('height'),
        ).length;

        // Structured Data (JSON-LD)
        const jsonLdScripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        );
        let validJsonLd = jsonLdScripts.length > 0;
        for (const script of jsonLdScripts) {
          try {
            JSON.parse(script.textContent || '');
          } catch {
            validJsonLd = false;
          }
        }

        return {
          htmlLang,
          charset,
          viewport,
          title,
          description,
          robots,
          canonical,
          ogTitle,
          ogDescription,
          ogImage,
          ogUrl,
          ogType,
          twitterCard,
          mainCount: mainElements.length,
          nestedMain,
          hasHeader,
          hasFooter,
          navCount: navElements.length,
          unlabeledNavs,
          invalidNestings,
          h1List,
          emptyHeadings,
          hiddenHeadings,
          headingsInChrome,
          tooLongHeadings,
          hierarchyErrors,
          headingOutline: headings.map((h) => `<${h.tag}>`).join(' -> '),
          unlabeledSections,
          fakeHeadings,
          emptyAnchorTexts,
          vagueLinks,
          duplicateIds,
          imagesWithoutAlt,
          imagesWithoutDimensions,
          jsonLdCount: jsonLdScripts.length,
          validJsonLd,
        };
      });

      const checks: SeoCheckResult[] = [
        // --- Indexing & URL ---
        {
          category: 'Indexing & URL',
          rule: 'HTTP Status Code must be 200 OK',
          passed: statusCode === 200,
          actual: `HTTP ${statusCode}`,
          recommendation: 'Ensure route builds cleanly without 404 or 5xx errors.',
          critical: true,
        },
        {
          category: 'Indexing & URL',
          rule: 'Canonical URL must be present and absolute',
          passed: /^https?:\/\/.+/.test(seoData.canonical),
          actual: seoData.canonical || '(missing)',
          recommendation:
            'Configure `site` in astro.config.mjs so <link rel="canonical"> outputs a full URL.',
          critical: true,
        },
        {
          category: 'Indexing & URL',
          rule: 'Robots meta tag must not block indexing',
          passed: !seoData.robots.toLowerCase().includes('noindex'),
          actual: seoData.robots || 'index, follow (default)',
          recommendation: 'Ensure `noindex` is false on public production pages.',
          critical: true,
        },

        // --- Core Meta ---
        {
          category: 'Core Meta',
          rule: 'HTML <html lang="..."> attribute must be declared',
          passed: seoData.htmlLang.length >= 2,
          actual: seoData.htmlLang || '(missing)',
          recommendation: 'Add lang="ja" or lang="en" on the root <html> tag in Layout.astro.',
          critical: true,
        },
        {
          category: 'Core Meta',
          rule: 'UTF-8 charset and responsive viewport meta required',
          passed:
            seoData.charset.toLowerCase() === 'utf-8' &&
            seoData.viewport.includes('width=device-width'),
          actual: `charset="${seoData.charset}", viewport="${seoData.viewport}"`,
          recommendation:
            'Include <meta charset="utf-8" /> and <meta name="viewport" content="width=device-width, initial-scale=1.0" />.',
          critical: true,
        },
        {
          category: 'Core Meta',
          rule: 'Meta <title> must exist and be concise (10–65 chars)',
          passed: seoData.title.length >= 10 && seoData.title.length <= 65,
          actual: `"${seoData.title}" (${seoData.title.length} chars)`,
          recommendation:
            'Keep page <title> between 10 and 65 characters for optimal SERP display.',
          critical: true,
        },
        {
          category: 'Core Meta',
          rule: 'Meta description must exist and be descriptive (50–160 chars)',
          passed: seoData.description.length >= 50 && seoData.description.length <= 160,
          actual: `"${seoData.description}" (${seoData.description.length} chars)`,
          recommendation: 'Write a unique <meta name="description"> between 50 and 160 characters.',
          critical: false,
        },

        // --- Social & OpenGraph ---
        {
          category: 'Social & OpenGraph',
          rule: 'Complete Open Graph tags (og:title, og:description, og:url, og:type, og:image)',
          passed: Boolean(
            seoData.ogTitle &&
              seoData.ogDescription &&
              seoData.ogUrl &&
              seoData.ogType &&
              /^https?:\/\/.+/.test(seoData.ogImage),
          ),
          actual: `og:title=${Boolean(seoData.ogTitle)}, og:image="${seoData.ogImage}"`,
          recommendation:
            'Ensure all Open Graph tags and absolute og:image URL are rendered in Head.astro.',
          critical: false,
        },
        {
          category: 'Social & OpenGraph',
          rule: 'Twitter Card meta tag must be configured',
          passed: ['summary', 'summary_large_image'].includes(seoData.twitterCard),
          actual: seoData.twitterCard || '(missing)',
          recommendation: 'Set <meta name="twitter:card" content="summary_large_image" />.',
          critical: false,
        },

        // --- Semantic Structure & Heading Outline ---
        {
          category: 'Semantic Structure',
          rule: 'Page landmarks must include <header>, single top-level <main>, and <footer>',
          passed:
            seoData.mainCount === 1 &&
            !seoData.nestedMain &&
            seoData.hasHeader &&
            seoData.hasFooter,
          actual: `header=${seoData.hasHeader}, main=${seoData.mainCount} (nested=${seoData.nestedMain}), footer=${seoData.hasFooter}`,
          recommendation:
            'Use semantic <header>, a single top-level <main>, and <footer> in Layout.astro.',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'Valid HTML element nesting (ul/ol > li, dl > dt/dd, no nested interactive elements)',
          passed: seoData.invalidNestings.length === 0,
          actual:
            seoData.invalidNestings.length === 0
              ? 'Valid HTML nesting'
              : `Invalid: ${seoData.invalidNestings.join(', ')}`,
          recommendation:
            'Fix invalid parent-child HTML tag nesting according to WHATWG HTML specification.',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'No empty or hidden heading tags (<h1> - <h6>)',
          passed: seoData.emptyHeadings.length === 0 && seoData.hiddenHeadings.length === 0,
          actual: `Empty: ${seoData.emptyHeadings.length} (${seoData.emptyHeadings.map((h) => `<${h.tag}>`).join(', ') || 'none'}), Hidden: ${seoData.hiddenHeadings.length}`,
          recommendation:
            'Remove empty heading tags and never hide headings with display:none or aria-hidden="true".',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'Exactly one <h1> placed inside <main>',
          passed: seoData.h1List.length === 1 && seoData.h1List[0].insideMain,
          actual: `h1Count=${seoData.h1List.length}, insideMain=${seoData.h1List[0]?.insideMain ?? false}`,
          recommendation:
            'Ensure <h1> appears once inside <main> (do not put <h1> inside <header>/<nav>).',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'Strict heading hierarchy order (must start at <h1> and progress 1 -> 2 -> 3 -> 4 -> 5 -> 6)',
          passed: seoData.hierarchyErrors.length === 0,
          actual:
            seoData.hierarchyErrors.length === 0
              ? seoData.headingOutline || '(no headings)'
              : `Invalid order: ${seoData.hierarchyErrors.join(' | ')} | Full outline: ${seoData.headingOutline}`,
          recommendation:
            'Follow strict sequential heading ranks (h1 -> h2 -> h3 -> h4 -> h5 -> h6) without skipping levels.',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'Do not place heading tags (<h1> - <h6>) inside <header>, <nav>, or <footer>',
          passed: seoData.headingsInChrome.length === 0,
          actual:
            seoData.headingsInChrome.length === 0
              ? '0 headings in header/nav/footer'
              : `Found: ${seoData.headingsInChrome.map((h) => `<${h.tag}>("${h.text.slice(0, 20)}")`).join(', ')}`,
          recommendation:
            'Use <a>, <span>, or <p> for site logos and footer titles instead of heading tags.',
          critical: false,
        },
        {
          category: 'Semantic Structure',
          rule: 'Headings must be concise (<= 120 chars) and not wrap entire paragraphs',
          passed: seoData.tooLongHeadings.length === 0,
          actual: `${seoData.tooLongHeadings.length} overly long heading(s)`,
          recommendation: 'Keep headings concise and move body copy into <p> tags.',
          critical: false,
        },
        {
          category: 'Semantic Structure',
          rule: 'Avoid fake headings (large bold <div>/<p> instead of semantic <h2>-<h6>)',
          passed: seoData.fakeHeadings === 0,
          actual: `${seoData.fakeHeadings} suspected non-semantic heading(s)`,
          recommendation:
            'Use semantic <h2>-<h6> tags instead of styling <div> or <p> with large bold fonts.',
          critical: false,
        },
        {
          category: 'Semantic Structure',
          rule: 'All <section> and <article> blocks must contain a heading or aria-label',
          passed: seoData.unlabeledSections === 0,
          actual: `${seoData.unlabeledSections} unlabeled <section>/<article> block(s)`,
          recommendation:
            'Ensure every <section>/<article> has a heading (<h2>-<h6>) or use <div> for layout wrappers.',
          critical: false,
        },
        {
          category: 'Semantic Structure',
          rule: 'Multiple <nav> landmarks must be uniquely labeled with aria-label',
          passed: seoData.unlabeledNavs === 0,
          actual: `${seoData.navCount} <nav> found (${seoData.unlabeledNavs} unlabeled)`,
          recommendation:
            'Add aria-label="Primary Navigation" / aria-label="Footer Navigation" when multiple <nav> exist.',
          critical: false,
        },
        {
          category: 'Semantic Structure',
          rule: 'No duplicate HTML id attributes on the same page',
          passed: seoData.duplicateIds.length === 0,
          actual:
            seoData.duplicateIds.length === 0
              ? 'All IDs unique'
              : `Duplicate IDs: ${[...new Set(seoData.duplicateIds)].join(', ')}`,
          recommendation: 'Ensure every id attribute is unique across the rendered DOM.',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'All <a> links must have descriptive anchor text (no empty or generic "click here"/"詳細")',
          passed: seoData.emptyAnchorTexts === 0 && seoData.vagueLinks === 0,
          actual: `Empty links: ${seoData.emptyAnchorTexts}, Generic/vague links: ${seoData.vagueLinks}`,
          recommendation: 'Use descriptive anchor text or aria-label explaining the destination.',
          critical: true,
        },
        {
          category: 'Semantic Structure',
          rule: 'Structured Data (JSON-LD) presence and valid JSON syntax',
          passed: seoData.jsonLdCount > 0 && seoData.validJsonLd,
          actual: `${seoData.jsonLdCount} JSON-LD block(s) (valid: ${seoData.validJsonLd})`,
          recommendation:
            'Include <script type="application/ld+json"> schema (WebSite / Organization / BreadcrumbList).',
          critical: false,
        },

        // --- Media & Performance ---
        {
          category: 'Media & Performance',
          rule: 'All <img> elements must include alt attribute and explicit width/height',
          passed: seoData.imagesWithoutAlt === 0 && seoData.imagesWithoutDimensions === 0,
          actual: `Missing alt: ${seoData.imagesWithoutAlt}, Missing width/height: ${seoData.imagesWithoutDimensions}`,
          recommendation:
            'Add alt, width, and height attributes on all <img> tags to prevent CLS and improve image indexing.',
          critical: true,
        },
      ];

      const { output, criticalFailures } = buildSeoReport(route, checks);
      console.log(output);

      expect(
        criticalFailures,
        `Critical Technical SEO & Semantic checks failed on "${route}":\n${output}`,
      ).toEqual([]);
    });
  }
});
