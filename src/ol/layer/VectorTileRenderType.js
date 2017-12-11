goog.provide('ol.layer.VectorTileRenderType');

/**
 * @enum {string}
 * Render mode for vector tiles:
 *  * `'image'`: Vector tiles are rendered as images. Great performance, but
 *    point symbols and texts are always rotated with the view and pixels are
 *    scaled during zoom animations.
 *  * `'hybrid'`: Polygon and line elements are rendered as images, so pixels
 *    are scaled during zoom animations. Point symbols and texts are accurately
 *    rendered as vectors and can stay upright on rotated views.
 *  * `'vector'`: Vector tiles are rendered as vectors. Most accurate rendering
 *    even during animations, but slower performance than the other options.
 * @api
 */
ol.layer.VectorTileRenderType = {
  IMAGE: 'image',
  HYBRID: 'hybrid',
  VECTOR: 'vector'
};
