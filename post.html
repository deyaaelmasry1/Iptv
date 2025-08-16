class ThemeManager {
  constructor() {
    this.templates = {};
    this.themePath = '/themes/default/';
  }

  async loadTemplates() {
    try {
      // Load all required templates
      const templatesToLoad = ['header', 'footer'];
      const templatePromises = templatesToLoad.map(name => 
        fetch(`${this.themePath}${name}.html`)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${name} template`);
            return response.text();
          })
      );

      const [header, footer] = await Promise.all(templatePromises);
      
      this.templates = {
        header,
        footer
      };
    } catch (error) {
      console.error("Theme loading failed:", error);
      // Fallback templates
      this.templates = {
        header: '<header class="bg-white shadow-sm py-4"><div class="container mx-auto px-4">Header failed to load</div></header>',
        footer: '<footer class="bg-gray-100 py-6 mt-8"><div class="container mx-auto px-4 text-center">Footer failed to load</div></footer>'
      };
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
