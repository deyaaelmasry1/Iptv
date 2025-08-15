document.addEventListener('DOMContentLoaded', async () => {
  console.log('Script started'); // Debug line
  
  try {
    const cms = new GitHubCMS();
    console.log('CMS initialized', cms); // Debug line
    
    const container = document.getElementById('posts-container');
    if (!container) {
      console.error('Missing posts-container element!');
      return;
    }

    // 1. Try loading posts
    const posts = await cms.getPosts();
    console.log('Posts loaded:', posts); // Debug line

    // 2. Handle empty state
    if (!posts || posts.length === 0) {
      container.innerHTML = `
        <div class="bg-yellow-50 p-4 rounded-lg text-center">
          <p>No posts found. <a href="/Iptv/admin/" class="text-blue-600 hover:underline">Create one?</a></p>
        </div>
      `;
      return;
    }

    // 3. Render posts
    container.innerHTML = ''; // Clear loader
    posts.forEach(post => {
      const postEl = document.createElement('article');
      postEl.className = 'mb-8 p-4 bg-white rounded-lg shadow';
      postEl.innerHTML = `
        <h2 class="text-xl font-bold mb-2">${post.replace('.md', '').split('-').slice(3).join(' ')}</h2>
        <a href="/Iptv/post/${post.replace('.md', '')}.html" class="text-blue-600 hover:underline">Read post</a>
      `;
      container.appendChild(postEl);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    document.getElementById('app').innerHTML = `
      <div class="bg-red-50 p-4 rounded-lg">
        <p class="text-red-600">Error loading content. Check console for details.</p>
      </div>
    `;
  }
});
