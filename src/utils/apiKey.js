const STORAGE_KEY = 'gemini_api_key'

export function getApiKey() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        try {
            const customKey = localStorage.getItem(STORAGE_KEY)
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
                localStorage.setItem(STORAGE_KEY, key.trim())
            } else {
                localStorage.removeItem(STORAGE_KEY)
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
            const customKey = localStorage.getItem(STORAGE_KEY)
            return Boolean(customKey && customKey.trim())
        } catch (_) {}
    }
    return false
}
