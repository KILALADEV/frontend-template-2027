export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Full suite WCAG AAA & Semantic SEO rule guides with exact code examples and quick fixes',
    },
    hasSuggestions: true,
    schema: [],
  },
  create(context) {
    const getAttr = (node, name) =>
      node.attributes?.find((a) => a.type === 'JSXAttribute' && a.name?.name === name);

    // Track heading order and count (h1 -> h6) within each .astro file
    const fileHeadings = [];

    const hasAccessibleHeadingContent = (jsxElement) => {
      if (!jsxElement?.children || jsxElement.children.length === 0) return false;
      return jsxElement.children.some((child) => {
        if (child.type === 'JSXText') return child.value.trim().length > 0;
        if (child.type === 'JSXExpressionContainer') return true;
        if (child.type === 'JSXElement') {
          const childTag = child.openingElement?.name?.name;
          if (childTag === 'img') {
            const alt = getAttr(child.openingElement, 'alt')?.value?.value;
            return Boolean(alt && alt.trim().length > 0);
          }
          return hasAccessibleHeadingContent(child);
        }
        return false;
      });
    };

    const hasHeadingDescendant = (parentNode) => {
      if (!parentNode?.children) return false;

      return parentNode.children.some((child) => {
        if (child.type === 'JSXElement' || child.type === 'AstroHTMLNode') {
          const childTag = child.openingElement?.name?.name || child.name;
          if (typeof childTag === 'string' && /^h[1-6]$/.test(childTag)) {
            return true;
          }
          if (childTag === 'section') {
            return false;
          }
          return hasHeadingDescendant(child);
        }

        if (child.type === 'JSXFragment') {
          return hasHeadingDescendant(child);
        }

        if (child.type === 'JSXExpressionContainer' && child.expression) {
          if (child.expression.type === 'LogicalExpression') {
            return (
              hasHeadingDescendant({ children: [child.expression.left] }) ||
              hasHeadingDescendant({ children: [child.expression.right] })
            );
          }
          if (child.expression.type === 'ConditionalExpression') {
            return (
              hasHeadingDescendant({ children: [child.expression.consequent] }) ||
              hasHeadingDescendant({ children: [child.expression.alternate] })
            );
          }
        }

        return false;
      });
    };

    const getDirectHtmlChildren = (jsxOpeningNode) =>
      (jsxOpeningNode.parent?.children || [])
        .filter((child) => child.type === 'JSXElement')
        .map((child) => ({
          tag: child.openingElement?.name?.name,
          node: child.openingElement,
        }))
        .filter((item) => item.tag && /^[a-z][a-z0-9-]*$/.test(item.tag));

    const hasAncestorTag = (jsxOpeningNode, forbiddenTags) => {
      let curr = jsxOpeningNode.parent?.parent;
      while (curr) {
        if (curr.type === 'JSXElement') {
          const ancestorTag = curr.openingElement?.name?.name;
          if (forbiddenTags.includes(ancestorTag)) return ancestorTag;
        }
        curr = curr.parent;
      }
      return null;
    };

    return {
      JSXOpeningElement(node) {
        const tagName = node.name.name;

        // 1. <img> & <area>: Required 'alt' attribute (WCAG AAA 1.1.1)
        if (tagName === 'img' || tagName === 'area') {
          const altAttr = getAttr(node, 'alt');
          if (!altAttr) {
            const src = getAttr(node, 'src')?.value?.value || 'image.png';
            context.report({
              node,
              message: `[A11y WCAG AAA]: <${tagName}> element is missing an 'alt' attribute.
👉 Informative image example:
   <img src="${src}" alt="Detailed description of the image content..." />
👉 Decorative image example:
   <img src="${src}" alt="" aria-hidden="true" />`,
              suggest: [
                {
                  desc: 'Insert alt="Detailed description..."',
                  fix: (fixer) =>
                    fixer.insertTextAfter(node.name, ' alt="Detailed description of the image"'),
                },
                {
                  desc: 'Insert alt="" aria-hidden="true" (Decorative image)',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' alt="" aria-hidden="true"'),
                },
              ],
            });
          }
        }

        // 2. <a>: Disallow href="#" or empty links (WCAG AAA 2.4.4, 2.4.9)
        if (tagName === 'a') {
          const hrefAttr = getAttr(node, 'href');
          const isDynamicHref = hrefAttr?.value?.type === 'JSXExpressionContainer';
          const hrefVal = hrefAttr?.value?.value;

          if (
            !isDynamicHref &&
            (!hrefVal || hrefVal === '#' || hrefVal.startsWith('javascript:'))
          ) {
            context.report({
              node,
              message: `[A11y WCAG AAA]: Invalid <a> anchor (href="#").
👉 For JS action/modal trigger: Change to <button type="button">
   <button type="button" aria-label="Action label">Label</button>
👉 For navigation link: Provide a valid URL with an accessible name
   <a href="/target-url" aria-label="Detailed target destination">Link Text</a>`,
              suggest: [
                {
                  desc: 'Change to <button type="button">',
                  fix: (fixer) => [fixer.replaceText(node.name, 'button type="button"')],
                },
              ],
            });
          }
        }

        // 3. <button>: Explicit 'type' attribute required (WCAG AAA 4.1.2)
        if (tagName === 'button') {
          const typeAttr = getAttr(node, 'type');
          if (!typeAttr) {
            context.report({
              node,
              message: `[A11y WCAG AAA]: <button> is missing an explicit 'type' attribute.
👉 Standard pattern:
   <button type="button" aria-label="Action description">Click me</button>
   (or type="submit" when inside a <form>)`,
              suggest: [
                {
                  desc: 'Add type="button"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="button"'),
                },
              ],
            });
          }
        }

        // 4. <iframe>: Required 'title' attribute (WCAG AAA 4.1.2)
        if (tagName === 'iframe') {
          const titleAttr = getAttr(node, 'title');
          if (!titleAttr) {
            context.report({
              node,
              message: `[A11y WCAG AAA]: <iframe> element requires a 'title' attribute.
👉 Standard pattern:
   <iframe src="..." title="Embedded content description (e.g., Google Maps)" loading="lazy"></iframe>`,
              suggest: [
                {
                  desc: 'Add title="Embedded frame description"',
                  fix: (fixer) =>
                    fixer.insertTextAfter(node.name, ' title="Embedded frame description"'),
                },
              ],
            });
          }
        }

        // 5. <input>, <select>, <textarea>: Accessible label required (WCAG AAA 3.3.2)
        if (['input', 'select', 'textarea'].includes(tagName)) {
          const type = getAttr(node, 'type')?.value?.value;
          if (type !== 'hidden') {
            const hasId = getAttr(node, 'id');
            const hasAriaLabel = getAttr(node, 'aria-label');
            const hasAriaLabelledby = getAttr(node, 'aria-labelledby');

            if (!hasId && !hasAriaLabel && !hasAriaLabelledby) {
              context.report({
                node,
                message: `[A11y WCAG AAA]: <${tagName}> is missing an accessible label (<label> association or aria-label).
👉 Connected <label> pattern:
   <label for="field-id">Field Name</label>
   <${tagName} id="field-id" name="field-name" />
👉 Direct aria-label pattern:
   <${tagName} aria-label="Field description" />`,
                suggest: [
                  {
                    desc: 'Add aria-label="Field label"',
                    fix: (fixer) => fixer.insertTextAfter(node.name, ' aria-label="Field label"'),
                  },
                ],
              });
            }
          }
        }

        // 6. <svg>: Explicit accessibility semantics required (WCAG AAA 1.1.1)
        if (tagName === 'svg') {
          const ariaHidden = getAttr(node, 'aria-hidden');
          const ariaLabel = getAttr(node, 'aria-label');
          const role = getAttr(node, 'role');

          if (!ariaHidden && !ariaLabel && !role) {
            context.report({
              node,
              message: `[A11y WCAG AAA]: <svg> requires explicit accessibility semantics.
👉 Decorative icon (text present alongside):
   <svg aria-hidden="true" focusable="false">...</svg>
👉 Standalone meaningful icon / button icon:
   <svg role="img" aria-label="Action description">...</svg>`,
              suggest: [
                {
                  desc: 'Add aria-hidden="true" focusable="false" (Decorative)',
                  fix: (fixer) =>
                    fixer.insertTextAfter(node.name, ' aria-hidden="true" focusable="false"'),
                },
                {
                  desc: 'Add role="img" aria-label="..." (Meaningful icon)',
                  fix: (fixer) =>
                    fixer.insertTextAfter(node.name, ' role="img" aria-label="Icon description"'),
                },
              ],
            });
          }
        }

        // 7. <video> & <audio>: Subtitles and caption tracks required (WCAG AAA 1.2.x)
        if (tagName === 'video' || tagName === 'audio') {
          const hasAutoplay = getAttr(node, 'autoplay');
          context.report({
            node,
            message: `[A11y WCAG AAA]: <${tagName}> requires captions/subtitles and must not autoplay audio unmuted.
👉 Required <track> pattern:
   <${tagName} controls>
     <source src="file.mp4" type="video/mp4" />
     <track kind="captions" src="subtitles.vtt" srclang="en" label="English" default />
   </${tagName}>
${hasAutoplay ? '⚠️ WARNING: Autoplay with unmuted audio violates WCAG AAA.' : ''}`,
          });
        }

        // 8. <table>: Caption and headers required (WCAG AAA 1.3.1)
        if (tagName === 'table') {
          context.report({
            node,
            message: `[A11y WCAG AAA]: <table> requires a clear caption and scoped headers.
👉 Accessible table structure:
   <table>
     <caption>Summary description of the table data</caption>
     <thead>
       <tr>
         <th scope="col">Header 1</th>
         <th scope="col">Header 2</th>
       </tr>
     </thead>
     <tbody>...</tbody>
   </table>`,
          });
        }

        // 9. Heading elements <h1> - <h6>: Empty, Duplicate <h1>, Strict Order 1->2->3->4->5->6, aria-hidden
        if (/^h[1-6]$/.test(tagName)) {
          const level = Number(tagName.replace('h', ''));
          const ariaHidden = getAttr(node, 'aria-hidden');
          const ariaLabel = getAttr(node, 'aria-label')?.value?.value?.trim();

          // 9a. Disallow aria-hidden="true" on headings
          if (ariaHidden?.value?.value === 'true') {
            context.report({
              node,
              message: `[Semantic SEO]: Do not apply aria-hidden="true" to <${tagName}>. It breaks the document outline.
👉 Keep the heading in the DOM and use visually hidden CSS if needed:
   <${tagName} class="sr-only">Accessible Heading Text</${tagName}>`,
            });
          }

          // 9b. Catch empty heading tags (e.g., <h1></h1> or containing only hidden icons)
          const hasTextContent = hasAccessibleHeadingContent(node.parent);
          if (!hasTextContent && !ariaLabel) {
            context.report({
              node,
              message: `[Semantic SEO]: Empty <${tagName}> tag detected. Search engines and screen readers require descriptive text inside headings.
👉 Provide meaningful heading text or remove the empty tag:
   <${tagName}>Section Title</${tagName}>`,
            });
          }

          // 9c. Catch duplicate <h1> tags within the same file
          if (level === 1 && fileHeadings.some((h) => h.level === 1)) {
            context.report({
              node,
              message: `[Semantic SEO]: Multiple <h1> tags detected in the same file. A page must have only one primary <h1>.
👉 Demote secondary headings to <h2>:
   <h2>Sub-section Title</h2>`,
              suggest: [
                {
                  desc: 'Change to <h2>',
                  fix: (fixer) => {
                    const fixes = [fixer.replaceText(node.name, 'h2')];
                    if (node.parent?.closingElement?.name) {
                      fixes.push(fixer.replaceText(node.parent.closingElement.name, 'h2'));
                    }
                    return fixes;
                  },
                },
              ],
            });
          }

          // 9d. Enforce strict heading hierarchy order (1 -> 2 -> 3 -> 4 -> 5 -> 6)
          const isPageFile = /[\\/]src[\\/]pages[\\/]/.test(context.filename || '');

          if (fileHeadings.length === 0) {
            // For page files (src/pages/*), the first heading MUST be <h1>
            if (isPageFile && level !== 1) {
              context.report({
                node,
                message: `[Semantic SEO]: Page must start with <h1> as its first heading, found <${tagName}> instead.
👉 Change the first heading on the page to <h1>.`,
              });
            }
          } else {
            const prev = fileHeadings[fileHeadings.length - 1];

            // Catch cases where <h1> appears AFTER <h2>-<h6> (e.g., <h3> -> <h2> -> <h1>)
            if (level === 1) {
              context.report({
                node,
                message: `[Semantic SEO]: <h1> cannot appear after <h${prev.level}>. <h1> must be the very first heading on the page.`,
              });
            }

            // Catch skipped heading levels (e.g., <h1> -> <h3>, <h2> -> <h4>)
            if (level - prev.level > 1) {
              const expectedLevel = prev.level + 1;
              context.report({
                node,
                message: `[Semantic SEO]: Invalid heading hierarchy (<h${prev.level}> -> <${tagName}>). Headings must follow sequential order (h1 -> h2 -> h3 -> h4 -> h5 -> h6) without skipping levels.
👉 Change <${tagName}> to <h${expectedLevel}>.`,
                suggest: [
                  {
                    desc: `Change to <h${expectedLevel}>`,
                    fix: (fixer) => {
                      const fixes = [fixer.replaceText(node.name, `h${expectedLevel}`)];
                      if (node.parent?.closingElement?.name) {
                        fixes.push(
                          fixer.replaceText(node.parent.closingElement.name, `h${expectedLevel}`),
                        );
                      }
                      return fixes;
                    },
                  },
                ],
              });
            }
          }

          fileHeadings.push({ level, node });
        }

        // 10. Positive tabindex: Disrupts natural tab sequence (WCAG AAA 2.4.3)
        const tabIndexAttr = getAttr(node, 'tabindex') || getAttr(node, 'tabIndex');
        if (tabIndexAttr) {
          const val = parseInt(tabIndexAttr.value?.value, 10);
          if (val > 0) {
            context.report({
              node: tabIndexAttr,
              message: `[A11y WCAG AAA]: Avoid positive tabindex (${val}). Values > 0 disrupt the sequential keyboard navigation order.
👉 Standard usage:
   tabindex="0"  (Includes element in natural tab order)
   tabindex="-1" (Programmatic focus via JS only)`,
              suggest: [
                {
                  desc: 'Change to tabindex="0"',
                  fix: (fixer) => fixer.replaceText(tabIndexAttr, 'tabindex="0"'),
                },
                {
                  desc: 'Change to tabindex="-1"',
                  fix: (fixer) => fixer.replaceText(tabIndexAttr, 'tabindex="-1"'),
                },
              ],
            });
          }
        }

        // 11. 'autofocus' attribute: Prohibited under AAA (WCAG AAA 2.1.1, 3.2.1)
        const autoFocusAttr = getAttr(node, 'autofocus') || getAttr(node, 'autoFocus');
        if (autoFocusAttr) {
          context.report({
            node: autoFocusAttr,
            message: `[A11y WCAG AAA]: The 'autofocus' attribute is prohibited at Level AAA because it disorients screen reader users upon page load.
👉 Remove 'autofocus' and allow users to navigate from the document root.`,
            suggest: [
              {
                desc: 'Remove autofocus attribute',
                fix: (fixer) => fixer.remove(autoFocusAttr),
              },
            ],
          });
        }

        // 12. Non-interactive elements with click events (WCAG AAA 2.1.1)
        if (['div', 'span', 'i', 'p', 'section', 'article'].includes(tagName)) {
          const hasClick = getAttr(node, 'onClick') || getAttr(node, 'onclick');
          if (hasClick) {
            context.report({
              node,
              message: `[A11y WCAG AAA]: Do not bind click handlers to non-interactive <${tagName}>.
👉 Change to a semantic <button>:
   <button type="button" class="..." onClick={...}>Label</button>
(<${tagName}> does not receive native keyboard focus or trigger on Enter/Space).`,
            });
          }
        }

        // 13. <section>: Semantic landmark requires heading
        if (tagName === 'section') {
          const hasHeadingChild = hasHeadingDescendant(node.parent);
          if (!hasHeadingChild) {
            context.report({
              node,
              message: `[Semantic SEO]: <section> must contain a heading (<h2>-<h6>). Use <div> if it is only a layout wrapper.`,
            });
          }
        }

        // 14. HTML Content Model & Invalid Tag Nesting (WHATWG HTML Standard)
        // 14a. <ul> / <ol> / <menu>: Only direct <li>, <script>, and <template> children are allowed
        if (['ul', 'ol', 'menu'].includes(tagName)) {
          const allowed = ['li', 'script', 'template'];
          for (const child of getDirectHtmlChildren(node)) {
            if (!allowed.includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> cannot be a direct child of <${tagName}>.
👉 Only <li> elements are valid direct children of <${tagName}>:
   <${tagName}>
     <li><${child.tag}>...</${child.tag}></li>
   </${tagName}>`,
              });
            }
          }
        }

        // 14b. <dl>: Only direct <dt>, <dd>, <div>, <script>, and <template> children are allowed
        if (tagName === 'dl') {
          const allowed = ['dt', 'dd', 'div', 'script', 'template'];
          for (const child of getDirectHtmlChildren(node)) {
            if (!allowed.includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> is invalid inside <dl>.
👉 <dl> only accepts <dt> (term), <dd> (description), or a wrapping <div>:
   <dl>
     <dt>Term</dt>
     <dd>Description</dd>
   </dl>`,
              });
            }
          }
        }

        // 14c. <li> / <dt> / <dd>: Must be placed directly inside a valid parent tag
        if (tagName === 'li') {
          const parentTag = node.parent?.parent?.openingElement?.name?.name;
          if (parentTag && /^[a-z]/.test(parentTag) && !['ul', 'ol', 'menu'].includes(parentTag)) {
            context.report({
              node,
              message: `[HTML Structure]: <li> must be a direct child of <ul>, <ol>, or <menu> (found inside <${parentTag}>).`,
            });
          }
        }
        if (tagName === 'dt' || tagName === 'dd') {
          const parentTag = node.parent?.parent?.openingElement?.name?.name;
          if (parentTag && /^[a-z]/.test(parentTag) && !['dl', 'div'].includes(parentTag)) {
            context.report({
              node,
              message: `[HTML Structure]: <${tagName}> must be inside <dl> (found inside <${parentTag}>).`,
            });
          }
        }

        // 14d. <table> structure
        if (tagName === 'table') {
          const allowed = [
            'caption',
            'colgroup',
            'thead',
            'tbody',
            'tfoot',
            'tr',
            'script',
            'template',
          ];
          for (const child of getDirectHtmlChildren(node)) {
            if (!allowed.includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> cannot be a direct child of <table>. Wrap cells inside <thead>/<tbody> -> <tr> -> <th>/<td>.`,
              });
            }
          }
        }
        if (['thead', 'tbody', 'tfoot'].includes(tagName)) {
          for (const child of getDirectHtmlChildren(node)) {
            if (!['tr', 'script', 'template'].includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> cannot be a direct child of <${tagName}>. Only <tr> is allowed.`,
              });
            }
          }
        }
        if (tagName === 'tr') {
          for (const child of getDirectHtmlChildren(node)) {
            if (!['td', 'th', 'script', 'template'].includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> cannot be a direct child of <tr>. Wrap content inside <td> or <th>.`,
              });
            }
          }
        }

        // 14e. <p> cannot contain block-level elements
        if (tagName === 'p') {
          const blockTags = [
            'div',
            'section',
            'article',
            'aside',
            'header',
            'footer',
            'main',
            'nav',
            'ul',
            'ol',
            'dl',
            'table',
            'blockquote',
            'pre',
            'form',
            'fieldset',
            'hr',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'p',
          ];
          for (const child of getDirectHtmlChildren(node)) {
            if (blockTags.includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: Block element <${child.tag}> cannot be nested inside <p>. The browser will auto-close <p> and break your layout.`,
              });
            }
          }
        }

        // 14f. Disallow nested interactive elements (<a> inside <a>/<button>, <button> inside <a>/<button>)
        if (['a', 'button'].includes(tagName)) {
          const forbiddenAncestor = hasAncestorTag(node, ['a', 'button']);
          if (forbiddenAncestor) {
            context.report({
              node,
              message: `[HTML Structure & A11y]: Interactive element <${tagName}> cannot be nested inside <${forbiddenAncestor}>.`,
            });
          }
        }

        // 14g. <select> can only contain <option>, <optgroup>, <hr>
        if (tagName === 'select') {
          for (const child of getDirectHtmlChildren(node)) {
            if (!['option', 'optgroup', 'hr', 'script', 'template'].includes(child.tag)) {
              context.report({
                node: child.node,
                message: `[HTML Structure]: <${child.tag}> is invalid inside <select>. Only <option> and <optgroup> are allowed.`,
              });
            }
          }
        }
      },
    };
  },
};
