/**
 * @module ol/render/VectorContext
 */

/**
 * @classdesc
 * Context for drawing geometries.  A vector context is available on render
 * events and does not need to be constructed directly.
 * @api
 */
class VectorContext {
  /**
   * Render a geometry with a custom renderer.
   *
   * @param {module:ol/geom/SimpleGeometry} geometry Geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   * @param {Function} renderer Renderer.
   */
  drawCustom(geometry, feature, renderer) {}

  /**
   * Render a geometry.
   *
   * @param {module:ol/geom/Geometry} geometry The geometry to render.
   */
  drawGeometry(geometry) {}

  /**
   * Set the rendering style.
   *
   * @param {module:ol/style/Style} style The rendering style.
   */
  setStyle(style) {}

  /**
   * @param {module:ol/geom/Circle} circleGeometry Circle geometry.
   * @param {module:ol/Feature} feature Feature.
   */
  drawCircle(circleGeometry, feature) {}

  /**
   * @param {module:ol/Feature} feature Feature.
   * @param {module:ol/style/Style} style Style.
   */
  drawFeature(feature, style) {}

  /**
   * @param {module:ol/geom/GeometryCollection} geometryCollectionGeometry Geometry collection.
   * @param {module:ol/Feature} feature Feature.
   */
  drawGeometryCollection(geometryCollectionGeometry, feature) {}

  /**
   * @param {module:ol/geom/LineString|module:ol/render/Feature} lineStringGeometry Line string geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawLineString(lineStringGeometry, feature) {}

  /**
   * @param {module:ol/geom/MultiLineString|module:ol/render/Feature} multiLineStringGeometry MultiLineString geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawMultiLineString(multiLineStringGeometry, feature) {}

  /**
   * @param {module:ol/geom/MultiPoint|module:ol/render/Feature} multiPointGeometry MultiPoint geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawMultiPoint(multiPointGeometry, feature) {}

  /**
   * @param {module:ol/geom/MultiPolygon} multiPolygonGeometry MultiPolygon geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawMultiPolygon(multiPolygonGeometry, feature) {}

  /**
   * @param {module:ol/geom/Point|module:ol/render/Feature} pointGeometry Point geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawPoint(pointGeometry, feature) {}

  /**
   * @param {module:ol/geom/Polygon|module:ol/render/Feature} polygonGeometry Polygon geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawPolygon(polygonGeometry, feature) {}

  /**
   * @param {module:ol/geom/Geometry|module:ol/render/Feature} geometry Geometry.
   * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
   */
  drawText(geometry, feature) {}

  /**
   * @param {module:ol/style/Fill} fillStyle Fill style.
   * @param {module:ol/style/Stroke} strokeStyle Stroke style.
   */
  setFillStrokeStyle(fillStyle, strokeStyle) {}

  /**
   * @param {module:ol/style/Image} imageStyle Image style.
   * @param {module:ol/render/canvas~DeclutterGroup=} opt_declutterGroup Declutter.
   */
  setImageStyle(imageStyle, opt_declutterGroup) {}

  /**
   * @param {module:ol/style/Text} textStyle Text style.
   * @param {module:ol/render/canvas~DeclutterGroup=} opt_declutterGroup Declutter.
   */
  setTextStyle(textStyle, opt_declutterGroup) {}
}

export default VectorContext;
