class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = 'Iptv'; // Hardcoded for your repo
    this.owner = 'deyaaelmasry1'; // Hardcoded for your account
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
  }

  async createPost(title, content) {
    if (!this.token) {
      alert('❌ Please complete setup first');
      window.location.href = '/Iptv/setup.html';
      return;
    }

    // Clean filename format
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${new Date().toISOString().split('T')[0]}-${cleanTitle}.md`;

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
        throw new Error(error.message || 'GitHub API error');
      }

      // Trigger index update
      await this.triggerIndexUpdate();
      return await response.json();

    } catch (error) {
      console.error('Post creation failed:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async triggerIndexUpdate() {
    try {
      await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/actions/workflows/update_posts.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          ref: 'main'
        })
      });
    } catch (e) {
      console.log('Index update trigger failed (normal for first run)', e);
    }
  }

  async getPosts() {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json?t=${Date.now()}`,
        { cache: 'no-store' }
      );
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to load posts:', error);
      return [];
    }
  }
}
