import { extractRecipeWithAI } from './extractRecipeWithAI'

// List of CORS proxies to try in order
const CORS_PROXIES = [
    {
        name: 'allOrigins',
        urlTemplate: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    },
    {
        name: 'corsproxy.io',
        urlTemplate: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    },
    {
        name: 'api.codetabs',
        urlTemplate: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    }
]

/**
 * Fetch metadata from a URL using a CORS proxy and AI extraction
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<Object>} - Extracted metadata
 */
export async function fetchMetadata(url) {
    if (!url || !isValidUrl(url)) {
        throw new Error('有効なURLを入力してください')
    }

    let html = null
    let lastError = null

    // Try each proxy until one succeeds
    for (const proxy of CORS_PROXIES) {
        try {
            console.log(`Trying ${proxy.name} proxy...`)
            const proxyUrl = proxy.urlTemplate(url)

            const response = await fetch(proxyUrl)
            if (!response.ok) {
                throw new Error(`${proxy.name} returned ${response.status}`)
            }

            // Different proxies return different formats
            if (proxy.name === 'allOrigins') {
                const data = await response.json()
                html = data.contents
            } else if (proxy.name === 'corsproxy.io') {
                html = await response.text()
            } else if (proxy.name === 'api.codetabs') {
                html = await response.text()
            }

            if (html) {
                console.log(`Successfully fetched HTML using ${proxy.name}`)
                break
            }
        } catch (error) {
            console.warn(`${proxy.name} failed:`, error.message)
            lastError = error
            continue
        }
    }

    if (!html) {
        throw new Error(`URLからの情報取得に失敗しました。別のURLを試してください。\nエラー: ${lastError?.message || '不明'}`)
    }

    try {
        // Check if API key is configured
        const hasApiKey = import.meta.env.VITE_GEMINI_API_KEY
        console.log(`API Key status: ${hasApiKey ? 'CONFIGURED ✓' : 'NOT CONFIGURED ✗'}`)

        // Try AI extraction first if API key is configured
        if (hasApiKey) {
            try {
                console.log('🤖 Attempting AI extraction...')
                const aiData = await extractRecipeWithAI(html, url)
                if (aiData && aiData.title) {
                    console.log('✅ AI extraction successful!', {
                        title: aiData.title,
                        ingredients: aiData.ingredients?.length || 0,
                        steps: aiData.steps?.length || 0,
                        tags: aiData.tags?.length || 0
                    })
                    return {
                        ...aiData,
                        url // Ensure original URL is preserved
                    }
                }
            } catch (aiError) {
                console.error('❌ AI extraction failed:', aiError)
                console.warn('Falling back to metadata extraction...')
                // Continue to fallback
            }
        } else {
            console.warn('⚠️ Gemini API key not configured. Using fallback metadata extraction only.')
        }

        // Fallback: Parse HTML to extract metadata (standard tags)
        console.log('Using fallback metadata extraction...')
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // Extract metadata with fallbacks
        const metadata = {
            title: extractTitle(doc),
            description: extractDescription(doc),
            imageUrl: extractImage(doc, url),
            url: url,
            ingredients: [''], // Standard metadata doesn't provide ingredients
            steps: ['']        // Standard metadata doesn't provide steps
        }

        return metadata
    } catch (error) {
        console.error('Metadata extraction error:', error)
        throw new Error('URLからの情報取得に失敗しました。URLが正しいか確認してください。')
    }
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
    try {
        const url = new URL(string)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
        return false
    }
}

/**
 * Extract title from document
 * Priority: og:title > twitter:title > title tag
 */
function extractTitle(doc) {
    // Try Open Graph
    const ogTitle = doc.querySelector('meta[property="og:title"]')
    if (ogTitle && ogTitle.content) return ogTitle.content

    // Try Twitter Card
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')
    if (twitterTitle && twitterTitle.content) return twitterTitle.content

    // Try title tag
    const titleTag = doc.querySelector('title')
    if (titleTag && titleTag.textContent) return titleTag.textContent.trim()

    return ''
}

/**
 * Extract description from document
 * Priority: og:description > twitter:description > meta description
 */
function extractDescription(doc) {
    // Try Open Graph
    const ogDesc = doc.querySelector('meta[property="og:description"]')
    if (ogDesc && ogDesc.content) return ogDesc.content

    // Try Twitter Card
    const twitterDesc = doc.querySelector('meta[name="twitter:description"]')
    if (twitterDesc && twitterDesc.content) return twitterDesc.content

    // Try meta description
    const metaDesc = doc.querySelector('meta[name="description"]')
    if (metaDesc && metaDesc.content) return metaDesc.content

    return ''
}

/**
 * Extract image URL from document
 * Priority: og:image > twitter:image > first img tag
 */
function extractImage(doc, baseUrl) {
    // Try Open Graph
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.content) return makeAbsoluteUrl(ogImage.content, baseUrl)

    // Try Twitter Card
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.content) return makeAbsoluteUrl(twitterImage.content, baseUrl)

    // Try first img tag in article or main content
    const articleImg = doc.querySelector('article img, main img, .content img')
    if (articleImg && articleImg.src) return makeAbsoluteUrl(articleImg.src, baseUrl)

    return ''
}

/**
 * Convert relative URL to absolute URL
 */
function makeAbsoluteUrl(imageUrl, baseUrl) {
    try {
        return new URL(imageUrl, baseUrl).href
    } catch (_) {
        return imageUrl
    }
}
