import { extractRecipeWithAI, extractRecipeFromUrlWithSearch } from './extractRecipeWithAI.js'
import { hasApiKey } from './apiKey.js'

// プロキシ一覧（ローカル環境なら内蔵プロキシ、本番なら外部プロキシ）
function getProxyList() {
    const list = []

    // ローカル開発環境の場合、Viteの内蔵プロキシを最優先
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        list.push({
            name: 'localViteProxy',
            urlTemplate: (url) => `/api/proxy?url=${encodeURIComponent(url)}`
        })
    }

    // 公開CORSプロキシ
    list.push(
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
    )

    return list
}

/**
 * Fetch recipe metadata from a URL.
 * 1. ローカル環境・プロキシ経由で直接HTMLを取得してAI抽出
 * 2. プロキシが失敗した場合はGemini Google Search GroundingでWeb検索抽出
 * 3. エラー時は具体的な理由をユーザーに明示
 */
export async function fetchMetadata(url) {
    if (!url || !isValidUrl(url)) {
        throw new Error('有効なURLを入力してください')
    }

    const apiKeyConfigured = hasApiKey()
    let lastError = null

    // 1. プロキシ経由でHTMLの直接取得を試みる（ローカル内蔵プロキシ優先）
    let html = null
    const proxies = getProxyList()

    for (const proxy of proxies) {
        try {
            console.log(`Trying ${proxy.name}...`)
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

    // HTMLが取得できた場合、HTMLをもとにAI抽出
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
                console.error('HTML AI extraction failed:', aiError)
                throw aiError // AIエラー（429等）はそのまま上に伝える
            }
        }

        // DOM Fallback (APIキー未設定時)
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

    // 2. HTML直接取得が全滅した場合、GeminiのGoogle Search GroundingでWeb検索抽出を試みる
    if (apiKeyConfigured) {
        try {
            console.log('🤖 HTML fetch blocked. Attempting Gemini Google Search Grounding...')
            const searchData = await extractRecipeFromUrlWithSearch(url)
            if (searchData && searchData.title) {
                return {
                    ...searchData,
                    url
                }
            }
        } catch (searchError) {
            console.error('Google Search Grounding failed:', searchError)
            throw searchError // AIエラーは握りつぶさず伝える
        }
    }

    // APIキー未設定でHTML取得も失敗した場合
    if (!apiKeyConfigured) {
        throw new Error('対象サイトの直接読み込みが制限されています。画面右上の「設定」からGemini APIキーを設定すると、AIによる直接抽出が利用できます。')
    }

    throw new Error(
        `URLからのレシピ取得に失敗しました（${lastError?.message || '通信タイムアウト'}）。\n「テキスト・SNSメモから」タブにレシピの文章を貼り付けて解析することをお試しください。`
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
