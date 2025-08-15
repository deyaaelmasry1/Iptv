document.addEventListener('DOMContentLoaded', async () => {
  // Initialize CMS without redirect checks
  const cms = new GitHubCMS();
  
  try {
    const posts = await cms.getPosts();
    const container = document.getElementById('posts-container');
    
    if (!posts || posts.length === 0) {
      container.innerHTML = '<p class="text-gray-500">No posts yet. Check back later!</p>';
      return;
    }
    
    // Render posts...
  } catch (error) {
    console.error('Post loading failed:', error);
  }
});
