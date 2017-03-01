goog.provide('ol.featureloader');

goog.require('ol');
goog.require('ol.format.FormatType');
goog.require('ol.xml');


/**
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @param {function(this:ol.VectorTile, Array.<ol.Feature>, ol.proj.Projection)|function(this:ol.source.Vector, Array.<ol.Feature>)} success
 *     Function called with the loaded features and optionally with the data
 *     projection. Called with the vector tile or source as `this`.
 * @param {function(this:ol.VectorTile)|function(this:ol.source.Vector)} failure
 *     Function called when loading failed. Called with the vector tile or
 *     source as `this`.
 * @return {ol.FeatureLoader} The feature loader.
 */
ol.featureloader.loadFeaturesXhr = function(url, format, success, failure) {
  return (
      /**
       * @param {ol.Extent} extent Extent.
       * @param {number} resolution Resolution.
       * @param {ol.proj.Projection} projection Projection.
       * @this {ol.source.Vector|ol.VectorTile}
       */
      function(extent, resolution, projection) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET',
            typeof url === 'function' ? url(extent, resolution, projection) : url,
            true);
        if (format.getType() == ol.format.FormatType.ARRAY_BUFFER) {
          xhr.responseType = 'arraybuffer';
        }
        /**
         * @param {Event} event Event.
         * @private
         */
        xhr.onload = function(event) {
          // status will be 0 for file:// urls
          if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
            var type = format.getType();
            /** @type {Document|Node|Object|string|undefined} */
            var source;
            if (type == ol.format.FormatType.JSON ||
                type == ol.format.FormatType.TEXT) {
              source = xhr.responseText;
            } else if (type == ol.format.FormatType.XML) {
              source = xhr.responseXML;
              if (!source) {
                source = ol.xml.parse(xhr.responseText);
              }
            } else if (type == ol.format.FormatType.ARRAY_BUFFER) {
              source = /** @type {ArrayBuffer} */ (xhr.response);
            }
            if (source) {
              success.call(this, format.readFeatures(source,
                  {featureProjection: projection}),
                  format.readProjection(source));
            } else {
              failure.call(this);
            }
          } else {
            failure.call(this);
          }
        }.bind(this);
        xhr.send();
      });
};


/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @return {ol.FeatureLoader} The feature loader.
 * @api
 */
ol.featureloader.xhr = function(url, format) {
  return ol.featureloader.loadFeaturesXhr(url, format,
      /**
       * @param {Array.<ol.Feature>} features The loaded features.
       * @param {ol.proj.Projection} dataProjection Data projection.
       * @this {ol.source.Vector}
       */
      function(features, dataProjection) {
        this.addFeatures(features);
      }, /* FIXME handle error */ ol.nullFunction);
};
