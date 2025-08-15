class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.owner = 'deyaaelmasry1';         // <-- your GitHub username
    this.repo  = 'Iptv';                   // <-- your repo name
    this.token = config.token || '';       // PAT stored locally (not committed)
    this.baseUrl = 'https://api.github.com';
    this.branch  = 'main';
  }

  setToken(token) {
    this.token = token || '';
    const cfg = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    cfg.token = this.token;
    localStorage.setItem('github-cms-config', JSON.stringify(cfg));
  }

  encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  // Create a new Markdown post under posts/YYYY-MM-DD-slug.md
  async createPost(title, content) {
    if (!title?.trim() || !content?.trim()) throw new Error('Title and content are required');
    if (!this.token) throw new Error('Missing GitHub token - open Setup and save your token first');

    const date = new Date().toISOString().split('T')[0];
    const cleanTitle = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `posts/${date}-${cleanTitle}.md`;

    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filename}`;
    const res = await fetch(url, {
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
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error (${res.status})`);
    }

    // Try to trigger index workflow (optional)
    fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/update_posts.yml/dispatches`, {
      method: 'POST',
      headers: { 'Authorization': `token ${this.token}`, 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({ ref: this.branch })
    }).catch(() => console.warn('Workflow dispatch failed (ok if not configured yet).'));

    return {
      success: true,
      filename,
      url: `https://${this.owner}.github.io/${this.repo}/${filename}`
    };
  }

  // Load the generated posts index (array of filenames)
  async getPosts() {
    const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/posts/index.json?t=${Date.now()}`;
    const res = await fetch(rawUrl);
    if (!res.ok) return [];
    return res.json();
  }

  // Fetch raw Markdown content for a given filename (e.g. 2025-08-15-hello.md)
  async getPostContent(filename) {
    if (!/\.md$/i.test(filename)) filename += '.md';
    const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/posts/${filename}?t=${Date.now()}`;
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`Cannot load post (${res.status})`);
    return res.text();
  }

  // Helper to parse slug from a path like /post/2025-08-15-hello.html
  static slugFromPath(pathname) {
    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.toLowerCase().endsWith('.html') ? last.replace(/\.html$/i, '') : '';
  }

  // Helpers for display
  static titleFromFilename(file) {
    return file
      .replace(/^\d{4}-\d{2}-\d{2}-/, '')
      .replace(/\.md$/i, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, m => m.toUpperCase());
  }

  static dateFromFilename(file) {
    const m = file.match(/^(\d{4}-\d{2}-\d{2})-/);
    return m ? m[1] : '';
  }
}
