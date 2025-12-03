import './MobileNav.css'

export default function MobileNav({ currentView, onHomeClick, onAddClick }) {
    return (
        <nav className="mobile-nav">
            <button
                className={`mobile-nav-item ${currentView === 'list' ? 'active' : ''}`}
                onClick={onHomeClick}
                aria-label="ホーム"
            >
                <span className="mobile-nav-icon">🏠</span>
                <span className="mobile-nav-label">ホーム</span>
            </button>

            <button
                className={`mobile-nav-item ${currentView === 'add' || currentView === 'edit' ? 'active' : ''}`}
                onClick={onAddClick}
                aria-label="追加"
            >
                <span className="mobile-nav-icon add-icon">+</span>
                <span className="mobile-nav-label">追加</span>
            </button>
        </nav>
    )
}
