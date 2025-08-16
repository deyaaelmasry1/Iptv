class ThemeManager {
  constructor(themeName = 'default') {
    this.themePath = `/themes/${themeName}/`;
    this.templates = {};
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      const templates = ['header', 'footer', 'post'];
      const requests = templates.map(template => 
        fetch(`${this.themePath}${template}.html`)
          .then(res => res.ok ? res.text() : Promise.reject(`Failed to load ${template}`))
      );

      const [header, footer, post] = await Promise.all(requests);
      
      this.templates = { header, footer, post };
      this.initialized = true;
    } catch (error) {
      console.error('Theme initialization failed:', error);
      this.templates = {
        header: '<header class="bg-white shadow-sm py-4"><div class="container mx-auto px-4">Header</div></header>',
        footer: '<footer class="bg-gray-100 py-6 mt-8"><div class="container mx-auto px-4 text-center">Footer</div></footer>',
        post: '<article class="post"><h1>{{title}}</h1><time>{{date}}</time><div class="content">{{content}}</div></article>'
      };
    }
  }

  async applyTemplate(name, containerId) {
    await this.init();
    const container = document.getElementById(containerId);
    if (container && this.templates[name]) {
      container.innerHTML = this.templates[name];
    }
  }

  async renderPost(postData, containerId) {
    await this.init();
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this.templates.post) {
      container.innerHTML = this.renderDefaultPost(postData);
      return;
    }

    const html = this.templates.post
      .replace('{{title}}', postData.title)
      .replace('{{date}}', postData.date)
      .replace('{{content}}', postData.content);
    
    container.innerHTML = html;
  }

  renderDefaultPost(postData) {
    return `
      <article class="bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold mb-4">${postData.title}</h1>
        ${postData.date ? `<div class="text-gray-500 mb-4">${new Date(postData.date).toLocaleDateString()}</div>` : ''}
        <div class="prose max-w-none">${postData.content}</div>
      </article>
    `;
  }
}
