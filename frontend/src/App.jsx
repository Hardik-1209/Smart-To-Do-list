import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import Chatbot from "./components/Chatbot";
import { getTasks, createTask, updateTask, deleteTask } from "./api";
import "./App.css";

const PRIORITIES = ["All", "High", "Medium", "Low"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // unfiltered, for sidebar counts
  const [activeCategory, setActiveCategory] = useState("All"); // Changed default to "All" to match logic
  const [activeView, setActiveView] = useState("all"); // all, today, upcoming, overdue, completed
  const [activePriority, setActivePriority] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch tasks ──────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};

      // If we are in a specific view, use that.
      if (activeView !== "all") {
        filters.view = activeView;
      } else {
        // Only apply category filter in 'All' view or if we want to combine filters?
        // Let's allow category filtering effectively only when not in special views for simplicity,
        // OR allow category filtering on top of views.
        // The sidebar usually switches between Categories AND Special Views.
        // Let's assume:
        // - "All Tasks", "Today", "Upcoming", "Overdue", "Completed" are mutually exclusive main navigation items.
        // - "Categories" are additional filters OR mutually exclusive with Views.
        // Implementation Plan said: Sidebar for "All", "Today", ... 

        if (activeCategory !== "All") filters.category = activeCategory;
      }

      if (activePriority !== "All") filters.priority = activePriority;

      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeView, activePriority]);

  const fetchAllTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setAllTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSave = async (data) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
      } else {
        await createTask(data);
      }
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
      fetchAllTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
      fetchTasks();
      fetchAllTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      fetchTasks();
      fetchAllTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setActiveCategory("All"); // Reset category when switching views
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveView("all"); // Reset view when switching categories
  };

  // ── Derived ──────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  let heading = "Tasks";
  if (activeView === "today") heading = "Today's Tasks";
  else if (activeView === "upcoming") heading = "Upcoming Tasks";
  else if (activeView === "overdue") heading = "Overdue Tasks";
  else if (activeView === "completed") heading = "Completed Tasks";
  else if (activeCategory !== "All") heading = `${activeCategory} Tasks`;
  else heading = "All Tasks";

  return (
    <>
      <Sidebar
        activeCategory={activeCategory}
        activeView={activeView}
        onCategoryChange={handleCategoryChange}
        onViewChange={handleViewChange}
        tasks={allTasks}
      />

      <main className="main-content">
        {/* Header */}
        <div className="main-header">
          <div>
            <h1 className="main-header__title">{heading}</h1>
            <p className="main-header__subtitle">{today}</p>
          </div>
          <button className="btn-add-task" onClick={() => setShowForm(true)}>
            <span style={{ fontSize: "1.1rem" }}>＋</span> Add Task
          </button>
        </div>

        {/* Priority Filters */}
        <div className="filters-bar">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`filter-chip ${activePriority === p ? "filter-chip--active" : ""}`}
              onClick={() => setActivePriority(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="task-list">
          {loading ? (
            <div className="task-list--empty">
              <div className="task-list--empty__icon">⏳</div>
              <div className="task-list--empty__text">Loading tasks...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="task-list--empty">
              <div className="task-list--empty__icon">🎯</div>
              <div className="task-list--empty__text">No tasks found</div>
              <div className="task-list--empty__sub">
                Try adjusting filters or add a new task.
              </div>
            </div>
          ) : (
            tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
      <Chatbot />
    </>
  );
}
