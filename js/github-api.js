class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = config.repo || 'Iptv';
    this.owner = config.owner || 'deyaaelmasry1';
    this.branch = config.branch || 'main';
    this.token = config.token;
    this.baseUrl = 'https://api.github.com';
    this.defaultHeaders = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  // Improved base64 encoding that handles Unicode properly
  encodeBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
      (match, p1) => String.fromCharCode(parseInt(p1, 16))
    );
  }

  // Validate required fields and token
  validateRequest() {
    if (!this.token) {
      throw new Error('GitHub token is required - please configure the CMS first');
    }
  }

  // Create a new blog post
  async createPost(title, content, options = {}) {
    try {
      // Input validation
      if (!title?.trim() || !content?.trim()) {
        throw new Error('Both title and content are required');
      }
      this.validateRequest();

      // Generate filename with date prefix and cleaned title
      const date = new Date().toISOString().split('T')[0];
      const cleanTitle = title.toLowerCase()
        .replace(/[^\w\u0600-\u06FF]+/g, '-')  // Supports Arabic characters
        .replace(/(^-|-$)/g, '');
      const filename = `posts/${date}-${cleanTitle}.md`;
      const commitMessage = options.commitMessage || `Add post: ${title}`;

      // Create file on GitHub
      const response = await this.githubRequest(
        `PUT`,
        `/repos/${this.owner}/${this.repo}/contents/${filename}`,
        {
          message: commitMessage,
          content: this.encodeBase64(content),
          branch: this.branch
        }
      );

      // Optional: Trigger index update workflow
      if (options.triggerWorkflow !== false) {
        this.triggerWorkflow('update_posts.yml').catch(console.warn);
      }

      return {
        success: true,
        filename,
        url: `https://${this.owner}.github.io/${this.repo}/post/${cleanTitle}.html`,
        editUrl: `https://github.com/${this.owner}/${this.repo}/edit/${this.branch}/${filename}`,
        sha: response.content.sha
      };

    } catch (error) {
      console.error('Post creation failed:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  }

  // Get list of posts from index.json
  async getPosts() {
    try {
      const response = await this.githubRequest(
        'GET',
        `/repos/${this.owner}/${this.repo}/contents/posts/index.json`,
        null,
        { headers: { 'If-None-Match': '' } }  // Bypass cache
      );

      // Decode and parse the content
      const content = atob(response.content.replace(/\s/g, ''));
      return JSON.parse(content);

    } catch (error) {
      if (error.status === 404) {
        console.warn('posts/index.json not found - returning empty array');
        return [];
      }
      throw new Error('Failed to load posts: ' + error.message);
    }
  }

  // Generic GitHub API request handler
  async githubRequest(method, endpoint, body, options = {}) {
    this.validateRequest();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `GitHub API error: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  // Trigger GitHub Actions workflow
  async triggerWorkflow(workflowFile) {
    return this.githubRequest(
      'POST',
      `/repos/${this.owner}/${this.repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        ref: this.branch
      }
    );
  }

  // Utility method to get post content
  async getPostContent(filename) {
    try {
      const response = await this.githubRequest(
        'GET',
        `/repos/${this.owner}/${this.repo}/contents/posts/${filename}`
      );
      return atob(response.content.replace(/\s/g, ''));
    } catch (error) {
      throw new Error(`Failed to load post: ${error.message}`);
    }
  }
}
