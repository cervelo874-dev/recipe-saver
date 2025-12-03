import RecipeCard from './RecipeCard'
import './RecipeList.css'

export default function RecipeList({ recipes, onRecipeClick, filterTag, onFilterChange, allTags }) {
    return (
        <div className="recipe-list-container">
            {/* Filter Tags */}
            {allTags.length > 0 && (
                <div className="filter-section">
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
                </div>
            )}

            {/* Recipes Grid */}
            {recipes.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon">📝</span>
                    <h2 className="empty-title">レシピがありません</h2>
                    <p className="empty-description">
                        {filterTag
                            ? `「${filterTag}」のレシピが見つかりませんでした。`
                            : '右上の「レシピ追加」ボタンから、お気に入りのレシピを保存しましょう！'
                        }
                    </p>
                </div>
            ) : (
                <div className="recipe-grid">
                    {recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onClick={onRecipeClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
