/**
 * @module ol/render
 */
import {isCanvas} from './dom.js';
import {DEVICE_PIXEL_RATIO} from './has.js';
import {getTransformFromProjections, getUserProjection} from './proj.js';
import CanvasImmediateRenderer from './render/canvas/Immediate.js';
import {getSquaredTolerance} from './renderer/vector.js';
import {
  apply as applyTransform,
  create as createTransform,
  fromString,
  multiply as multiplyTransform,
  scale as scaleTransform,
} from './transform.js';

/**
 * @typedef {Object} ToCanvasOptions
 * @property {number} [pixelRatio=1] Output pixels per viewport CSS pixel. Increasing
 * this value scales the existing rendered image; it does not render more detail.
 * @property {string} [backgroundColor] CSS color to fill behind the layers.
 * By default, pixels not covered by a layer or its background are transparent.
 */

/**
 * Copy the currently rendered Canvas 2D layers into a new canvas, in their rendered
 * order, clipped to the viewport. Layer backgrounds, inline opacity and the canvas
 * transforms applied by the built-in renderers are included. Shared layer canvases
 * are copied only once; layer and layer-group opacity already drawn into those
 * canvases is preserved.
 *
 * This synchronous function neither renders nor waits for loading. Call it from
 * `rendercomplete` for a fully loaded snapshot, registering the listener before
 * requesting a render:
 * ```js
 * import {toCanvas} from 'ol/render.js';
 *
 * map.once('rendercomplete', () => {
 *   const canvas = toCanvas(map);
 *   // Use canvas.toBlob() or canvas.toDataURL() to encode the image.
 * });
 * map.render();
 * ```
 *
 * Requires a browser map with an HTML container target. Canvas targets and workers
 * are not supported (a canvas target can already be used for export). Throws for
 * rendered WebGL or custom DOM layer output, or for a layer canvas transform other
 * than a single `matrix()`, instead of returning a partial image. Canvas transforms
 * are applied from the top left corner, as set by the built-in renderers.
 * Controls, overlays, target/viewport CSS backgrounds, and arbitrary CSS effects
 * (e.g. filters, blend modes or other transforms) are not captured.
 *
 * Images and tiles must be loaded with appropriate `crossOrigin` settings and
 * server CORS headers for encoding or reading the result. Copying a tainted layer
 * taints the result; this function does not bypass browser security restrictions.
 *
 * @param {import('./Map.js').default} map Map with a rendered viewport.
 * @param {ToCanvasOptions} [options] Export options.
 * @return {HTMLCanvasElement} Independent snapshot, sized in output pixels
 * (viewport size multiplied by `pixelRatio`, rounded to the nearest integer).
 * @api
 */
export function toCanvas(map, options = {}) {
  const pixelRatio = options.pixelRatio === undefined ? 1 : options.pixelRatio;
  if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) {
    throw new Error('The export pixel ratio must be a positive finite number');
  }
  const viewport = map.getViewport();
  const size = map.getSize();
  const target = map.getTargetElement();
  if (
    !viewport ||
    !target ||
    isCanvas(target) ||
    !map.isRendered() ||
    !size ||
    !(size[0] > 0 && size[1] > 0)
  ) {
    throw new Error('A rendered map with an HTML container target is required');
  }
  const layers = viewport.querySelector(':scope > .ol-layers');
  if (!layers) {
    throw new Error('No rendered layer container');
  }
  const canvas = viewport.ownerDocument.createElement('canvas');
  canvas.width = Math.round(size[0] * pixelRatio);
  canvas.height = Math.round(size[1] * pixelRatio);
  const context = canvas.getContext('2d');
  if (!context || !canvas.width || !canvas.height) {
    throw new Error('Cannot create the export canvas');
  }
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  /** @type {CanvasRenderingContext2D|null|undefined} */
  let groupContext;
  for (const element of layers.children) {
    const container = /** @type {HTMLElement} */ (element);
    const source = /** @type {HTMLCanvasElement} */ (
      container.tagName === 'CANVAS' ? container : container.firstElementChild
    );
    if (
      !source ||
      source.tagName !== 'CANVAS' ||
      (container !== source && container.childElementCount !== 1) ||
      !source.getContext('2d')
    ) {
      throw new Error('Only Canvas 2D layer output is supported');
    }
    if (!source.width || !source.height) {
      continue;
    }
    const opacity =
      container.style.opacity === '' ? 1 : Number(container.style.opacity);
    // CSS container opacity applies to the background and canvas as a group.
    if (opacity !== 1 && !groupContext) {
      const group = viewport.ownerDocument.createElement('canvas');
      group.width = canvas.width;
      group.height = canvas.height;
      groupContext = group.getContext('2d');
    }
    /** @type {CanvasRenderingContext2D|null|undefined} */
    const layerContext = opacity !== 1 ? groupContext : context;
    if (!layerContext) {
      throw new Error('Cannot create the export canvas');
    }
    if (layerContext !== context) {
      layerContext.clearRect(0, 0, canvas.width, canvas.height);
    }
    layerContext.save();
    layerContext.scale(pixelRatio, pixelRatio);
    const background = container.style.backgroundColor;
    if (background && container !== source) {
      // Container backgrounds cover the viewport, independent of canvas rotation.
      layerContext.fillStyle = background;
      layerContext.fillRect(0, 0, size[0], size[1]);
    }
    const transform = source.style.transform;
    // `fromString()` reads a single matrix(); other values would be misread.
    if (transform && !/^matrix\([^()]*\)$/.test(transform)) {
      throw new Error('Only matrix() layer canvas transforms are supported');
    }
    const matrix = transform
      ? fromString(transform)
      : [
          source.style.width
            ? parseFloat(source.style.width) / source.width
            : 1,
          0,
          0,
          source.style.height
            ? parseFloat(source.style.height) / source.height
            : 1,
          0,
          0,
        ];
    layerContext.transform(
      .../** @type {[number, number, number, number, number, number]} */ (
        matrix
      ),
    );
    if (background && container === source) {
      layerContext.fillStyle = background;
      layerContext.fillRect(0, 0, source.width, source.height);
    }
    layerContext.globalAlpha =
      container === source || source.style.opacity === ''
        ? 1
        : Number(source.style.opacity);
    layerContext.drawImage(source, 0, 0);
    layerContext.restore();
    if (layerContext !== context) {
      context.save();
      context.globalAlpha = opacity;
      context.drawImage(layerContext.canvas, 0, 0);
      context.restore();
    }
  }
  return canvas;
}

/**
 * @typedef {Object} State
 * @property {CanvasRenderingContext2D} context Canvas context that the layer is being rendered to.
 * @property {import("./Feature.js").FeatureLike} feature Feature.
 * @property {import("./geom/SimpleGeometry.js").default} geometry Geometry.
 * @property {number} pixelRatio Pixel ratio used by the layer renderer.
 * @property {number} resolution Resolution that the render batch was created and optimized for.
 * This is not the view's resolution that is being rendered.
 * @property {number} rotation Rotation of the rendered layer in radians.
 */

/**
 * A function to be used when sorting features before rendering.
 * It takes two instances of {@link module:ol/Feature~Feature} or
 * {@link module:ol/render/Feature~RenderFeature} and returns a `{number}`.
 *
 * @typedef {function(import("./Feature.js").FeatureLike, import("./Feature.js").FeatureLike):number} OrderFunction
 */

/**
 * @typedef {Object} ToContextOptions
 * @property {import("./size.js").Size} [size] Desired size of the canvas in css
 * pixels. When provided, both canvas and css size will be set according to the
 * `pixelRatio`. If not provided, the current canvas and css sizes will not be
 * altered.
 * @property {number} [pixelRatio=window.devicePixelRatio] Pixel ratio (canvas
 * pixel to css pixel ratio) for the canvas.
 */

/**
 * Binds a Canvas Immediate API to a canvas context, to allow drawing geometries
 * to the context's canvas.
 *
 * The units for geometry coordinates are css pixels relative to the top left
 * corner of the canvas element.
 * ```js
 * import {toContext} from 'ol/render.js';
 * import Fill from 'ol/style/Fill.js';
 * import Polygon from 'ol/geom/Polygon.js';
 *
 * const canvas = document.createElement('canvas');
 * const render = toContext(
 *     canvas.getContext('2d'),
 *     {size: [100, 100]}
 * );
 * render.setFillStrokeStyle(new Fill({ color: blue }));
 * render.drawPolygon(
 *     new Polygon([[[0, 0], [100, 100], [100, 0], [0, 0]]])
 * );
 * ```
 *
 * @param {CanvasRenderingContext2D} context Canvas context.
 * @param {ToContextOptions} [options] Options.
 * @return {CanvasImmediateRenderer} Canvas Immediate.
 * @api
 */
export function toContext(context, options) {
  const canvas = context.canvas;
  options = options ? options : {};
  const pixelRatio = options.pixelRatio || DEVICE_PIXEL_RATIO;
  const size = options.size;
  if (size) {
    canvas.width = size[0] * pixelRatio;
    canvas.height = size[1] * pixelRatio;
    canvas.style.width = size[0] + 'px';
    canvas.style.height = size[1] + 'px';
  }
  const extent = [0, 0, canvas.width, canvas.height];
  const transform = scaleTransform(createTransform(), pixelRatio, pixelRatio);
  const squaredTolerance = getSquaredTolerance(1, pixelRatio);
  return new CanvasImmediateRenderer(
    context,
    pixelRatio,
    extent,
    transform,
    0,
    squaredTolerance,
  );
}

/**
 * Gets a vector context for drawing to the event's canvas.
 * @param {import("./render/Event.js").default} event Render event.
 * @return {CanvasImmediateRenderer} Vector context.
 * @api
 */
export function getVectorContext(event) {
  if (!(event.context instanceof CanvasRenderingContext2D)) {
    throw new Error('Only works for render events from Canvas 2D layers');
  }

  // canvas may be at a different pixel ratio than frameState.pixelRatio
  const inversePixelTransform = event.inversePixelTransform;
  const frameState = event.frameState;
  if (!inversePixelTransform || !frameState) {
    throw new Error('Only works for render events from Canvas 2D layers');
  }
  const extent = frameState.extent;
  if (!extent) {
    throw new Error('Missing frame extent');
  }
  const a = inversePixelTransform[0];
  const b = inversePixelTransform[1];
  const canvasPixelRatio = Math.sqrt(a * a + b * b);
  const transform = multiplyTransform(
    inversePixelTransform.slice(),
    frameState.coordinateToPixelTransform,
  );
  const squaredTolerance = getSquaredTolerance(
    frameState.viewState.resolution,
    canvasPixelRatio,
  );
  let userTransform;
  const userProjection = getUserProjection();
  if (userProjection) {
    userTransform = getTransformFromProjections(
      userProjection,
      frameState.viewState.projection,
    );
  }

  return new CanvasImmediateRenderer(
    event.context,
    canvasPixelRatio,
    extent,
    transform,
    frameState.viewState.rotation,
    squaredTolerance,
    userTransform || undefined,
  );
}

/**
 * Gets the pixel of the event's canvas context from the map viewport's CSS pixel.
 * @param {import("./render/Event.js").default} event Render event.
 * @param {import("./pixel.js").Pixel} pixel CSS pixel relative to the top-left
 * corner of the map viewport.
 * @return {import("./pixel.js").Pixel} Pixel on the event's canvas context.
 * @api
 */
export function getRenderPixel(event, pixel) {
  const inversePixelTransform = event.inversePixelTransform;
  if (!inversePixelTransform) {
    throw new Error('Missing inversePixelTransform');
  }
  return applyTransform(inversePixelTransform, pixel.slice(0));
}
