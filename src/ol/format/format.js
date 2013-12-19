goog.provide('ol.format.Format');
goog.provide('ol.format.FormatType');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.net.XhrIo');


/**
 * @enum {string}
 */
ol.format.FormatType = {
  BINARY: 'binary',
  JSON: 'json',
  TEXT: 'text',
  XML: 'xml'
};



/**
 * @constructor
 */
ol.format.Format = function() {
};


/**
 * @return {ol.format.FormatType} Format.
 */
ol.format.Format.prototype.getType = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.Feature} Feature.
 */
ol.format.Format.prototype.readFeature = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.Format.prototype.readFeatures = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @param {function(this: S, ol.Feature, (Document|Node|Object|undefined)): T}
 *     callback Callback.
 * @param {S=} opt_obj Scope.
 * @template S,T
 */
ol.format.Format.prototype.readFeaturesAsync = goog.abstractMethod;


/**
 * @param {goog.Uri|string} url URL.
 * @param {function(this: S, Array.<ol.Feature>, ol.proj.Projection): T}
 *     callback Callback.
 * @param {S=} opt_obj Scope.
 * @template S,T
 */
ol.format.Format.prototype.readFeaturesFromURL =
    function(url, callback, opt_obj) {
  goog.net.XhrIo.send(url, goog.bind(
      /**
       * @param {Event} event Event.
       */
      function(event) {
        var xhrIo = /** @type {goog.net.XhrIo} */ (event.target);
        if (xhrIo.isSuccess()) {
          var type = this.getType();
          /** @type {Document|Node|Object|string|undefined} */
          var source;
          if (type == ol.format.FormatType.BINARY) {
            // FIXME
          } else if (type == ol.format.FormatType.JSON) {
            source = xhrIo.getResponseJson();
          } else if (type == ol.format.FormatType.TEXT) {
            source = xhrIo.getResponseText();
          } else if (type == ol.format.FormatType.XML) {
            source = xhrIo.getResponseXml();
          } else {
            goog.asserts.fail();
          }
          if (goog.isDef(source)) {
            var features = this.readFeatures(source);
            var featureProjection = this.readProjection(source);
            callback.call(opt_obj, features, featureProjection);
          } else {
            goog.asserts.fail();
          }
        } else {
          // FIXME error handling
          goog.asserts.fail();
        }
      }, this));
};


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.geom.Geometry} Geometry.
 */
ol.format.Format.prototype.readGeometry = goog.abstractMethod;


/**
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 */
ol.format.Format.prototype.readProjection = goog.abstractMethod;


/**
 * @param {ol.Feature} feature Feature.
 * @return {Node|Object|string} Result.
 */
ol.format.Format.prototype.writeFeature = goog.abstractMethod;


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {Node|Object|string} Result.
 */
ol.format.Format.prototype.writeFeatures = goog.abstractMethod;


/**
 * @param {ol.geom.Geometry} geometry Geometry.
 * @return {Node|Object|string} Node.
 */
ol.format.Format.prototype.writeGeometry = goog.abstractMethod;
