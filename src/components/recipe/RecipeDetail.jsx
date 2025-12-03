import './RecipeDetail.css'

export default function RecipeDetail({ recipe, onEdit, onDelete, onBack }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        })
    }

    const handleDelete = () => {
        if (window.confirm('このレシピを削除してもよろしいですか?')) {
            onDelete()
        }
    }

    return (
        <div className="recipe-detail-container">
            {/* Header with Actions */}
            <div className="detail-header">
                <button className="btn btn-ghost" onClick={onBack}>
                    ← 戻る
                </button>
                <div className="detail-actions">
                    <button className="btn btn-secondary" onClick={onEdit}>
                        ✏️ 編集
                    </button>
                    <button className="btn btn-ghost" onClick={handleDelete}>
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
                            e.target.src = 'https://via.placeholder.com/1200x600/E65100/FFFFFF?text=No+Image'
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="detail-content">
                {/* Title and Meta */}
                <div className="detail-title-section">
                    <h1 className="detail-title">{recipe.title}</h1>

                    {recipe.rating > 0 && (
                        <div className="detail-rating">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < recipe.rating ? 'star filled' : 'star'}>
                                    ★
                                </span>
                            ))}
                        </div>
                    )}

                    {recipe.tags && recipe.tags.length > 0 && (
                        <div className="detail-tags">
                            {recipe.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="detail-meta">
                        <span className="meta-item">📅 {formatDate(recipe.createdAt)}</span>
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

                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="detail-section">
                        <h2 className="section-title">🥘 材料</h2>
                        <ul className="ingredients-list">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index} className="ingredient-item">
                                    {ingredient}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Steps */}
                {recipe.steps && recipe.steps.length > 0 && (
                    <div className="detail-section">
                        <h2 className="section-title">👨‍🍳 作り方</h2>
                        <ol className="steps-list">
                            {recipe.steps.map((step, index) => (
                                <li key={index} className="step-item">
                                    <span className="step-number">{index + 1}</span>
                                    <p className="step-text">{step}</p>
                                </li>
                            ))}
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
