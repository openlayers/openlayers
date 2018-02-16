/**
 * @module ol/source/Coverage
 */
import {inherits} from '../index.js';
import Source from './Source.js';
import {get as getProjection, equivalent} from '../proj.js';
import {unlistenByKey, listen} from '../events.js';
import EventType from '../events/EventType.js';
import ObjectEventType from '../ObjectEventType.js';
import {ENABLE_RASTER_REPROJECTION} from '../reproj/common.js';
import State from './State.js';
import {createEmpty, extend, equals, intersects} from '../extent.js';
import ReprojImage from '../reproj/Image.js';
import CoverageImage from '../coverage/Image.js';
import {alignRasterBands} from '../coverage/util.js';
import Band from '../coverage/Band.js';
import MatrixType from '../coverage/MatrixType.js';
import {DEFAULT_WCS_VERSION} from './common.js';
import {assign} from '../obj.js';
import {appendParams} from '../uri.js';
import Event from '../events/Event.js';


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
const CoverageSource = function(options) {
  Source.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: getProjection(options.projection),
    state: options.state,
    wrapX: options.wrapX
  });

  /**
   * @private
   * @type {ol.coverage.CoverageType|null}
   */
  this.type_ = options.type;

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
    for (let i = 0; i < options.bands.length; ++i) {
      this.addBand(options.bands[i]);
    }
  } else {
    this.loadBands();
  }
};

inherits(CoverageSource, Source);


/**
 * @param {ol.coverage.Band} band Coverage band.
 */
CoverageSource.prototype.addBand = function(band) {
  this.bands_.push(band);
  this.setupChangeEvents_(band);
  this.changed();
};


/**
 * @param {ol.CoverageStyle|null} style Style.
 */
CoverageSource.prototype.setStyle = function(style) {
  if (this.styleInitKey_) {
    unlistenByKey(this.styleInitKey_);
    this.styleInitKey_ = null;
  }
  this.style_ = style;
  if (style) {
    if (this.getState() === State.READY && this.getBands()) {
      this.style_.fillMissingValues(this.getBands());
    } else {
      this.styleInitKey_ = listen(this, EventType.CHANGE,
        function() {
          if (this.getState() === State.READY) {
            this.style_.fillMissingValues(this.getBands());
            unlistenByKey(this.styleInitKey_);
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
CoverageSource.prototype.setCoverageDrawFunction = function(coverageDrawFunc) {
  this.coverageDrawFunction_ = coverageDrawFunc;
  this.changed();
  this.rerenderRevision_ = this.getRevision();
};


/**
 * @param {ol.coverage.CoverageType|null|undefined} type Coverage type.
 */
CoverageSource.prototype.setType = function(type) {
  this.type_ = type;
};


/**
 * @param {ol.coverage.Band} band Coverage band.
 * @private
 */
CoverageSource.prototype.setupChangeEvents_ = function(band) {
  listen(band, EventType.CHANGE,
    this.handleCoverageChange_, this);
  listen(band, EventType.CHANGE,
    function() {
      const bandIndex = this.getBands().indexOf(band);
      const styleIndex = this.style_.getBandIndex();
      if (styleIndex.length) {
        if (styleIndex.indexOf(bandIndex) > -1) {
          this.rerenderRevision_ = this.getRevision();
        }
      } else if (styleIndex === bandIndex) {
        this.rerenderRevision_ = this.getRevision();
      }
    }, this);
  listen(band, ObjectEventType.PROPERTYCHANGE,
    this.handleCoverageChange_, this);
};


/**
 * Get every coverage band from this source.
 * @return {Array.<ol.coverage.Band>} Coverage bands.
 * @api
 */
CoverageSource.prototype.getBands = function() {
  return this.bands_.slice();
};


/**
 * Get the extent of the bands in this source.
 * @return {ol.Extent} Extent.
 * @api
 */
CoverageSource.prototype.getExtent = function() {
  const bands = this.getBands();
  const extent = createEmpty();
  let i, ii;
  for (i = 0, ii = bands.length; i < ii; ++i) {
    extend(extent, bands[i].getExtent());
  }
  return extent;
};


/**
 * @return {ol.coverage.CoverageType|null|undefined} Coverage type.
 */
CoverageSource.prototype.getType = function() {
  return this.type_;
};


/**
 * Used by the coverage renderer for querying a band in an extent.
 * @abstract
 * @param {ol.Extent} extent Extent.
 * @param {number} index Band index.
 * @return {ol.coverage.Band} Single band.
 * @protected
 */
CoverageSource.prototype.getCoverage = function(extent, index) {};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.ImageBase} Single image.
 */
CoverageSource.prototype.getImage = function(extent, resolution, pixelRatio, projection) {
  const sourceProjection = this.getProjection();
  if (!ENABLE_RASTER_REPROJECTION ||
      !sourceProjection ||
      !projection ||
      equivalent(sourceProjection, projection)) {
    if (sourceProjection) {
      projection = sourceProjection;
    }
    return this.getImageInternal(extent, resolution, pixelRatio);
  } else {
    if (this.reprojectedImage_) {
      if (this.reprojectedRevision_ == this.getRevision() &&
          equivalent(
            this.reprojectedImage_.getProjection(), projection) &&
          this.reprojectedImage_.getResolution() == resolution &&
          this.style_.getChecksum() === this.renderedChecksum_ &&
          equals(this.reprojectedImage_.getExtent(), extent)) {
        return this.reprojectedImage_;
      }
      this.reprojectedImage_.dispose();
      this.reprojectedImage_ = null;
    }

    this.reprojectedImage_ = new ReprojImage(
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
CoverageSource.prototype.getImageInternal = function(extent, resolution, pixelRatio) {
  if (this.getState() === State.READY &&
    intersects(extent, this.getExtent())) {
    if (this.image_ && this.renderedRevision_ >= this.rerenderRevision_ &&
        this.style_.getChecksum() === this.renderedChecksum_) {
      this.image_.updateResolution(extent);
      return this.image_;
    } else {
      const styledBand = this.getStyledBand();
      if (styledBand) {
        this.image_ = new CoverageImage(styledBand.getExtent(), pixelRatio,
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
 * @return {?ol.coverage.Band} A new band with styled interleaved data.
 */
CoverageSource.prototype.getStyledBand = function() {
  let styledMatrix;
  const bandIndex = this.style_.getBandIndex();
  if (Array.isArray(bandIndex)) {
    const bands = this.getBands();
    const toAlign = [];
    const nulls = [];
    let i, ii;
    for (i = 0, ii = bandIndex.length; i < ii; ++i) {
      if (bandIndex[i] !== undefined) {
        toAlign.push(bands[bandIndex[i]]);
        nulls.push(bands[bandIndex[i]].getNullValue());
      }
    }
    const aligned = alignRasterBands(toAlign, this.getType());
    styledMatrix = this.style_.apply(aligned.matrices, nulls);
    return new Band({
      binary: false,
      extent: aligned.properties.extent,
      matrix: styledMatrix,
      stride: aligned.properties.stride,
      resolution: aligned.properties.resolution,
      type: MatrixType.UINT8
    });
  } else if (bandIndex !== undefined) {
    const band = this.getBands()[/** @type {number} */ (bandIndex)];
    styledMatrix = this.style_.apply(band.getCoverageData(), band.getNullValue());
    return new Band({
      binary: false,
      extent: band.getExtent(),
      matrix: styledMatrix,
      stride: band.getStride(),
      resolution: band.getResolution(),
      type: MatrixType.UINT8
    });
  }
  return null;
};


/**
 * @inheritDoc
 */
CoverageSource.prototype.getResolutions = function() {
  return undefined;
};


/**
 * Main function of every coverage source responsible for acquiring and parsing
 * coverage data.
 * @abstract
 * @protected
 */
CoverageSource.prototype.loadBands = function() {};


/**
 * @param {string} url Base URL.
 * @param {olx.WCSParams} wcsParams WCS parameters.
 * @return {string} WCS GetCoverage URL.
 * @protected
 */
CoverageSource.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
  const version = wcsParams.version === '1.0.0' ? '1.0.0' : DEFAULT_WCS_VERSION;

  const baseParams = {
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
        const res = wcsParams.resolution;
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
    assign(baseParams, wcsParams.params);
  }

  return appendParams(url, baseParams);
};


/**
 * Returns the URL associated to this source, if any.
 * @return {string|undefined} URL.
 * @api
 */
CoverageSource.prototype.getURL = function() {
  return this.url_;
};


/**
 * Handle coverage change events.
 * @param {ol.events.Event} event Event.
 * @private
 */
CoverageSource.prototype.handleCoverageChange_ = function(event) {
  const band = /** @type {ol.coverage.Band} */ (event.target);
  this.changed();
  this.dispatchEvent(new CoverageSource.Event(
    CoverageSource.EventType_.CHANGEBAND, band));
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
CoverageSource.Event = function(type, band) {

  Event.call(this, type);

  /**
   * The coverage band related to the event.
   * @type {ol.coverage.Band}
   * @api
   */
  this.band = band;

};

inherits(CoverageSource.Event, Event);


/**
 * @enum {string}
 * @private
 */
CoverageSource.EventType_ = {

  /**
   * Triggered when a coverage band is changed.
   * @event ol.source.Coverage.Event#changeband
   * @api
   */
  CHANGEBAND: 'changeband'

};
export default CoverageSource;
