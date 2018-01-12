/**
 * @module ol/style/Style
 */
import {assert} from '../asserts.js';
import GeometryType from '../geom/GeometryType.js';
import CircleStyle from '../style/Circle.js';
import Fill from '../style/Fill.js';
import Stroke from '../style/Stroke.js';

/**
 * @classdesc
 * Container for vector feature rendering styles. Any changes made to the style
 * or its children through `set*()` methods will not take effect until the
 * feature or layer that uses the style is re-rendered.
 *
 * @constructor
 * @struct
 * @param {olx.style.StyleOptions=} opt_options Style options.
 * @api
 */
const Style = function(opt_options) {

  const options = opt_options || {};

  /**
   * @private
   * @type {string|ol.geom.Geometry|ol.StyleGeometryFunction}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {!ol.StyleGeometryFunction}
   */
  this.geometryFunction_ = Style.defaultGeometryFunction;

  if (options.geometry !== undefined) {
    this.setGeometry(options.geometry);
  }

  /**
   * @private
   * @type {ol.style.Fill}
   */
  this.fill_ = options.fill !== undefined ? options.fill : null;

  /**
   * @private
   * @type {ol.style.Image}
   */
  this.image_ = options.image !== undefined ? options.image : null;

  /**
   * @private
   * @type {ol.StyleRenderFunction|null}
   */
  this.renderer_ = options.renderer !== undefined ? options.renderer : null;

  /**
   * @private
   * @type {ol.style.Stroke}
   */
  this.stroke_ = options.stroke !== undefined ? options.stroke : null;

  /**
   * @private
   * @type {ol.style.Text}
   */
  this.text_ = options.text !== undefined ? options.text : null;

  /**
   * @private
   * @type {number|undefined}
   */
  this.zIndex_ = options.zIndex;

};


/**
 * Clones the style.
 * @return {ol.style.Style} The cloned style.
 * @api
 */
Style.prototype.clone = function() {
  let geometry = this.getGeometry();
  if (geometry && geometry.clone) {
    geometry = geometry.clone();
  }
  return new Style({
    geometry: geometry,
    fill: this.getFill() ? this.getFill().clone() : undefined,
    image: this.getImage() ? this.getImage().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    text: this.getText() ? this.getText().clone() : undefined,
    zIndex: this.getZIndex()
  });
};


/**
 * Get the custom renderer function that was configured with
 * {@link #setRenderer} or the `renderer` constructor option.
 * @return {ol.StyleRenderFunction|null} Custom renderer function.
 * @api
 */
Style.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Sets a custom renderer function for this style. When set, `fill`, `stroke`
 * and `image` options of the style will be ignored.
 * @param {ol.StyleRenderFunction|null} renderer Custom renderer function.
 * @api
 */
Style.prototype.setRenderer = function(renderer) {
  this.renderer_ = renderer;
};


/**
 * Get the geometry to be rendered.
 * @return {string|ol.geom.Geometry|ol.StyleGeometryFunction}
 * Feature property or geometry or function that returns the geometry that will
 * be rendered with this style.
 * @api
 */
Style.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * Get the function used to generate a geometry for rendering.
 * @return {!ol.StyleGeometryFunction} Function that is called with a feature
 * and returns the geometry to render instead of the feature's geometry.
 * @api
 */
Style.prototype.getGeometryFunction = function() {
  return this.geometryFunction_;
};


/**
 * Get the fill style.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
Style.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Set the fill style.
 * @param {ol.style.Fill} fill Fill style.
 * @api
 */
Style.prototype.setFill = function(fill) {
  this.fill_ = fill;
};


/**
 * Get the image style.
 * @return {ol.style.Image} Image style.
 * @api
 */
Style.prototype.getImage = function() {
  return this.image_;
};


/**
 * Set the image style.
 * @param {ol.style.Image} image Image style.
 * @api
 */
Style.prototype.setImage = function(image) {
  this.image_ = image;
};


/**
 * Get the stroke style.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
Style.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Set the stroke style.
 * @param {ol.style.Stroke} stroke Stroke style.
 * @api
 */
Style.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
};


/**
 * Get the text style.
 * @return {ol.style.Text} Text style.
 * @api
 */
Style.prototype.getText = function() {
  return this.text_;
};


/**
 * Set the text style.
 * @param {ol.style.Text} text Text style.
 * @api
 */
Style.prototype.setText = function(text) {
  this.text_ = text;
};


/**
 * Get the z-index for the style.
 * @return {number|undefined} ZIndex.
 * @api
 */
Style.prototype.getZIndex = function() {
  return this.zIndex_;
};


/**
 * Set a geometry that is rendered instead of the feature's geometry.
 *
 * @param {string|ol.geom.Geometry|ol.StyleGeometryFunction} geometry
 *     Feature property or geometry or function returning a geometry to render
 *     for this style.
 * @api
 */
Style.prototype.setGeometry = function(geometry) {
  if (typeof geometry === 'function') {
    this.geometryFunction_ = geometry;
  } else if (typeof geometry === 'string') {
    this.geometryFunction_ = function(feature) {
      return /** @type {ol.geom.Geometry} */ (feature.get(geometry));
    };
  } else if (!geometry) {
    this.geometryFunction_ = Style.defaultGeometryFunction;
  } else if (geometry !== undefined) {
    this.geometryFunction_ = function() {
      return /** @type {ol.geom.Geometry} */ (geometry);
    };
  }
  this.geometry_ = geometry;
};


/**
 * Set the z-index.
 *
 * @param {number|undefined} zIndex ZIndex.
 * @api
 */
Style.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = zIndex;
};


/**
 * Convert the provided object into a style function.  Functions passed through
 * unchanged.  Arrays of ol.style.Style or single style objects wrapped in a
 * new style function.
 * @param {ol.StyleFunction|Array.<ol.style.Style>|ol.style.Style} obj
 *     A style function, a single style, or an array of styles.
 * @return {ol.StyleFunction} A style function.
 */
Style.createFunction = function(obj) {
  let styleFunction;

  if (typeof obj === 'function') {
    styleFunction = obj;
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    let styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      assert(obj instanceof Style,
        41); // Expected an `ol.style.Style` or an array of `ol.style.Style`
      styles = [obj];
    }
    styleFunction = function() {
      return styles;
    };
  }
  return styleFunction;
};


/**
 * @type {Array.<ol.style.Style>}
 * @private
 */
Style.default_ = null;


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 */
Style.defaultFunction = function(feature, resolution) {
  // We don't use an immediately-invoked function
  // and a closure so we don't get an error at script evaluation time in
  // browsers that do not support Canvas. (ol.style.Circle does
  // canvas.getContext('2d') at construction time, which will cause an.error
  // in such browsers.)
  if (!Style.default_) {
    const fill = new Fill({
      color: 'rgba(255,255,255,0.4)'
    });
    const stroke = new Stroke({
      color: '#3399CC',
      width: 1.25
    });
    Style.default_ = [
      new Style({
        image: new CircleStyle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      })
    ];
  }
  return Style.default_;
};


/**
 * Default styles for editing features.
 * @return {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} Styles
 */
Style.createDefaultEditing = function() {
  /** @type {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} */
  const styles = {};
  const white = [255, 255, 255, 1];
  const blue = [0, 153, 255, 1];
  const width = 3;
  styles[GeometryType.POLYGON] = [
    new Style({
      fill: new Fill({
        color: [255, 255, 255, 0.5]
      })
    })
  ];
  styles[GeometryType.MULTI_POLYGON] =
      styles[GeometryType.POLYGON];

  styles[GeometryType.LINE_STRING] = [
    new Style({
      stroke: new Stroke({
        color: white,
        width: width + 2
      })
    }),
    new Style({
      stroke: new Stroke({
        color: blue,
        width: width
      })
    })
  ];
  styles[GeometryType.MULTI_LINE_STRING] =
      styles[GeometryType.LINE_STRING];

  styles[GeometryType.CIRCLE] =
      styles[GeometryType.POLYGON].concat(
        styles[GeometryType.LINE_STRING]
      );


  styles[GeometryType.POINT] = [
    new Style({
      image: new CircleStyle({
        radius: width * 2,
        fill: new Fill({
          color: blue
        }),
        stroke: new Stroke({
          color: white,
          width: width / 2
        })
      }),
      zIndex: Infinity
    })
  ];
  styles[GeometryType.MULTI_POINT] =
      styles[GeometryType.POINT];

  styles[GeometryType.GEOMETRY_COLLECTION] =
      styles[GeometryType.POLYGON].concat(
        styles[GeometryType.LINE_STRING],
        styles[GeometryType.POINT]
      );

  return styles;
};


/**
 * Function that is called with a feature and returns its default geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature to get the geometry
 *     for.
 * @return {ol.geom.Geometry|ol.render.Feature|undefined} Geometry to render.
 */
Style.defaultGeometryFunction = function(feature) {
  return feature.getGeometry();
};
export default Style;
