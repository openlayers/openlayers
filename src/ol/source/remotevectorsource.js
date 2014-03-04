// FIXME cache expiration

goog.provide('ol.source.RemoteVector');

goog.require('ol.extent');
goog.require('ol.source.FormatVector');
goog.require('ol.structs.RBush');



/**
 * @constructor
 * @extends {ol.source.FormatVector}
 * @param {olx.source.RemoteVectorOptions} options Options.
 */
ol.source.RemoteVector = function(options) {

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
  this.loadingFunction_ = options.loadingFunction;

  /**
   * @private
   * @type {function(ol.Extent, number): string}
   */
  this.extentUrlFunction_ = options.extentUrlFunction;

  /**
   * @private
   * @type {Object.<number|string, boolean>}
   */
  this.loadedFeatures_ = {};

};
goog.inherits(ol.source.RemoteVector, ol.source.FormatVector);


/**
 * @inheritDoc
 */
ol.source.RemoteVector.prototype.addFeaturesInternal = function(features) {
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
ol.source.RemoteVector.prototype.loadFeatures = function(extent, resolution) {
  var loadedExtents = this.loadedExtents_;
  var extentsToLoad = this.loadingFunction_(extent, resolution);
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
      var url = this.extentUrlFunction_(extentToLoad, resolution);
      this.loadFeaturesFromURL(url);
      loadedExtents.insert(extentToLoad, {extent: extentToLoad.slice()});
    }
  }
};
