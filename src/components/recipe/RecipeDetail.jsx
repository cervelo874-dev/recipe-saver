import { useState, useEffect } from 'react'
import './RecipeDetail.css'

function parseBaseServings(servingsStr) {
    if (!servingsStr) return 2
    const match = String(servingsStr).match(/(\d+(\.\d+)?)/)
    return match ? Math.max(1, Math.round(parseFloat(match[1]))) : 2
}

function scaleIngredient(text, ratio) {
    if (ratio === 1 || !text) return text

    // 分数 (1/2, 3/4 等) の置換
    let result = text.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, den) => {
        const val = (parseFloat(num) / parseFloat(den)) * ratio
        return formatScaledValue(val)
    })

    // 通常の数値（整数・小数）の置換
    result = result.replace(/(\d+(\.\d+)?)/g, (match) => {
        const val = parseFloat(match) * ratio
        return formatScaledValue(val)
    })

    return result
}

function formatScaledValue(val) {
    if (Math.abs(val - Math.round(val)) < 0.05) {
        return Math.round(val).toString()
    }
    return (Math.round(val * 10) / 10).toString()
}

export default function RecipeDetail({ recipe, onEdit, onDelete, onBack, onIncrementView }) {
    const baseServings = parseBaseServings(recipe.servings)
    const [currentServings, setCurrentServings] = useState(baseServings)
    const [checkedIngredients, setCheckedIngredients] = useState({})
    const [checkedSteps, setCheckedSteps] = useState({})

    // Reset settings when recipe changes
    useEffect(() => {
        const base = parseBaseServings(recipe.servings)
        setCurrentServings(base)
        setCheckedIngredients({})
        setCheckedSteps({})
    }, [recipe.id, recipe.servings])

    // Increment view count
    useEffect(() => {
        if (onIncrementView && recipe.id) {
            onIncrementView(recipe.id)
        }
    }, [recipe.id, onIncrementView])

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleDelete = () => {
        if (window.confirm('このレシピを削除してもよろしいですか?')) {
            onDelete()
        }
    }

    const toggleIngredientCheck = (index) => {
        setCheckedIngredients(prev => ({ ...prev, [index]: !prev[index] }))
    }

    const toggleStepCheck = (index) => {
        setCheckedSteps(prev => ({ ...prev, [index]: !prev[index] }))
    }

    const resetChecks = () => {
        setCheckedIngredients({})
        setCheckedSteps({})
    }

    const ratio = currentServings / baseServings
    const hasAnyChecks = Object.values(checkedIngredients).some(Boolean) || Object.values(checkedSteps).some(Boolean)

    return (
        <div className="recipe-detail-container">
            {/* Header with Actions */}
            <div className="detail-header">
                <button className="btn btn-ghost" onClick={onBack}>
                    ← 戻る
                </button>
                <div className="detail-actions">
                    {hasAnyChecks && (
                        <button className="btn btn-ghost reset-checks-btn" onClick={resetChecks} title="チェックを解除">
                            ↺ チェック解除
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={onEdit}>
                        ✏️ 編集
                    </button>
                    <button className="btn btn-ghost text-danger" onClick={handleDelete}>
                        🗑️ 削除
                    </button>
                </div>
            </div>

            {/* Hero Image */}
            {recipe.imageUrl && (
                <div className="detail-hero">
                    <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        onError={(e) => {
                            e.target.style.display = 'none'
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="detail-content">
                {/* Title and Meta */}
                <div className="detail-title-section">
                    <h1 className="detail-title">{recipe.title}</h1>

                    {/* Quick Stats Badges */}
                    <div className="detail-badges">
                        {recipe.cookTime && (
                            <span className="badge badge-cooktime">⏱️ {recipe.cookTime}</span>
                        )}
                        {recipe.servings && (
                            <span className="badge badge-servings">👥 {recipe.servings}</span>
                        )}
                        {recipe.rating > 0 && (
                            <span className="badge badge-rating">
                                {'★'.repeat(recipe.rating)}{'☆'.repeat(5 - recipe.rating)}
                            </span>
                        )}
                    </div>

                    {recipe.tags && recipe.tags.length > 0 && (
                        <div className="detail-tags">
                            {recipe.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="detail-meta">
                        {recipe.createdAt && (
                            <span className="meta-item">📅 {formatDate(recipe.createdAt)}</span>
                        )}
                        {recipe.url && (
                            <a
                                href={recipe.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="meta-item meta-link"
                            >
                                🔗 元のレシピを見る
                            </a>
                        )}
                    </div>
                </div>

                {/* Description */}
                {recipe.description && (
                    <div className="detail-section">
                        <p className="detail-description">{recipe.description}</p>
                    </div>
                )}

                {/* Ingredients Section */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="detail-section">
                        <div className="section-header-row">
                            <h2 className="section-title">🥘 材料</h2>

                            {/* Servings Scaler */}
                            <div className="servings-scaler">
                                <span className="scaler-label">人数:</span>
                                <div className="scaler-controls">
                                    <button
                                        type="button"
                                        className="scaler-btn"
                                        onClick={() => setCurrentServings(prev => Math.max(1, prev - 1))}
                                        disabled={currentServings <= 1}
                                        aria-label="人数を減らす"
                                    >
                                        −
                                    </button>
                                    <span className="scaler-value">{currentServings}人分</span>
                                    <button
                                        type="button"
                                        className="scaler-btn"
                                        onClick={() => setCurrentServings(prev => prev + 1)}
                                        aria-label="人数を増やす"
                                    >
                                        +
                                    </button>
                                </div>
                                {ratio !== 1 && (
                                    <span className="scaler-ratio">（{ratio}倍計算中）</span>
                                )}
                            </div>
                        </div>

                        <ul className="ingredients-checklist">
                            {recipe.ingredients.map((ingredient, index) => {
                                const isChecked = Boolean(checkedIngredients[index])
                                const displayText = ratio === 1 ? ingredient : scaleIngredient(ingredient, ratio)

                                return (
                                    <li
                                        key={index}
                                        className={`ingredient-check-item ${isChecked ? 'checked' : ''}`}
                                        onClick={() => toggleIngredientCheck(index)}
                                    >
                                        <div className="checkbox-box">
                                            {isChecked ? '✓' : ''}
                                        </div>
                                        <span className="ingredient-text">{displayText}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}

                {/* Steps Section */}
                {recipe.steps && recipe.steps.length > 0 && (
                    <div className="detail-section">
                        <h2 className="section-title">👨‍🍳 作り方</h2>
                        <ol className="steps-checklist">
                            {recipe.steps.map((step, index) => {
                                const isChecked = Boolean(checkedSteps[index])

                                return (
                                    <li
                                        key={index}
                                        className={`step-check-item ${isChecked ? 'checked' : ''}`}
                                        onClick={() => toggleStepCheck(index)}
                                    >
                                        <div className="step-badge">
                                            {isChecked ? '✓' : index + 1}
                                        </div>
                                        <div className="step-content">
                                            <p className="step-text">{step}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                )}

                {/* Memo */}
                {recipe.memo && (
                    <div className="detail-section memo-section">
                        <h2 className="section-title">📝 メモ</h2>
                        <div className="memo-content">
                            {recipe.memo}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
