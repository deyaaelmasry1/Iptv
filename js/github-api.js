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
      throw new Error('Missing GitHub token - please complete setup');
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const cleanTitle = title.toLowerCase()
      .replace(/[^\w]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${date}-${cleanTitle}.md`;

    try {
      console.log('Attempting to create post:', filename); // Debug log
      
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`, {
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
      });

      console.log('GitHub API response:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub API error:', errorData); // Debug log
        throw new Error(errorData.message || 'Failed to create post');
      }

      const result = await response.json();
      console.log('Post created successfully:', result); // Debug log
      
      return {
        success: true,
        filename: filename,
        url: `https://github.com/${this.owner}/${this.repo}/blob/main/${filename}`
      };

    } catch (error) {
      console.error('Full error details:', error); // Debug log
      throw new Error(`Post creation failed: ${error.message}`);
    }
  }
}
