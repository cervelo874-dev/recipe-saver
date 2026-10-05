import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { getApiKey, getSelectedModel } from './apiKey.js'

const recipeSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title: {
            type: SchemaType.STRING,
            description: 'レシピの料理名'
        },
        description: {
            type: SchemaType.STRING,
            description: 'レシピの概要や魅力の簡単な説明（1〜2文）'
        },
        imageUrl: {
            type: SchemaType.STRING,
            description: 'メイン料理写真の絶対URL。見つからない場合は空文字。'
        },
        servings: {
            type: SchemaType.STRING,
            description: '分量・人数（例: 2人分、4個分など。不明なら空文字）'
        },
        cookTime: {
            type: SchemaType.STRING,
            description: '目安の調理時間（例: 15分、30分など。不明なら空文字）'
        },
        ingredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '材料名と分量のリスト（例: 「豚バラ肉 200g」、「玉ねぎ 1/2個」）'
        },
        steps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '調理手順の具体的なリスト'
        },
        tags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: '料理ジャンルや特徴タグ（例: 和食, 時短, ヘルシー など）'
        }
    },
    required: ['title', 'ingredients', 'steps']
}

function createModel(genAI, modelName, schema = recipeSchema) {
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.2
        }
    })
}

/**
 * 429エラーやモデル起因のエラー時に安定モデル (gemini-2.5-flash) で自動フォールバック実行
 */
async function generateWithFallback(genAI, primaryModelName, executeFn) {
    try {
        return await executeFn(primaryModelName)
    } catch (primaryError) {
        const errorMsg = primaryError.message || String(primaryError)
        console.warn(`⚠️ Model [${primaryModelName}] failed (${errorMsg}). Checking fallback...`)

        // 既に gemini-2.5-flash の場合はそのまま再スロー
        if (primaryModelName === 'gemini-2.5-flash') {
            throw primaryError
        }

        // 429 (Quota exceeded) や 404 (Not found) などの場合は gemini-2.5-flash で即座にリトライ
        console.log('🔄 Automatically falling back to stable model: gemini-2.5-flash...')
        try {
            return await executeFn('gemini-2.5-flash')
        } catch (fallbackError) {
            console.error('❌ Fallback to gemini-2.5-flash also failed:', fallbackError)
            throw fallbackError
        }
    }
}

/**
 * Google Search Groundingを使ってURLから直接レシピをWeb検索・抽出
 */
export async function extractRecipeFromUrlWithSearch(url) {
    const apiKey = getApiKey()
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。画面右上の「設定」からAPIキーを入力してください。')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const primaryModelName = getSelectedModel()

    const searchPrompt = `Web検索機能を使用して、以下のレシピページの料理名、材料、分量、手順、人数、調理時間を調べて詳しく教えてください。
URL: ${url}`

    try {
        console.log(`🔍 Step 1: Searching recipe with Google Search Grounding for URL: ${url} (model: ${primaryModelName})`)

        const searchText = await generateWithFallback(genAI, primaryModelName, async (modelName) => {
            const searchModel = genAI.getGenerativeModel({
                model: modelName,
                tools: [{ googleSearch: {} }]
            })
            const result = await searchModel.generateContent(searchPrompt)
            return result.response.text()
        })

        if (!searchText || searchText.trim().length < 20) {
            throw new Error('Web検索からレシピ情報を取得できませんでした')
        }

        console.log('🤖 Step 2: Structuring search results with Structured Outputs...')
        const structured = await extractRecipeFromText(
            `【URL】: ${url}\n\n【Web検索による調査結果】:\n${searchText}`
        )

        return structured
    } catch (error) {
        console.error('Google Search Grounding Pipeline Error:', error)
        throw formatAiError(error)
    }
}

/**
 * HTMLコンテンツからレシピを抽出（Structured Outputs）
 */
export async function extractRecipeWithAI(htmlContent, url) {
    const apiKey = getApiKey()
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。画面右上の「設定」からAPIキーを入力してください。')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const primaryModelName = getSelectedModel()

    const origin = url ? new URL(url).origin : ''
    const prompt = `
あなたはプロの料理レシピ抽出アシスタントです。
提供されたHTML情報からレシピの主要情報を抽出し、指定されたJSON構造で返してください。
元URL: ${url || '不明'}

【指示】
1. メインの料理レシピを特定して抽出してください。
2. ingredients（材料）は必ず名前と分量をセットで抽出してください。
3. steps（手順）は調理順序に沿って具体的かつ分かりやすく抽出してください。
4. imageUrlは絶対URLで返してください。相対パスの場合は「${origin}」を補完してください。見つからない場合は空文字にしてください。
5. 人数（servings）や調理時間（cookTime）がページ内に記載されていれば抽出してください。
`

    const truncatedHtml = htmlContent.substring(0, 100000)

    try {
        console.log(`Sending HTML to Gemini API (Structured Outputs, model: ${primaryModelName})...`)
        const parsed = await generateWithFallback(genAI, primaryModelName, async (modelName) => {
            const model = createModel(genAI, modelName)
            const result = await model.generateContent([prompt, truncatedHtml])
            const responseText = result.response.text()
            return JSON.parse(responseText)
        })

        return normalizeRecipeData(parsed)
    } catch (error) {
        console.error('AI Extraction Error (HTML):', error)
        throw formatAiError(error)
    }
}

/**
 * プレーンテキスト（SNS投稿、メモ、ブログのコピー等）からレシピを抽出
 */
export async function extractRecipeFromText(text) {
    if (!text || !text.trim()) {
        throw new Error('解析するテキストが空です')
    }

    const apiKey = getApiKey()
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。画面右上の「設定」からAPIキーを入力してください。')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const primaryModelName = getSelectedModel()

    const prompt = `
あなたはプロの料理レシピ抽出アシスタントです。
以下の入力テキスト（SNSの投稿、メモ、またはレシピ記事の抜粋）からレシピ情報を抽出し、指定されたJSON構造で返してください。

【テキスト内容】:
${text}

【指示】
1. 料理名（title）、材料（ingredients）、手順（steps）を漏れなく抽出してください。
2. もし人数（例: 2人前）や調理時間（例: 10分）が含まれていれば抽出してください。
3. ジャンルや特徴を表すタグ（tags）を2〜4個抽出または自動付与してください。
`

    try {
        console.log(`Sending text extraction to Gemini API (model: ${primaryModelName})...`)
        const parsed = await generateWithFallback(genAI, primaryModelName, async (modelName) => {
            const model = createModel(genAI, modelName)
            const result = await model.generateContent(prompt)
            const responseText = result.response.text()
            return JSON.parse(responseText)
        })

        return normalizeRecipeData(parsed)
    } catch (error) {
        console.error('AI Extraction Error (Text):', error)
        throw formatAiError(error)
    }
}

function formatAiError(error) {
    const msg = error.message || String(error)
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        return new Error('Gemini APIの利用回数制限（429 Quota Exceeded）に達しました。1〜2分お待ちいただくか、設定画面で別のAPIキーをお試しください。')
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        return new Error('設定されているGemini APIキーが無効です。画面右上の設定から正しいキーを入力してください。')
    }
    return new Error(`レシピの抽出に失敗しました: ${msg}`)
}

function normalizeRecipeData(data) {
    return {
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl === 'N/A' ? '' : (data.imageUrl || ''),
        servings: data.servings === 'N/A' ? '' : (data.servings || ''),
        cookTime: data.cookTime === 'N/A' ? '' : (data.cookTime || ''),
        ingredients: Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean) : [],
        steps: Array.isArray(data.steps) ? data.steps.filter(Boolean) : [],
        tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : []
    }
}
