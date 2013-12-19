// FIXME remove reprojectTo

goog.provide('ol.source.VectorFile');

goog.require('goog.asserts');
goog.require('ol.proj');
goog.require('ol.source.State');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.source.Vector}
 * @param {olx.source.VectorFileOptions=} opt_options Options.
 */
ol.source.VectorFile = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @type {ol.format.Format}
   * @private
   */
  this.format_ = options.format;

  /**
   * @type {ol.proj.Projection}
   * @private
   */
  this.reprojectTo_ = goog.isDef(options.reprojectTo) ?
      ol.proj.get(options.reprojectTo) : ol.proj.get('EPSG:3857');

  if (goog.isDef(options.doc)) {
    this.readFeatures_(options.doc);
  }

  if (goog.isDef(options.node)) {
    this.readFeatures_(options.node);
  }

  if (goog.isDef(options.object)) {
    this.readFeatures_(options.object);
  }

  if (goog.isDef(options.text)) {
    this.readFeatures_(options.text);
  }

  if (goog.isDef(options.url)) {
    this.setState(ol.source.State.LOADING);
    this.format_.readFeaturesFromURL(options.url, this.addFeatures_, this);
  }

};
goog.inherits(ol.source.VectorFile, ol.source.Vector);


/**
 * @param {Array.<ol.Feature>} features Features.
 * @param {ol.proj.Projection} featureProjection Feature projection.
 * @private
 */
ol.source.VectorFile.prototype.addFeatures_ =
    function(features, featureProjection) {
  var transform;
  if (!ol.proj.equivalent(featureProjection, this.reprojectTo_)) {
    transform = ol.proj.getTransform(featureProjection, this.reprojectTo_);
  } else {
    transform = null;
  }
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var geometry = feature.getGeometry();
    if (!goog.isNull(geometry) && !goog.isNull(transform)) {
      geometry.transform(transform);
    }
    this.addFeature(feature);
  }
  this.setState(ol.source.State.READY);
};


/**
 * @param {Document|Node|Object|string} source Source.
 * @private
 */
ol.source.VectorFile.prototype.readFeatures_ = function(source) {
  var features = this.format_.readFeatures(source);
  var featureProjection = this.format_.readProjection(source);
  this.addFeatures_(features, featureProjection);
};
