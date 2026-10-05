import { useState, useMemo } from 'react'
import RecipeCard from './RecipeCard'
import { categorizeTags, CATEGORIES } from '../../utils/tagCategorizer.js'
import './RecipeList.css'

export default function RecipeList({
    recipes,
    onRecipeClick,
    onToggleFavorite,
    selectedTags = [],
    onTagsChange,
    allTags = []
}) {
    const [sortBy, setSortBy] = useState('createdAt-desc')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [isAccordionOpen, setIsAccordionOpen] = useState(false)

    // タグのスマート自動分類（メモ化）
    const categorizedTags = useMemo(() => {
        return categorizeTags(allTags)
    }, [allTags])

    // タグのトグル選択（複数選択・解除）
    const handleTagToggle = (tag) => {
        if (!onTagsChange) return
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter(t => t !== tag))
        } else {
            onTagsChange([...selectedTags, tag])
        }
    }

    const handleClearAllTags = () => {
        if (onTagsChange) {
            onTagsChange([])
        }
    }

    // フィルター処理
    let filteredRecipes = recipes

    // 複数タグによる絞り込み（AND検索: 選択されたすべてのタグを含む）
    if (selectedTags.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const recipeTags = recipe.tags || []
            return selectedTags.every(tag => recipeTags.includes(tag))
        })
    }

    // お気に入りのみ
    if (showFavoritesOnly) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.isFavorite)
    }

    // ソート
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
                return (a.title || '').localeCompare(b.title || '', 'ja')
            case 'title-desc':
                return (b.title || '').localeCompare(a.title || '', 'ja')
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
                {/* 1行横スクロール・クイックタグバー */}
                {allTags.length > 0 && (
                    <div className="tags-bar-container">
                        <div className="tags-scroll-row">
                            <button
                                type="button"
                                className={`filter-tag-chip ${selectedTags.length === 0 ? 'active' : ''}`}
                                onClick={handleClearAllTags}
                            >
                                すべて
                            </button>

                            {/* 選択中のタグを先頭にピン留め表示 */}
                            {selectedTags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="filter-tag-chip active selected-pinned"
                                    onClick={() => handleTagToggle(tag)}
                                    title="クリックして解除"
                                >
                                    <span>{tag}</span>
                                    <span className="chip-remove-icon">✕</span>
                                </button>
                            ))}

                            {/* 未選択のタグ（横スクロールで素早く選択可能） */}
                            {allTags
                                .filter(tag => !selectedTags.includes(tag))
                                .map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className="filter-tag-chip"
                                        onClick={() => handleTagToggle(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))
                            }
                        </div>

                        {/* アコーディオン開閉トグルボタン */}
                        <button
                            type="button"
                            className={`accordion-toggle-btn ${isAccordionOpen ? 'open' : ''} ${selectedTags.length > 0 ? 'has-filter' : ''}`}
                            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                            aria-expanded={isAccordionOpen}
                        >
                            <span className="toggle-icon">🏷️</span>
                            <span className="toggle-text">
                                {isAccordionOpen ? '閉じる' : 'ジャンル別'}
                            </span>
                            {selectedTags.length > 0 && (
                                <span className="filter-count-badge">{selectedTags.length}</span>
                            )}
                            <span className="chevron-icon">{isAccordionOpen ? '▲' : '▼'}</span>
                        </button>
                    </div>
                )}

                {/* アコーディオン展開エリア（ジャンル・カテゴリ別） */}
                {allTags.length > 0 && isAccordionOpen && (
                    <div className="tag-accordion-panel">
                        <div className="accordion-header">
                            <h4>🏷️ タグで絞り込み（複数選択可）</h4>
                            {selectedTags.length > 0 && (
                                <button
                                    type="button"
                                    className="btn-clear-selection"
                                    onClick={handleClearAllTags}
                                >
                                    すべてクリア ({selectedTags.length})
                                </button>
                            )}
                        </div>

                        <div className="accordion-categories-grid">
                            {CATEGORIES.map(category => {
                                const tagsInCat = categorizedTags[category.key] || []
                                if (tagsInCat.length === 0) return null

                                return (
                                    <div key={category.key} className="category-group">
                                        <div className="category-title">
                                            <span>{category.label}</span>
                                            <span className="category-count">({tagsInCat.length})</span>
                                        </div>
                                        <div className="category-tags-list">
                                            {tagsInCat.map(tag => {
                                                const isSelected = selectedTags.includes(tag)
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        className={`category-tag-btn ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleTagToggle(tag)}
                                                    >
                                                        {isSelected ? '✓ ' : ''}{tag}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
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
                            : selectedTags.length > 0
                                ? `「${selectedTags.join('」「')}」に一致するレシピが見つかりませんでした。`
                                : '右上の「レシピ追加」ボタンから、お気に入りのレシピを保存しましょう！'
                        }
                    </p>
                    {selectedTags.length > 0 && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm mt-md"
                            onClick={handleClearAllTags}
                        >
                            フィルターを解除する
                        </button>
                    )}
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
