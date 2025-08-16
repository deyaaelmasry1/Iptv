class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.token = config.token;
    this.owner = config.owner || 'deyaaelmasry1';
    this.repo = config.repo || 'Iptv';
    this.baseUrl = 'https://api.github.com';
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

    // Trigger index.json update
    await this.triggerWorkflow('generate-posts-json.yml');

    return {
      success: true,
      url: `/${this.repo}/post/${filename.replace('.md', '.html')}`,
      editUrl: `https://github.com/${this.owner}/${this.repo}/edit/main/${filename}`
    };
  }

  async getPosts() {
    const response = await fetch(
      `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json?t=${Date.now()}`
    );
    return response.ok ? response.json() : [];
  }

  async triggerWorkflow(workflowFile) {
    return fetch(
      `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ ref: 'main' })
      }
    ).catch(console.warn); // Silent fail if workflow trigger fails
  }
}
