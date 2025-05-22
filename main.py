from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize app
app = Flask(__name__, 
            static_folder='app/static',
            template_folder='app/templates')

# Configure the app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskmaster.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    tasks = db.relationship('Task', backref='created_by_user', lazy='dynamic', foreign_keys='Task.created_by_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='not-started')
    remarks = db.Column(db.Text)
    created_on = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated_on = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_by_name = db.Column(db.String(64))
    last_updated_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    last_updated_by_name = db.Column(db.String(64))
    
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

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

# Forms (using Flask-WTF)
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField, DateField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo, ValidationError

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Log In')

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=64)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already taken. Please choose a different one.')

class TaskForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(max=100)])
    description = TextAreaField('Description')
    due_date = DateField('Due Date', validators=[DataRequired()])
    status = SelectField('Status', choices=[
        ('not-started', 'Not Started'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed')
    ], validators=[DataRequired()])
    remarks = TextAreaField('Remarks')
    submit = SubmitField('Save Task')

# Routes
@app.route('/')
@login_required
def index():
    # Count tasks for sidebar
    all_tasks = Task.query.count()
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    today_tasks = Task.query.filter(
        Task.due_date >= today,
        Task.due_date < tomorrow
    ).count()
    
    upcoming_tasks = Task.query.filter(
        Task.due_date >= today,
        Task.due_date <= today + timedelta(days=7),
        Task.status != 'completed'
    ).count()
    
    overdue_tasks = Task.query.filter(
        Task.due_date < today,
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
    
    return render_template('index.html', task_counts=task_counts)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        user = User()
        user.username = form.username.data
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/tasks')
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
    today = datetime.now().date()
    
    today_tasks = Task.query.filter(
        Task.due_date >= today,
        Task.due_date < today + timedelta(days=1)
    ).count()
    
    upcoming_tasks = Task.query.filter(
        Task.due_date >= today,
        Task.due_date <= today + timedelta(days=7),
        Task.status != 'completed'
    ).count()
    
    overdue_tasks = Task.query.filter(
        Task.due_date < today,
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
        task_counts=task_counts,
        today=today
    )

@app.route('/tasks/new', methods=['GET', 'POST'])
@login_required
def new_task():
    form = TaskForm()
    if form.validate_on_submit():
        task = Task()
        task.title = form.title.data
        task.description = form.description.data
        task.due_date = form.due_date.data
        task.status = form.status.data
        task.remarks = form.remarks.data
        task.created_by_id = current_user.id
        task.created_by_name = current_user.username
        task.last_updated_by_id = current_user.id
        task.last_updated_by_name = current_user.username
        
        db.session.add(task)
        db.session.commit()
        flash('Task created successfully!', 'success')
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', form=form, title='New Task')

@app.route('/tasks/<int:task_id>/edit', methods=['GET', 'POST'])
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
        return redirect(url_for('tasks'))
    
    return render_template('task_form.html', form=form, title='Edit Task', task=task)

@app.route('/tasks/<int:task_id>/delete', methods=['POST'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    flash('Task deleted successfully!', 'success')
    return redirect(url_for('tasks'))

# API routes for AJAX operations
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

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)