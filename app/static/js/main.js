// Main JavaScript file for TaskMaster

document.addEventListener('DOMContentLoaded', function() {
    // Mobile sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
    
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            
            // Create backdrop if it doesn't exist
            if (!sidebarBackdrop) {
                const backdrop = document.createElement('div');
                backdrop.classList.add('sidebar-backdrop');
                document.body.appendChild(backdrop);
                
                backdrop.addEventListener('click', function() {
                    sidebar.classList.remove('show');
                    backdrop.classList.remove('show');
                });
            } else {
                sidebarBackdrop.classList.toggle('show');
            }
        });
    }
    
    // Task status quick update
    const statusDropdowns = document.querySelectorAll('.task-status-dropdown');
    
    statusDropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const taskId = this.getAttribute('data-task-id');
            const newStatus = this.value;
            
            // Update task status via API
            fetch(`/api/tasks/${taskId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    const toast = createToast('Status updated', 'Task status has been updated successfully.', 'success');
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.classList.add('show');
                    }, 100);
                    
                    // Update UI status indicator
                    const taskCard = this.closest('.task-card');
                    const statusBadge = taskCard.querySelector('.status-badge');
                    
                    // Remove old status classes
                    statusBadge.classList.remove('not-started', 'in-progress', 'completed');
                    // Add new status class
                    statusBadge.classList.add(newStatus);
                    
                    // Update status dot
                    const statusDot = statusBadge.querySelector('.status-dot');
                    statusDot.classList.remove('not-started', 'in-progress', 'completed');
                    statusDot.classList.add(newStatus);
                    
                    // Update status text
                    statusBadge.querySelector('span:not(.status-dot)').textContent = 
                        newStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            })
            .catch(error => {
                console.error('Error updating status:', error);
                // Show error message
                const toast = createToast('Error', 'Failed to update task status.', 'danger');
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.classList.add('show');
                }, 100);
            });
        });
    });
    
    // Helper function to create toast notifications
    function createToast(title, message, type = 'primary') {
        const toast = document.createElement('div');
        toast.classList.add('toast', `bg-${type === 'danger' ? 'danger' : 'white'}`);
        toast.style.position = 'fixed';
        toast.style.top = '1rem';
        toast.style.right = '1rem';
        toast.style.zIndex = '1050';
        toast.style.minWidth = '250px';
        
        toast.innerHTML = `
            <div class="toast-header ${type === 'danger' ? 'bg-danger text-white' : ''}">
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body ${type === 'danger' ? 'text-white' : ''}">
                ${message}
            </div>
        `;
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.btn-close');
        closeBtn.addEventListener('click', function() {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        });
        
        return toast;
    }
});