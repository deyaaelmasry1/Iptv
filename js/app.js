document.addEventListener('DOMContentLoaded', async () => {
  console.log('Script started');

  try {
    const cms = new GitHubCMS();
    console.log('CMS initialized', cms);

    const container = document.getElementById('posts-container');
    if (!container) {
      console.error('Missing posts-container element!');
      return;
    }

    // 1. Load posts index.json
    let posts = [];
    try {
      posts = await cms.getPosts();
      console.log('Posts loaded:', posts);
    } catch (err) {
      console.warn('Could not load index.json', err);
      posts = [];
    }

    // 2. If no posts
    if (!posts.length) {
      container.innerHTML = `
        <div class="bg-yellow-50 p-4 rounded-lg text-center">
          <p>No posts found. 
          <a href="/Iptv/admin/" class="text-blue-600 hover:underline">Create one?</a></p>
        </div>
      `;
      return;
    }

    // 3. Render posts
    container.innerHTML = '';
    posts.forEach(postFile => {
      const title = postFile
        .replace('.md', '')
        .replace(/^\d{4}-\d{2}-\d{2}-/, '') // remove date prefix
        .replace(/-/g, ' ') // replace dashes with spaces
        .replace(/\b\w/g, c => c.toUpperCase()); // capitalize

      const slug = postFile.replace('.md', '');
      const postEl = document.createElement('article');
      postEl.className = 'mb-8 p-4 bg-white rounded-lg shadow';
      postEl.innerHTML = `
        <h2 class="text-xl font-bold mb-2">${title}</h2>
        <a href="/Iptv/post/${slug}.html" class="text-blue-600 hover:underline">Read post</a>
      `;
      container.appendChild(postEl);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    const app = document.getElementById('app') || document.body;
    app.innerHTML = `
      <div class="bg-red-50 p-4 rounded-lg">
        <p class="text-red-600">Error loading content. Check console for details.</p>
      </div>
    `;
  }
});
