from app import db, login_manager
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    tasks = db.relationship('Task', backref='created_by_user', lazy='dynamic', foreign_keys='Task.created_by_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

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