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
        deleteRecipe
    } = useRecipes()

    const [currentView, setCurrentView] = useState('list') // 'list', 'add', 'detail'
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

    // Filter recipes based on search and tags
    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesTag = !filterTag || recipe.tags.includes(filterTag)
        return matchesSearch && matchesTag
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
            />

            <main className="main-content">
                <div className="container">
                    {currentView === 'list' && (
                        <RecipeList
                            recipes={filteredRecipes}
                            onRecipeClick={handleViewRecipe}
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
