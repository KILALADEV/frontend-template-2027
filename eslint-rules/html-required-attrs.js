export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Strict enforcement of mandatory HTML attributes across all primary elements (CWV, SEO, Security, Mobile Engine)",
    },
    hasSuggestions: true,
    schema: [],
  },
  create(context) {
    const getAttr = (node, name) => node.attributes?.find((a) => a.type === "JSXAttribute" && a.name?.name === name);

    return {
      JSXOpeningElement(node) {
        const tagName = node.name.name;

        // 1. <img>: Layout stability (CLS prevention), LCP vs Lazy Loading, and Async Decoding
        if (tagName === "img") {
          const widthAttr = getAttr(node, "width");
          const heightAttr = getAttr(node, "height");
          const loadingAttr = getAttr(node, "loading");
          const decodingAttr = getAttr(node, "decoding");
          const fetchPriorityAttr = getAttr(node, "fetchpriority") || getAttr(node, "fetchPriority");

          const loadingVal = loadingAttr?.value?.value;
          const fetchPriorityVal = fetchPriorityAttr?.value?.value;
          const srcVal = getAttr(node, "src")?.value?.value || "";
          const classVal = getAttr(node, "class")?.value?.value || getAttr(node, "className")?.value?.value || "";

          // Kiểm tra xem thẻ <img> có nằm trong <header> hoặc <nav> không
          let isInsideTopLandmark = false;
          let curr = node.parent;
          while (curr) {
            const pName = curr.openingElement?.name?.name;
            if (pName === "header" || pName === "nav") {
              isInsideTopLandmark = true;
              break;
            }
            curr = curr.parent;
          }

          // Nhận diện ảnh load ban đầu (Above-the-fold / LCP)
          const isAboveFold =
            fetchPriorityVal === "high" ||
            loadingVal === "eager" ||
            isInsideTopLandmark ||
            /(^|[-_/])(mv|hero|keyvisual|kv|logo)([-_/.]|$)/i.test(`${srcVal} ${classVal}`);

          // Cảnh báo xung đột nghiêm trọng: Ảnh LCP ưu tiên cao nhưng lại để loading="lazy"
          if (fetchPriorityVal === "high" && loadingVal === "lazy") {
            context.report({
              node,
              message: `[HTML Performance]: Do not use loading="lazy" with fetchpriority="high" on LCP images; it delays initial rendering.`,
              suggest: [
                {
                  desc: 'Replace loading="lazy" with loading="eager"',
                  fix: (fixer) => fixer.replaceText(loadingAttr, 'loading="eager"'),
                },
              ],
            });
            return;
          }

          const missing = [];
          if (!widthAttr) missing.push("width");
          if (!heightAttr) missing.push("height");
          if (!decodingAttr) missing.push('decoding="async"');

          // Chỉ bắt buộc loading="lazy" nếu KHÔNG phải ảnh load ban đầu
          if (!isAboveFold && !loadingAttr) {
            missing.push('loading="lazy"');
          }

          if (missing.length > 0) {
            const suggestAttrs = isAboveFold
              ? 'fetchpriority="high" decoding="async"'
              : 'loading="lazy" decoding="async"';

            context.report({
              node,
              message: `[HTML Quality]: <img> is missing essential performance attributes: ${missing.join(", ")}.
👉 Standard Core Web Vitals pattern:
   ${
     isAboveFold
       ? '<img src="..." alt="..." width="1440" height="647" fetchpriority="high" decoding="async" />'
       : '<img src="..." alt="..." width="400" height="300" loading="lazy" decoding="async" />'
   }`,
              suggest: [
                {
                  desc: `Insert ${suggestAttrs}`,
                  fix: (fixer) => fixer.insertTextAfter(node.name, ` ${suggestAttrs}`),
                },
                {
                  desc: `Insert placeholder width="400" height="300" ${suggestAttrs}`,
                  fix: (fixer) => fixer.insertTextAfter(node.name, ` width="400" height="300" ${suggestAttrs}`),
                },
              ],
            });
          }
        }

        // 2. <a>: Reverse tabnabbing vulnerability prevention for external tabs
        if (tagName === "a") {
          const target = getAttr(node, "target")?.value?.value;
          const rel = getAttr(node, "rel")?.value?.value;

          if (target === "_blank" && (!rel || !rel.includes("noopener"))) {
            context.report({
              node,
              message: `[HTML Security]: <a> with target="_blank" must include rel="noopener noreferrer" to prevent reverse tabnabbing attacks.
👉 Standard pattern:
   <a href="..." target="_blank" rel="noopener noreferrer">Link</a>`,
              suggest: [
                {
                  desc: 'Insert rel="noopener noreferrer"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' rel="noopener noreferrer"'),
                },
              ],
            });
          }
        }

        // 3. <button>: Explicit button type declaration (prevent unintended form submissions)
        if (tagName === "button") {
          const typeAttr = getAttr(node, "type");
          if (!typeAttr) {
            context.report({
              node,
              message: `[HTML Quality]: <button> is missing an explicit 'type' attribute. Default type is "submit", causing unwanted form triggers.
👉 Standard pattern:
   <button type="button">Action</button>
   (or type="submit" inside forms)`,
              suggest: [
                {
                  desc: 'Insert type="button"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="button"'),
                },
                {
                  desc: 'Insert type="submit"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="submit"'),
                },
              ],
            });
          }
        }

        // 4. <iframe>: Lazy loading + layout dimensions
        if (tagName === "iframe") {
          const missing = [];
          if (!getAttr(node, "loading")) missing.push('loading="lazy"');
          if (!getAttr(node, "width")) missing.push("width");
          if (!getAttr(node, "height")) missing.push("height");

          if (missing.length > 0) {
            context.report({
              node,
              message: `[HTML Performance]: <iframe> is missing performance attributes: ${missing.join(", ")}.
👉 Standard pattern:
   <iframe src="..." title="..." width="600" height="450" loading="lazy"></iframe>`,
              suggest: [
                {
                  desc: 'Insert loading="lazy"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' loading="lazy"'),
                },
              ],
            });
          }
        }

        // 5. <video>: Autoplay engine compatibility (iOS Safari requires playsinline + muted)
        if (tagName === "video") {
          const hasAutoplay = getAttr(node, "autoplay");
          const hasMuted = getAttr(node, "muted");
          const hasPlaysInline = getAttr(node, "playsinline") || getAttr(node, "playsInline");
          const hasPreload = getAttr(node, "preload");

          if (hasAutoplay && (!hasMuted || !hasPlaysInline)) {
            context.report({
              node,
              message: `[HTML Media]: <video autoplay> requires 'muted' and 'playsinline' attributes to function on mobile browsers (iOS WebKit / Safari).
👉 Autoplay video pattern:
   <video autoplay muted loop playsinline preload="metadata">...</video>`,
              suggest: [
                {
                  desc: 'Insert muted playsinline preload="metadata"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' muted playsinline preload="metadata"'),
                },
              ],
            });
          } else if (!hasPreload) {
            context.report({
              node,
              message: `[HTML Media]: <video> should declare a 'preload' attribute to avoid excessive data usage.
👉 Standard pattern:
   <video controls preload="metadata">...</video>`,
              suggest: [
                {
                  desc: 'Insert preload="metadata"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' preload="metadata"'),
                },
              ],
            });
          }
        }

        // 6. <audio>: Explicit preload attribute
        if (tagName === "audio") {
          const hasPreload = getAttr(node, "preload");
          if (!hasPreload) {
            context.report({
              node,
              message: `[HTML Media]: <audio> should declare a 'preload' attribute to optimize network bandwidth.
👉 Standard pattern:
   <audio controls preload="none">...</audio>`,
              suggest: [
                {
                  desc: 'Insert preload="none"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' preload="none"'),
                },
              ],
            });
          }
        }

        // 7. <form>: Explicit method attribute
        if (tagName === "form") {
          const method = getAttr(node, "method");
          if (!method) {
            context.report({
              node,
              message: `[HTML Quality]: <form> element should declare an explicit 'method' attribute.
👉 Standard pattern:
   <form action="/api/endpoint" method="POST">...</form>`,
              suggest: [
                {
                  desc: 'Insert method="POST"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' method="POST"'),
                },
                {
                  desc: 'Insert method="GET"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' method="GET"'),
                },
              ],
            });
          }
        }

        // 8. <input>: Explicit type and autocomplete
        if (tagName === "input") {
          const type = getAttr(node, "type");
          const typeVal = type?.value?.value;

          if (!type) {
            context.report({
              node,
              message: `[HTML Quality]: <input> is missing an explicit 'type' attribute.
👉 Standard pattern:
   <input type="text" id="..." name="..." autocomplete="on" />`,
              suggest: [
                {
                  desc: 'Insert type="text"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="text"'),
                },
              ],
            });
          } else if (["text", "email", "tel", "password"].includes(typeVal)) {
            const hasAutocomplete = getAttr(node, "autocomplete");
            if (!hasAutocomplete) {
              context.report({
                node,
                message: `[HTML Quality]: <input type="${typeVal}"> should include an 'autocomplete' attribute for user autofill convenience and WCAG AAA conformance.
👉 Standard pattern:
   <input type="${typeVal}" autocomplete="${typeVal === "text" ? "name" : typeVal}" />`,
                suggest: [
                  {
                    desc: `Insert autocomplete="${typeVal === "text" ? "on" : typeVal}"`,
                    fix: (fixer) =>
                      fixer.insertTextAfter(node.name, ` autocomplete="${typeVal === "text" ? "on" : typeVal}"`),
                  },
                ],
              });
            }
          }
        }

        // 9. <textarea>: Required rows and cols (or layout dimensions)
        if (tagName === "textarea") {
          const hasRows = getAttr(node, "rows");
          const hasName = getAttr(node, "name");

          if (!hasRows || !hasName) {
            context.report({
              node,
              message: `[HTML Quality]: <textarea> requires 'name' and fallback 'rows' attributes.
👉 Standard pattern:
   <textarea id="message" name="message" rows="4"></textarea>`,
              suggest: [
                {
                  desc: 'Insert rows="4"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' rows="4"'),
                },
              ],
            });
          }
        }

        // 10. <source>: Missing type attribute on media sources & width/height on <picture> sources
        if (tagName === "source") {
          const typeAttr = getAttr(node, "type");
          const typeVal = typeAttr?.value?.value || "";
          const parentTag = node.parent?.openingElement?.name?.name;
          const isImageSource =
            parentTag === "picture" || Boolean(getAttr(node, "srcset")) || typeVal.startsWith("image/");

          const missing = [];
          if (!typeAttr) missing.push("type");

          if (isImageSource) {
            if (!getAttr(node, "width")) missing.push("width");
            if (!getAttr(node, "height")) missing.push("height");
          }

          if (missing.length > 0) {
            const suggestions = [];

            if (!typeAttr) {
              suggestions.push(
                {
                  desc: 'Insert type="image/webp"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="image/webp"'),
                },
                {
                  desc: 'Insert type="video/mp4"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' type="video/mp4"'),
                },
              );
            }

            if (isImageSource && (!getAttr(node, "width") || !getAttr(node, "height"))) {
              const missingDims = [
                !getAttr(node, "width") ? 'width="1440"' : "",
                !getAttr(node, "height") ? 'height="647"' : "",
              ]
                .filter(Boolean)
                .join(" ");

              suggestions.push({
                desc: `Insert ${missingDims}`,
                fix: (fixer) => fixer.insertTextAfter(node.name, ` ${missingDims}`),
              });
            }

            context.report({
              node,
              message: `[HTML Performance]: <source> is missing essential attributes: ${missing.join(", ")}.
👉 Standard pattern:
   <picture>
     <source media="(min-width: 769px)" srcset="image-pc.webp" type="image/webp" width="1440" height="647" />
     <img src="image-sp.webp" alt="..." width="360" height="740" loading="lazy" decoding="async" />
   </picture>`,
              suggest: suggestions,
            });
          }
        }

        // 11. <track>: Captions must declare kind, srclang, and label
        if (tagName === "track") {
          const missing = [];
          if (!getAttr(node, "kind")) missing.push("kind");
          if (!getAttr(node, "srclang")) missing.push("srclang");
          if (!getAttr(node, "label")) missing.push("label");

          if (missing.length > 0) {
            context.report({
              node,
              message: `[HTML A11y]: <track> is missing mandatory caption attributes: ${missing.join(", ")}.
👉 Standard pattern:
   <track kind="captions" src="subtitles.vtt" srclang="en" label="English" default />`,
              suggest: [
                {
                  desc: 'Insert kind="captions" srclang="en" label="English"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' kind="captions" srclang="en" label="English"'),
                },
              ],
            });
          }
        }

        // 12. <th>: Header cells in <table> must declare scope
        if (tagName === "th") {
          const scopeAttr = getAttr(node, "scope");
          if (!scopeAttr) {
            context.report({
              node,
              message: `[HTML Quality]: Table header <th> requires an explicit 'scope' attribute ("col" or "row").
👉 Standard pattern:
   <th scope="col">Header Title</th>`,
              suggest: [
                {
                  desc: 'Insert scope="col"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' scope="col"'),
                },
                {
                  desc: 'Insert scope="row"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' scope="row"'),
                },
              ],
            });
          }
        }

        // 13. <dialog>: Modal attributes
        if (tagName === "dialog") {
          const hasAriaModal = getAttr(node, "aria-modal");
          if (!hasAriaModal) {
            context.report({
              node,
              message: `[HTML Quality]: Native <dialog> should declare 'aria-modal="true"' when used as a blocking modal.
👉 Standard pattern:
   <dialog aria-modal="true" aria-labelledby="dialog-title">...</dialog>`,
              suggest: [
                {
                  desc: 'Insert aria-modal="true"',
                  fix: (fixer) => fixer.insertTextAfter(node.name, ' aria-modal="true"'),
                },
              ],
            });
          }
        }
      },
    };
  },
};
