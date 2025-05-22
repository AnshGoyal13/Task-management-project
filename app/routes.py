from flask import render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from app.models import User, Task
from datetime import datetime, timedelta
from urllib.parse import urlparse

# Routes for authentication
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        remember_me = 'remember_me' in request.form
        
        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('login'))
        
        login_user(user, remember=remember_me)
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc != '':
            next_page = url_for('index')
        
        flash('You have been logged in successfully!', 'success')
        return redirect(next_page)
    
    return render_template('login.html', title='Sign In')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return redirect(url_for('register'))
        
        user = User()
        user.username = username
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Congratulations, you are now a registered user!', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register')

@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

# Routes for task management
@app.route('/')
def index():
    return redirect(url_for('tasks'))

@app.route('/tasks')
@login_required
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
@login_required
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
        task.created_by_id = current_user.id
        task.created_by_name = current_user.username
        task.last_updated_by_id = current_user.id
        task.last_updated_by_name = current_user.username
        
        db.session.add(task)
        db.session.commit()
        
        flash('Task created successfully!', 'success')
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', task=None, title="New Task")

@app.route('/tasks/<int:task_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    if request.method == 'POST':
        task.title = request.form['title']
        task.description = request.form['description']
        task.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%d')
        task.status = request.form['status']
        task.remarks = request.form['remarks']
        task.last_updated_by_id = current_user.id
        task.last_updated_by_name = current_user.username
        
        db.session.commit()
        flash('Task updated successfully!', 'success')
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', task=task, title="Edit Task")

@app.route('/tasks/<int:task_id>/delete', methods=['POST'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('tasks'))

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())

@app.route('/api/tasks/<int:task_id>/status', methods=['POST'])
@login_required
def update_task_status(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'status' in data:
        task.status = data['status']
        task.last_updated_by_id = current_user.id
        task.last_updated_by_name = current_user.username
        db.session.commit()
        return jsonify({'success': True, 'task': task.to_dict()})
    
    return jsonify({'success': False, 'message': 'Status not provided'}), 400