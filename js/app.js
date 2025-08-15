document.addEventListener('DOMContentLoaded', async () => {
  const theme = new ThemeManager();
  const cms = new GitHubCMS();
  
  theme.renderFullPage('home', async () => {
    const posts = await cms.getPosts();
    const postsList = document.getElementById('posts-list');
    const loading = document.getElementById('loading');
    
    if (posts.length > 0) {
      loading.remove();
      
      for (const post of posts) {
        const postUrl = `https://raw.githubusercontent.com/${cms.owner}/${cms.repo}/main/posts/${post.slug}.md`;
        try {
          const response = await fetch(postUrl);
          const markdown = await response.text();
          const excerpt = markdown.split('\n').slice(0, 3).join('\n');
          
          const postElement = document.createElement('article');
          postElement.className = 'bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow';
          postElement.innerHTML = `
            <div class="p-6">
              <h2 class="text-xl font-bold mb-2">
                <a href="/post/${post.slug}.html" class="hover:text-blue-600">${post.title}</a>
              </h2>
              <p class="text-gray-500 text-sm mb-4">${post.date.toLocaleDateString()}</p>
              <div class="prose prose-sm max-w-none mb-4">${marked.parse(excerpt)}</div>
              <a href="/post/${post.slug}.html" class="inline-block mt-2 text-blue-600 hover:underline font-medium">
                Read more →
              </a>
            </div>
          `;
          postsList.appendChild(postElement);
        } catch (error) {
          console.error(`Error loading post ${post.slug}:`, error);
        }
      }
    } else {
      loading.innerHTML = `
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-md mx-auto">
          <p class="text-yellow-700">No posts found. <a href="/admin/" class="text-blue-600 hover:underline">Create your first post</a></p>
        </div>
      `;
    }
  });
});
