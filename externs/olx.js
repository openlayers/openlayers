
/**
 * @type {Object}
 */
let olx;


/**
 * @typedef {{context: CanvasRenderingContext2D,
 *     feature: (module:ol/Feature~Feature|ol.render.Feature),
 *     geometry: module:ol/geom/SimpleGeometry~SimpleGeometry,
 *     pixelRatio: number,
 *     resolution: number,
 *     rotation: number}}
 */
olx.render.State;


/**
 * Canvas context that the layer is being rendered to.
 * @type {CanvasRenderingContext2D}
 * @api
 */
olx.render.State.prototype.context;


/**
 * Pixel ratio used by the layer renderer.
 * @type {number}
 * @api
 */
olx.render.State.prototype.pixelRatio;


/**
 * Resolution that the render batch was created and optimized for. This is
 * not the view's resolution that is being rendered.
 * @type {number}
 * @api
 */
olx.render.State.prototype.resolution;


/**
 * Rotation of the rendered layer in radians.
 * @type {number}
 * @api
 */
olx.render.State.prototype.rotation;


/**