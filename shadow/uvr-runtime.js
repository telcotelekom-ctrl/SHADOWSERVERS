export class UniversalVisualRuntime {
  constructor(vosDocument = {}) {
    this.doc = vosDocument;
    this.objects = new Map();
    this.rules = [];
    this.hardware = this.detectHardware();
    this.renderer = this.selectRenderer();
    this.activeContainer = null;
    this.activeSceneId = null;
    this.lastShownObjectId = null;
  }

  detectHardware() {
    const globalScope = typeof globalThis !== 'undefined' ? globalThis : {};
    return {
      cpu: 'generic',
      gpu: Boolean(globalScope.WebGLRenderingContext),
      ram: 'unknown',
      monitor: Boolean(globalScope.window),
      touch: Boolean(globalScope.window && 'ontouchstart' in globalScope.window),
      mouse: true,
      keyboard: true,
      network: Boolean(globalScope.fetch),
      battery: 'unknown',
      storage: 'generic'
    };
  }

  selectRenderer() {
    const hasDom = typeof document !== 'undefined' && typeof document.createElement === 'function';
    const hasNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
    if (hasDom) {
      return 'html';
    }
    if (hasNode) {
      return 'text';
    }
    return 'text';
  }

  loadFromManifest(vosDocumentOrJson) {
    if (typeof vosDocumentOrJson === 'string') {
      try {
        this.doc = JSON.parse(vosDocumentOrJson);
      } catch (error) {
        this.doc = createUvrManifest();
      }
    } else {
      this.doc = vosDocumentOrJson || {};
    }
    return this.load();
  }

  load() {
    this.objects = new Map((this.doc.objects || []).map((object) => [object.id, object]));
    this.rules = Array.isArray(this.doc.rules) ? this.doc.rules : [];
    return this;
  }

  detect() {
    return this.hardware;
  }

  render(container, sceneId) {
    if (!container) return null;
    this.activeContainer = container;
    if (this.renderer === 'text') {
      return this.renderText(container, sceneId);
    }
    const scenes = Array.isArray(this.doc.scenes) ? this.doc.scenes : [];
    const activeScene = scenes.find((scene) => scene.id === sceneId) || scenes[0];
    if (!activeScene) {
      container.innerHTML = '<div class="uvr-empty">No scene available.</div>';
      return null;
    }

    this.activeSceneId = activeScene.id;
    container.innerHTML = '';

    const shell = document.createElement('div');
    shell.className = 'uvr-scene';

    const title = document.createElement('div');
    title.className = 'uvr-scene-title';
    title.textContent = activeScene.id;
    shell.appendChild(title);

    const objectGrid = document.createElement('div');
    objectGrid.className = 'uvr-scene-object-grid';

    (activeScene.objects || []).forEach((objectId) => {
      const object = this.objects.get(objectId);
      if (!object) return;
      const element = this.renderObjectToHTML(object);
      if (element) {
        objectGrid.appendChild(element);
      }
    });

    shell.appendChild(objectGrid);

    const status = document.createElement('div');
    status.className = 'uvr-scene-status';
    status.textContent = this.lastShownObjectId
      ? `Activated object: ${this.lastShownObjectId}`
      : 'No object activated yet. Click a menu item or object to trigger a rule.';
    shell.appendChild(status);

    container.appendChild(shell);
    return shell;
  }

  renderText(container, sceneId) {
    const scenes = Array.isArray(this.doc.scenes) ? this.doc.scenes : [];
    const activeScene = scenes.find((scene) => scene.id === sceneId) || scenes[0];
    const lines = [
      `UVR • ${this.doc.manifest?.name || 'Universal Visual Runtime'}`,
      `Renderer: ${this.renderer}`,
      `Scene: ${activeScene?.id || 'default'}`
    ];

    (activeScene?.objects || []).forEach((objectId) => {
      const object = this.objects.get(objectId);
      if (!object) return;
      lines.push(`- ${object.id}: ${object.type}`);
    });

    container.textContent = lines.join('\n');
    return container;
  }

  renderObjectToHTML(object) {
    let element;

    switch (object.type) {
      case 'Image':
        element = document.createElement('div');
        element.className = 'uvr-object-card uvr-image-card';
        const image = document.createElement('img');
        image.alt = object.id;
        image.src = object.src || 'assets/uvr-logo.svg';
        image.loading = 'lazy';
        element.appendChild(image);
        break;
      case 'Menu':
        element = document.createElement('nav');
        element.className = 'uvr-object-card uvr-menu-card';
        const menuLabel = document.createElement('strong');
        menuLabel.textContent = object.id;
        element.appendChild(menuLabel);
        const menuList = document.createElement('div');
        menuList.className = 'uvr-menu-list';
        (object.items || []).forEach((item) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = item.label;
          button.className = 'uvr-menu-button';
          button.addEventListener('click', () => this.handleAction(item.action));
          menuList.appendChild(button);
        });
        element.appendChild(menuList);
        break;
      case 'Window':
        element = document.createElement('section');
        element.className = 'uvr-object-card uvr-window-card';
        element.innerHTML = `<strong>${object.id}</strong><p>Scene: ${object.scene || 'default'}</p>`;
        break;
      case 'Text':
        element = document.createElement('div');
        element.className = 'uvr-object-card';
        element.textContent = object.content || object.id;
        break;
      case 'RichText':
        element = document.createElement('article');
        element.className = 'uvr-object-card';
        element.innerHTML = `<strong>${object.id}</strong><p>${object.content || ''}</p>`;
        break;
      default:
        element = document.createElement('div');
        element.className = 'uvr-object-card';
        element.textContent = `[${object.type || 'Object'} ${object.id}]`;
    }

    this.applyRulesForObject(object, element);
    return element;
  }

  applyRulesForObject(object, element) {
    this.rules
      .filter((rule) => rule.target === object.id && rule.when === 'Render')
      .forEach((rule) => {
        if (rule.action === 'position') {
          element.style.position = 'relative';
          element.style.left = rule.params?.x || '0';
          element.style.top = rule.params?.y || '0';
        }
        if (rule.action === 'size') {
          element.style.minHeight = rule.params?.height || 'auto';
          element.style.minWidth = rule.params?.width || 'auto';
        }
      });

    this.rules
      .filter((rule) => rule.target === object.id && rule.when === 'Click')
      .forEach((rule) => {
        element.addEventListener('click', () => {
          if (rule.action === 'show') {
            this.showObject(rule.params?.object);
          }
        });
      });
  }

  handleAction(action) {
    if (!action) return;
    if (action.startsWith('open:')) {
      const objectId = action.slice(5);
      this.showObject(objectId);
    }
  }

  showObject(objectId) {
    const object = this.objects.get(objectId);
    if (!object) return;
    this.lastShownObjectId = objectId;
    if (this.activeContainer) {
      this.render(this.activeContainer, this.activeSceneId);
    }
  }

  animate() {
    return 'Animation layer ready';
  }

  connect() {
    return 'Network layer ready';
  }

  store() {
    return 'Storage layer ready';
  }

  compute() {
    return 'Compute layer ready';
  }

  present(container, sceneId) {
    return this.render(container, sceneId);
  }
}

export function createUvrManifest() {
  return {
    manifest: {
      id: 'myopenai.portal',
      name: 'MyOpenAI Portal',
      version: '1.0.0',
      permissions: ['render', 'network', 'storage', 'input']
    },
    hardware: {
      targets: ['desktop', 'mobile', 'tv', 'terminal', 'vr', 'legacy'],
      constraints: {
        min_ram_mb: 64,
        gpu_optional: true
      }
    },
    objects: [
      {
        id: 'logo',
        type: 'Image',
        src: 'assets/uvr-logo.svg',
        rules: ['center-top', 'click-open-menu']
      },
      {
        id: 'mainMenu',
        type: 'Menu',
        items: [
          { label: 'Portal', action: 'open:portalWindow' },
          { label: 'Jobs', action: 'open:jobsWindow' },
          { label: 'Developers', action: 'open:devHubWindow' }
        ]
      },
      {
        id: 'portalWindow',
        type: 'Window',
        scene: 'portalScene'
      },
      {
        id: 'jobsWindow',
        type: 'Window',
        scene: 'jobsScene'
      },
      {
        id: 'devHubWindow',
        type: 'Window',
        scene: 'devHubScene'
      },
      {
        id: 'heroText',
        type: 'Text',
        content: 'Universal Visual Runtime • one format, many surfaces'
      }
    ],
    rules: [
      {
        id: 'center-top',
        when: 'Render',
        target: 'logo',
        action: 'position',
        params: { x: '50%', y: '5%' }
      },
      {
        id: 'click-open-menu',
        when: 'Click',
        target: 'logo',
        action: 'show',
        params: { object: 'mainMenu' }
      }
    ],
    scenes: [
      {
        id: 'portalScene',
        objects: ['logo', 'mainMenu', 'heroText', 'portalWindow']
      }
    ],
    assets: [
      { id: 'logoAsset', type: 'svg', path: 'assets/uvr-logo.svg' }
    ]
  };
}

export function createUvrSummary(vosDocument, runtime) {
  return {
    manifestId: vosDocument.manifest?.id || 'unknown',
    objectCount: (vosDocument.objects || []).length,
    sceneCount: (vosDocument.scenes || []).length,
    ruleCount: (vosDocument.rules || []).length,
    renderer: runtime.renderer || 'html',
    hardware: runtime.detect()
  };
}

export function adaptWordPressToUVR(wpExportJson = {}) {
  const pages = Array.isArray(wpExportJson.pages) ? wpExportJson.pages : [];
  const objects = [];
  const scenes = [];

  pages.forEach((page, index) => {
    const sceneId = `scene_${index + 1}`;
    const titleId = `title_${index + 1}`;
    const contentId = `content_${index + 1}`;

    objects.push({ id: titleId, type: 'Text', content: page.title || `Page ${index + 1}` });
    objects.push({ id: contentId, type: 'RichText', content: page.content || 'Auto-adapted from WordPress export.' });

    scenes.push({ id: sceneId, objects: [titleId, contentId] });
  });

  return {
    manifest: {
      id: 'wp.site',
      name: wpExportJson.siteTitle || 'WP Site',
      version: '1.0.0',
      permissions: ['render', 'network']
    },
    objects,
    rules: [],
    scenes,
    assets: []
  };
}
