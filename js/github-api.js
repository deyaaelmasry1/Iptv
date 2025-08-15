class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = config.repo || 'Iptv';
    this.owner = config.owner || 'deyaaelmasry1';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  // Add this method to fetch posts
  async getPosts() {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json`
      );
      if (!response.ok) throw new Error('Failed to fetch posts');
      return await response.json();
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }

  // Keep your existing createPost() method
  async createPost(title, content) {
    const filename = `posts/${new Date().toISOString().split('T')[0]}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${this.token}` },
      body: JSON.stringify({
        message: `Add post: ${title}`,
        content: btoa(unescape(encodeURIComponent(content)))
      })
    });
    return await response.json();
  }
}
