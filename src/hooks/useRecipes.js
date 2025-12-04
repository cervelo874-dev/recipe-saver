import { useState, useEffect } from 'react'

export const useRecipes = () => {
    const [recipes, setRecipes] = useState([])

    // Load recipes from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('recipes')
        if (stored) {
            try {
                setRecipes(JSON.parse(stored))
            } catch (error) {
                console.error('Failed to load recipes:', error)
            }
        }
    }, [])

    // Save recipes to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('recipes', JSON.stringify(recipes))
    }, [recipes])

    const addRecipe = (recipe) => {
        const newRecipe = {
            ...recipe,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isFavorite: false,
            viewCount: 0
        }
        setRecipes(prev => [newRecipe, ...prev])
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
            version: '1.0'
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
                throw new Error('Invalid data format')
            }

            // Ensure all recipes have required new fields
            const normalizedRecipes = importedRecipes.map(recipe => ({
                ...recipe,
                isFavorite: recipe.isFavorite || false,
                viewCount: recipe.viewCount || 0
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
