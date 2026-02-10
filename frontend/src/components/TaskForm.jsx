import React, { useState, useEffect } from "react";

const CATEGORIES = ["Personal", "Work", "Shopping", "Health"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function TaskForm({ task, onSave, onClose }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Personal");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");

    const isEditing = !!task;

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setCategory(task.category);
            setPriority(task.priority);
            // Format existing due_date for datetime-local (YYYY-MM-DDTHH:mm)
            if (task.due_date) {
                // Ensure we strip seconds/ms if present or just take first 16 chars
                setDueDate(task.due_date.substring(0, 16));
            } else {
                setDueDate("");
            }
        } else {
            // Default: clear
            setTitle("");
            setDescription("");
            setCategory("Personal");
            setPriority("Medium");
            setDueDate("");
        }
    }, [task]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim(),
            category,
            priority,
            due_date: dueDate || null
        });
    };

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal__header">
                    <h2 className="modal__title">{isEditing ? "Edit Task" : "New Task"}</h2>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form__group">
                        <label className="form__label" htmlFor="task-title">Title</label>
                        <input
                            id="task-title"
                            className="form__input"
                            type="text"
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form__group">
                        <label className="form__label" htmlFor="task-desc">Description</label>
                        <textarea
                            id="task-desc"
                            className="form__textarea"
                            placeholder="Add details (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form__row">
                        <div className="form__group">
                            <label className="form__label" htmlFor="task-category">Category</label>
                            <select
                                id="task-category"
                                className="form__select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form__group">
                            <label className="form__label" htmlFor="task-priority">Priority</label>
                            <select
                                id="task-priority"
                                className="form__select"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form__group">
                        <label className="form__label" htmlFor="task-due">Due Date</label>
                        <input
                            id="task-due"
                            className="form__input"
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="form__actions">
                        <button type="button" className="btn btn--ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {isEditing ? "Save Changes" : "Add Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
