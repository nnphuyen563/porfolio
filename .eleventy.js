require('dotenv').config()

const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginNavigation = require('@11ty/eleventy-navigation')
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const pluginPageAssets = require('eleventy-plugin-page-assets')
const pluginShareHighlight = require('eleventy-plugin-share-highlight')

const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const shortcodes = require('./utils/shortcodes.js')
const markdown = require('./utils/markdown.js')

const IS_PRODUCTION = process.env.ELEVENTY_ENV === 'production'
const CONTENT_GLOBS = {
    posts: 'src/posts/**/*.md',
    drafts: 'src/drafts/**/*.md',
    notes: 'src/notes/*.md',
    projects: 'src/projects/**/*.md',
    media: '*.jpg|*.png|*.gif|*.mp4|*.webp|*.webm'
}

function slugify(str) {
    return String(str)
      .normalize('NFKD') // split accented characters into their base characters and diacritical marks
      .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      .trim() // trim leading or trailing whitespace
      .toLowerCase() // convert to lowercase
      .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // remove consecutive hyphens
  }

module.exports = function (config) {
    // Plugins
    config.addPlugin(pluginRss)
    config.addPlugin(pluginNavigation)
    config.addPlugin(pluginSyntaxHighlight)
    config.addPlugin(pluginPageAssets, {
        mode: 'directory',
        postsMatching: 'src/posts/*/*.md',
        assetsMatching: CONTENT_GLOBS.media,
        silent: true
    })

    config.addPlugin(pluginPageAssets, {
        mode: 'directory',
        postsMatching: 'src/projects/*/*.md',
        assetsMatching: CONTENT_GLOBS.media,
        silent: true
    })

    config.addPlugin(pluginShareHighlight)

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // Transforms
    Object.keys(transforms).forEach((transformName) => {
        config.addTransform(transformName, transforms[transformName])
    })

    // Shortcodes
    config.addShortcode('icon', shortcodes.icon)
    config.addPairedShortcode('signup', shortcodes.signup)
    config.addPairedShortcode('callout', shortcodes.callout)

    // Asset Watch Targets
    config.addWatchTarget('./src/assets')

    // Markdown Parsing
    config.setLibrary('md', markdown)

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('page', 'page.njk')
    config.addLayoutAlias('post', 'post.njk')
    config.addLayoutAlias('draft', 'draft.njk')
    // config.addLayoutAlias('note', 'note.njk')
    config.addLayoutAlias('tag', 'tag.njk')

    // Pass-through files
    config.addPassthroughCopy('src/site.webmanifest')
    config.addPassthroughCopy('src/robots.txt')
    config.addPassthroughCopy('src/assets/images')
    config.addPassthroughCopy('src/assets/fonts')
    config.addPassthroughCopy('src/admin')

    // Deep-Merge
    config.setDataDeepMerge(true)

    // Collections: Posts
    config.addCollection('posts', function (collection) {
        return collection
            .getFilteredByGlob(CONTENT_GLOBS.posts)
            .filter((item) => item.data.permalink !== false)
            .filter((item) => !(item.data.draft && IS_PRODUCTION))
    })

    config.addCollection('tags', collection => {
        const tagsSet = {};
        collection
            .getFilteredByGlob(CONTENT_GLOBS.posts)
            .forEach(item => {
                item.data.tags
                .forEach(
                    tag => {
                        tag = slugify(tag);
                        if (!tagsSet[tag]) { tagsSet[tag] = []; }
                        tagsSet[tag].push(item)
                    }
                );
            });
        return tagsSet;
    });

    config.addCollection('tagList', collection => {
        const tagsList = [];
        collection
            .getFilteredByGlob(CONTENT_GLOBS.posts)
            .forEach(item => {
                item.data.tags
                .forEach(
                    tag => {
                        tag = slugify(tag);
                        if (!tagsList.includes(tag)) {
                            tagsList.push(tag)
                        }
                    }
                );
            });
        return tagsList
    });

    // Collections: Drafts
    config.addCollection('drafts', function (collection) {
        return collection
            .getFilteredByGlob(CONTENT_GLOBS.drafts)
            .filter((item) => item.data.permalink !== false)
    })

    // Collections: Notes
    config.addCollection('notes', function (collection) {
        return collection.getFilteredByGlob(CONTENT_GLOBS.notes).reverse()
    })

    // Collections: Featured Posts
    config.addCollection('featured', function (collection) {
        return collection
            .getFilteredByGlob(CONTENT_GLOBS.posts)
            .filter((item) => item.data.featured)
            .sort((a, b) => b.date - a.date)
    })

    config.addCollection('projects', function (collection) {
        return collection
            .getFilteredByGlob(CONTENT_GLOBS.projects)
            .filter((item) => item.data.permalink !== false)
            .filter((item) => !(item.data.draft && IS_PRODUCTION))
    })

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    }
}
