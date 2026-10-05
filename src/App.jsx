import { useState } from 'react'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import SettingsModal from './components/layout/SettingsModal'
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
    const [selectedTags, setSelectedTags] = useState([])
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleAddRecipe = (recipe) => {
        const created = addRecipe(recipe)
        setSelectedRecipe(created)
        setCurrentView('detail')
    }

    const handleUpdateRecipe = (recipe) => {
        updateRecipe(recipe)
        setSelectedRecipe(recipe)
        setCurrentView('detail')
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
        setSelectedRecipe(null)
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
        const query = searchQuery.toLowerCase().trim()
        if (!query) return true

        const matchesTitle = recipe.title?.toLowerCase().includes(query)
        const matchesDescription = recipe.description?.toLowerCase().includes(query)
        const matchesIngredients = recipe.ingredients?.some(ing => ing.toLowerCase().includes(query))
        const matchesTags = recipe.tags?.some(tag => tag.toLowerCase().includes(query))

        return matchesTitle || matchesDescription || matchesIngredients || matchesTags
    })

    // Get all unique tags
    const allTags = [...new Set(recipes.flatMap(r => r.tags || []))]

    return (
        <div className="app-layout">
            <Header
                onAddClick={() => { setSelectedRecipe(null); setCurrentView('add'); }}
                onLogoClick={() => setCurrentView('list')}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExport={handleExport}
                onImport={handleImport}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            <main className="main-content">
                <div className="container">
                    {currentView === 'list' && (
                        <RecipeList
                            recipes={filteredRecipes}
                            onRecipeClick={handleViewRecipe}
                            onToggleFavorite={toggleFavorite}
                            selectedTags={selectedTags}
                            onTagsChange={setSelectedTags}
                            allTags={allTags}
                        />
                    )}

                    {currentView === 'add' && (
                        <RecipeForm
                            onSubmit={handleAddRecipe}
                            onCancel={() => setCurrentView('list')}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    )}

                    {currentView === 'edit' && (
                        <RecipeForm
                            recipe={selectedRecipe}
                            onSubmit={handleUpdateRecipe}
                            onCancel={() => setCurrentView(selectedRecipe ? 'detail' : 'list')}
                            onOpenSettings={() => setIsSettingsOpen(true)}
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
                onAddClick={() => { setSelectedRecipe(null); setCurrentView('add'); }}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    )
}

export default App
