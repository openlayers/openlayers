// FIXME cache expiration

goog.provide('ol.source.ServerVector');

goog.require('ol.extent');
goog.require('ol.source.FormatVector');
goog.require('ol.structs.RBush');



/**
 * @constructor
 * @extends {ol.source.FormatVector}
 * @param {olx.source.ServerVectorOptions} options Options.
 */
ol.source.ServerVector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    format: options.format,
    headers: options.headers,
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
   * @type {function(ol.Extent, number): Array.<ol.Extent>}
   */
  this.loadingStrategy_ = options.loadingStrategy;

  /**
   * @private
   * @type {function(ol.Extent, number, ol.proj.Projection): string}
   */
  this.extentUrlFunction_ = options.extentUrlFunction;

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
    if (!(featureId in this.loadedFeatures_)) {
      notLoadedFeatures.push(feature);
      this.loadedFeatures_[featureId] = true;
    }
  }
  goog.base(this, 'addFeaturesInternal', notLoadedFeatures);
};


/**
 * @inheritDoc
 */
ol.source.ServerVector.prototype.loadFeatures =
    function(extent, resolution, projection) {
  var loadedExtents = this.loadedExtents_;
  var extentsToLoad = this.loadingStrategy_(extent, resolution);
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
      var url = this.extentUrlFunction_(extentToLoad, resolution, projection);
      this.loadFeaturesFromURL(url);
      loadedExtents.insert(extentToLoad, {extent: extentToLoad.slice()});
    }
  }
};
