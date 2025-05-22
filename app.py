from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:@localhost/taskmaster')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Task model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='not-started')
    remarks = db.Column(db.Text)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated_on = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_name = db.Column(db.String(64), default="System User")
    last_updated_by_name = db.Column(db.String(64), default="System User")
    
    def __repr__(self):
        return f'<Task {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.strftime('%Y-%m-%d'),
            'status': self.status,
            'remarks': self.remarks,
            'created_on': self.created_on.strftime('%Y-%m-%d %H:%M'),
            'last_updated_on': self.last_updated_on.strftime('%Y-%m-%d %H:%M'),
            'created_by_name': self.created_by_name,
            'last_updated_by_name': self.last_updated_by_name
        }

# Create database tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    return redirect(url_for('tasks'))

@app.route('/tasks')
def tasks():
    filter_type = request.args.get('filter', 'all')
    status_filter = request.args.get('status', '')
    search_query = request.args.get('search', '')
    
    # Base query
    query = Task.query
    
    # Apply filters
    if filter_type == 'today':
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        query = query.filter(Task.due_date >= today, Task.due_date < tomorrow)
    elif filter_type == 'upcoming':
        today = datetime.now().date()
        next_week = today + timedelta(days=7)
        query = query.filter(Task.due_date >= today, Task.due_date <= next_week, Task.status != 'completed')
    elif filter_type == 'overdue':
        today = datetime.now().date()
        query = query.filter(Task.due_date < today, Task.status != 'completed')
    
    # Apply status filter
    if status_filter:
        query = query.filter(Task.status == status_filter)
    
    # Apply search
    if search_query:
        search = f"%{search_query}%"
        query = query.filter(
            (Task.title.like(search)) | 
            (Task.description.like(search)) | 
            (Task.remarks.like(search))
        )
    
    tasks = query.all()
    
    # Get counts for different types of tasks
    all_tasks = Task.query.count()
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    today_tasks = Task.query.filter(Task.due_date >= today, Task.due_date < tomorrow).count()
    upcoming_tasks = Task.query.filter(Task.due_date >= today, Task.due_date <= today + timedelta(days=7), Task.status != 'completed').count()
    overdue_tasks = Task.query.filter(Task.due_date < today, Task.status != 'completed').count()
    not_started_tasks = Task.query.filter(Task.status == 'not-started').count()
    in_progress_tasks = Task.query.filter(Task.status == 'in-progress').count()
    completed_tasks = Task.query.filter(Task.status == 'completed').count()
    
    task_counts = {
        'all': all_tasks,
        'today': today_tasks,
        'upcoming': upcoming_tasks,
        'overdue': overdue_tasks,
        'not_started': not_started_tasks,
        'in_progress': in_progress_tasks,
        'completed': completed_tasks
    }
    
    return render_template('tasks.html', 
                          tasks=tasks, 
                          filter_type=filter_type,
                          status_filter=status_filter,
                          search_query=search_query,
                          task_counts=task_counts,
                          today=today)

@app.route('/tasks/new', methods=['GET', 'POST'])
def new_task():
    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        due_date_str = request.form['due_date']
        status = request.form['status']
        remarks = request.form['remarks']
        
        # Convert string date to datetime
        due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
        
        # Create new task
        task = Task()
        task.title = title
        task.description = description
        task.due_date = due_date
        task.status = status
        task.remarks = remarks
        task.created_by_name = "System User"
        task.last_updated_by_name = "System User"
        
        db.session.add(task)
        db.session.commit()
        
        flash('Task created successfully!', 'success')
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', task=None, title="New Task")

@app.route('/tasks/<int:task_id>/edit', methods=['GET', 'POST'])
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    if request.method == 'POST':
        task.title = request.form['title']
        task.description = request.form['description']
        task.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%d')
        task.status = request.form['status']
        task.remarks = request.form['remarks']
        task.last_updated_by_name = "System User"
        
        db.session.commit()
        flash('Task updated successfully!', 'success')
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', task=task, title="Edit Task")

@app.route('/tasks/<int:task_id>/delete', methods=['POST'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('tasks'))

@app.route('/api/tasks/<int:task_id>/status', methods=['POST'])
def update_task_status(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
        task.last_updated_by_name = "System User"
        db.session.commit()
        return jsonify({'success': True, 'task': task.to_dict()})
    
    return jsonify({'success': False, 'message': 'Status not provided'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)