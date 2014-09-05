// FIXME consider delaying feature reading so projection can be provided by
// consumer (e.g. the view)

goog.provide('ol.source.FormatVector');

goog.require('goog.asserts');
goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('goog.userAgent');
goog.require('ol.format.FormatType');
goog.require('ol.has');
goog.require('ol.source.State');
goog.require('ol.source.Vector');
goog.require('ol.xml');



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for vector sources in one of the supported formats.
 *
 * @constructor
 * @extends {ol.source.Vector}
 * @param {olx.source.FormatVectorOptions} options Options.
 */
ol.source.FormatVector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @protected
   * @type {ol.format.Feature}
   */
  this.format = options.format;

};
goog.inherits(ol.source.FormatVector, ol.source.Vector);


/**
 * @param {goog.Uri|string} url URL.
 * @param {function(this: T, Array.<ol.Feature>)} callback Callback.
 * @param {T} thisArg Value to use as `this` when executing `callback`.
 * @template T
 */
ol.source.FormatVector.prototype.loadFeaturesFromURL =
    function(url, callback, thisArg) {
  var xhrIo = new goog.net.XhrIo();
  var type = this.format.getType();
  var responseType;
  // FIXME maybe use ResponseType.DOCUMENT?
  if (type == ol.format.FormatType.BINARY &&
      ol.has.ARRAY_BUFFER) {
    responseType = goog.net.XhrIo.ResponseType.ARRAY_BUFFER;
  } else {
    responseType = goog.net.XhrIo.ResponseType.TEXT;
  }
  xhrIo.setResponseType(responseType);
  goog.events.listen(xhrIo, goog.net.EventType.COMPLETE,
      /**
       * @param {Event} event Event.
       * @private
       * @this {ol.source.FormatVector}
       */
      function(event) {
        var xhrIo = event.target;
        goog.asserts.assertInstanceof(xhrIo, goog.net.XhrIo);
        if (xhrIo.isSuccess()) {
          var type = this.format.getType();
          /** @type {ArrayBuffer|Document|Node|Object|string|undefined} */
          var source;
          if (type == ol.format.FormatType.BINARY &&
              ol.has.ARRAY_BUFFER) {
            source = xhrIo.getResponse();
            goog.asserts.assertInstanceof(source, ArrayBuffer);
          } else if (type == ol.format.FormatType.JSON) {
            source = xhrIo.getResponseText();
          } else if (type == ol.format.FormatType.TEXT) {
            source = xhrIo.getResponseText();
          } else if (type == ol.format.FormatType.XML) {
            if (!goog.userAgent.IE) {
              source = xhrIo.getResponseXml();
            }
            if (!goog.isDefAndNotNull(source)) {
              source = ol.xml.load(xhrIo.getResponseText());
            }
          } else {
            goog.asserts.fail();
          }
          if (goog.isDefAndNotNull(source)) {
            callback.call(thisArg, this.readFeatures(source));
          } else {
            this.setState(ol.source.State.ERROR);
            goog.asserts.fail();
          }
        } else {
          this.setState(ol.source.State.ERROR);
        }
        goog.dispose(xhrIo);
      }, false, this);
  xhrIo.send(url);
};


/**
 * @param {ArrayBuffer|Document|Node|Object|string} source Source.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
ol.source.FormatVector.prototype.readFeatures = function(source) {
  var format = this.format;
  var projection = this.getProjection();
  return format.readFeatures(source, {featureProjection: projection});
};
