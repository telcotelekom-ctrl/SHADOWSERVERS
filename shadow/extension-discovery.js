const MODULE_BLUEPRINTS = {
  'svg-editor': {
    layer: 'Visual Layer',
    hostStrategy: 'Local-first',
    requiredCapabilities: ['visual-runtime', 'animation'],
    summary: 'Visual layer support for expression, composition, and motion-ready authoring.',
    suggestions: [
      { id: 'animation-package', label: 'Animation Package', reason: 'Adds motion and scene timing support' },
      { id: 'webgpu-renderer', label: 'WebGPU Renderer', reason: 'Improves high-performance visual playback' },
      { id: 'version-control', label: 'Version Control', reason: 'Tracks edits and revisions' },
      { id: 'ai-explainer', label: 'AI Explainer', reason: 'Creates semantic descriptions for visual assets' }
    ]
  },
  'video-editor': {
    layer: 'Studio Layer',
    hostStrategy: 'Hybrid',
    requiredCapabilities: ['timeline-engine', 'studio-engine'],
    summary: 'Studio layer support for edit pipelines, exports, and creative production flows.',
    suggestions: [
      { id: 'export-pwa', label: 'PWA Export', reason: 'Publishes the project as a web app' },
      { id: 'video-rendering', label: 'Video Rendering', reason: 'Renders timeline projects to media' },
      { id: 'ai-assistant', label: 'AI Assistant', reason: 'Supports editing and narration suggestions' }
    ]
  },
  'knowledge-graph': {
    layer: 'Knowledge Layer',
    hostStrategy: 'Cloud-assisted',
    requiredCapabilities: ['knowledge-engine', 'semantic-engine'],
    summary: 'Knowledge layer support for semantic mapping, graph traversal, and auto-tagging.',
    suggestions: [
      { id: 'graph-visualizer', label: 'Graph Visualizer', reason: 'Shows semantic relationships in a canvas' },
      { id: 'auto-tagging', label: 'Auto Tagging', reason: 'Classifies knowledge objects' },
      { id: 'search-index', label: 'Search Index', reason: 'Accelerates semantic search' }
    ]
  },
  'identity': {
    layer: 'Identity Layer',
    hostStrategy: 'Hybrid',
    requiredCapabilities: ['knowledge-engine', 'pwa-first'],
    summary: 'Identity layer anchors secure profiles, member access, and trust-driven handoffs.',
    suggestions: [
      { id: 'profile-hub', label: 'Profile Hub', reason: 'Creates a centralized member and role cockpit' },
      { id: 'trust-board', label: 'Trust Board', reason: 'Surfaces trust signals and audit posture' },
      { id: 'biometric-guard', label: 'Biometric Guard', reason: 'Strengthens secure identity verification' }
    ]
  },
  'knowledge': {
    layer: 'Knowledge Layer',
    hostStrategy: 'Hybrid',
    requiredCapabilities: ['knowledge-engine', 'semantic-engine'],
    summary: 'Knowledge layer turns shared context into actionable memory and retrieval.',
    suggestions: [
      { id: 'semantic-index', label: 'Semantic Index', reason: 'Accelerates retrieval and retrieval quality' },
      { id: 'ontology-lab', label: 'Ontology Lab', reason: 'Maps domain relationships for deeper reasoning' }
    ]
  },
  'workspace': {
    layer: 'Workspace Layer',
    hostStrategy: 'Local-first',
    requiredCapabilities: ['studio-engine', 'pwa-first'],
    summary: 'Workspace layer coordinates member projects, shared states, and task flows.',
    suggestions: [
      { id: 'project-cockpit', label: 'Project Cockpit', reason: 'Unifies task, invoice, and project views' },
      { id: 'collab-rooms', label: 'Collab Rooms', reason: 'Supports shared operations and review loops' }
    ]
  },
  'service': {
    layer: 'Service Layer',
    hostStrategy: 'Hybrid',
    requiredCapabilities: ['ai-engine', 'pwa-first'],
    summary: 'Service layer exposes automation, support flows, and operational handoffs.',
    suggestions: [
      { id: 'request-orchestrator', label: 'Request Orchestrator', reason: 'Routes requests to the correct service stream' },
      { id: 'ops-console', label: 'Ops Console', reason: 'Provides executive visibility into delivery states' }
    ]
  },
  'universe': {
    layer: 'Universe Layer',
    hostStrategy: 'Distributed',
    requiredCapabilities: ['visual-runtime', 'knowledge-engine', 'ai-engine'],
    summary: 'Universe layer scales the platform into a larger narrative and operating system.',
    suggestions: [
      { id: 'cosmos-hub', label: 'Cosmos Hub', reason: 'Builds a shared universe map for the platform' },
      { id: 'story-graph', label: 'Story Graph', reason: 'Connects campaigns, products, and experiences' }
    ]
  }
};

const LAYER_CATALOGUE = [
  'identity',
  'workspace',
  'knowledge',
  'visual-runtime',
  'service',
  'universe',
  'svg-editor',
  'video-editor'
];

function cloneSuggestions(suggestions = []) {
  return suggestions.map((suggestion) => ({ ...suggestion }));
}

export function createExtensionDiscoveryEngine(activeCapabilities = []) {
  const capabilitySet = new Set(activeCapabilities);

  function analyzeBlueprint(moduleId, blueprint) {
    const missingCapabilities = (blueprint.requiredCapabilities || []).filter((capability) => !capabilitySet.has(capability));
    const suggestions = cloneSuggestions(blueprint.suggestions || []);

    return {
      moduleId,
      layer: blueprint.layer || 'Runtime Layer',
      hostStrategy: blueprint.hostStrategy || 'Local-first',
      requiredCapabilities: blueprint.requiredCapabilities || [],
      missingCapabilities,
      suggestions,
      summary: blueprint.summary || `${moduleId} layer is ready for platform extension.`
    };
  }

  return {
    analyzeModule(moduleId) {
      const blueprint = MODULE_BLUEPRINTS[moduleId];
      if (!blueprint) {
        return {
          moduleId,
          layer: 'Runtime Layer',
          hostStrategy: 'Local-first',
          requiredCapabilities: [],
          missingCapabilities: [],
          suggestions: [],
          summary: `${moduleId} has no registered blueprint yet.`
        };
      }
      return analyzeBlueprint(moduleId, blueprint);
    },
    analyzeLayerCatalogue() {
      return LAYER_CATALOGUE.map((moduleId) => analyzeBlueprint(moduleId, MODULE_BLUEPRINTS[moduleId] || {
        layer: 'Runtime Layer',
        hostStrategy: 'Local-first',
        requiredCapabilities: [],
        summary: `${moduleId} is part of the platform stack.`,
        suggestions: []
      }));
    }
  };
}
