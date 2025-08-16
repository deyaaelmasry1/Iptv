document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const postForm = document.getElementById('post-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusMessage = document.getElementById('status-message');
  const titleInput = document.getElementById('post-title');
  const contentInput = document.getElementById('post-content');
  const cms = new GitHubCMS();

  // Toast Notification Functions
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } animate-fade-in`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.replace('animate-fade-in', 'animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  // Form Validation
  const validateForm = () => {
    let isValid = true;
    
    if (!titleInput.value.trim()) {
      titleInput.classList.add('border-red-500');
      isValid = false;
    }
    
    if (!contentInput.value.trim()) {
      contentInput.classList.add('border-red-500');
      isValid = false;
    }
    
    return isValid;
  };

  // Clear Validation Styles
  const clearValidation = () => {
    [titleInput, contentInput].forEach(input => {
      input.classList.remove('border-red-500');
      input.addEventListener('input', () => {
        if (input.value.trim()) input.classList.remove('border-red-500');
      });
    });
  };

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearValidation();
    
    if (!validateForm()) {
      showStatus('Please fill in all required fields', 'error');
      return;
    }

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    try {
      // UI Loading State
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="flex items-center">
          <i class="fas fa-spinner fa-spin mr-2"></i>
          Publishing...
        </span>
      `;
      showStatus('Creating your post...', 'info');

      // API Call
      const result = await cms.createPost(title, content);
      
      // Success Handling
      showToast('Post created successfully!');
      showStatus('Post created!', 'success');
      postForm.reset();
      
      // Open new tab after short delay
      setTimeout(() => {
        if (result?.url) window.open(result.url, '_blank');
      }, 1000);
      
    } catch (error) {
      console.error('Post creation failed:', error);
      showToast(error.message || 'Failed to create post', 'error');
      showStatus(`Error: ${error.message}`, 'error');
    } finally {
      // Reset UI
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Publish Post';
    }
  };

  // Status Message Display
  const showStatus = (message, type = 'info') => {
    const colors = {
      info: 'text-blue-500',
      success: 'text-green-500',
      error: 'text-red-500'
    };
    
    statusMessage.innerHTML = `
      <span class="${colors[type]}">
        ${type === 'error' ? '❌' : type === 'success' ? '✓' : '↻'} ${message}
      </span>
    `;
  };

  // Initialize
  clearValidation();
  postForm.addEventListener('submit', handleSubmit);
});
