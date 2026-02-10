"""
Task Manager API — Flask + SQLite
"""

from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app, origins=["http://localhost:5173"])
db = SQLAlchemy(app)

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
CATEGORIES = {"Work", "Personal", "Shopping", "Health"}
PRIORITIES = {"Low", "Medium", "High"}

# Priority mapping for sorting (High=3, Medium=2, Low=1)
PRIORITY_ORDER = {"High": 3, "Medium": 2, "Low": 1}


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    category = db.Column(db.String(50), default="Personal")
    priority = db.Column(db.String(20), default="Medium")
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    due_date = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        # Determine status
        now_utc = datetime.now(timezone.utc)
        
        # Ensure due_date is aware if it's not None (it receives naive fro DB usually)
        # But for comparison we'll make 'now' naive if due_date is naive or vice versa
        # Best practice: keep everything aware or everything naive. 
        # API receives ISO strings, usually interpreted as naive or utc based on parsing.
        # For simplicity, we'll treat due_date as naive or UTC.
        
        status = "Pending"
        is_late = False
        
        if self.completed:
            status = "Completed"
            if self.due_date and self.completed_at:
                # Use replace(tzinfo=None) to compare safely if mix
                # Assuming app stores UTC or naive consistently.
                # Let's standarize on naive UTC for simplicity in this prototype if needed,
                # or just standard aware UTC.
                if self.completed_at > self.due_date:
                    is_late = True
        else:
            if self.due_date and now_utc > self.due_date.replace(tzinfo=timezone.utc) if self.due_date.tzinfo is None else self.due_date:
                status = "Overdue"

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "completed": self.completed,
            "created_at": self.created_at.isoformat(),
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "status": status,
            "is_late": is_late
        }


# Create tables on first run
with app.app_context():
    db.create_all()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    """List tasks with optional filters: category, priority, completed, context view."""
    query = Task.query
    now_utc = datetime.now(timezone.utc)

    # Basic filters
    category = request.args.get("category")
    if category and category in CATEGORIES:
        query = query.filter_by(category=category)

    priority = request.args.get("priority")
    if priority and priority in PRIORITIES:
        query = query.filter_by(priority=priority)

    # Context View Filter
    view = request.args.get("view") # today, upcoming, overdue, completed
    
    if view == "today":
        # Tasks due today (from 00:00 to 23:59) OR overdue (optional decision)
        # Usually 'Today' means due_date is strictly today.
        # Let's simplify: Due date <= EOD today And Not Completed
        # SQLite doesn't have great date functions, so we might need python filtering or careful queries
        # For prototype: Retrieve all and filter in Python or use simplest SQL
        # Let's try to do reasonable SQL.
        today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Task.completed == False, Task.due_date >= today_start, Task.due_date <= today_end)
    
    elif view == "upcoming":
        # Due in future (tomorrow onwards)
        today_end = now_utc.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Task.completed == False, Task.due_date > today_end)
    
    elif view == "overdue":
        # Due date < now AND not completed
        query = query.filter(Task.completed == False, Task.due_date < now_utc)
    
    elif view == "completed":
        query = query.filter(Task.completed == True)

    # Manual completed filter (overrides view if provided explicitly?)
    # Let's keep existing behavior if no view
    completed = request.args.get("completed")
    if not view and completed is not None and completed != "":
        query = query.filter_by(completed=completed.lower() == "true")

    tasks = query.all()

    # Python-side sorting (easier for multi-key with nullable fields in SQLite/SQLAlchemy basic)
    # Sort order: 
    # 1. Status (Overdue > Pending > Completed) -- implied by filters usually, but global list needs it
    # 2. Priority (High > Medium > Low)
    # 3. Due Date (Ascending - closer first)
    # 4. Created At (Desc)
    
    def sort_key(t):
        # 1. Completion status (Incomplete first = 0, Completed = 1)
        k_completed = 1 if t.completed else 0
        
        # 2. Overdue status (Overdue first = 0, Not overdue = 1)
        # Ensure proper timezone handling
        if t.due_date:
            d = t.due_date
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            is_overdue = (d < now_utc and not t.completed)
        else:
            is_overdue = False
            
        k_overdue = 0 if is_overdue else 1
        
        # 3. Priority (High=0, Med=1, Low=2 for ascending sort)
        # We want High first.
        k_priority = 3 - PRIORITY_ORDER.get(t.priority, 2)
        
        # 4. Due Date (None at end? or beginning? Usually end for pending, but depends. Let's put None at end)
        # We want closer dates first.
        k_date = t.due_date if t.due_date else datetime.max.replace(tzinfo=timezone.utc)
        if k_date.tzinfo is None:
             k_date = k_date.replace(tzinfo=timezone.utc)
        
        return (k_completed, k_overdue, k_priority, k_date)

    tasks.sort(key=sort_key)

    return jsonify([t.to_dict() for t in tasks])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    """Create a new task."""
    data = request.get_json(force=True)
    if not data.get("title", "").strip():
        return jsonify({"error": "Title is required"}), 400

    due_date = None
    if "due_date" in data and data["due_date"]:
        try:
            # Expecting ISO format
            due_date = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
            # If naive, assume UTC or local? Let's assume input is UTC or we make it aware
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
        except ValueError:
            pass # Ignore invalid dates

    task = Task(
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        category=data.get("category", "Personal") if data.get("category") in CATEGORIES else "Personal",
        priority=data.get("priority", "Medium") if data.get("priority") in PRIORITIES else "Medium",
        due_date=due_date
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    """Update an existing task."""
    task = Task.query.get_or_404(task_id)
    data = request.get_json(force=True)

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400
        task.title = title
    if "description" in data:
        task.description = data["description"].strip()
    if "category" in data and data["category"] in CATEGORIES:
        task.category = data["category"]
    if "priority" in data and data["priority"] in PRIORITIES:
        task.priority = data["priority"]
    
    if "due_date" in data:
        if data["due_date"]:
            try:
                dt = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                task.due_date = dt
            except ValueError:
                pass
        else:
            task.due_date = None

    if "completed" in data:
        new_completed = bool(data["completed"])
        if new_completed and not task.completed:
            task.completed = True
            task.completed_at = datetime.now(timezone.utc)
        elif not new_completed and task.completed:
            task.completed = False
            task.completed_at = None

    db.session.commit()
    return jsonify(task.to_dict())


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task."""
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
