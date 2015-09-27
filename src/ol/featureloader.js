goog.provide('ol.FeatureLoader');
goog.provide('ol.FeatureUrlFunction');
goog.provide('ol.featureloader');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('ol.format.FormatType');
goog.require('ol.xml');


/**
 * {@link ol.source.Vector} sources use a function of this type to load
 * features.
 *
 * This function takes an {@link ol.Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link ol.proj.Projection} for the projection  as arguments. `this` within
 * the function is bound to the {@link ol.source.Vector} it's called from.
 *
 * The function is responsible for loading the features and adding them to the
 * source.
 * @api
 * @typedef {function(this:ol.source.Vector, ol.Extent, number,
 *                    ol.proj.Projection)}
 */
ol.FeatureLoader;


/**
 * {@link ol.source.Vector} sources use a function of this type to get the url
 * to load features from.
 *
 * This function takes an {@link ol.Extent} representing the area to be loaded,
 * a `{number}` representing the resolution (map units per pixel) and an
 * {@link ol.proj.Projection} for the projection  as arguments and returns a
 * `{string}` representing the URL.
 * @api
 * @typedef {function(ol.Extent, number, ol.proj.Projection) : string}
 */
ol.FeatureUrlFunction;


/**
 * @param {string|ol.FeatureUrlFunction} url Feature URL service.
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
                  if (!source) {
                    source = ol.xml.parse(xhrIo.getResponseText());
                  }
                } else {
                  goog.asserts.fail('unexpected format type');
                }
                if (source) {
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
        if (goog.isFunction(url)) {
          xhrIo.send(url(extent, resolution, projection));
        } else {
          xhrIo.send(url);
        }

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
       * @this {ol.source.Vector}
       */
      function(features) {
        this.addFeatures(features);
      });
};
