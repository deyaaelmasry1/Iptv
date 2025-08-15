class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = 'Iptv';
    this.owner = 'deyaaelmasry1';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async createPost(title, content) {
    // Validate inputs
    if (!title?.trim() || !content?.trim()) {
      throw new Error('Title and content are required');
    }

    if (!this.token) {
      throw new Error('Missing GitHub token - complete setup first');
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${date}-${cleanTitle}.md`;

    try {
      // 1. Create the post file
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

      // 2. Trigger index update
      const workflowResponse = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/update_posts.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({ ref: 'main' })
        }
      );

      if (!workflowResponse.ok) {
        console.warn('Failed to trigger index update (normal for first post)');
      }

      return {
        success: true,
        filename: filename,
        url: `https://github.com/${this.owner}/${this.repo}/blob/main/${filename}`
      };

    } catch (error) {
      console.error('Post creation failed:', error);
      throw new Error(`Post creation failed: ${error.message}`);
    }
  }
}
