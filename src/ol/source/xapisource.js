goog.provide('ol.source.XAPI');

goog.require('goog.asserts');
goog.require('goog.net.XhrIo');
goog.require('ol.proj');
goog.require('ol.source.Vector');



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.XAPIOptions} options Vector source options.
 */
ol.source.XAPI = function(options) {

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = goog.isDef(options.url) ?
      options.url : 'http://xapi.openstreetmap.org/api/0.6/';

  // use it
  this.url_;

  var attributions;
  if (goog.isDef(options.attributions)) {
    attributions = options.attributions;
  } else if (goog.isDef(options.attribution)) {
    attributions = [options.attribution];
  } else {
    attributions = ol.source.OSM.ATTRIBUTIONS;
  }

  goog.base(this, {
    attributions: attributions,
    projection: goog.isDef(options.projection) ?
        options.projection : ol.proj.get('EPSG:4326')
  });
};
goog.inherits(ol.source.XAPI, ol.source.Vector);


///**
// * @param {ol.layer.Vector} layer Layer that parses the data.
// * @param {ol.Extent} extent Extent that needs to be fetched.
// * @param {ol.Projection} projection Projection of the view.
// * @param {function()=} opt_callback Callback which is
//          called when features are parsed after loading.
// * @return {ol.source.VectorLoadState} The current load state.
// */
//ol.source.Vector.prototype.prepareFeatures = function(layer,
//    extent, projection, opt_callback) {
//  // TODO: Implement strategies. BBOX aware strategies will need the extent.
//  if (goog.isDef(this.url_) &&
//      this.loadState_ == ol.source.VectorLoadState.IDLE) {
//    this.loadState_ = ol.source.VectorLoadState.LOADING;
//    goog.net.XhrIo.send(this.url_, goog.bind(function(event) {
//      var xhr = event.target;
//      if (xhr.isSuccess()) {
//        // TODO: Get source projection from data if supported by parser.
//        layer.parseFeatures(xhr.getResponseText(), this.parser_, projection);
//        this.loadState_ = ol.source.VectorLoadState.LOADED;
//        if (goog.isDef(opt_callback)) {
//          opt_callback();
//        }
//      } else {
//        // TODO: Error handling.
//        this.loadState_ = ol.source.VectorLoadState.ERROR;
//      }
//    }, this));
//  } else if (!goog.isNull(this.data_)) {
//    layer.parseFeatures(this.data_, this.parser_, projection);
//    this.data_ = null;
//    this.loadState_ = ol.source.VectorLoadState.LOADED;
//  }
//  return this.loadState_;
//};
