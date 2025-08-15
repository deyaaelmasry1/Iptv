class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = 'Iptv';
    this.owner = 'deyaaelmasry1';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async createPost(title, content) {
    if (!title?.trim() || !content?.trim()) {
      throw new Error('Title and content are required');
    }
    if (!this.token) {
      throw new Error('Missing GitHub token - complete setup first');
    }

    const date = new Date().toISOString().split('T')[0];
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${date}-${cleanTitle}.md`;

    // Step 1: Create the post
    const createResponse = await fetch(
      `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add post: ${title}`,
          content: btoa(unescape(encodeURIComponent(content)))
        })
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || 'Failed to create post file');
    }

    // Step 2: Trigger index update
    await fetch(
      `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/update_posts.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ ref: 'main' })
      }
    ).catch(() => console.warn('Index update workflow may not exist yet'));

    return {
      success: true,
      filename,
      url: `https://github.com/${this.owner}/${this.repo}/blob/main/${filename}`
    };
  }

  async getPosts() {
    const response = await fetch(
      `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json?t=${Date.now()}`
    );
    if (!response.ok) throw new Error('Failed to load index.json');
    return await response.json();
  }
}
