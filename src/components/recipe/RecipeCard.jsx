import './RecipeCard.css'

export default function RecipeCard({ recipe, onClick, onToggleFavorite }) {
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const handleFavoriteClick = (e) => {
        e.stopPropagation() // Prevent card click event
        onToggleFavorite(recipe.id)
    }

    return (
        <article className="recipe-card" onClick={() => onClick(recipe)}>
            <div className="recipe-card-image-wrapper">
                {recipe.imageUrl ? (
                    <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="recipe-card-image"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x225/E65100/FFFFFF?text=No+Image'
                        }}
                    />
                ) : (
                    <div className="recipe-card-placeholder">
                        <span className="placeholder-icon">🍽️</span>
                    </div>
                )}

                {/* Favorite Button */}
                <button
                    className={`favorite-btn ${recipe.isFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteClick}
                    aria-label={recipe.isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                >
                    ★
                </button>

                {recipe.rating > 0 && (
                    <div className="recipe-rating">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < recipe.rating ? 'star filled' : 'star'}>
                                ★
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="recipe-card-content">
                <h3 className="recipe-card-title">{recipe.title}</h3>

                {recipe.description && (
                    <p className="recipe-card-description">{recipe.description}</p>
                )}

                {/* Badges for cookTime and servings */}
                {(recipe.cookTime || recipe.servings) && (
                    <div className="card-quick-meta">
                        {recipe.cookTime && <span className="card-badge">⏱️ {recipe.cookTime}</span>}
                        {recipe.servings && <span className="card-badge">👥 {recipe.servings}</span>}
                    </div>
                )}

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-card-tags">
                        {recipe.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                        {recipe.tags.length > 3 && (
                            <span className="tag tag-outline">+{recipe.tags.length - 3}</span>
                        )}
                    </div>
                )}

                <div className="recipe-card-footer">
                    <span className="recipe-date">{formatDate(recipe.createdAt)}</span>
                </div>
            </div>
        </article>
    )
}
