goog.provide('ol.FeatureLoader');
goog.provide('ol.featureloader');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('ol.format.FormatType');
goog.require('ol.xml');


/**
 * @api
 * @typedef {function(this:ol.source.Vector, ol.Extent, number,
 *                    ol.proj.Projection)}
 */
ol.FeatureLoader;


/**
 * @param {string} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @param {function(this:ol.source.Vector, Array.<ol.Feature>)} success
 *     Function called with the loaded features. Called with the vector
 *     source as `this`.
 * @return {ol.FeatureLoader} The feature loader.
 */
ol.featureloader.loadFeaturesXhr = function(url, format, success) {
  return (
      /**
       * @param {ol.Extent} extent Extent.
       * @param {number} resolution Resolution.
       * @param {ol.proj.Projection} projection Projection.
       * @this {ol.source.Vector}
       */
      function(extent, resolution, projection) {
        var xhrIo = new goog.net.XhrIo();
        xhrIo.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
        goog.events.listen(xhrIo, goog.net.EventType.COMPLETE,
            /**
             * @param {Event} event Event.
             * @private
             * @this {ol.source.Vector}
             */
            function(event) {
              var xhrIo = event.target;
              goog.asserts.assertInstanceof(xhrIo, goog.net.XhrIo,
                  'event.target/xhrIo is an instance of goog.net.XhrIo');
              if (xhrIo.isSuccess()) {
                var type = format.getType();
                /** @type {Document|Node|Object|string|undefined} */
                var source;
                if (type == ol.format.FormatType.JSON) {
                  source = xhrIo.getResponseText();
                } else if (type == ol.format.FormatType.TEXT) {
                  source = xhrIo.getResponseText();
                } else if (type == ol.format.FormatType.XML) {
                  if (!goog.userAgent.IE) {
                    source = xhrIo.getResponseXml();
                  }
                  if (!goog.isDefAndNotNull(source)) {
                    source = ol.xml.parse(xhrIo.getResponseText());
                  }
                } else {
                  goog.asserts.fail('unexpected format type');
                }
                if (goog.isDefAndNotNull(source)) {
                  var features = format.readFeatures(source,
                      {featureProjection: projection});
                  success.call(this, features);
                } else {
                  goog.asserts.fail('undefined or null source');
                }
              } else {
                // FIXME
              }
              goog.dispose(xhrIo);
            }, false, this);
        xhrIo.send(url);
      });
};


/**
 * Create an XHR feature loader for a `url` and `format`. The feature loader
 * loads features (with XHR), parses the features, and adds them to the
 * vector source.
 * @param {string} url Feature URL service.
 * @param {ol.format.Feature} format Feature format.
 * @return {ol.FeatureLoader} The feature loader.
 * @api
 */
ol.featureloader.xhr = function(url, format) {
  return ol.featureloader.loadFeaturesXhr(url, format,
      /**
       * @param {Array.<ol.Feature>} features The loaded features.
       * @this {ol.source.Vector}
       */
      function(features) {
        this.addFeatures(features);
      });
};
