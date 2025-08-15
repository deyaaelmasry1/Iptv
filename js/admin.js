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
      statusMessage.textContent = 'Please fill in all fields';
      statusMessage.className = 'text-sm text-red-500';
      return;
    }

    submitBtn.disabled = true;
    statusMessage.textContent = 'Creating post...';
    statusMessage.className = 'text-sm text-blue-500';

    try {
      const result = await cms.createPost(title, content);
      
      if (result.content) {
        statusMessage.textContent = 'Post created successfully!';
        statusMessage.className = 'text-sm text-green-500';
        postForm.reset();
        
        // Optional: Redirect to view the post
        // const postUrl = result.content.path.replace('.md','.html');
        // window.location.href = `/Iptv/post/${postUrl}`;
      }
    } catch (error) {
      console.error('Post creation failed:', error);
      statusMessage.textContent = `Error: ${error.message}`;
      statusMessage.className = 'text-sm text-red-500';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
