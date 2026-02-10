import React from "react";

const CATEGORIES = [
    { label: "Personal", value: "Personal", icon: "🏠" },
    { label: "Work", value: "Work", icon: "💼" },
    { label: "Shopping", value: "Shopping", icon: "🛒" },
    { label: "Health", value: "Health", icon: "💪" },
];

const VIEWS = [
    { label: "All Tasks", value: "all", icon: "📋" },
    { label: "Today", value: "today", icon: "📅" },
    { label: "Upcoming", value: "upcoming", icon: "🔮" },
    { label: "Overdue", value: "overdue", icon: "⚠️" },
    { label: "Completed", value: "completed", icon: "✅" },
];

export default function Sidebar({ activeCategory, activeView, onCategoryChange, onViewChange, tasks }) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Count tasks per category (from all tasks, unfiltered)
    const countForCategory = (cat) =>
        tasks.filter((t) => t.category === cat).length;

    // Helper to count for views (approximate client-side or we rely on backend for these counts? 
    // For now, client-side approximation for 'All' and 'Completed' is easy. 
    // 'Today', 'Upcoming', 'Overdue' requires date logic matching backend.
    // Let's just show counts for Categories and All/Completed for now to avoid duplicative logic bugs.)

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">✓</div>
                <span className="sidebar__logo-text">TaskFlow</span>
            </div>

            {/* Nav - Views */}
            <div>
                <div className="sidebar__section-title">Views</div>
                <nav className="sidebar__nav">
                    {VIEWS.map((view) => (
                        <button
                            key={view.value}
                            className={`sidebar__item ${activeView === view.value ? "sidebar__item--active" : ""}`}
                            onClick={() => onViewChange(view.value)}
                        >
                            <span className="sidebar__item-icon">{view.icon}</span>
                            {view.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Nav - Categories */}
            <div>
                <div className="sidebar__section-title">Categories</div>
                <nav className="sidebar__nav">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            className={`sidebar__item ${activeCategory === cat.value ? "sidebar__item--active" : ""}`}
                            onClick={() => onCategoryChange(cat.value)}
                        >
                            <span className="sidebar__item-icon">{cat.icon}</span>
                            {cat.label}
                            <span className="sidebar__item-count">{countForCategory(cat.value)}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Stats */}
            <div className="sidebar__stats">
                <div className="sidebar__stats-title">Progress</div>
                <div className="sidebar__stats-bar">
                    <div className="sidebar__stats-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="sidebar__stats-label">
                    <span>{completed}</span> of {total} tasks completed
                </div>
            </div>
        </aside>
    );
}
