// In your admin.js or script tag
document.addEventListener('DOMContentLoaded', () => {
  const postForm = document.getElementById('post-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusMessage = document.getElementById('status-message');
  const cms = new GitHubCMS();

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
      showStatus('Please fill in all fields', 'red');
      return;
    }

    submitBtn.disabled = true;
    showStatus('Creating post...', 'blue');

    try {
      console.log('Starting post creation...'); // Debug log
      const result = await cms.createPost(title, content);
      
      if (result.success) {
        showStatus('✓ Post created successfully!', 'green');
        console.log('Post created at:', result.url); // Debug log
        
        // Open GitHub repo in new tab to verify
        window.open(result.url, '_blank');
        
        postForm.reset();
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error('Post creation error:', error); // Debug log
      showStatus(`❌ ${error.message}`, 'red');
    } finally {
      submitBtn.disabled = false;
    }
  });

  function showStatus(message, color) {
    statusMessage.textContent = message;
    statusMessage.className = `text-sm text-${color}-500`;
  }
});
