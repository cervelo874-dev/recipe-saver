import { useState } from 'react'
import RecipeCard from './RecipeCard'
import './RecipeList.css'

export default function RecipeList({ recipes, onRecipeClick, onToggleFavorite, filterTag, onFilterChange, allTags }) {
    const [sortBy, setSortBy] = useState('createdAt-desc')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

    // Filter recipes
    let filteredRecipes = recipes

    // Filter by tag
    if (filterTag) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.tags && recipe.tags.includes(filterTag)
        )
    }

    // Filter by favorites
    if (showFavoritesOnly) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.isFavorite)
    }

    // Sort recipes
    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
        switch (sortBy) {
            case 'createdAt-desc':
                return new Date(b.createdAt) - new Date(a.createdAt)
            case 'createdAt-asc':
                return new Date(a.createdAt) - new Date(b.createdAt)
            case 'rating-desc':
                return (b.rating || 0) - (a.rating || 0)
            case 'rating-asc':
                return (a.rating || 0) - (b.rating || 0)
            case 'title-asc':
                return a.title.localeCompare(b.title, 'ja')
            case 'title-desc':
                return b.title.localeCompare(a.title, 'ja')
            case 'views-desc':
                return (b.viewCount || 0) - (a.viewCount || 0)
            case 'views-asc':
                return (a.viewCount || 0) - (b.viewCount || 0)
            default:
                return 0
        }
    })

    return (
        <div className="recipe-list-container">
            {/* Filter and Sort Section */}
            <div className="filter-section">
                {/* Tag Filters */}
                {allTags.length > 0 && (
                    <div className="filter-tags">
                        <button
                            className={`filter-tag ${!filterTag ? 'active' : ''}`}
                            onClick={() => onFilterChange(null)}
                        >
                            すべて
                        </button>
                        {allTags.map((tag, index) => (
                            <button
                                key={index}
                                className={`filter-tag ${filterTag === tag ? 'active' : ''}`}
                                onClick={() => onFilterChange(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Controls: Favorites & Sort */}
                <div className="filter-controls">
                    {/* Favorites Toggle */}
                    <button
                        className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        title="お気に入りのみ表示"
                    >
                        <span className="star-icon">★</span>
                        {showFavoritesOnly ? 'お気に入り' : 'すべて'}
                    </button>

                    {/* Sort Dropdown */}
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="createdAt-desc">作成日（新しい順）</option>
                        <option value="createdAt-asc">作成日（古い順）</option>
                        <option value="rating-desc">評価（高い順）</option>
                        <option value="rating-asc">評価（低い順）</option>
                        <option value="title-asc">タイトル（あいうえお順）</option>
                        <option value="title-desc">タイトル（逆順）</option>
                        <option value="views-desc">閲覧数（多い順）</option>
                        <option value="views-asc">閲覧数（少ない順）</option>
                    </select>
                </div>
            </div>

            {/* Recipes Grid */}
            {sortedRecipes.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📝</span>
                    <h2 className="empty-title">レシピがありません</h2>
                    <p className="empty-description">
                        {showFavoritesOnly
                            ? 'お気に入りのレシピがまだありません。'
                            : filterTag
                                ? `「${filterTag}」のレシピが見つかりませんでした。`
                                : '右上の「レシピ追加」ボタンから、お気に入りのレシピを保存しましょう！'
                        }
                    </p>
                </div>
            ) : (
                <div className="recipe-grid">
                    {sortedRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onClick={onRecipeClick}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
