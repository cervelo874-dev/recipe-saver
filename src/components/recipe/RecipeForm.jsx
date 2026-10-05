import { useState, useEffect, useRef } from 'react'
import { fetchMetadata } from '../../utils/fetchMetadata'
import { extractRecipeFromText } from '../../utils/extractRecipeWithAI'
import { hasApiKey } from '../../utils/apiKey'
import './RecipeForm.css'

export default function RecipeForm({ recipe, onSubmit, onCancel, onOpenSettings }) {
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        imageUrl: '',
        servings: '',
        cookTime: '',
        description: '',
        ingredients: [''],
        steps: [''],
        tags: [],
        rating: 0,
        memo: ''
    })

    const [aiMode, setAiMode] = useState('url') // 'url' or 'text'
    const [textInput, setTextInput] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [isLoadingAI, setIsLoadingAI] = useState(false)
    const [aiError, setAiError] = useState('')
    const [aiSuccess, setAiSuccess] = useState('')
    const fileInputRef = useRef(null)

    const keyConfigured = hasApiKey()

    // If editing, populate form with existing data
    useEffect(() => {
        if (recipe) {
            setFormData({
                title: recipe.title || '',
                url: recipe.url || '',
                imageUrl: recipe.imageUrl || '',
                servings: recipe.servings || '',
                cookTime: recipe.cookTime || '',
                description: recipe.description || '',
                ingredients: recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients : [''],
                steps: recipe.steps && recipe.steps.length > 0 ? recipe.steps : [''],
                tags: recipe.tags || [],
                rating: recipe.rating || 0,
                memo: recipe.memo || ''
            })
        }
    }, [recipe])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleArrayChange = (field, index, value) => {
        setFormData(prev => {
            const newArray = [...prev[field]]
            newArray[index] = value
            return { ...prev, [field]: newArray }
        })
    }

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }))
    }

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }))
    }

    const handleAddTag = () => {
        const trimmed = tagInput.trim()
        if (trimmed && !formData.tags.includes(trimmed)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, trimmed]
            }))
            setTagInput('')
        }
    }

    const handleRemoveTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }))
    }

    // 画像ファイルアップロード（Base64変換）
    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください')
            return
        }

        // 5MB制限
        if (file.size > 5 * 1024 * 1024) {
            alert('画像サイズは5MB以下にしてください')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            handleChange('imageUrl', event.target.result)
        }
        reader.readAsDataURL(file)
    }

    // AI抽出（URL）
    const handleFetchFromUrl = async () => {
        if (!formData.url) {
            setAiError('レシピのURLを入力してください')
            return
        }

        setIsLoadingAI(true)
        setAiError('')
        setAiSuccess('')

        try {
            const metadata = await fetchMetadata(formData.url)
            applyExtractedData(metadata)
            setAiSuccess('URLからレシピ情報を抽出しました！')
        } catch (error) {
            setAiError(error.message || 'レシピの取得に失敗しました')
        } finally {
            setIsLoadingAI(false)
        }
    }

    // AI抽出（テキスト貼り付け）
    const handleExtractFromText = async () => {
        if (!textInput.trim()) {
            setAiError('レシピのテキストやメモを入力してください')
            return
        }

        setIsLoadingAI(true)
        setAiError('')
        setAiSuccess('')

        try {
            const data = await extractRecipeFromText(textInput)
            applyExtractedData(data)
            setAiSuccess('テキストからレシピ情報を抽出しました！')
        } catch (error) {
            setAiError(error.message || 'テキストからの抽出に失敗しました')
        } finally {
            setIsLoadingAI(false)
        }
    }

    // 抽出されたデータをフォームに反映
    const applyExtractedData = (extracted) => {
        setFormData(prev => ({
            ...prev,
            title: extracted.title || prev.title,
            description: extracted.description || prev.description,
            imageUrl: extracted.imageUrl || prev.imageUrl,
            servings: extracted.servings || prev.servings,
            cookTime: extracted.cookTime || prev.cookTime,
            ingredients: (extracted.ingredients && extracted.ingredients.length > 0)
                ? extracted.ingredients
                : prev.ingredients,
            steps: (extracted.steps && extracted.steps.length > 0)
                ? extracted.steps
                : prev.steps,
            tags: (extracted.tags && extracted.tags.length > 0)
                ? [...new Set([...prev.tags, ...extracted.tags])]
                : prev.tags
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const cleanedData = {
            ...formData,
            ingredients: formData.ingredients.map(i => i.trim()).filter(Boolean),
            steps: formData.steps.map(s => s.trim()).filter(Boolean)
        }

        if (!cleanedData.title.trim()) {
            alert('レシピ名を入力してください')
            return
        }

        onSubmit(cleanedData)
    }

    return (
        <div className="recipe-form-container">
            <div className="form-header">
                <h1>{recipe ? 'レシピを編集' : '新しいレシピを追加'}</h1>
            </div>

            {/* AI Assistant Section */}
            <div className="ai-assistant-card">
                <div className="ai-assistant-header">
                    <span className="ai-badge">🤖 AIアシスタント</span>
                    <h3>レシピを自動抽出</h3>
                </div>

                {!keyConfigured && (
                    <div className="api-key-warning">
                        <span>⚠️ Gemini APIキーが設定されていません。</span>
                        {onOpenSettings && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={onOpenSettings}
                            >
                                設定画面で登録
                            </button>
                        )}
                    </div>
                )}

                <div className="ai-tabs">
                    <button
                        type="button"
                        className={`ai-tab ${aiMode === 'url' ? 'active' : ''}`}
                        onClick={() => { setAiMode('url'); setAiError(''); setAiSuccess(''); }}
                    >
                        🌐 WebサイトのURLから
                    </button>
                    <button
                        type="button"
                        className={`ai-tab ${aiMode === 'text' ? 'active' : ''}`}
                        onClick={() => { setAiMode('text'); setAiError(''); setAiSuccess(''); }}
                    >
                        📋 テキスト・SNSメモから
                    </button>
                </div>

                {aiMode === 'url' ? (
                    <div className="ai-panel">
                        <div className="url-input-row">
                            <input
                                type="url"
                                className="input"
                                value={formData.url}
                                onChange={(e) => handleChange('url', e.target.value)}
                                placeholder="https://example.com/recipe"
                            />
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleFetchFromUrl}
                                disabled={isLoadingAI || !formData.url}
                            >
                                {isLoadingAI ? '抽出中...' : 'URLから解析'}
                            </button>
                        </div>
                        <p className="ai-hint">料理ブログやレシピサイトのURLを入力すると、材料や手順をAIが自動抽出します。</p>
                    </div>
                ) : (
                    <div className="ai-panel">
                        <textarea
                            className="textarea"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="InstagramやXの投稿文、料理メモなどをそのまま貼り付けてください..."
                            rows="4"
                        />
                        <div className="ai-panel-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleExtractFromText}
                                disabled={isLoadingAI || !textInput.trim()}
                            >
                                {isLoadingAI ? '解析中...' : 'テキストから抽出'}
                            </button>
                        </div>
                    </div>
                )}

                {aiError && <p className="error-message mt-sm">{aiError}</p>}
                {aiSuccess && <p className="success-message mt-sm">{aiSuccess}</p>}
            </div>

            <form onSubmit={handleSubmit} className="recipe-form">
                {/* Title */}
                <div className="form-group">
                    <label className="input-label" htmlFor="title">
                        レシピ名 <span className="required">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        className="input"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="例：ジューシー煮込みハンバーグ"
                        required
                    />
                </div>

                {/* Servings & Cook Time Row */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="input-label" htmlFor="servings">
                            分量・人数（任意）
                        </label>
                        <input
                            id="servings"
                            type="text"
                            className="input"
                            value={formData.servings}
                            onChange={(e) => handleChange('servings', e.target.value)}
                            placeholder="例：2人分、4個分"
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label" htmlFor="cookTime">
                            目安調理時間（任意）
                        </label>
                        <input
                            id="cookTime"
                            type="text"
                            className="input"
                            value={formData.cookTime}
                            onChange={(e) => handleChange('cookTime', e.target.value)}
                            placeholder="例：20分、1時間"
                        />
                    </div>
                </div>

                {/* Image Section */}
                <div className="form-group">
                    <label className="input-label" htmlFor="imageUrl">
                        料理の写真（任意）
                    </label>
                    <div className="image-input-container">
                        <div className="image-url-row">
                            <input
                                id="imageUrl"
                                type="url"
                                className="input"
                                value={formData.imageUrl}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                placeholder="画像URL（https://...）"
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                📷 ファイルから選択
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageFileChange}
                            />
                        </div>
                        {formData.imageUrl && (
                            <div className="image-preview-wrapper">
                                <img
                                    src={formData.imageUrl}
                                    alt="プレビュー"
                                    className="image-preview"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm remove-image-btn"
                                    onClick={() => handleChange('imageUrl', '')}
                                >
                                    画像を削除
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="input-label" htmlFor="description">
                        説明（任意）
                    </label>
                    <textarea
                        id="description"
                        className="textarea"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="レシピの特徴やおすすめポイントなど"
                        rows="2"
                    />
                </div>

                {/* Ingredients */}
                <div className="form-group">
                    <div className="label-with-hint">
                        <label className="input-label">材料（任意）</label>
                        <span className="input-hint">※「豚バラ肉 200g」のように数字と単位を記載すると後から人数倍率計算が可能です</span>
                    </div>
                    {formData.ingredients.map((ingredient, index) => (
                        <div key={index} className="array-input-row">
                            <input
                                type="text"
                                className="input"
                                value={ingredient}
                                onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                                placeholder={`材料 ${index + 1}（例: 醤油 大さじ2）`}
                            />
                            {formData.ingredients.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => removeArrayItem('ingredients', index)}
                                    aria-label="削除"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => addArrayItem('ingredients')}
                    >
                        + 材料を追加
                    </button>
                </div>

                {/* Steps */}
                <div className="form-group">
                    <label className="input-label">手順（任意）</label>
                    {formData.steps.map((step, index) => (
                        <div key={index} className="array-input-row">
                            <span className="step-number">{index + 1}</span>
                            <textarea
                                className="textarea"
                                value={step}
                                onChange={(e) => handleArrayChange('steps', index, e.target.value)}
                                placeholder={`手順 ${index + 1}`}
                                rows="2"
                            />
                            {formData.steps.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => removeArrayItem('steps', index)}
                                    aria-label="削除"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => addArrayItem('steps')}
                    >
                        + 手順を追加
                    </button>
                </div>

                {/* Tags */}
                <div className="form-group">
                    <label className="input-label" htmlFor="tagInput">
                        タグ（任意）
                    </label>
                    <div className="tag-input-row">
                        <input
                            id="tagInput"
                            type="text"
                            className="input"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="例：和食、時短、お弁当"
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleAddTag}
                        >
                            追加
                        </button>
                    </div>
                    {formData.tags.length > 0 && (
                        <div className="tags-list mt-sm">
                            {formData.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                    <button
                                        type="button"
                                        className="tag-remove"
                                        onClick={() => handleRemoveTag(tag)}
                                        aria-label="削除"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rating */}
                <div className="form-group">
                    <label className="input-label">お気に入り度 / 評価</label>
                    <div className="rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star-button ${star <= formData.rating ? 'active' : ''}`}
                                onClick={() => handleChange('rating', star)}
                                aria-label={`${star}つ星`}
                            >
                                ★
                            </button>
                        ))}
                        {formData.rating > 0 && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleChange('rating', 0)}
                            >
                                クリア
                            </button>
                        )}
                    </div>
                </div>

                {/* Memo */}
                <div className="form-group">
                    <label className="input-label" htmlFor="memo">
                        メモ・アレンジ（任意）
                    </label>
                    <textarea
                        id="memo"
                        className="textarea"
                        value={formData.memo}
                        onChange={(e) => handleChange('memo', e.target.value)}
                        placeholder="家族の好みの味付けや、次回のアレンジアイデアなど"
                        rows="3"
                    />
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {recipe ? '更新する' : '保存する'}
                    </button>
                </div>
            </form>
        </div>
    )
}
