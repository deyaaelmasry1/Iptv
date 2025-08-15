class ThemeManager {
  constructor(themeName = 'default') {
    this.themeName = themeName;
    this.templates = {};
  }

  async loadTemplates() {
    const templates = ['header', 'footer', 'home', 'post'];
    
    try {
      await Promise.all(templates.map(async (template) => {
        const response = await fetch(`/themes/${this.themeName}/${template}.html`);
        if (!response.ok) throw new Error(`Failed to load ${template} template`);
        this.templates[template] = await response.text();
      }));
      
      // Load theme CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/themes/${this.themeName}/style.css`;
      document.head.appendChild(link);
      
      return true;
    } catch (error) {
      console.error('Error loading theme:', error);
      return false;
    }
  }

  applyTemplate(templateName, containerId = 'app') {
    const container = document.getElementById(containerId) || document.querySelector('body');
    if (container && this.templates[templateName]) {
      container.innerHTML = this.templates[templateName];
    }
  }

  async renderFullPage(pageType, contentCallback) {
    try {
      const loaded = await this.loadTemplates();
      if (!loaded) throw new Error('Theme failed to load');
      
      // Create basic page structure
      document.body.innerHTML = `
        <div id="header-container"></div>
        <div id="main-container"></div>
        <div id="footer-container"></div>
      `;
      
      // Insert templates
      this.applyTemplate('header', 'header-container');
      this.applyTemplate(pageType, 'main-container');
      this.applyTemplate('footer', 'footer-container');
      
      // Call content-specific rendering
      if (contentCallback) {
        await contentCallback();
      }
    } catch (error) {
      document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-red-50 border-l-4 border-red-500 p-4 max-w-md">
            <p class="text-red-700">Error loading theme: ${error.message}</p>
            <a href="/" class="mt-2 inline-block text-blue-600 hover:underline">Return to homepage</a>
          </div>
        </div>
      `;
    }
  }
}
