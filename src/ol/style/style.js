goog.provide('ol.style.GeometryFunction');
goog.provide('ol.style.Style');
goog.provide('ol.style.StyleFunction');
goog.provide('ol.style.defaultGeometryFunction');

goog.require('goog.asserts');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Stroke');



/**
 * @classdesc
 * Container for vector feature rendering styles. Any changes made to the style
 * or its children through `set*()` methods will not take effect until the
 * feature or layer that uses the style is re-rendered.
 *
 * @constructor
 * @param {olx.style.StyleOptions=} opt_options Style options.
 * @api
 */
ol.style.Style = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {string|ol.geom.Geometry|ol.style.GeometryFunction}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {!ol.style.GeometryFunction}
   */
  this.geometryFunction_ = ol.style.defaultGeometryFunction;

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
 * Get the geometry to be rendered.
 * @return {string|ol.geom.Geometry|ol.style.GeometryFunction}
 * Feature property or geometry or function that returns the geometry that will
 * be rendered with this style.
 * @api
 */
ol.style.Style.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * Get the function used to generate a geometry for rendering.
 * @return {!ol.style.GeometryFunction} Function that is called with a feature
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
 * Get the image style.
 * @return {ol.style.Image} Image style.
 * @api
 */
ol.style.Style.prototype.getImage = function() {
  return this.image_;
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
 * Get the text style.
 * @return {ol.style.Text} Text style.
 * @api
 */
ol.style.Style.prototype.getText = function() {
  return this.text_;
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
 * @param {string|ol.geom.Geometry|ol.style.GeometryFunction} geometry
 *     Feature property or geometry or function returning a geometry to render
 *     for this style.
 * @api
 */
ol.style.Style.prototype.setGeometry = function(geometry) {
  if (goog.isFunction(geometry)) {
    this.geometryFunction_ = geometry;
  } else if (goog.isString(geometry)) {
    this.geometryFunction_ = function(feature) {
      var result = feature.get(geometry);
      if (result) {
        goog.asserts.assertInstanceof(result, ol.geom.Geometry,
            'feature geometry must be an ol.geom.Geometry instance');
      }
      return result;
    };
  } else if (!geometry) {
    this.geometryFunction_ = ol.style.defaultGeometryFunction;
  } else if (geometry !== undefined) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Geometry,
        'geometry must be an ol.geom.Geometry instance');
    this.geometryFunction_ = function() {
      return geometry;
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
 * A function that takes an {@link ol.Feature} and a `{number}` representing
 * the view's resolution. The function should return an array of
 * {@link ol.style.Style}. This way e.g. a vector layer can be styled.
 *
 * @typedef {function(ol.Feature, number): Array.<ol.style.Style>}
 * @api
 */
ol.style.StyleFunction;


/**
 * Convert the provided object into a style function.  Functions passed through
 * unchanged.  Arrays of ol.style.Style or single style objects wrapped in a
 * new style function.
 * @param {ol.style.StyleFunction|Array.<ol.style.Style>|ol.style.Style} obj
 *     A style function, a single style, or an array of styles.
 * @return {ol.style.StyleFunction} A style function.
 */
ol.style.createStyleFunction = function(obj) {
  var styleFunction;

  if (goog.isFunction(obj)) {
    styleFunction = obj;
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (goog.isArray(obj)) {
      styles = obj;
    } else {
      goog.asserts.assertInstanceof(obj, ol.style.Style,
          'obj geometry must be an ol.style.Style instance');
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
ol.style.defaultStyle_ = null;


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 */
ol.style.defaultStyleFunction = function(feature, resolution) {
  // We don't use an immediately-invoked function
  // and a closure so we don't get an error at script evaluation time in
  // browsers that do not support Canvas. (ol.style.Circle does
  // canvas.getContext('2d') at construction time, which will cause an.error
  // in such browsers.)
  if (!ol.style.defaultStyle_) {
    var fill = new ol.style.Fill({
      color: 'rgba(255,255,255,0.4)'
    });
    var stroke = new ol.style.Stroke({
      color: '#3399CC',
      width: 1.25
    });
    ol.style.defaultStyle_ = [
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
  return ol.style.defaultStyle_;
};


/**
 * Default styles for editing features.
 * @return {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} Styles
 */
ol.style.createDefaultEditingStyles = function() {
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
 * A function that takes an {@link ol.Feature} as argument and returns an
 * {@link ol.geom.Geometry} that will be rendered and styled for the feature.
 *
 * @typedef {function(ol.Feature): (ol.geom.Geometry|undefined)}
 * @api
 */
ol.style.GeometryFunction;


/**
 * Function that is called with a feature and returns its default geometry.
 * @param {ol.Feature} feature Feature to get the geometry for.
 * @return {ol.geom.Geometry|undefined} Geometry to render.
 */
ol.style.defaultGeometryFunction = function(feature) {
  goog.asserts.assert(feature, 'feature must not be null');
  return feature.getGeometry();
};
