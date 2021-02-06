/**
 * @module ol/layer/VectorTileRenderType
 */

/**
 * @enum {string}
 * Render mode for vector tiles:
 * @api
 */
export default {
  /**
   * Vector tiles are rendered as images. Great performance, but
   * point symbols and texts are always rotated with the view and pixels are
   * scaled during zoom animations
   * @api
   * @deprecated
   */
  IMAGE: 'image',
  /**
   * Polygon and line elements are rendered as images, so pixels
   * are scaled during zoom animations. Point symbols and texts are accurately
   * rendered as vectors and can stay upright on rotated views.
   * @api
   */
  HYBRID: 'hybrid',
  /**
   * Everything is rendered as vectors. Use this mode for improved
   * performance on vector tile layers with only a few rendered features (e.g.
   * for highlighting a subset of features of another layer with the same
   * source).
   * @api
   */
  VECTOR: 'vector',
};
