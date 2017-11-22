goog.provide('ol.layer.VectorRenderType');

/**
 * @enum {string}
 * Render mode for vector layers:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance.
 * @api
 */
ol.layer.VectorRenderType = {
  IMAGE: 'image',
  VECTOR: 'vector'
};
