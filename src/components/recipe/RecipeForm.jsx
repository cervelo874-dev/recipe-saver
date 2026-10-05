import { useState, useEffect, useRef } from 'react'
import { fetchMetadata } from '../../utils/fetchMetadata'
import { extractRecipeFromText, extractRecipeFromImages } from '../../utils/extractRecipeWithAI'
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

    const [aiMode, setAiMode] = useState('url') // 'url', 'text', 'image'
    const [textInput, setTextInput] = useState('')
    const [screenshots, setScreenshots] = useState([]) // Array of { id, previewUrl, base64Data, mimeType }
    const [isDragging, setIsDragging] = useState(false)
    const [selectedMainImageId, setSelectedMainImageId] = useState(null)

    const [tagInput, setTagInput] = useState('')
    const [isLoadingAI, setIsLoadingAI] = useState(false)
    const [aiError, setAiError] = useState('')
    const [aiSuccess, setAiSuccess] = useState('')

    const fileInputRef = useRef(null)
    const screenshotInputRef = useRef(null)

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

    // クリップボードからの画像ペースト（Ctrl + V）の監視
    useEffect(() => {
        if (aiMode !== 'image') return

        const handlePaste = async (e) => {
            const items = e.clipboardData?.items
            if (!items) return

            const imageFiles = []
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile()
                    if (file) imageFiles.push(file)
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault()
                await addScreenshotFiles(imageFiles)
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [aiMode, screenshots])

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

    // 料理写真の手動アップロード（Base64変換）
    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください')
            return
        }

        if (file.size > 8 * 1024 * 1024) {
            alert('画像サイズは8MB以下にしてください')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            handleChange('imageUrl', event.target.result)
        }
        reader.readAsDataURL(file)
    }

    // スクショ画像ファイルの追加処理（最大5枚）
    const addScreenshotFiles = async (files) => {
        const remainingSlots = 5 - screenshots.length
        if (remainingSlots <= 0) {
            setAiError('スクショ画像は一度に最大5枚まで追加できます')
            return
        }

        const filesToProcess = Array.from(files).slice(0, remainingSlots)
        const newScreenshots = []

        for (const file of filesToProcess) {
            if (!file.type.startsWith('image/')) continue

            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = (e) => resolve(e.target.result)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                const base64Data = dataUrl.split(',')[1]
                const item = {
                    id: crypto.randomUUID(),
                    previewUrl: dataUrl,
                    base64Data,
                    mimeType: file.type || 'image/jpeg'
                }
                newScreenshots.push(item)
            } catch (err) {
                console.error('Failed to read image:', err)
            }
        }

        if (newScreenshots.length > 0) {
            setScreenshots(prev => [...prev, ...newScreenshots])
            setAiError('')
            setAiSuccess(`${newScreenshots.length}枚のスクショを追加しました`)
            setTimeout(() => setAiSuccess(''), 2500)
        }
    }

    const handleRemoveScreenshot = (id) => {
        setScreenshots(prev => prev.filter(s => s.id !== id))
        if (selectedMainImageId === id) {
            setSelectedMainImageId(null)
        }
    }

    const handleSelectMainImage = (shot) => {
        setSelectedMainImageId(shot.id)
        handleChange('imageUrl', shot.previewUrl)
        setAiSuccess('メイン料理写真に設定しました！')
        setTimeout(() => setAiSuccess(''), 2000)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
        if (files.length > 0) {
            await addScreenshotFiles(files)
        }
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

    // AI抽出（スクショ画像）
    const handleExtractFromImages = async () => {
        if (screenshots.length === 0) {
            setAiError('スクショ画像を1枚以上選択または貼り付けてください')
            return
        }

        setIsLoadingAI(true)
        setAiError('')
        setAiSuccess('')

        try {
            const data = await extractRecipeFromImages(screenshots)
            applyExtractedData(data)

            // AIが判定したベスト写真を料理写真に設定
            if (data.bestImageIndex >= 0 && screenshots[data.bestImageIndex]) {
                const bestShot = screenshots[data.bestImageIndex]
                setSelectedMainImageId(bestShot.id)
                handleChange('imageUrl', bestShot.previewUrl)
            } else if (screenshots.length > 0 && !formData.imageUrl) {
                // 判定できなかった場合は1枚目をデフォルト設定
                setSelectedMainImageId(screenshots[0].id)
                handleChange('imageUrl', screenshots[0].previewUrl)
            }

            setAiSuccess('スクショ画像からレシピを解析しました！料理写真も自動設定されました。')
        } catch (error) {
            setAiError(error.message || 'スクショ画像からの抽出に失敗しました')
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

            {/* AI Assistant Card */}
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
                    <button
                        type="button"
                        className={`ai-tab ${aiMode === 'image' ? 'active' : ''}`}
                        onClick={() => { setAiMode('image'); setAiError(''); setAiSuccess(''); }}
                    >
                        📸 スクショ画像から
                    </button>
                </div>

                {/* Tab 1: URL */}
                {aiMode === 'url' && (
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
                )}

                {/* Tab 2: Text */}
                {aiMode === 'text' && (
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

                {/* Tab 3: Screenshot Images */}
                {aiMode === 'image' && (
                    <div className="ai-panel">
                        <div
                            className={`screenshot-dropzone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => screenshotInputRef.current?.click()}
                        >
                            <input
                                ref={screenshotInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files && addScreenshotFiles(e.target.files)}
                            />
                            <span className="dropzone-icon">📷</span>
                            <div className="dropzone-text">
                                <strong>タップして写真を選択</strong> またはドラッグ＆ドロップ
                            </div>
                            <div className="dropzone-hint">
                                ※ PCは画面上で <strong>Ctrl + V</strong> でも直接貼り付け可能（最大5枚）
                            </div>
                        </div>

                        {/* Screenshots Thumbnail List */}
                        {screenshots.length > 0 && (
                            <div className="screenshot-previews-container">
                                <div className="screenshot-previews-header">
                                    <span className="screenshots-count">選択中のスクショ ({screenshots.length}/5枚):</span>
                                    <span className="screenshots-subhint">★をクリックで完成料理写真に指定できます</span>
                                </div>
                                <div className="screenshot-thumbnails-grid">
                                    {screenshots.map((shot, idx) => {
                                        const isMain = selectedMainImageId === shot.id || formData.imageUrl === shot.previewUrl
                                        return (
                                            <div
                                                key={shot.id}
                                                className={`screenshot-thumb-card ${isMain ? 'is-main-photo' : ''}`}
                                            >
                                                <img src={shot.previewUrl} alt={`スクショ ${idx + 1}`} />
                                                <div className="thumb-index-tag">#{idx + 1}</div>
                                                <button
                                                    type="button"
                                                    className="thumb-delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveScreenshot(shot.id); }}
                                                    title="削除"
                                                >
                                                    ✕
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`thumb-set-main-btn ${isMain ? 'active' : ''}`}
                                                    onClick={() => handleSelectMainImage(shot)}
                                                    title="料理のメイン写真に指定"
                                                >
                                                    {isMain ? '★ メイン写真' : '☆ メインに設定'}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="ai-panel-actions mt-sm">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleExtractFromImages}
                                disabled={isLoadingAI || screenshots.length === 0}
                            >
                                {isLoadingAI ? 'AI解析中 (画像認識)...' : `スクショから解析する (${screenshots.length}枚)`}
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
                                placeholder="画像URL（または下のボタンで写真選択）"
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
