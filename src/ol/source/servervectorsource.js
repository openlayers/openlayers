// FIXME cache expiration

goog.provide('ol.source.ServerVector');

goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.loadingstrategy');
goog.require('ol.source.FormatVector');
goog.require('ol.structs.RBush');



/**
 * @classdesc
 * A vector source in one of the supported formats, using a custom function to
 * read in the data from a remote server.
 *
 * @constructor
 * @extends {ol.source.FormatVector}
 * @param {olx.source.ServerVectorOptions} options Options.
 * @api
 */
ol.source.ServerVector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    format: options.format,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @private
   * @type {ol.structs.RBush.<{extent: ol.Extent}>}
   */
  this.loadedExtents_ = new ol.structs.RBush();

  /**
   * @private
   * @type {function(this: ol.source.ServerVector, ol.Extent, number,
   *                 ol.proj.Projection): string}
   */
  this.loader_ = options.loader;

  /**
   * @private
   * @type {function(ol.Extent, number): Array.<ol.Extent>}
   */
  this.strategy_ = goog.isDef(options.strategy) ?
      options.strategy : ol.loadingstrategy.bbox;

  /**
   * @private
   * @type {Object.<number|string, boolean>}
   */
  this.loadedFeatures_ = {};

};
goog.inherits(ol.source.ServerVector, ol.source.FormatVector);


/**
 * @inheritDoc
 */
ol.source.ServerVector.prototype.addFeaturesInternal = function(features) {
  /** @type {Array.<ol.Feature>} */
  var notLoadedFeatures = [];
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    var featureId = feature.getId();
    if (!goog.isDef(featureId)) {
      notLoadedFeatures.push(feature);
    } else if (!(featureId in this.loadedFeatures_)) {
      notLoadedFeatures.push(feature);
      this.loadedFeatures_[featureId] = true;
    }
  }
  goog.base(this, 'addFeaturesInternal', notLoadedFeatures);
};


/**
 * @inheritDoc
 */
ol.source.ServerVector.prototype.clear = function() {
  goog.object.clear(this.loadedFeatures_);
  this.loadedExtents_.clear();
  goog.base(this, 'clear');
};


/**
 * @inheritDoc
 */
ol.source.ServerVector.prototype.loadFeatures =
    function(extent, resolution, projection) {
  var loadedExtents = this.loadedExtents_;
  var extentsToLoad = this.strategy_(extent, resolution);
  var i, ii;
  for (i = 0, ii = extentsToLoad.length; i < ii; ++i) {
    var extentToLoad = extentsToLoad[i];
    var alreadyLoaded = loadedExtents.forEachInExtent(extentToLoad,
        /**
         * @param {{extent: ol.Extent}} object Object.
         * @return {boolean} Contains.
         */
        function(object) {
          return ol.extent.containsExtent(object.extent, extentToLoad);
        });
    if (!alreadyLoaded) {
      this.loader_.call(this, extentToLoad, resolution, projection);
      loadedExtents.insert(extentToLoad, {extent: extentToLoad.slice()});
    }
  }
};


/**
 * @function
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
ol.source.ServerVector.prototype.readFeatures;
