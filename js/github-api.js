class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = config.repo || 'Iptv';
    this.owner = config.owner || 'deyaaelmasry1';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async createPost(title, content) {
    if (!this.token) throw new Error('No GitHub token found');
    
    const filename = `posts/${new Date().toISOString().split('T')[0]}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    const message = `Add new post: ${title}`;
    
    const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content)))
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create post');
    }
    
    return await response.json();
  }
}
