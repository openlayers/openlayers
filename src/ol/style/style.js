goog.provide('ol.style.Style');

goog.require('ol.asserts');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');


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
ol.style.Style = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {string|ol.geom.Geometry|ol.StyleGeometryFunction}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {!ol.StyleGeometryFunction}
   */
  this.geometryFunction_ = ol.style.Style.defaultGeometryFunction;

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
ol.style.Style.prototype.clone = function() {
  var geometry = this.getGeometry();
  if (geometry && geometry.clone) {
    geometry = geometry.clone();
  }
  return new ol.style.Style({
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
ol.style.Style.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Sets a custom renderer function for this style. When set, `fill`, `stroke`
 * and `image` options of the style will be ignored.
 * @param {ol.StyleRenderFunction|null} renderer Custom renderer function.
 * @api
 */
ol.style.Style.prototype.setRenderer = function(renderer) {
  this.renderer_ = renderer;
};


/**
 * Get the geometry to be rendered.
 * @return {string|ol.geom.Geometry|ol.StyleGeometryFunction}
 * Feature property or geometry or function that returns the geometry that will
 * be rendered with this style.
 * @api
 */
ol.style.Style.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * Get the function used to generate a geometry for rendering.
 * @return {!ol.StyleGeometryFunction} Function that is called with a feature
 * and returns the geometry to render instead of the feature's geometry.
 * @api
 */
ol.style.Style.prototype.getGeometryFunction = function() {
  return this.geometryFunction_;
};


/**
 * Get the fill style.
 * @return {ol.style.Fill} Fill style.
 * @api
 */
ol.style.Style.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Set the fill style.
 * @param {ol.style.Fill} fill Fill style.
 * @api
 */
ol.style.Style.prototype.setFill = function(fill) {
  this.fill_ = fill;
};


/**
 * Get the image style.
 * @return {ol.style.Image} Image style.
 * @api
 */
ol.style.Style.prototype.getImage = function() {
  return this.image_;
};


/**
 * Set the image style.
 * @param {ol.style.Image} image Image style.
 * @api
 */
ol.style.Style.prototype.setImage = function(image) {
  this.image_ = image;
};


/**
 * Get the stroke style.
 * @return {ol.style.Stroke} Stroke style.
 * @api
 */
ol.style.Style.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Set the stroke style.
 * @param {ol.style.Stroke} stroke Stroke style.
 * @api
 */
ol.style.Style.prototype.setStroke = function(stroke) {
  this.stroke_ = stroke;
};


/**
 * Get the text style.
 * @return {ol.style.Text} Text style.
 * @api
 */
ol.style.Style.prototype.getText = function() {
  return this.text_;
};


/**
 * Set the text style.
 * @param {ol.style.Text} text Text style.
 * @api
 */
ol.style.Style.prototype.setText = function(text) {
  this.text_ = text;
};


/**
 * Get the z-index for the style.
 * @return {number|undefined} ZIndex.
 * @api
 */
ol.style.Style.prototype.getZIndex = function() {
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
ol.style.Style.prototype.setGeometry = function(geometry) {
  if (typeof geometry === 'function') {
    this.geometryFunction_ = geometry;
  } else if (typeof geometry === 'string') {
    this.geometryFunction_ = function(feature) {
      return /** @type {ol.geom.Geometry} */ (feature.get(geometry));
    };
  } else if (!geometry) {
    this.geometryFunction_ = ol.style.Style.defaultGeometryFunction;
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
ol.style.Style.prototype.setZIndex = function(zIndex) {
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
ol.style.Style.createFunction = function(obj) {
  var styleFunction;

  if (typeof obj === 'function') {
    styleFunction = obj;
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      ol.asserts.assert(obj instanceof ol.style.Style,
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
ol.style.Style.default_ = null;


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 */
ol.style.Style.defaultFunction = function(feature, resolution) {
  // We don't use an immediately-invoked function
  // and a closure so we don't get an error at script evaluation time in
  // browsers that do not support Canvas. (ol.style.Circle does
  // canvas.getContext('2d') at construction time, which will cause an.error
  // in such browsers.)
  if (!ol.style.Style.default_) {
    var fill = new ol.style.Fill({
      color: 'rgba(255,255,255,0.4)'
    });
    var stroke = new ol.style.Stroke({
      color: '#3399CC',
      width: 1.25
    });
    ol.style.Style.default_ = [
      new ol.style.Style({
        image: new ol.style.Circle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      })
    ];
  }
  return ol.style.Style.default_;
};


/**
 * Default styles for editing features.
 * @return {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} Styles
 */
ol.style.Style.createDefaultEditing = function() {
  /** @type {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} */
  var styles = {};
  var white = [255, 255, 255, 1];
  var blue = [0, 153, 255, 1];
  var width = 3;
  styles[ol.geom.GeometryType.POLYGON] = [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.5]
      })
    })
  ];
  styles[ol.geom.GeometryType.MULTI_POLYGON] =
      styles[ol.geom.GeometryType.POLYGON];

  styles[ol.geom.GeometryType.LINE_STRING] = [
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: white,
        width: width + 2
      })
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: blue,
        width: width
      })
    })
  ];
  styles[ol.geom.GeometryType.MULTI_LINE_STRING] =
      styles[ol.geom.GeometryType.LINE_STRING];

  styles[ol.geom.GeometryType.CIRCLE] =
      styles[ol.geom.GeometryType.POLYGON].concat(
          styles[ol.geom.GeometryType.LINE_STRING]
      );


  styles[ol.geom.GeometryType.POINT] = [
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: width * 2,
        fill: new ol.style.Fill({
          color: blue
        }),
        stroke: new ol.style.Stroke({
          color: white,
          width: width / 2
        })
      }),
      zIndex: Infinity
    })
  ];
  styles[ol.geom.GeometryType.MULTI_POINT] =
      styles[ol.geom.GeometryType.POINT];

  styles[ol.geom.GeometryType.GEOMETRY_COLLECTION] =
      styles[ol.geom.GeometryType.POLYGON].concat(
          styles[ol.geom.GeometryType.LINE_STRING],
          styles[ol.geom.GeometryType.POINT]
      );

  return styles;
};


/**
 * Function that is called with a feature and returns its default geometry.
 * @param {ol.Feature|ol.render.Feature} feature Feature to get the geometry
 *     for.
 * @return {ol.geom.Geometry|ol.render.Feature|undefined} Geometry to render.
 */
ol.style.Style.defaultGeometryFunction = function(feature) {
  return feature.getGeometry();
};
