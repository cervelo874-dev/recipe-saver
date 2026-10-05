import { useState, useEffect } from 'react'

export const useRecipes = () => {
    // Lazy initialization from localStorage to prevent overwriting with []
    const [recipes, setRecipes] = useState(() => {
        try {
            const stored = localStorage.getItem('recipes')
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    return parsed
                }
            }
        } catch (error) {
            console.error('Failed to load recipes from localStorage:', error)
        }
        return []
    })

    // Save recipes to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('recipes', JSON.stringify(recipes))
        } catch (error) {
            console.error('Failed to save recipes to localStorage:', error)
        }
    }, [recipes])

    const addRecipe = (recipe) => {
        const newRecipe = {
            ...recipe,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isFavorite: false,
            viewCount: 0,
            servings: recipe.servings || '',
            cookTime: recipe.cookTime || ''
        }
        setRecipes(prev => [newRecipe, ...prev])
        return newRecipe
    }

    const updateRecipe = (updatedRecipe) => {
        setRecipes(prev => prev.map(recipe =>
            recipe.id === updatedRecipe.id ? updatedRecipe : recipe
        ))
    }

    const deleteRecipe = (id) => {
        setRecipes(prev => prev.filter(recipe => recipe.id !== id))
    }

    const toggleFavorite = (id) => {
        setRecipes(prev => prev.map(recipe =>
            recipe.id === id ? { ...recipe, isFavorite: !recipe.isFavorite } : recipe
        ))
    }

    const incrementViewCount = (id) => {
        setRecipes(prev => prev.map(recipe =>
            recipe.id === id ? { ...recipe, viewCount: (recipe.viewCount || 0) + 1 } : recipe
        ))
    }

    const exportRecipes = () => {
        const dataStr = JSON.stringify({
            recipes,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        }, null, 2)

        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `recipe-saver-backup-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const importRecipes = (jsonData) => {
        try {
            const parsed = JSON.parse(jsonData)
            const importedRecipes = parsed.recipes || parsed

            // Validate data structure
            if (!Array.isArray(importedRecipes)) {
                throw new Error('無効なデータ形式です')
            }

            // Ensure all recipes have required fields
            const normalizedRecipes = importedRecipes.map(recipe => ({
                ...recipe,
                id: recipe.id || crypto.randomUUID(),
                title: recipe.title || '無題のレシピ',
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
                steps: Array.isArray(recipe.steps) ? recipe.steps : [],
                tags: Array.isArray(recipe.tags) ? recipe.tags : [],
                isFavorite: recipe.isFavorite || false,
                viewCount: recipe.viewCount || 0,
                servings: recipe.servings || '',
                cookTime: recipe.cookTime || '',
                createdAt: recipe.createdAt || new Date().toISOString()
            }))

            setRecipes(normalizedRecipes)
            return { success: true, count: normalizedRecipes.length }
        } catch (error) {
            console.error('Import failed:', error)
            return { success: false, error: error.message }
        }
    }

    return {
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        incrementViewCount,
        exportRecipes,
        importRecipes
    }
}
