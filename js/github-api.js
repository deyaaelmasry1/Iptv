class GitHubCMS {
  constructor() {
    const config = JSON.parse(localStorage.getItem('github-cms-config')) || {};
    this.repo = config.repo || 'Iptv';
    this.owner = config.owner || 'deyaaelmasry1';
    this.baseUrl = 'https://api.github.com';
  }

  // Add this critical method
  async getPosts() {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/posts/index.json`
      );
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Failed to load posts:', error);
      return []; // Return empty array instead of failing
    }
  }
}
