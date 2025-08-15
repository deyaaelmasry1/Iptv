document.addEventListener('DOMContentLoaded', async () => {
  // Verify authentication
  const config = JSON.parse(localStorage.getItem('github-cms-config'));
  if (!config?.token) {
    alert('Please complete setup first');
    window.location.href = '/Iptv/setup.html';
    return;
  }

  const cms = new GitHubCMS();
  const postForm = document.getElementById('post-form');

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    
    if (!title || !content) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const result = await cms.createPost(title, content);
      if (result.content) {
        alert('Post created successfully!');
        postForm.reset();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    }
  });
});
