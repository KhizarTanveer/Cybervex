import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { DEFAULT_IMAGE, SITE_NAME, canonicalUrl, pageSeo } from './src/data/seo.js'

// The API server (server/index.js) runs on port 4000 (or API_PORT); forward /api to it
const apiProxy = { '/api': `http://localhost:${process.env.API_PORT || 4000}` }

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Title, description, canonical and social tags for one page
const seoTags = (route) => {
  const { title, description } = pageSeo[route]
  const url = canonicalUrl(route)
  return [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${DEFAULT_IMAGE.url}" />`,
    `<meta property="og:image:width" content="${DEFAULT_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${DEFAULT_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeAttr(DEFAULT_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_IMAGE.url}" />`,
  ].join('\n    ')
}

// The site is a single-page app, so every page would otherwise share index.html's tags.
// This writes dist/<page>/index.html for each page with that page's own tags; the server
// (and any static host) serves them at /about, /projects, …
function seoPages() {
  let outDir
  return {
    name: 'cybervex-seo-pages',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    transformIndexHtml(html) {
      return html.replace('<!-- seo-tags -->', seoTags('/'))
    },
    closeBundle() {
      const homeHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const homeTags = seoTags('/')
      if (!homeHtml.includes(homeTags)) throw new Error('seo-pages: home tags not found in dist/index.html')
      for (const route of Object.keys(pageSeo)) {
        if (route === '/') continue
        const dir = path.join(outDir, route)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), homeHtml.replace(homeTags, seoTags(route)))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoPages()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
