class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = 'Iptv';
    this.owner = 'deyaaelmasry1';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async createPost(title, content) {
    if (!this.token) {
      throw new Error('Authentication required. Please complete setup.');
    }

    // Generate filename with date and sanitized title
    const dateStr = new Date().toISOString().split('T')[0];
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${dateStr}-${cleanTitle}.md`;

    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Add post: ${title}`,
          content: btoa(unescape(encodeURIComponent(content)))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      const result = await response.json();
      
      // Return enhanced response
      return {
        success: true,
        content: {
          path: filename,
          url: `${window.location.origin}/Iptv/post/${filename.replace('.md', '.html')}`,
          githubUrl: result.content.html_url
        },
        message: 'Post created successfully'
      };

    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`Post creation failed: ${error.message}`);
    }
  }
}
