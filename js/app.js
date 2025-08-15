document.addEventListener('DOMContentLoaded', async () => {
  const cms = new GitHubCMS();
  const posts = await cms.getPosts(); // Now this will work
  
  if (posts.length === 0) {
    document.getElementById('posts-container').innerHTML = '<p>No posts found.</p>';
    return;
  }

  // Render posts...
});
