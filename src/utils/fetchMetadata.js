import { extractRecipeWithAI, extractRecipeFromUrlWithSearch } from './extractRecipeWithAI.js'
import { hasApiKey } from './apiKey.js'

// List of CORS proxies to try in order
const CORS_PROXIES = [
    {
        name: 'allOriginsRaw',
        urlTemplate: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    },
    {
        name: 'allOriginsGet',
        urlTemplate: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    },
    {
        name: 'codetabs',
        urlTemplate: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    }
]

/**
 * Fetch recipe metadata from a URL.
 * Prioritizes Gemini's Google Search Grounding for CORS-immune web extraction,
 * with fallbacks to CORS proxies and HTML parsing.
 *
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<Object>} - Extracted metadata
 */
export async function fetchMetadata(url) {
    if (!url || !isValidUrl(url)) {
        throw new Error('有効なURLを入力してください')
    }

    const apiKeyConfigured = hasApiKey()

    // 1. First priority: Try Gemini Google Search Grounding (Immune to CORS & proxy blocks)
    if (apiKeyConfigured) {
        try {
            console.log('🤖 Attempting AI extraction via Google Search Grounding...')
            const searchData = await extractRecipeFromUrlWithSearch(url)
            if (searchData && searchData.title) {
                console.log('✅ Google Search Grounding extraction successful!', {
                    title: searchData.title,
                    ingredients: searchData.ingredients?.length || 0,
                    steps: searchData.steps?.length || 0
                })
                return {
                    ...searchData,
                    url
                }
            }
        } catch (searchError) {
            console.warn('⚠️ Google Search Grounding failed, trying CORS proxy fallback:', searchError.message)
        }
    }

    // 2. Second priority: Try fetching HTML via CORS proxies
    let html = null
    let lastError = null

    for (const proxy of CORS_PROXIES) {
        try {
            console.log(`Trying ${proxy.name} proxy...`)
            const proxyUrl = proxy.urlTemplate(url)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 6000)

            const response = await fetch(proxyUrl, { signal: controller.signal })
            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error(`${proxy.name} returned ${response.status}`)
            }

            if (proxy.name === 'allOriginsGet') {
                const data = await response.json()
                html = data.contents
            } else {
                html = await response.text()
            }

            if (html && html.trim().length > 100) {
                console.log(`Successfully fetched HTML using ${proxy.name}`)
                break
            }
        } catch (error) {
            console.warn(`${proxy.name} failed:`, error.message)
            lastError = error
            continue
        }
    }

    // 3. Process HTML if fetched
    if (html) {
        if (apiKeyConfigured) {
            try {
                console.log('🤖 Attempting HTML AI extraction...')
                const aiData = await extractRecipeWithAI(html, url)
                if (aiData && aiData.title) {
                    return {
                        ...aiData,
                        url
                    }
                }
            } catch (aiError) {
                console.warn('HTML AI extraction failed, using DOM fallback:', aiError.message)
            }
        }

        // DOM Fallback
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        return {
            title: extractTitle(doc) || '無題のレシピ',
            description: extractDescription(doc) || '',
            imageUrl: extractImage(doc, url) || '',
            url: url,
            ingredients: [''],
            steps: [''],
            tags: []
        }
    }

    // If both Search Grounding and CORS proxies failed
    throw new Error(
        'URLからレシピを取得できませんでした。対象サイトがアクセス制限されている可能性があります。\n' +
        '「テキスト・SNSメモから」タブにレシピの文章を貼り付けて解析することをお試しください。'
    )
}

function isValidUrl(string) {
    try {
        const url = new URL(string)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
        return false
    }
}

function extractTitle(doc) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')
    if (ogTitle && ogTitle.content) return ogTitle.content

    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
    if (twitterTitle && twitterTitle.content) return twitterTitle.content

    const titleTag = doc.querySelector('title')
    if (titleTag && titleTag.textContent) return titleTag.textContent.trim()

    return ''
}

function extractDescription(doc) {
    const ogDesc = doc.querySelector('meta[property="og:description"]')
    if (ogDesc && ogDesc.content) return ogDesc.content

    const twitterDesc = doc.querySelector('meta[name="twitter:description"]')
    if (twitterDesc && twitterDesc.content) return twitterDesc.content

    const metaDesc = doc.querySelector('meta[name="description"]')
    if (metaDesc && metaDesc.content) return metaDesc.content

    return ''
}

function extractImage(doc, baseUrl) {
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.content) return makeAbsoluteUrl(ogImage.content, baseUrl)

    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.content) return makeAbsoluteUrl(twitterImage.content, baseUrl)

    const articleImg = doc.querySelector('article img, main img, .content img')
    if (articleImg && articleImg.src) return makeAbsoluteUrl(articleImg.src, baseUrl)

    return ''
}

function makeAbsoluteUrl(imageUrl, baseUrl) {
    try {
        return new URL(imageUrl, baseUrl).href
    } catch (_) {
        return imageUrl
    }
}
