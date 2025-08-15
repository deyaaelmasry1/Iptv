document.addEventListener('DOMContentLoaded', async () => {
  // Configuration
  const config = {
    fallbackAdminUrl: '/admin/',
    emptyStateMessage: 'No posts found.',
    errorStateMessage: 'Error loading content. Please try again later.'
  };

  // DOM Elements
  const container = document.getElementById('posts-container');
  const appElement = document.getElementById('app') || document.body;

  // Show loading state
  if (container) {
    container.innerHTML = `
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    `;
  }

  try {
    // Initialize CMS
    const cms = new GitHubCMS();
    console.debug('CMS initialized', cms);

    if (!container) {
      console.error('Missing posts-container element');
      throw new Error('Post container element not found');
    }

    // Load posts with retry logic
    let posts = [];
    try {
      posts = await withRetry(() => cms.getPosts(), {
        retries: 2,
        delay: 1000
      });
      console.debug('Posts loaded:', posts);
    } catch (err) {
      console.warn('Failed to load posts index:', err);
      posts = [];
    }

    // Handle empty state
    if (!posts.length) {
      renderEmptyState();
      return;
    }

    // Process and render posts
    renderPosts(posts);

  } catch (error) {
    console.error('Fatal error:', error);
    renderErrorState(error);
  }

  // Helper Functions
  function renderPosts(posts) {
    container.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    posts.forEach(postFile => {
      const { title, slug } = processPostFilename(postFile);
      
      const postEl = document.createElement('article');
      postEl.className = 'mb-8 p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow';
      postEl.innerHTML = `
        <h2 class="text-2xl font-bold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
          <a href="/Iptv/post/${slug}.html">${title}</a>
        </h2>
        <div class="flex items-center text-gray-500 text-sm mb-4">
          <i class="far fa-calendar-alt mr-2"></i>
          <span>${extractDateFromSlug(slug)}</span>
        </div>
        <a href="/Iptv/post/${slug}.html" 
           class="inline-flex items-center text-blue-600 hover:underline">
          Read post <i class="fas fa-arrow-right ml-2"></i>
        </a>
      `;
      
      fragment.appendChild(postEl);
    });
    
    container.appendChild(fragment);
  }

  function processPostFilename(filename) {
    const slug = filename.replace('.md', '');
    let title = slug
      .replace(/^\d{4}-\d{2}-\d{2}-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
      
    return { slug, title };
  }

  function extractDateFromSlug(slug) {
    const dateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      try {
        return new Date(dateMatch[1]).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateMatch[1];
      }
    }
    return '';
  }

  function renderEmptyState() {
    container.innerHTML = `
      <div class="bg-yellow-50 p-6 rounded-lg text-center">
        <i class="far fa-newspaper text-4xl mb-4 text-yellow-500"></i>
        <p class="text-lg mb-4">${config.emptyStateMessage}</p>
        <a href="${config.fallbackAdminUrl}" 
           class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-plus mr-2"></i> Create First Post
        </a>
      </div>
    `;
  }

  function renderErrorState(error) {
    const errorContent = `
      <div class="bg-red-50 p-6 rounded-lg text-center">
        <i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-500"></i>
        <h3 class="text-xl font-bold mb-2 text-red-600">Oops! Something went wrong</h3>
        <p class="mb-4">${config.errorStateMessage}</p>
        ${error.message ? `<p class="text-sm text-gray-500">${error.message}</p>` : ''}
        <button onclick="window.location.reload()" 
                class="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
          <i class="fas fa-sync-alt mr-2"></i> Try Again
        </button>
      </div>
    `;
    
    if (container) {
      container.innerHTML = errorContent;
    } else {
      appElement.innerHTML = errorContent;
    }
  }

  async function withRetry(fn, options = { retries: 1, delay: 500 }) {
    try {
      return await fn();
    } catch (err) {
      if (options.retries <= 0) throw err;
      await new Promise(resolve => setTimeout(resolve, options.delay));
      return withRetry(fn, { ...options, retries: options.retries - 1 });
    }
  }
});
