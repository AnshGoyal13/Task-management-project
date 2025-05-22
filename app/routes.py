from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
from app import db
from app.models import User, Task
from app.forms import LoginForm, RegisterForm, TaskForm

# Create blueprints
main_bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Authentication routes
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.index'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(username=form.username.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

# Main application routes
@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')

# Task routes
@main_bp.route('/tasks')
@login_required
def tasks():
    filter_type = request.args.get('filter', 'all')
    status_filter = request.args.get('status', '')
    search_query = request.args.get('search', '')
    sort_by = request.args.get('sort_by', 'due_date')
    sort_order = request.args.get('sort_order', 'asc')
    
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
    
    # Apply sorting
    if sort_by == 'due_date':
        query = query.order_by(Task.due_date.asc() if sort_order == 'asc' else Task.due_date.desc())
    elif sort_by == 'created_date':
        query = query.order_by(Task.created_on.asc() if sort_order == 'asc' else Task.created_on.desc())
    elif sort_by == 'title':
        query = query.order_by(Task.title.asc() if sort_order == 'asc' else Task.title.desc())
    elif sort_by == 'status':
        query = query.order_by(Task.status.asc() if sort_order == 'asc' else Task.status.desc())
    
    tasks = query.all()
    
    # Count tasks for sidebar
    all_tasks = Task.query.count()
    today_tasks = Task.query.filter(
        Task.due_date >= datetime.now().date(),
        Task.due_date < datetime.now().date() + timedelta(days=1)
    ).count()
    upcoming_tasks = Task.query.filter(
        Task.due_date >= datetime.now().date(),
        Task.due_date <= datetime.now().date() + timedelta(days=7),
        Task.status != 'completed'
    ).count()
    overdue_tasks = Task.query.filter(
        Task.due_date < datetime.now().date(),
        Task.status != 'completed'
    ).count()
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
    
    return render_template(
        'tasks.html', 
        tasks=tasks, 
        filter_type=filter_type,
        status_filter=status_filter,
        search_query=search_query,
        sort_by=sort_by,
        sort_order=sort_order,
        task_counts=task_counts
    )

@main_bp.route('/tasks/new', methods=['GET', 'POST'])
@login_required
def new_task():
    form = TaskForm()
    if form.validate_on_submit():
        task = Task(
            title=form.title.data,
            description=form.description.data,
            due_date=form.due_date.data,
            status=form.status.data,
            remarks=form.remarks.data,
            created_by_id=current_user.id,
            created_by_name=current_user.username,
            last_updated_by_id=current_user.id,
            last_updated_by_name=current_user.username
        )
        db.session.add(task)
        db.session.commit()
        flash('Task created successfully!', 'success')
        return redirect(url_for('main.tasks'))
    
    return render_template('task_form.html', form=form, title='New Task')

@main_bp.route('/tasks/<int:task_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    form = TaskForm(obj=task)
    
    if form.validate_on_submit():
        task.title = form.title.data
        task.description = form.description.data
        task.due_date = form.due_date.data
        task.status = form.status.data
        task.remarks = form.remarks.data
        task.last_updated_by_id = current_user.id
        task.last_updated_by_name = current_user.username
        
        db.session.commit()
        flash('Task updated successfully!', 'success')
        return redirect(url_for('main.tasks'))
    
    return render_template('task_form.html', form=form, title='Edit Task', task=task)

@main_bp.route('/tasks/<int:task_id>/delete', methods=['POST'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('main.tasks'))

# API routes for AJAX operations
@main_bp.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())

@main_bp.route('/api/tasks/<int:task_id>/status', methods=['POST'])
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