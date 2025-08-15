class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config') || '{}');
    this.repo = config.repo || window.location.pathname.split('/')[1] || 'my-blog';
    this.owner = config.owner || window.location.pathname.split('/')[1] || 'your-username';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async getPosts() {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const posts = await response.json();
      return posts.map(post => {
        return {
          slug: post.replace('.md', ''),
          title: post.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '').replace(/-/g, ' '),
          date: new Date(post.split('-').slice(0, 3).join('-'))
        };
      });
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }

  async createPost(title, content) {
    if (!this.token) throw new Error('Authentication required');
    
    const filename = `posts/${new Date().toISOString().split('T')[0]}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    const message = `Add new post: ${title}`;
    
    const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${this.token}` },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content)))
      })
    });
    
    if (!response.ok) throw new Error('Failed to create post');
    return await response.json();
  }
}
