class ThemeManager {
  constructor(themeName = 'default') {
    this.themeName = themeName;
    this.templates = {};
    this.styleElement = null;
    this.cacheKey = `theme-${themeName}-cache`;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours cache
  }

  async loadTemplates() {
    const templates = ['header', 'footer', 'home', 'post', 'sidebar'];
    
    try {
      // Check cache first
      const cached = this._getCachedTemplates();
      if (cached) {
        this.templates = cached;
        return true;
      }

      // Load fresh templates
      await Promise.all(templates.map(async (template) => {
        const response = await fetch(`/themes/${this.themeName}/${template}.html?_=${Date.now()}`);
        if (!response.ok) {
          if (response.status === 404 && template === 'sidebar') return; // Skip optional templates
          throw new Error(`Failed to load ${template} template (${response.status})`);
        }
        this.templates[template] = await response.text();
      }));

      // Cache the templates
      this._cacheTemplates();
      
      // Load theme CSS with cache busting
      await this._loadThemeCSS();
      
      return true;
    } catch (error) {
      console.error('Theme loading error:', error);
      this._fallbackToDefaultTheme();
      return false;
    }
  }

  async _loadThemeCSS() {
    // Remove existing theme CSS if any
    if (this.styleElement) {
      this.styleElement.remove();
    }

    this.styleElement = document.createElement('link');
    this.styleElement.rel = 'stylesheet';
    this.styleElement.href = `/themes/${this.themeName}/style.css?_=${Date.now()}`;
    this.styleElement.onerror = () => {
      console.warn(`Theme CSS not found for ${this.themeName}, using default styles`);
    };
    document.head.appendChild(this.styleElement);
  }

  _getCachedTemplates() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const { timestamp, templates } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheExpiry) return null;
      
      return templates;
    } catch {
      return null;
    }
  }

  _cacheTemplates() {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        timestamp: Date.now(),
        templates: this.templates
      }));
    } catch (error) {
      console.warn('Failed to cache templates:', error);
    }
  }

  _fallbackToDefaultTheme() {
    console.warn('Falling back to default theme');
    this.themeName = 'default';
    this.templates = {};
    return this.loadTemplates();
  }

  applyTemplate(templateName, containerId, context = {}) {
    const container = containerId ? 
      document.getElementById(containerId) : 
      document.querySelector('main') || document.body;

    if (!container) {
      console.error(`Container not found for template: ${templateName}`);
      return false;
    }

    if (!this.templates[templateName]) {
      console.error(`Template not loaded: ${templateName}`);
      return false;
    }

    try {
      // Simple template rendering with variable replacement
      let renderedContent = this.templates[templateName];
      Object.entries(context).forEach(([key, value]) => {
        renderedContent = renderedContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
      });

      container.innerHTML = renderedContent;
      this._executeScripts(container);
      return true;
    } catch (error) {
      console.error(`Error applying template ${templateName}:`, error);
      return false;
    }
  }

  _executeScripts(container) {
    container.querySelectorAll('script').forEach(script => {
      const newScript = document.createElement('script');
      newScript.text = script.text;
      [...script.attributes].forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      script.parentNode.replaceChild(newScript, script);
    });
  }

  async renderPage(pageType, context = {}, contentCallback) {
    try {
      const loaded = await this.loadTemplates();
      if (!loaded) throw new Error('Theme failed to load');

      // Create basic page structure if not exists
      if (!document.getElementById('theme-header')) {
        document.body.innerHTML = `
          <div id="theme-header"></div>
          <main id="theme-content"></main>
          <div id="theme-footer"></div>
        `;
      }

      // Apply templates with context data
      this.applyTemplate('header', 'theme-header', context);
      this.applyTemplate(pageType, 'theme-content', context);
      this.applyTemplate('footer', 'theme-footer', context);

      // Handle dynamic content
      if (contentCallback) {
        await contentCallback();
      }

      // Dispatch event for theme-loaded
      document.dispatchEvent(new CustomEvent('theme-loaded', {
        detail: { theme: this.themeName, pageType }
      }));

    } catch (error) {
      console.error('Page rendering failed:', error);
      this._showErrorUI(error);
      return false;
    }
    return true;
  }

  _showErrorUI(error) {
    document.body.innerHTML = `
      <div class="theme-error">
        <h1>Theme Error</h1>
        <p>${error.message}</p>
        <button id="reload-button">Try Again</button>
        <a href="/">Return Home</a>
      </div>
    `;
    
    document.getElementById('reload-button')?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Theme switching
  async switchTheme(newThemeName) {
    if (newThemeName === this.themeName) return true;
    
    try {
      // Clear current theme
      if (this.styleElement) {
        this.styleElement.remove();
      }
      
      // Clear cache for old theme
      localStorage.removeItem(this.cacheKey);
      
      // Load new theme
      this.themeName = newThemeName;
      this.cacheKey = `theme-${newThemeName}-cache`;
      return await this.loadTemplates();
    } catch (error) {
      console.error('Theme switch failed:', error);
      return false;
    }
  }
}
