import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

export async function extractRecipeWithAI(htmlContent, url) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured')
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `
あなたはレシピ抽出アシスタントです。提供されたHTMLコンテンツからレシピ情報を抽出してください。
このHTMLは以下のURLから取得されました: ${url}

以下のJSON形式でデータを返してください：
{
  "title": "レシピのタイトル",
  "description": "レシピの簡単な説明（2-3文程度）",
  "imageUrl": "メイン画像の完全なURL",
  "ingredients": ["材料1の名前と分量", "材料2の名前と分量", "..."],
  "steps": ["手順1の説明", "手順2の説明", "..."],
  "tags": ["和食", "時短", "..."]
}

重要なルール：
1. ページ内の主要なレシピを抽出してください。
2. ingredients（材料）は必ず配列形式で、各材料の名前と分量を含めてください。最低でも1つ以上の材料を抽出してください。
3. steps（手順）は必ず配列形式で、各手順を詳しく説明してください。最低でも1つ以上の手順を抽出してください。
4. tags（タグ）は料理のジャンル、特徴、調理時間などを抽出してください（例：「和食」「洋食」「時短」「ヘルシー」など）
5. imageUrlは絶対URLにしてください。相対URLの場合は、ベースURL（${new URL(url).origin}）を付けてください。
6. テキストから余分な空白や広告、不要な情報を除去してください。
7. フィールドが見つからない場合は、空の文字列または空の配列を使用してください。
8. 必ずJSON形式のみを返してください。マークダウンのコードブロック記号（\`\`\`）は使用しないでください。

JSON形式のみを返してください（他のテキストは含めないでください）。
    `

        // Truncate HTML if it's too long
        const truncatedHtml = htmlContent.substring(0, 100000)

        console.log('Sending request to Gemini API...')
        const result = await model.generateContent([prompt, truncatedHtml])
        const response = await result.response
        const text = response.text()

        console.log('Raw AI Response:', text.substring(0, 500) + '...')

        // Clean up markdown code blocks if present
        let jsonString = text.trim()

        // Remove markdown code blocks
        jsonString = jsonString.replace(/```json\n?/g, '')
        jsonString = jsonString.replace(/```\n?/g, '')
        jsonString = jsonString.trim()

        // Find JSON object in the response (in case there's extra text)
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            jsonString = jsonMatch[0]
        }

        console.log('Cleaned JSON string:', jsonString.substring(0, 500) + '...')

        const parsedData = JSON.parse(jsonString)

        console.log('Parsed AI data:', {
            title: parsedData.title,
            ingredientsCount: parsedData.ingredients?.length || 0,
            stepsCount: parsedData.steps?.length || 0,
            tagsCount: parsedData.tags?.length || 0
        })

        // Validate that we have at least some data
        if (!parsedData.title && (!parsedData.ingredients || parsedData.ingredients.length === 0)) {
            throw new Error('AI could not extract meaningful recipe data')
        }

        // Ensure arrays exist
        return {
            title: parsedData.title || '',
            description: parsedData.description || '',
            imageUrl: parsedData.imageUrl || '',
            ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
            steps: Array.isArray(parsedData.steps) ? parsedData.steps : [],
            tags: Array.isArray(parsedData.tags) ? parsedData.tags : []
        }
    } catch (error) {
        console.error('AI Extraction Error:', error)
        console.error('Error details:', error.message)
        throw error
    }
}
