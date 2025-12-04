import { useState } from 'react'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import RecipeList from './components/recipe/RecipeList'
import RecipeForm from './components/recipe/RecipeForm'
import RecipeDetail from './components/recipe/RecipeDetail'
import { useRecipes } from './hooks/useRecipes'

function App() {
    const {
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        incrementViewCount,
        exportRecipes,
        importRecipes
    } = useRecipes()

    const [currentView, setCurrentView] = useState('list') // 'list', 'add', 'detail', 'edit'
    const [selectedRecipe, setSelectedRecipe] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTag, setFilterTag] = useState(null)

    const handleAddRecipe = (recipe) => {
        addRecipe(recipe)
        setCurrentView('list')
    }

    const handleUpdateRecipe = (recipe) => {
        updateRecipe(recipe)
        setCurrentView('list')
    }

    const handleViewRecipe = (recipe) => {
        setSelectedRecipe(recipe)
        setCurrentView('detail')
    }

    const handleEditRecipe = (recipe) => {
        setSelectedRecipe(recipe)
        setCurrentView('edit')
    }

    const handleDeleteRecipe = (id) => {
        deleteRecipe(id)
        setCurrentView('list')
    }

    const handleExport = () => {
        exportRecipes()
    }

    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.onchange = (e) => {
            const file = e.target.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                    const result = importRecipes(event.target.result)
                    if (result.success) {
                        alert(`${result.count}件のレシピをインポートしました！`)
                    } else {
                        alert(`インポートに失敗しました: ${result.error}`)
                    }
                }
                reader.readAsText(file)
            }
        }
        input.click()
    }

    // Filter recipes based on search
    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
    })

    // Get all unique tags
    const allTags = [...new Set(recipes.flatMap(r => r.tags))]

    return (
        <div className="app-layout">
            <Header
                onAddClick={() => setCurrentView('add')}
                onLogoClick={() => setCurrentView('list')}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExport={handleExport}
                onImport={handleImport}
            />

            <main className="main-content">
                <div className="container">
                    {currentView === 'list' && (
                        <RecipeList
                            recipes={filteredRecipes}
                            onRecipeClick={handleViewRecipe}
                            onToggleFavorite={toggleFavorite}
                            filterTag={filterTag}
                            onFilterChange={setFilterTag}
                            allTags={allTags}
                        />
                    )}

                    {currentView === 'add' && (
                        <RecipeForm
                            onSubmit={handleAddRecipe}
                            onCancel={() => setCurrentView('list')}
                        />
                    )}

                    {currentView === 'edit' && (
                        <RecipeForm
                            recipe={selectedRecipe}
                            onSubmit={handleUpdateRecipe}
                            onCancel={() => setCurrentView('list')}
                        />
                    )}

                    {currentView === 'detail' && selectedRecipe && (
                        <RecipeDetail
                            recipe={selectedRecipe}
                            onEdit={() => handleEditRecipe(selectedRecipe)}
                            onDelete={() => handleDeleteRecipe(selectedRecipe.id)}
                            onBack={() => setCurrentView('list')}
                            onIncrementView={incrementViewCount}
                        />
                    )}
                </div>
            </main>

            <MobileNav
                currentView={currentView}
                onHomeClick={() => setCurrentView('list')}
                onAddClick={() => setCurrentView('add')}
            />
        </div>
    )
}

export default App
