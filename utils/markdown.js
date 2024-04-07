const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItEleventyImg = require("markdown-it-eleventy-img");
const path = require('path');

const PREFIX = 'Eleventy-Markdown-it'
const LOG_PREFIX = `[\x1b[34m${PREFIX}\x1b[0m]`

const anchorSlugify = (s) =>
    encodeURIComponent(
        'h-' +
            String(s)
                .trim()
                .toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, '')
                .replace(/\s+/g, '-')
    )

const markdown = markdownIt({
    html: true,
    breaks: true,
    typographer: true
}).use(markdownItAnchor, {
    permalink: true,
    permalinkSymbol: '#',
    permalinkClass: 'heading-anchor',
    permalinkBefore: true,
    permalinkAttrs: () => ({ 'aria-hidden': true }),
    level: 2,
    slugify: anchorSlugify
}).use(markdownItEleventyImg, {
    resolvePath: (filepath, env) => path.join(path.dirname(env.page.inputPath), filepath),
    imgOptions: {
        urlPath: "/",
        format: ["auto"]
    },
    renderImage(image, attributes) {
        const [ src, attrs ] = attributes;
        var img_src;

        if (src.includes("\\")) {
            img_src = src.split("\\").pop();
        } else {
            img_src = src.split("/").pop();
        }

        const imageMarkup = `<img src="${img_src}" alt="${attrs.alt}" title="${attrs.title}">`;
    
        return `<figure class="markdown-image">${imageMarkup}${attrs.title ? `<figcaption>${attrs.title}</figcaption>` : ""}</figure>`;
    }
});

module.exports = markdown
