class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.token = config.token;
    this.owner = config.owner || 'deyaaelmasry1';
    this.repo = config.repo || 'Iptv';
    this.baseUrl = 'https://api.github.com';
    this.postsUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts`;
    this.templatesUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/templates`;
  }

  async createPost(title, content) {
    if (!this.token) throw new Error('GitHub token not configured');
    
    const date = new Date().toISOString().split('T')[0];
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${date}-${slug}.md`;

    const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `Add post: ${title}`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }

    await this.triggerWorkflow('update-posts-index.yml');

    return {
      success: true,
      url: `/${this.repo}/post/${date}-${slug}.html`,
      editUrl: `https://github.com/${this.owner}/${this.repo}/edit/main/${filename}`
    };
  }

  async getPosts() {
    try {
      const response = await fetch(`${this.postsUrl}/index.json?t=${Date.now()}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return [];
    }
  }

  async getPost(slug) {
    try {
      const response = await fetch(`${this.postsUrl}/${slug}.md?t=${Date.now()}`);
      if (!response.ok) return null;
      const content = await response.text();
      return { slug, content };
    } catch (error) {
      console.error('Failed to fetch post:', error);
      return null;
    }
  }

  async getFullPost(slug) {
    try {
      // Get the post content
      const postResponse = await this.getPost(slug);
      if (!postResponse) return null;
      
      // Get templates
      const [header, footer] = await Promise.all([
        this.fetchTemplate('header.html'),
        this.fetchTemplate('footer.html')
      ]);
      
      // Convert markdown to HTML
      const htmlContent = this.markdownToHtml(postResponse.content);
      
      // Create full page HTML
      const title = slug.replace(/-/g, ' ').replace(/\d{4}-\d{2}-\d{2}/, '').trim();
      
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link rel="stylesheet" href="/css/main.css">
        </head>
        <body>
          ${header || '<header>Default Header</header>'}
          <main class="post-container">
            <article class="post-content">
              ${htmlContent}
            </article>
          </main>
          ${footer || '<footer>Default Footer</footer>'}
        </body>
        </html>
      `;
    } catch (error) {
      console.error('Failed to generate full post:', error);
      return null;
    }
  }

  async fetchTemplate(templateName) {
    try {
      const response = await fetch(`${this.templatesUrl}/${templateName}?t=${Date.now()}`);
      if (!response.ok) return '';
      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch template ${templateName}:`, error);
      return '';
    }
  }

  markdownToHtml(markdown) {
    // Simple markdown to HTML conversion (consider using a library like marked.js for full support)
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\s*-\s(.*$)/gm, '<li>$1</li>')
      .replace(/<li>.*<\/li>/g, '<ul>$&</ul>');
  }

  async triggerWorkflow(workflowFile) {
    try {
      await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflowFile}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({ ref: 'main' })
        }
      );
    } catch (error) {
      console.warn('Workflow trigger failed:', error);
    }
  }
}
