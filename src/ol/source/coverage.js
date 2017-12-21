goog.provide('ol.source.Coverage');

goog.require('ol');
goog.require('ol.coverage.Band');
goog.require('ol.coverage.Image');
goog.require('ol.coverage.MatrixType');
goog.require('ol.coverage.util');
goog.require('ol.events');
goog.require('ol.events.Event');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.ObjectEventType');
goog.require('ol.proj');
goog.require('ol.reproj.Image');
goog.require('ol.source.Source');
goog.require('ol.source.State');
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
      projection: ol.proj.get(options.projection),
      state: options.state,
      wrapX: options.wrapX
    });

    /**
     * @private
     * @type {ol.CoverageStyle|null}
     */
    this.style_ = null;

    /**
     * @private
     * @type {?ol.EventsKey}
     */
    this.styleInitKey_ = null;

    /**
     * @private
     * @type {?ol.EventsKey}
     */
    this.styleChangeKey_ = null;

    /**
     * @private
     * @type {Array.<ol.coverage.Band>}
     */
    this.bands_ = [];

    /**
     * @private
     * @type {ol.coverage.Image}
     */
    this.image_ = null;

    /**
     * @private
     * @type {ol.reproj.Image}
     */
    this.reprojectedImage_ = null;

    /**
     * @private
     * @type {number}
     */
    this.reprojectedRevision_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.rerenderRevision_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = 0;

    /**
     * @private
     * @type {string}
     */
    this.renderedChecksum_ = '';

    /**
     * @private
     * @type {ol.CoverageDrawFunctionType|null}
     */
    this.coverageDrawFunction_ = null;

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
   * @param {ol.CoverageStyle|null} style Style.
   */
  ol.source.Coverage.prototype.setStyle = function(style) {
    if (this.styleInitKey_) {
      ol.events.unlistenByKey(this.styleInitKey_);
      this.styleInitKey_ = null;
    }
    this.style_ = style;
    if (style) {
      if (this.getState() === ol.source.State.READY && this.getBands()) {
        this.style_.fillMissingValues(this.getBands());
      } else {
        this.styleInitKey_ = ol.events.listen(this, ol.events.EventType.CHANGE,
            function() {
              if (this.getState() === ol.source.State.READY) {
                this.style_.fillMissingValues(this.getBands());
                ol.events.unlistenByKey(this.styleInitKey_);
                this.styleInitKey_ = null;
              }
            }, this);
      }
    }
    this.changed();
    this.rerenderRevision_ = this.getRevision();
  };


  /**
   * @param {ol.CoverageDrawFunctionType|null} coverageDrawFunc Coverage draw function.
   */
  ol.source.Coverage.prototype.setCoverageDrawFunction = function(coverageDrawFunc) {
    this.coverageDrawFunction_ = coverageDrawFunc;
    this.changed();
    this.rerenderRevision_ = this.getRevision();
  };


  /**
   * @param {ol.coverage.Band} band Coverage band.
   * @private
   */
  ol.source.Coverage.prototype.setupChangeEvents_ = function(band) {
    ol.events.listen(band, ol.events.EventType.CHANGE,
        this.handleCoverageChange_, this);
    ol.events.listen(band, ol.events.EventType.CHANGE,
        function() {
          var bandIndex = this.getBands().indexOf(band);
          var styleIndex = this.style_.getBandIndex();
          if (styleIndex.length) {
            if (styleIndex.indexOf(bandIndex) > -1) {
              this.rerenderRevision_ = this.getRevision();
            }
          } else if (styleIndex === bandIndex) {
            this.rerenderRevision_ = this.getRevision();
          }
        }, this);
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
   * @return {ol.Extent} Extent.
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
   * Used by the coverage renderer for querying a band in an extent.
   * @abstract
   * @param {ol.Extent} extent Extent.
   * @param {number} index Band index.
   * @return {ol.coverage.Band} Single band.
   * @protected
   */
  ol.source.Coverage.prototype.getCoverage = function(extent, index) {};


  /**
   * @param {ol.Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {ol.proj.Projection} projection Projection.
   * @return {ol.ImageBase} Single image.
   */
  ol.source.Coverage.prototype.getImage = function(extent, resolution, pixelRatio,
      projection) {
    var sourceProjection = this.getProjection();
    if (!ol.ENABLE_RASTER_REPROJECTION ||
        !sourceProjection ||
        !projection ||
        ol.proj.equivalent(sourceProjection, projection)) {
      if (sourceProjection) {
        projection = sourceProjection;
      }
      return this.getImageInternal(extent, resolution, pixelRatio);
    } else {
      if (this.reprojectedImage_) {
        if (this.reprojectedRevision_ == this.getRevision() &&
            ol.proj.equivalent(
                this.reprojectedImage_.getProjection(), projection) &&
            this.reprojectedImage_.getResolution() == resolution &&
            this.style_.getChecksum() === this.renderedChecksum_ &&
            ol.extent.equals(this.reprojectedImage_.getExtent(), extent)) {
          return this.reprojectedImage_;
        }
        this.reprojectedImage_.dispose();
        this.reprojectedImage_ = null;
      }

      this.reprojectedImage_ = new ol.reproj.Image(
          sourceProjection, projection, extent, resolution, pixelRatio,
          function(extent, resolution, pixelRatio) {
            return this.getImageInternal(extent, resolution, pixelRatio);
          }.bind(this), false);
      this.reprojectedRevision_ = this.getRevision();

      return this.reprojectedImage_;
    }
  };


  /**
   * @param {ol.Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @return {ol.coverage.Image} Single image.
   */
  ol.source.Coverage.prototype.getImageInternal = function(extent, resolution,
      pixelRatio) {
    if (this.getState() === ol.source.State.READY &&
      ol.extent.intersects(extent, this.getExtent())) {
      if (this.image_ && this.renderedRevision_ >= this.rerenderRevision_ &&
          this.style_.getChecksum() === this.renderedChecksum_) {
        this.image_.updateResolution(extent);
        return this.image_;
      } else {
        var styledBand = this.getStyledBand_();
        if (styledBand) {
          this.image_ = new ol.coverage.Image(styledBand.getExtent(), pixelRatio,
              this.getAttributions(), styledBand, this.coverageDrawFunction_);
          this.renderedRevision_ = this.getRevision();
          this.renderedChecksum_ = this.style_.getChecksum();
          return this.image_;
        }
      }
    }
    return null;
  };


  /**
   * Returns the color values of the styled band(s) in an interleaved array.
   * @private
   * @return {?ol.coverage.Band} A new band with styled interleaved data.
   */
  ol.source.Coverage.prototype.getStyledBand_ = function() {
    var styledMatrix;
    var bandIndex = this.style_.getBandIndex();
    if (Array.isArray(bandIndex)) {
      var bands = this.getBands();
      var toAlign = [];
      var nulls = [];
      var i, ii;
      for (i = 0, ii = bandIndex.length; i < ii; ++i) {
        if (bandIndex[i]) {
          toAlign.push(bands[bandIndex[i]]);
          nulls.push(bands[bandIndex[i]].getNullValue());
        }
      }
      var aligned = ol.coverage.util.alignRasterBands(toAlign);
      styledMatrix = this.style_.apply(aligned.matrices, nulls);
      return new ol.coverage.Band({
        binary: false,
        extent: aligned.extent,
        matrix: styledMatrix,
        stride: aligned.stride,
        resolution: aligned.resolution,
        type: ol.coverage.MatrixType.UINT8
      });
    } else if (bandIndex !== undefined) {
      var band = this.getBands()[/** @type {number} */ (bandIndex)];
      styledMatrix = this.style_.apply(band.getCoverageData(), band.getNullValue());
      return new ol.coverage.Band({
        binary: false,
        extent: band.getExtent(),
        matrix: styledMatrix,
        stride: band.getStride(),
        resolution: band.getResolution(),
        type: ol.coverage.MatrixType.UINT8
      });
    }
    return null;
  };


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
