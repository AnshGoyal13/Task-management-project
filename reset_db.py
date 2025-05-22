from app import app, db
from app.models import User, Task
from datetime import datetime, timedelta

# Reset and initialize the database
with app.app_context():
    print('Dropping all tables...')
    db.drop_all()
    
    print('Creating all tables...')
    db.create_all()
    
    print('Creating demo user...')
    user = User()
    user.username = 'demo'
    user.set_password('password')
    db.session.add(user)
    db.session.commit()
    
    print('Creating sample tasks...')
    tasks = [
        {
            'title': 'Complete Project Plan',
            'description': 'Finalize the project plan document including timeline and resources',
            'due_date': datetime.now() + timedelta(days=2),
            'status': 'in-progress',
            'remarks': 'Need to discuss with team',
        },
        {
            'title': 'Review Code Changes',
            'description': 'Review pull request for the new feature implementation',
            'due_date': datetime.now() + timedelta(days=1),
            'status': 'not-started',
            'remarks': 'High priority',
        },
        {
            'title': 'Deploy Application',
            'description': 'Deploy the latest version to production',
            'due_date': datetime.now() + timedelta(days=5),
            'status': 'not-started',
            'remarks': 'Needs testing first',
        },
        {
            'title': 'Update Documentation',
            'description': 'Update API documentation with the latest changes',
            'due_date': datetime.now() - timedelta(days=1),
            'status': 'not-started',
            'remarks': 'Overdue',
        }
    ]
    
    for task_data in tasks:
        task = Task()
        task.title = task_data['title']
        task.description = task_data['description']
        task.due_date = task_data['due_date']
        task.status = task_data['status']
        task.remarks = task_data['remarks']
        task.created_by_id = user.id
        task.created_by_name = user.username
        task.last_updated_by_id = user.id
        task.last_updated_by_name = user.username
        db.session.add(task)
    
    db.session.commit()
    print('Database successfully initialized with demo user and sample tasks!')

print('Done!')