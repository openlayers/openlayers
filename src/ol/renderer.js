/**
 * @module ol/renderer
 */

/**
 * The renderer used by {@link module:ol/layer/Tile~TileLayer},
 * {@link module:ol/layer/Vector~VectorLayer} and
 * {@link module:ol/layer/VectorTile~VectorTileLayer}.
 * @typedef {'canvas'|'webgpu'} RendererName
 */

/**
 * @type {RendererName}
 */
let defaultRenderer = 'canvas';

/**
 * Set the renderer for tile, vector and vector tile layers that are created after
 * this call. The default is `'canvas'`. A layer's `renderer` option takes
 * precedence. Layers load their renderer when they are
 * first rendered, so an application only downloads the renderers it uses.
 *
 * `'webgpu'` requires WebGPU (`navigator.gpu`). There is no silent fallback to
 * Canvas. WebGPU layers release their GPU resources when they are removed from
 * the map, and build them again when they are added back.
 *
 * @param {RendererName} renderer The renderer.
 * @api
 */
export function setDefaultRenderer(renderer) {
  defaultRenderer = renderer;
}

/**
 * Get the renderer for tile, vector and vector tile layers that are created
 * from now on.
 * @return {RendererName} The renderer.
 * @api
 */
export function getDefaultRenderer() {
  return defaultRenderer;
}

/**
 * Wraps a dynamic import of a renderer module, so the module is loaded on
 * first use and returned synchronously once it is loaded.
 * @template T
 * @param {function(): Promise<{default: T}>} load Imports the module.
 * @return {function(): (T|Promise<T>)} Returns the default export, or a
 * promise for it while the module is loading.
 */
export function lazyRenderer(load) {
  /** @type {T|undefined} */
  let loaded;
  /** @type {Promise<T>|undefined} */
  let loading;
  return () => {
    if (loaded) {
      return loaded;
    }
    if (!loading) {
      loading = load().then((module) => {
        loaded = module.default;
        return loaded;
      });
    }
    return loading;
  };
}

/**
 * Creates a renderer with a lazily loaded renderer class.
 * @template T, R
 * @param {function(): (T|Promise<T>)} getClass Lazy renderer class, see
 * {@link lazyRenderer}.
 * @param {function(T): R} create Creates the renderer from the class.
 * @return {R|Promise<R>} The renderer, or a promise for it while the renderer
 * class is loading.
 */
export function createLazyRenderer(getClass, create) {
  const RendererClass = getClass();
  if (RendererClass instanceof Promise) {
    return RendererClass.then(create);
  }
  return create(RendererClass);
}
