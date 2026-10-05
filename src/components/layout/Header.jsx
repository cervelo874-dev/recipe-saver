import './Header.css'

export default function Header({ onAddClick, onLogoClick, searchQuery, onSearchChange, onExport, onImport, onSettingsClick }) {
    return (
        <header className="header">
            <div className="header-content container">
                <div className="header-left">
                    <button
                        className="logo-button"
                        onClick={onLogoClick}
                        aria-label="ホームに戻る"
                    >
                        <span className="logo-icon">🍳</span>
                        <span className="logo-text">Recipe Saver</span>
                    </button>
                </div>

                <div className="header-center">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="レシピや材料を検索..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="header-right">
                    {/* Settings Button */}
                    <button
                        className="btn btn-ghost icon-btn settings-btn"
                        onClick={onSettingsClick}
                        title="APIキーと設定"
                        aria-label="APIキーと設定"
                    >
                        <span className="btn-icon">⚙️</span>
                    </button>

                    {/* Export/Import Buttons */}
                    <button
                        className="btn btn-ghost icon-btn"
                        onClick={onExport}
                        title="データをエクスポート"
                        aria-label="データをエクスポート"
                    >
                        <span className="btn-icon">💾</span>
                    </button>

                    <button
                        className="btn btn-ghost icon-btn"
                        onClick={onImport}
                        title="データをインポート"
                        aria-label="データをインポート"
                    >
                        <span className="btn-icon">📂</span>
                    </button>

                    {/* Add Recipe Button */}
                    <button
                        className="btn btn-primary add-recipe-btn"
                        onClick={onAddClick}
                    >
                        <span className="btn-icon">+</span>
                        <span className="btn-text">レシピ追加</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
