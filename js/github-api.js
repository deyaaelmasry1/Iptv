class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = 'Iptv'; // اسم المستودع
    this.owner = 'deyaaelmasry1'; // اسم المستخدم
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
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
          content: this.encodeBase64(content)
        })
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || 'Failed to create post file');
    }

    // Trigger workflow (optional)
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
    ).catch(() => console.warn('Workflow trigger failed'));

    return {
      success: true,
      filename,
      url: `https://${this.owner}.github.io/${this.repo}/${filename}`
    };
  }
}
