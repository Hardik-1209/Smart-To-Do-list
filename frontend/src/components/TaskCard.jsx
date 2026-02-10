import React from "react";

const CATEGORY_CLASS = {
    Work: "badge--category-work",
    Personal: "badge--category",
    Shopping: "badge--category-shopping",
    Health: "badge--category-health",
};

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {

    // Format date helper
    const formatDate = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        return d.toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
        });
    };

    return (
        <div className={`task-card ${task.completed ? "task-card--completed" : ""}`}>
            {/* Checkbox */}
            <button
                className={`task-card__checkbox ${task.completed ? "task-card__checkbox--checked" : ""}`}
                onClick={() => onToggle(task)}
                aria-label="Toggle complete"
            >
                {task.completed ? "✓" : ""}
            </button>

            {/* Body */}
            <div className="task-card__body">
                <div className="task-card__header-row">
                    <div className="task-card__title">{task.title}</div>
                    {task.status === "Overdue" && <span className="badge badge--overdue">Overdue</span>}
                    {task.is_late && <span className="badge badge--late">Late</span>}
                </div>

                {task.description && (
                    <div className="task-card__desc">{task.description}</div>
                )}

                <div className="task-card__meta">
                    <span className={`badge ${CATEGORY_CLASS[task.category] || "badge--category"}`}>
                        {task.category}
                    </span>
                    <span className={`badge badge--priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                    </span>

                    {task.due_date && (
                        <span className={`task-date ${task.status === "Overdue" ? "task-date--overdue" : ""}`}>
                            📅 {formatDate(task.due_date)}
                        </span>
                    )}

                    {task.completed && task.completed_at && (
                        <span className="task-date task-date--completed">
                            ✅ {formatDate(task.completed_at)}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="task-card__actions">
                <button
                    className="task-card__action-btn"
                    onClick={() => onEdit(task)}
                    aria-label="Edit task"
                >
                    ✏️
                </button>
                <button
                    className="task-card__action-btn task-card__action-btn--delete"
                    onClick={() => onDelete(task.id)}
                    aria-label="Delete task"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
