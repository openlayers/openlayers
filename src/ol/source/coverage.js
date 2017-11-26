goog.provide('ol.source.Coverage');

goog.require('ol');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.ObjectEventType');
goog.require('ol.source.Source');
goog.require('ol.uri');


if (ol.ENABLE_COVERAGE) {

  /**
   * @classdesc
   * Abstract base class; normally only used for creating subclasses and not
   * instantiated in apps.
   * Base class for sources providing a single coverage.
   *
   * @constructor
   * @abstract
   * @extends {ol.source.Source}
   * @param {ol.CoverageSourceOptions} options Coverage source options.
   */
  ol.source.Coverage = function(options) {
    ol.source.Source.call(this, {
      attributions: options.attributions,
      logo: options.logo,
      projection: options.projection,
      state: options.state,
      wrapX: options.wrapX
    });

    /**
     * @private
     * @type {Array.<ol.coverage.Band>}
     */
    this.bands_ = [];

    /**
     * @private
     * @type {string|undefined}
     */
    this.url_ = options.wcsParams ? this.createWCSGetCoverageURL(options.url,
        options.wcsParams) : options.url;

    if (options.bands) {
      for (var i = 0; i < options.bands.length; ++i) {
        this.addBand(options.bands[i]);
      }
    } else {
      this.loadBands();
    }
  };
  ol.inherits(ol.source.Coverage, ol.source.Source);


  /**
   * @param {ol.coverage.Band} band Coverage band.
   */
  ol.source.Coverage.prototype.addBand = function(band) {
    this.bands_.push(band);
    this.setupChangeEvents_(band);
    this.changed();
  };


  /**
   * @param {ol.coverage.Band} band Coverage band.
   * @private
   */
  ol.source.Coverage.prototype.setupChangeEvents_ = function(band) {
    ol.events.listen(band, ol.events.EventType.CHANGE,
        this.handleCoverageChange_, this);
    ol.events.listen(band, ol.ObjectEventType.PROPERTYCHANGE,
        this.handleCoverageChange_, this);
  };


  /**
   * Get every coverage band from this source.
   * @return {Array.<ol.coverage.Band>} Coverage bands.
   * @api
   */
  ol.source.Coverage.prototype.getBands = function() {
    return this.bands_.slice();
  };


  /**
   * Get the extent of the bands in this source.
   * @return {ol.Extent|undefined} Extent.
   * @api
   */
  ol.source.Coverage.prototype.getExtent = function() {
    var bands = this.getBands();
    var extent = ol.extent.createEmpty();
    var i, ii;
    for (i = 0, ii = bands.length; i < ii; ++i) {
      ol.extent.extend(extent, bands[i].getExtent());
    }
    return extent;
  };


  /**
   * Used by the renderer for querying a band in an extent.
   * @abstract
   * @param {ol.Extent} extent Extent.
   * @param {number} index Band index.
   * @return {ol.coverage.Band} Single band.
   * @protected
   */
  ol.source.Coverage.prototype.getCoverage = function(extent, index) {};


  /**
   * @inheritDoc
   */
  ol.source.Coverage.prototype.getResolutions = function() {
    return undefined;
  };


  /**
   * Main function of every coverage source responsible for acquiring and parsing
   * coverage data.
   * @abstract
   * @protected
   */
  ol.source.Coverage.prototype.loadBands = function() {};


  /**
   * @param {string} url Base URL.
   * @param {olx.WCSParams} wcsParams WCS parameters.
   * @return {string} WCS GetCoverage URL.
   * @protected
   */
  ol.source.Coverage.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
    var version = wcsParams.version === '1.0.0' ? '1.0.0' : ol.DEFAULT_WCS_VERSION;

    var baseParams = {
      'SERVICE': 'WCS',
      'REQUEST': 'GetCoverage',
      'VERSION': version
    };

    switch (version) {
      case '1.0.0':
        baseParams['BBOX'] = wcsParams.extent.join(',');
        baseParams['CRS'] = this.getProjection().getCode();
        baseParams['COVERAGE'] = wcsParams.layer;
        if (wcsParams.resolution) {
          var res = wcsParams.resolution;
          baseParams['RESX'] = Array.isArray(res) ? res[0] : res;
          baseParams['RESY'] = Array.isArray(res) ? res[1] : res;
        } else if (wcsParams.size) {
          baseParams['WIDTH'] = wcsParams.size[0];
          baseParams['HEIGHT'] = wcsParams.size[1];
        }
        break;
      case '2.0.1':
        baseParams['COVERAGEID'] = wcsParams.layer;
        break;
      default:
        break;
    }

    if (wcsParams.params) {
      ol.obj.assign(baseParams, wcsParams.params);
    }

    return ol.uri.appendParams(url, baseParams);
  };


  /**
   * Returns the URL associated to this source, if any.
   * @return {string|undefined} URL.
   * @api
   */
  ol.source.Coverage.prototype.getURL = function() {
    return this.url_;
  };


  /**
   * Handle coverage change events.
   * @param {ol.events.Event} event Event.
   * @private
   */
  ol.source.Coverage.prototype.handleCoverageChange_ = function(event) {
    var band = /** @type {ol.coverage.Band} */ (event.target);
    this.changed();
    this.dispatchEvent(new ol.source.Coverage.Event(
        ol.source.Coverage.EventType_.CHANGEBAND, band));
  };


  /**
   * @classdesc
   * Events emitted by {@link ol.source.Coverage} instances are instances of this
   * type.
   *
   * @constructor
   * @extends {ol.events.Event}
   * @implements {oli.source.CoverageEvent}
   * @param {string} type Type.
   * @param {ol.coverage.Band} band The coverage band.
   */
  ol.source.Coverage.Event = function(type, band) {

    ol.events.Event.call(this, type);

    /**
     * The coverage band related to the event.
     * @type {ol.coverage.Band}
     * @api
     */
    this.band = band;

  };
  ol.inherits(ol.source.Coverage.Event, ol.events.Event);


  /**
   * @enum {string}
   * @private
   */
  ol.source.Coverage.EventType_ = {

    /**
     * Triggered when a coverage band is changed.
     * @event ol.source.Coverage.Event#changeband
     * @api
     */
    CHANGEBAND: 'changeband'

  };

}
