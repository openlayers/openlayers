goog.provide('ol.source.RasterBase');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.ObjectEventType');
goog.require('ol.source.Source');


if (ol.ENABLE_RASTER) {

  /**
   * @classdesc
   * Abstract base class; normally only used for creating subclasses and not
   * instantiated in apps.
   * Base class for sources providing a single raster.
   *
   * @constructor
   * @abstract
   * @extends {ol.source.Source}
   * @param {ol.RasterBaseOptions} options Raster source options.
   */
  ol.source.RasterBase = function(options) {
    ol.source.Source.call(this, {
      attributions: options.attributions,
      extent: options.extent,
      logo: options.logo,
      projection: options.projection,
      state: options.state
    });


    /**
     * @private
     * @type {Array.<ol.RasterBand>}
     */
    this.bands_ = [];

    var bands = options.bands ? options.bands : [];
    for (var i = 0; i < bands.length; ++i) {
      this.addBand(bands[i]);
    }
  };
  ol.inherits(ol.source.RasterBase, ol.source.Source);


  /**
   * Used by subclasses. Not designed for arbitrarily adding new bands.
   * @param {ol.RasterBand} band Raster band.
   * @protected
   */
  ol.source.RasterBase.prototype.addBand = function(band) {
    this.bands_.push(band);
    this.setupChangeEvents_(band);
    this.dispatchEvent(
        new ol.source.RasterBase.Event(ol.source.RasterBase.EventType_.ADDBAND, band));
    this.changed();
  };


  /**
   * @param {ol.RasterBand} band Raster band.
   * @private
   */
  ol.source.RasterBase.prototype.setupChangeEvents_ = function(band) {
    ol.events.listen(band, ol.events.EventType.CHANGE,
        this.handleRasterChange_, this);
    ol.events.listen(band, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleRasterChange_, this);
  };


  /**
   * @return {Array.<ol.RasterBand>} Raster bands.
   */
  ol.source.RasterBase.prototype.getBands = function() {
    return this.bands_;
  };


  /**
   * @param {number} index Band index.
   * @return {ol.RasterBand} Raster band.
   */
  ol.source.RasterBase.prototype.getBand = function(index) {
    return this.bands_[index];
  };


  /**
   * @abstract
   * @param {ol.Extent} extent Extent.
   * @param {number} index Band index.
   * @return {ol.RasterBand} Single band.
   * @protected
   */
  ol.source.RasterBase.prototype.getRaster = function(extent, index) {};


  /**
   * Handle raster change events.
   * @param {ol.events.Event} event Event.
   * @private
   */
  ol.source.RasterBase.prototype.handleRasterChange_ = function(event) {
    var band = /** @type {ol.RasterBand} */ (event.target);
    this.changed();
    this.dispatchEvent(new ol.source.RasterBase.Event(
        ol.source.RasterBase.EventType_.CHANGEBAND, band));
  };


  /**
   * @classdesc
   * Events emitted by {@link ol.source.RasterBase} instances are instances of this
   * type.
   *
   * @constructor
   * @extends {ol.events.Event}
   * @implements {oli.source.RasterBaseEvent}
   * @param {string} type Type.
   * @param {ol.RasterBand} band The raster band.
   */
  ol.source.RasterBase.Event = function(type, band) {

    ol.events.Event.call(this, type);

    /**
     * The raster band related to the event.
     * @type {ol.RasterBand}
     * @api
     */
    this.band = band;

  };
  ol.inherits(ol.source.RasterBase.Event, ol.events.Event);


  /**
   * @enum {string}
   * @private
   */
  ol.source.RasterBase.EventType_ = {

    /**
     * Triggered when a raster band is added.
     * @event ol.source.RasterBase.Event#addband
     */
    ADDBAND: 'addband',

    /**
     * Triggered when a raster band is changed.
     * @event ol.source.RasterBase.Event#changeband
     * @api
     */
    CHANGEBAND: 'changeband'

  };

}
