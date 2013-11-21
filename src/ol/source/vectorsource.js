goog.provide('ol.source.Vector');

goog.require('goog.asserts');
goog.require('goog.net.XhrIo');
goog.require('ol.source.Source');


/**
 * @enum {number}
 */
ol.source.VectorLoadState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorOptions} options Vector source options.
 * @todo stability experimental
 */
ol.source.Vector = function(options) {

  /**
   * @private
   * @type {Object|string}
   */
  this.data_ = goog.isDef(options.data) ? options.data : null;

  /**
   * @private
   * @type {ol.source.VectorLoadState}
   */
  this.loadState_ = ol.source.VectorLoadState.IDLE;

  /**
   * @private
   * @type {ol.parser.Parser}
   */
  this.parser_ = goog.isDef(options.parser) ? options.parser : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = options.url;

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });
};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * @param {ol.layer.Vector} layer Layer that parses the data.
 * @param {ol.Extent} extent Extent that needs to be fetched.
 * @param {ol.proj.Projection} projection Projection of the view.
 * @param {function()=} opt_callback Callback which is called when features are
 *     parsed after loading.
 * @return {ol.source.VectorLoadState} The current load state.
 */
ol.source.Vector.prototype.prepareFeatures = function(layer, extent, projection,
    opt_callback) {
  // TODO: Implement strategies. BBOX aware strategies will need the extent.
  if (goog.isDef(this.url_) &&
      this.loadState_ == ol.source.VectorLoadState.IDLE) {
    this.loadState_ = ol.source.VectorLoadState.LOADING;
    goog.net.XhrIo.send(this.url_, goog.bind(function(event) {
      var xhr = event.target;
      if (xhr.isSuccess()) {
        // TODO: Get source projection from data if supported by parser.
        layer.parseFeatures(xhr.getResponseText(), this.parser_, projection);
        this.loadState_ = ol.source.VectorLoadState.LOADED;
        if (goog.isDef(opt_callback)) {
          opt_callback();
        }
      } else {
        // TODO: Error handling.
        this.loadState_ = ol.source.VectorLoadState.ERROR;
      }
    }, this));
  } else if (!goog.isNull(this.data_)) {
    layer.parseFeatures(this.data_, this.parser_, projection);
    this.data_ = null;
    this.loadState_ = ol.source.VectorLoadState.LOADED;
  }
  return this.loadState_;
};
