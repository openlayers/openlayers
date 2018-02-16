/**
 * @module ol/source/ArcGrid
 */
import {inherits} from '../index.js';
import {assert} from '../asserts.js';
import CoverageSource from './Coverage.js';
import MatrixType from '../coverage/MatrixType.js';
import State from './State.js';
import {intersects} from '../extent.js';
import {appendParams} from '../uri.js';
import Band from '../coverage/Band.js';
import CoverageType from '../coverage/CoverageType.js';


/**
* @classdesc
* Layer source for raster data in ArcInfo ASCII Grid format.
*
* @constructor
* @extends {ol.source.Coverage}
* @fires ol.source.Coverage.Event
* @param {olx.source.ArcGridOptions=} options Options.
* @api
 */
const ArcGrid = function(options) {

  assert(options.raster || options.url, 63);

  /**
   * @private
   * @type {string|undefined}
   */
  this.data_ = options.data;


  /**
   * @private
   * @type {ol.coverage.MatrixType}
   */
  this.dataType_ = options.dataType || MatrixType.FLOAT32;

  CoverageSource.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    state: State.UNDEFINED,
    type: options.type,
    url: options.url,
    wcsParams: options.wcsParams,
    wrapX: options.wrapX
  });
};

inherits(ArcGrid, CoverageSource);


/**
 * @inheritDoc
 */
ArcGrid.prototype.getCoverage = function(extent, index) {
  const band = this.getBands()[0];
  const coverageExtent = band.getExtent();
  if (coverageExtent && intersects(extent, coverageExtent)) {
    return band;
  }
  return null;
};


/**
 * @inheritDoc
 */
ArcGrid.prototype.loadBands = function() {
  if (this.getURL()) {
    this.loadCoverageXhr_();
  } else {
    this.parseCoverage_();
  }
};


/**
 * @inheritDoc
 */
ArcGrid.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
  const getCoverageURL = CoverageSource.prototype.createWCSGetCoverageURL.call(
    this, url, wcsParams);
  const arcGridParams = {};
  arcGridParams['FORMAT'] = wcsParams.format ? wcsParams.format : 'ArcGrid';

  return appendParams(getCoverageURL, arcGridParams);
};


/**
 * @private
 */
ArcGrid.prototype.loadCoverageXhr_ = function() {
  this.setState(State.LOADING);

  const xhr = new XMLHttpRequest();
  const url = /** @type {string} */ (this.getURL());
  xhr.open('GET', url, true);
  /**
   * @param {Event} event Event.
   * @private
   */
  xhr.onload = function(event) {
    // status will be 0 for file:// urls
    if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
      const source = xhr.responseText;
      if (source) {
        this.data_ = source;
        this.parseCoverage_();
      } else {
        this.setState(State.ERROR);
      }
    } else {
      this.setState(State.ERROR);
    }
  }.bind(this);
  /**
   * @private
   */
  xhr.onerror = function() {
    this.setState(State.ERROR);
  }.bind(this);
  xhr.send();
};


/**
 * @private
 */
ArcGrid.prototype.parseCoverage_ = function() {
  if (this.getState() !== State.LOADING) {
    this.setState(State.LOADING);
  }

  const source = this.data_.split('\n');
  let i, ii;

  // Parse the header and check for its validity.
  const header = {};
  for (i = 0; i < 6; ++i) {
    const headerElem = source[i].split(' ');
    const headerName = headerElem[0].toUpperCase();
    header[headerName] = parseFloat(headerElem[1]);
  }
  if (!('NCOLS' in header && 'NROWS' in header && 'XLLCORNER' in header &&
      'YLLCORNER' in header && 'CELLSIZE' in header &&
      'NODATA_VALUE' in header && Object.keys(header).length === 6)) {
    this.setState(State.ERROR);
    return;
  }

  // Parse the raster.
  let matrix = [];
  for (i = 6, ii = source.length; i < ii; ++i) {
    matrix = matrix.concat(source[i].split(' ').map(parseFloat));
  }

  // Calculate and set the layer's extent.
  const extent = [header['XLLCORNER'], header['YLLCORNER']];
  extent.push(header['XLLCORNER'] + header['CELLSIZE'] * header['NCOLS']);
  extent.push(header['YLLCORNER'] + header['CELLSIZE'] * header['NROWS']);

  // Create a band from the parsed data.
  const band = new Band({
    extent: extent,
    nodata: header['NODATA_VALUE'],
    matrix: matrix,
    resolution: [header['CELLSIZE'], header['CELLSIZE']],
    stride: /** @type {number} */ (header['NCOLS']),
    type: this.dataType_
  });
  this.addBand(band);

  // Default type to rectangular.
  if (!this.getType()) {
    this.setType(CoverageType.RECTANGULAR);
  }

  this.data_ = undefined;
  this.setState(State.READY);
};
export default ArcGrid;
