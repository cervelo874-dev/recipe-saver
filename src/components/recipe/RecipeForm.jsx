import { useState, useEffect } from 'react'
import { fetchMetadata } from '../../utils/fetchMetadata'
import './RecipeForm.css'

export default function RecipeForm({ recipe, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        imageUrl: '',
        description: '',
        ingredients: [''],
        steps: [''],
        tags: [],
        rating: 0,
        memo: ''
    })

    const [tagInput, setTagInput] = useState('')
    const [isLoadingUrl, setIsLoadingUrl] = useState(false)
    const [urlError, setUrlError] = useState('')

    // If editing, populate form with existing data
    useEffect(() => {
        if (recipe) {
            setFormData(recipe)
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
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
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

    const handleFetchFromUrl = async () => {
        if (!formData.url) {
            setUrlError('URLを入力してください')
            return
        }

        setIsLoadingUrl(true)
        setUrlError('')

        try {
            const metadata = await fetchMetadata(formData.url)

            // Populate form with fetched data (don't override if already filled)
            setFormData(prev => ({
                ...prev,
                title: prev.title || metadata.title,
                description: prev.description || metadata.description,
                imageUrl: prev.imageUrl || metadata.imageUrl,
                // Only update ingredients if current list is empty or has only one empty item
                ingredients: (prev.ingredients.length === 0 || (prev.ingredients.length === 1 && !prev.ingredients[0])) && metadata.ingredients && metadata.ingredients.length > 0
                    ? metadata.ingredients
                    : prev.ingredients,
                // Only update steps if current list is empty or has only one empty item
                steps: (prev.steps.length === 0 || (prev.steps.length === 1 && !prev.steps[0])) && metadata.steps && metadata.steps.length > 0
                    ? metadata.steps
                    : prev.steps,
                // Only update tags if current list is empty
                tags: prev.tags.length === 0 && metadata.tags && metadata.tags.length > 0
                    ? metadata.tags
                    : prev.tags
            }))

            setUrlError('')
        } catch (error) {
            setUrlError(error.message)
        } finally {
            setIsLoadingUrl(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        // Filter out empty ingredients and steps
        const cleanedData = {
            ...formData,
            ingredients: formData.ingredients.filter(i => i.trim()),
            steps: formData.steps.filter(s => s.trim())
        }

        onSubmit(cleanedData)
    }

    return (
        <div className="recipe-form-container">
            <div className="form-header">
                <h1>{recipe ? 'レシピを編集' : '新しいレシピを追加'}</h1>
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
                        placeholder="例：トマトパスタ"
                        required
                    />
                </div>

                {/* URL */}
                <div className="form-group">
                    <label className="input-label" htmlFor="url">
                        元のレシピURL（任意）
                    </label>
                    <div className="url-input-row">
                        <input
                            id="url"
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
                            disabled={isLoadingUrl || !formData.url}
                        >
                            {isLoadingUrl ? '取得中...' : 'URLから取得'}
                        </button>
                    </div>
                    {urlError && <p className="error-message">{urlError}</p>}
                </div>

                {/* Image URL */}
                <div className="form-group">
                    <label className="input-label" htmlFor="imageUrl">
                        画像URL（任意）
                    </label>
                    <input
                        id="imageUrl"
                        type="url"
                        className="input"
                        value={formData.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                        <div className="image-preview">
                            <img src={formData.imageUrl} alt="プレビュー" onError={(e) => e.target.style.display = 'none'} />
                        </div>
                    )}
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
                        placeholder="レシピの簡単な説明"
                        rows="3"
                    />
                </div>

                {/* Ingredients */}
                <div className="form-group">
                    <label className="input-label">
                        材料（任意）
                    </label>
                    {formData.ingredients.map((ingredient, index) => (
                        <div key={index} className="array-input-row">
                            <input
                                type="text"
                                className="input"
                                value={ingredient}
                                onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                                placeholder={`材料 ${index + 1}`}
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
                    <label className="input-label">
                        手順（任意）
                    </label>
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
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="例：和食、時短"
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
                    <label className="input-label">評価（任意）</label>
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
                        メモ（任意）
                    </label>
                    <textarea
                        id="memo"
                        className="textarea"
                        value={formData.memo}
                        onChange={(e) => handleChange('memo', e.target.value)}
                        placeholder="作った感想やアレンジのアイデアなど"
                        rows="4"
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
