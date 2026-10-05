import { useState, useEffect } from 'react'
import {
    getApiKey,
    setApiKey,
    isCustomApiKey,
    getSelectedModel,
    setSelectedModel,
    AVAILABLE_MODELS,
    DEFAULT_MODEL
} from '../../utils/apiKey'
import './SettingsModal.css'

export default function SettingsModal({ isOpen, onClose }) {
    const [inputKey, setInputKey] = useState('')
    const [selectedModel, setModel] = useState(DEFAULT_MODEL)
    const [showKey, setShowKey] = useState(false)
    const [savedMessage, setSavedMessage] = useState('')
    const [hasCustom, setHasCustom] = useState(false)
    const [hasEnv, setHasEnv] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setInputKey(localStorage.getItem('gemini_api_key') || '')
            setModel(getSelectedModel())
            setHasCustom(isCustomApiKey())
            setHasEnv(Boolean(import.meta.env.VITE_GEMINI_API_KEY))
            setSavedMessage('')
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSave = (e) => {
        e.preventDefault()
        setApiKey(inputKey)
        setSelectedModel(selectedModel)
        setHasCustom(Boolean(inputKey.trim()))
        setSavedMessage('設定を保存しました！')
        setTimeout(() => {
            setSavedMessage('')
            onClose()
        }, 1000)
    }

    const handleClear = () => {
        setApiKey('')
        setInputKey('')
        setHasCustom(false)
        setSavedMessage('APIキーを削除しました。')
        setTimeout(() => {
            setSavedMessage('')
        }, 1200)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚙️ 設定</h2>
                    <button className="btn-close" onClick={onClose} aria-label="閉じる">✕</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSave}>
                        {/* Model Selection Section */}
                        <section className="settings-section">
                            <h3>🤖 使用するGeminiモデル</h3>
                            <p className="settings-description">
                                レシピ抽出に使用するモデルを選択します。最新のGemini 3.8 Flashや高速・軽量なLiteモデルをご利用いただけます。
                            </p>
                            <div className="model-select-wrapper">
                                <select
                                    className="input model-select"
                                    value={selectedModel}
                                    onChange={(e) => setModel(e.target.value)}
                                >
                                    {AVAILABLE_MODELS.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        {/* API Key Section */}
                        <section className="settings-section mt-md">
                            <h3>🔑 Google Gemini API キー</h3>
                            <p className="settings-description">
                                入力されたキーはお使いのブラウザ（LocalStorage）にのみ安全に保存され、外部サーバーには送信されません。
                            </p>

                            <div className="status-badge-container">
                                <span className="status-label">現在の状態:</span>
                                {hasCustom ? (
                                    <span className="status-badge status-active">✓ ブラウザ保存キー有効</span>
                                ) : hasEnv ? (
                                    <span className="status-badge status-env">✓ .envキー有効</span>
                                ) : (
                                    <span className="status-badge status-missing">未設定（AI機能は利用不可）</span>
                                )}
                            </div>

                            <div className="input-group">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    className="input api-key-input"
                                    placeholder="AIzaSy..."
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowKey(!showKey)}
                                >
                                    {showKey ? '隠す' : '表示'}
                                </button>
                            </div>

                            <div className="settings-links">
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="external-link"
                                >
                                    ↗ Google AI StudioでAPIキーを無料取得
                                </a>
                            </div>

                            {savedMessage && <p className="success-message">{savedMessage}</p>}

                            <div className="modal-actions">
                                {hasCustom && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost text-danger"
                                        onClick={handleClear}
                                    >
                                        キーを削除
                                    </button>
                                )}
                                <div className="right-actions">
                                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                                        キャンセル
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        保存する
                                    </button>
                                </div>
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </div>
    )
}
