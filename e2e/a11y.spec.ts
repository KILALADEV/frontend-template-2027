import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// WCAG tags grouped by compliance level
const LEVEL_A_TAGS = ['wcag2a', 'wcag21a', 'wcag22a'];
const LEVEL_AA_TAGS = ['wcag2aa', 'wcag21aa', 'wcag22aa'];
const LEVEL_AAA_TAGS = ['wcag2aaa', 'wcag21aaa'];

const ALL_WCAG_TAGS = [...LEVEL_A_TAGS, ...LEVEL_AA_TAGS, ...LEVEL_AAA_TAGS];

// List of target routes to audit (sync with seo.spec.ts)
const TARGET_ROUTES = ['/'];

interface LevelSummary {
  passed: number;
  failed: number;
  total: number;
  rate: number;
}

/**
 * Calculates compliance percentages across WCAG levels (A, AA, AAA).
 */
function evaluateComplianceLevels(results: any) {
  const getRulesForLevel = (items: any[], tags: string[]) =>
    items.filter((item) => item.tags.some((tag: string) => tags.includes(tag)));

  const passedA = getRulesForLevel(results.passes, LEVEL_A_TAGS).length;
  const failedA = getRulesForLevel(results.violations, LEVEL_A_TAGS).length;

  const passedAA = getRulesForLevel(results.passes, LEVEL_AA_TAGS).length;
  const failedAA = getRulesForLevel(results.violations, LEVEL_AA_TAGS).length;

  const passedAAA = getRulesForLevel(results.passes, LEVEL_AAA_TAGS).length;
  const failedAAA = getRulesForLevel(results.violations, LEVEL_AAA_TAGS).length;

  const buildSummary = (passed: number, failed: number): LevelSummary => {
    const total = passed + failed;
    return {
      passed,
      failed,
      total,
      rate: total > 0 ? Math.round((passed / total) * 100) : 100,
    };
  };

  const levelA = buildSummary(passedA, failedA);
  const levelAA = buildSummary(passedAA, failedAA);
  const levelAAA = buildSummary(passedAAA, failedAAA);

  const totalRules = results.passes.length + results.violations.length;
  const overallRate = totalRules > 0 ? Math.round((results.passes.length / totalRules) * 100) : 100;

  // Determine highest fully achieved compliance level
  let finalStatus = 'NON-COMPLIANT (Failed Level A)';
  if (levelA.failed === 0) {
    if (levelAA.failed === 0) {
      if (levelAAA.failed === 0) {
        finalStatus = '🏆 WCAG LEVEL AAA (Highest Standard)';
      } else {
        finalStatus = '🥇 WCAG LEVEL AA (Recommended Industry Standard)';
      }
    } else {
      finalStatus = '🥈 WCAG LEVEL A (Baseline Conformance)';
    }
  }

  return {
    levelA,
    levelAA,
    levelAAA,
    overallRate,
    passedTotal: results.passes.length,
    failedTotal: results.violations.length,
    finalStatus,
  };
}

/**
 * Formats accessibility evaluation metrics and violations into a clean terminal report.
 */
function buildAccessibilityReport(route: string, results: any) {
  const compliance = evaluateComplianceLevels(results);

  let output = `
================================================================================
                    ACCESSIBILITY (A11Y) AUDIT REPORT (${route})
================================================================================
CONFORMANCE RESULT: ${compliance.finalStatus}
OVERALL PASS RATE : ${compliance.overallRate}% (${compliance.passedTotal}/${compliance.passedTotal + compliance.failedTotal} rules)

WCAG CONFORMANCE BY LEVEL:
  * Level A   (Baseline)   : ${compliance.levelA.rate}%  [Passed: ${compliance.levelA.passed} | Failed: ${compliance.levelA.failed}] ${compliance.levelA.failed === 0 ? '✓ PASS' : '✗ FAIL'}
  * Level AA  (Standard)   : ${compliance.levelAA.rate}%  [Passed: ${compliance.levelAA.passed} | Failed: ${compliance.levelAA.failed}] ${compliance.levelAA.failed === 0 ? '✓ PASS' : '✗ FAIL'}
  * Level AAA (Enhanced)   : ${compliance.levelAAA.rate}%  [Passed: ${compliance.levelAAA.passed} | Failed: ${compliance.levelAAA.failed}] ${compliance.levelAAA.failed === 0 ? '✓ PASS' : '✗ FAIL'}
================================================================================
`;

  if (results.violations.length > 0) {
    output += `\nLIST OF ${results.violations.length} VIOLATION(S) FOUND:\n`;

    results.violations.forEach((violation: any, index: number) => {
      const nodesDetail = violation.nodes
        .map(
          (node: any, nIdx: number) => `
    [Node ${nIdx + 1}]
    - Element       : ${node.html}
    - CSS Selector  : ${node.target.join(' ')}
    - Remediation   : ${node.failureSummary}`,
        )
        .join('\n');

      output += `
--------------------------------------------------------------------------------
#${index + 1}. [${violation.impact?.toUpperCase() || 'MODERATE'}] ${violation.id}
Description : ${violation.description}
Guidance URL: ${violation.helpUrl}
Tags        : ${violation.tags.join(', ')}
Target Nodes:
${nodesDetail}
--------------------------------------------------------------------------------`;
    });
  }

  return output;
}

test.describe('Accessibility Audits (A11y)', () => {
  for (const route of TARGET_ROUTES) {
    test(`Page "${route}" must satisfy WCAG 2.0 / 2.1 / 2.2 standards`, async ({ page }) => {
      // 1. Navigate to target page
      await page.goto(route);

      // 2. Wait until DOM is stable and network requests settle
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      // 3. Execute axe accessibility scan across all configured WCAG tags
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(ALL_WCAG_TAGS)
        .analyze();

      // 4. Generate formatted audit report
      const reportText = buildAccessibilityReport(route, accessibilityScanResults);

      // 5. Print report directly to terminal stdout
      console.log(reportText);

      // 6. Assert zero violations
      expect(
        accessibilityScanResults.violations,
        `Accessibility audit failed on "${route}":\n${reportText}`,
      ).toEqual([]);
    });
  }
});
