import './Header.css'

export default function Header({ onAddClick, onLogoClick, searchQuery, onSearchChange }) {
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
