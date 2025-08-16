class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.token = config.token;
    this.owner = config.owner || 'deyaaelmasry1';
    this.repo = config.repo || 'Iptv';
    this.baseUrl = 'https://api.github.com';
    this.postsUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts`;
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
