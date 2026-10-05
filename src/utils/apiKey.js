const STORAGE_KEY_KEY = 'gemini_api_key'
const STORAGE_KEY_MODEL = 'gemini_model_name'

export const DEFAULT_MODEL = 'gemini-3.8-flash'

export const AVAILABLE_MODELS = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash（推奨・最新高精度）' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite（推奨・超高速＆軽量）' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' }
]

export function getApiKey() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        try {
            const customKey = localStorage.getItem(STORAGE_KEY_KEY)
            if (customKey && customKey.trim()) {
                return customKey.trim()
            }
        } catch (_) {}
    }
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) || ''
}

export function setApiKey(key) {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        try {
            if (key && key.trim()) {
                localStorage.setItem(STORAGE_KEY_KEY, key.trim())
            } else {
                localStorage.removeItem(STORAGE_KEY_KEY)
            }
        } catch (_) {}
    }
}

export function hasApiKey() {
    return Boolean(getApiKey())
}

export function isCustomApiKey() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        try {
            const customKey = localStorage.getItem(STORAGE_KEY_KEY)
            return Boolean(customKey && customKey.trim())
        } catch (_) {}
    }
    return false
}

export function getSelectedModel() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_MODEL)
            if (stored && stored.trim()) {
                return stored.trim()
            }
        } catch (_) {}
    }
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL) || DEFAULT_MODEL
}

export function setSelectedModel(modelName) {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        try {
            if (modelName && modelName.trim()) {
                localStorage.setItem(STORAGE_KEY_MODEL, modelName.trim())
            } else {
                localStorage.removeItem(STORAGE_KEY_MODEL)
            }
        } catch (_) {}
    }
}
