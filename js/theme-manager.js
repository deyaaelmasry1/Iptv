class ThemeManager {
  constructor(themeName = 'default') {
    this.themePath = `/themes/${themeName}/`;
    this.templates = {};
    this.initialized = false;
    this.marked = window.marked || null;
    this.DOMPurify = window.DOMPurify || null;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Load essential templates (header, footer) and optional post template
      const templates = ['header', 'footer', 'post'];
      const requests = templates.map(template => 
        fetch(`${this.themePath}${template}.html`)
          .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${template}`))
          .catch(() => null) // Allow individual templates to fail
      );

      const [header, footer, post] = await Promise.all(requests);
      
      this.templates = { 
        header: header || this.getDefaultHeader(),
        footer: footer || this.getDefaultFooter(),
        post: post || null // We'll handle post template specially
      };
      this.initialized = true;
    } catch (error) {
      console.error('Theme initialization failed:', error);
      this.templates = {
        header: this.getDefaultHeader(),
        footer: this.getDefaultFooter(),
        post: null
      };
    }
  }

  getDefaultHeader() {
    return `
      <header class="bg-white shadow-sm py-4 dark:bg-gray-800">
        <div class="container mx-auto px-4">
          <nav class="flex justify-between items-center">
            <a href="/" class="text-xl font-bold text-gray-800 dark:text-white">My Blog</a>
            <div class="flex space-x-4">
              <a href="/" class="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">Home</a>
              <a href="/admin/" class="text-blue-600 hover:text-blue-800 dark:text-blue-400">Admin</a>
            </div>
          </nav>
        </div>
      </header>
    `;
  }

  getDefaultFooter() {
    return `
      <footer class="bg-gray-100 py-6 mt-8 dark:bg-gray-800">
        <div class="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
          <p>© ${new Date().getFullYear()} My Blog. All rights reserved.</p>
        </div>
      </footer>
    `;
  }

  async applyTemplate(name, containerId) {
    await this.init();
    const container = document.getElementById(containerId);
    if (container && this.templates[name]) {
      container.innerHTML = this.templates[name];
    }
  }

  async renderPost(postData, containerId) {
    await this.init();
    const container = document.getElementById(containerId);
    if (!container) return;

    // Process content (markdown to HTML)
    let contentHtml = postData.content || '';
    if (this.marked) {
      contentHtml = this.marked.parse(contentHtml);
    }
    if (this.DOMPurify) {
      contentHtml = this.DOMPurify.sanitize(contentHtml);
    }

    // Format date
    const formattedDate = postData.date ? 
      new Date(postData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '';

    // Use theme's post template if available, otherwise fallback
    if (this.templates.post) {
      const html = this.templates.post
        .replace('{{title}}', postData.title)
        .replace('{{date}}', formattedDate)
        .replace('{{content}}', contentHtml);
      container.innerHTML = html;
    } else {
      container.innerHTML = this.renderDefaultPost(postData, contentHtml, formattedDate);
    }

    // Update page title
    if (postData.title) {
      document.title = `${postData.title} | My Blog`;
    }
  }

  renderDefaultPost(postData, contentHtml = '', formattedDate = '') {
    if (!contentHtml && postData.content) {
      contentHtml = this.marked ? this.marked.parse(postData.content) : postData.content;
      if (this.DOMPurify) {
        contentHtml = this.DOMPurify.sanitize(contentHtml);
      }
    }

    return `
      <article class="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700 dark:text-gray-200">
        ${formattedDate ? `
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <i class="far fa-calendar mr-2"></i>
            <time datetime="${postData.date}">${formattedDate}</time>
          </div>
        ` : ''}
        <h1 class="text-3xl font-bold mb-6">${postData.title}</h1>
        <div class="prose max-w-none dark:prose-dark">
          ${contentHtml}
        </div>
      </article>
    `;
  }
}
