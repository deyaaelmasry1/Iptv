class ThemeManager {
  constructor(themeName = 'default') {
    this.templates = {};
    this.themePath = `/themes/${themeName}/`;
    this.postsPath = '/posts/';
  }

  async loadTemplates() {
    try {
      // Load all required templates (now including post template)
      const templatesToLoad = ['header', 'footer', 'post'];
      const templatePromises = templatesToLoad.map(name => 
        fetch(`${this.themePath}${name}.html`)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${name} template`);
            return response.text();
          })
      );

      const [header, footer, post] = await Promise.all(templatePromises);
      
      this.templates = {
        header,
        footer,
        post
      };
    } catch (error) {
      console.error("Theme loading failed:", error);
      // Fallback templates
      this.templates = {
        header: '<header class="bg-white shadow-sm py-4"><div class="container mx-auto px-4">Header failed to load</div></header>',
        footer: '<footer class="bg-gray-100 py-6 mt-8"><div class="container mx-auto px-4 text-center">Footer failed to load</div></footer>',
        post: '<article class="post"><h1>{{title}}</h1><time>{{date}}</time><div class="content">{{content}}</div></article>'
      };
    }
  }

  async loadPost(slug, containerId) {
    try {
      // First ensure templates are loaded
      if (!this.templates.post) {
        await this.loadTemplates();
      }

      // Fetch post data
      const response = await fetch(`${this.postsPath}${slug}.json`);
      if (!response.ok) throw new Error('Post not found');
      const post = await response.json();

      // Render post using template
      const html = this.templates.post
        .replace('{{title}}', post.title)
        .replace('{{date}}', post.date)
        .replace('{{content}}', post.content);

      // Insert into container
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
      } else {
        console.error(`Container ${containerId} not found`);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `<div class="error">Failed to load post: ${err.message}</div>`;
      }
    }
  }

  applyTemplate(name, containerId) {
    if (!this.templates[name]) {
      console.error(`Template ${name} not loaded`);
      return;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = this.templates[name];
    } else {
      console.error(`Container ${containerId} not found`);
    }
  }
}
