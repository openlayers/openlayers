// Registers the global test helpers (createMapDiv, disposeMap, where,
// afterLoad*, loadRenderers) and the after-each DOM-leak check for every spec.
import './test-extensions.js';

// WebGPU specs load the WebGPU renderers themselves.
await loadRenderers('canvas');
