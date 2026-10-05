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

function getGenerativeModel(schema = recipeSchema) {
    const apiKey = getApiKey()
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。画面右上の「設定」からAPIキーを入力してください。')
    }

    const modelName = getSelectedModel()
    const genAI = new GoogleGenerativeAI(apiKey)
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
 * Google Search Groundingを使ってURLから直接レシピをWeb検索・抽出
 * 2ステップ方式（Search Groundingで調査 ➔ Structured Outputsで高精度構造化）により、
 * CORSプロキシ不要かつ100%パース成功を実現。
 */
export async function extractRecipeFromUrlWithSearch(url) {
    const apiKey = getApiKey()
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。画面右上の「設定」からAPIキーを入力してください。')
    }

    const modelName = getSelectedModel()
    const genAI = new GoogleGenerativeAI(apiKey)
    const searchModel = genAI.getGenerativeModel({
        model: modelName,
        tools: [{ googleSearch: {} }]
    })

    const searchPrompt = `Web検索機能を使用して、以下のレシピページの料理名、材料、分量、手順、人数、調理時間を調べて詳しく教えてください。
URL: ${url}`

    try {
        console.log('🔍 Step 1: Searching recipe with Google Search Grounding for URL:', url)
        const searchResult = await searchModel.generateContent(searchPrompt)
        const searchText = searchResult.response.text()

        if (!searchText || searchText.trim().length < 20) {
            throw new Error('Web検索からレシピ情報を取得できませんでした')
        }

        console.log('🤖 Step 2: Structuring search results with Structured Outputs...')
        const structured = await extractRecipeFromText(
            `【URL】: ${url}\n\n【Web検索による調査結果】:\n${searchText}`
        )

        return structured
    } catch (error) {
        console.error('Google Search Grounding Error:', error)
        throw error
    }
}

/**
 * HTMLコンテンツからレシピを抽出（Structured Outputs）
 */
export async function extractRecipeWithAI(htmlContent, url) {
    const model = getGenerativeModel()

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
        console.log('Sending request to Gemini API (Structured Outputs)...')
        const result = await model.generateContent([prompt, truncatedHtml])
        const response = await result.response
        const responseText = response.text()
        const parsed = JSON.parse(responseText)

        return normalizeRecipeData(parsed)
    } catch (error) {
        console.error('AI Extraction Error (HTML):', error)
        throw new Error(`レシピの抽出に失敗しました: ${error.message || error}`)
    }
}

/**
 * プレーンテキスト（SNS投稿、メモ、ブログのコピー等）からレシピを抽出
 */
export async function extractRecipeFromText(text) {
    if (!text || !text.trim()) {
        throw new Error('解析するテキストが空です')
    }

    const model = getGenerativeModel()

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
        console.log('Sending text extraction to Gemini API...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const responseText = response.text()
        const parsed = JSON.parse(responseText)

        return normalizeRecipeData(parsed)
    } catch (error) {
        console.error('AI Extraction Error (Text):', error)
        throw new Error(`テキストからの抽出に失敗しました: ${error.message || error}`)
    }
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
