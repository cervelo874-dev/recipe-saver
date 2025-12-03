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
            createdAt: new Date().toISOString()
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

    return {
        recipes,
        addRecipe,
        updateRecipe,
        deleteRecipe
    }
}
