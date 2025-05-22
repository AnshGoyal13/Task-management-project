import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from app import app, db
from app.models import User, Task
from datetime import datetime, timedelta

def create_test_data():
    """Create test user and sample tasks for demonstration"""
    with app.app_context():
        # Check if the test user already exists
        if User.query.filter_by(username='demo').first() is None:
            # Create a test user
            user = User()
            user.username = 'demo'
            user.set_password('password')
            db.session.add(user)
            db.session.commit()
            print(f"Created test user: {user.username}")
            
            # Create sample tasks
            tasks = [
                {
                    'title': 'Complete Project Plan',
                    'description': 'Finalize the project plan document including timeline and resources',
                    'due_date': datetime.now() + timedelta(days=2),
                    'status': 'in-progress',
                    'remarks': 'Need to discuss with team',
                    'created_by_id': user.id,
                    'created_by_name': user.username,
                    'last_updated_by_id': user.id,
                    'last_updated_by_name': user.username
                },
                {
                    'title': 'Review Code Changes',
                    'description': 'Review pull request for the new feature implementation',
                    'due_date': datetime.now() + timedelta(days=1),
                    'status': 'not-started',
                    'remarks': 'High priority',
                    'created_by_id': user.id,
                    'created_by_name': user.username,
                    'last_updated_by_id': user.id,
                    'last_updated_by_name': user.username
                },
                {
                    'title': 'Deploy Application',
                    'description': 'Deploy the latest version to production',
                    'due_date': datetime.now() + timedelta(days=5),
                    'status': 'not-started',
                    'remarks': 'Needs testing first',
                    'created_by_id': user.id,
                    'created_by_name': user.username,
                    'last_updated_by_id': user.id,
                    'last_updated_by_name': user.username
                },
                {
                    'title': 'Update Documentation',
                    'description': 'Update API documentation with the latest changes',
                    'due_date': datetime.now() - timedelta(days=1),
                    'status': 'not-started',
                    'remarks': 'Overdue',
                    'created_by_id': user.id,
                    'created_by_name': user.username,
                    'last_updated_by_id': user.id,
                    'last_updated_by_name': user.username
                }
            ]
            
            for task_data in tasks:
                task = Task()
                task.title = task_data['title']
                task.description = task_data['description']
                task.due_date = task_data['due_date']
                task.status = task_data['status']
                task.remarks = task_data['remarks']
                task.created_by_id = task_data['created_by_id']
                task.created_by_name = task_data['created_by_name']
                task.last_updated_by_id = task_data['last_updated_by_id']
                task.last_updated_by_name = task_data['last_updated_by_name']
                db.session.add(task)
            
            db.session.commit()
            print(f"Created {len(tasks)} sample tasks")
        else:
            print("Test user already exists")

if __name__ == "__main__":
    create_test_data()