/**
 * @module ol/source/GeoTIFF
 */
import {inherits} from '../index.js';
import {assert} from '../asserts.js';
import {TYPED_ARRAY} from '../has.js';
import CoverageSource from './Coverage.js';
import State from './State.js';
import {intersects} from '../extent.js';
import {appendParams} from '../uri.js';
import {get as getGeoTIFF, set as setGeoTIFF} from '../coverage/geotiff.js';
import Band from '../coverage/Band.js';
import MatrixType from '../coverage/MatrixType.js';
import Matrix from '../coverage/Matrix.js';


/**
* @classdesc
* Layer source for GeoTIFF rasters.
*
* @constructor
* @extends {ol.source.Coverage}
* @fires ol.source.Coverage.Event
* @param {olx.source.GeoTIFFOptions=} options Options.
* @api
*/
const GeoTIFF = function(options) {

  assert(options.raster || options.url, 63);
  assert(TYPED_ARRAY, 60);

  /**
   * @private
   * @type {ArrayBuffer|undefined}
   */
  this.data_ = options.data;

  /**
   * @private
   * @type {ol.Extent|undefined}
   */
  this.extent_ = options.wcsParams ? options.wcsParams.extent : undefined;

  CoverageSource.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    state: State.UNDEFINED,
    url: options.url,
    wcsParams: options.wcsParams,
    wrapX: options.wrapX
  });
};

inherits(GeoTIFF, CoverageSource);


/**
 * @inheritDoc
 */
GeoTIFF.prototype.getCoverage = function(extent, index) {
  const band = this.getBands()[index];
  const rasterExtent = band.getExtent();
  if (rasterExtent && intersects(extent, rasterExtent)) {
    return band;
  }
  return null;
};


/**
 * @inheritDoc
 */
GeoTIFF.prototype.loadBands = function() {
  if (this.getURL()) {
    this.loadCoverageXhr_();
  } else {
    this.parseCoverage_();
  }
};


/**
 * @inheritDoc
 */
GeoTIFF.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
  const getCoverageURL = CoverageSource.prototype.createWCSGetCoverageURL.call(
    this, url, wcsParams);
  const geoTiffParams = {};
  geoTiffParams['FORMAT'] = wcsParams.format ? wcsParams.format : 'image/tiff';

  return appendParams(getCoverageURL, geoTiffParams);
};


/**
 * @private
 */
GeoTIFF.prototype.loadCoverageXhr_ = function() {
  this.setState(State.LOADING);

  const xhr = new XMLHttpRequest();
  const url = /** @type {string} */ (this.getURL());
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  /**
   * @param {Event} event Event.
   * @private
   */
  xhr.onload = function(event) {
    // status will be 0 for file:// urls
    if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
      const source = xhr.response;
      if (source) {
        this.data_ = /**  @type {ArrayBuffer} */ (source);
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
GeoTIFF.prototype.parseCoverage_ = function() {
  if (this.getState() !== State.LOADING) {
    this.setState(State.LOADING);
  }

  const GeoTIFF = getGeoTIFF();
  assert(GeoTIFF, 64);

  const tiff = GeoTIFF.parse(/** @type {ArrayBuffer} */ (this.data_));
  const numImages = tiff.getImageCount();
  let image, bands, height, width, resolution, extent, matrix, type, origin,
      nodata, i, j;

  for (i = 0; i < numImages; ++i) {
    image = tiff.getImage(i);
    height = image.getHeight();
    width = image.getWidth();
    bands = image.readRasters();
    nodata =  image.getFileDirectory() ? parseFloat(
      /** @type {string} */ (image.getFileDirectory()['GDAL_NODATA'])) : undefined;

    try {
      resolution = image.getResolution().slice(0, 2);
      origin = image.getOrigin();
      extent = [origin[0], origin[1] - resolution[1] * height,
        origin[0] + resolution[0] * width, origin[1]];

    } catch (err) {
      if (this.extent_) {
        // We calculate the resolution, if it is a WCS request, and the extent
        // is provided.
        extent = this.extent_;
        resolution = [
          (extent[2] - extent[0]) / width,
          (extent[3] - extent[1]) / height
        ];

      } else {
        this.setState(State.ERROR);
        continue;
      }
    }
    for (j = 0; j < bands.length; ++j) {
      matrix = bands[j];
      type = this.getType_(matrix);
      this.addBand(new Band({
        extent: extent,
        nodata: nodata,
        matrix: matrix.buffer,
        resolution: resolution,
        stride: width,
        type: type
      }));
    }

  }
  this.data_ = undefined;

  if (this.getState() === State.LOADING) {
    this.setState(State.READY);
  }
};


/**
 * @param {ol.TypedArray} typedArr Typed array.
 * @returns {ol.coverage.MatrixType} Raster type.
 * @private
 */
GeoTIFF.prototype.getType_ = function(typedArr) {
  let ctor, i;
  const types = MatrixType;
  for (i in types) {
    ctor = Matrix.getArrayConstructor(types[i]);
    if (typedArr instanceof ctor) {
      return types[i];
    }
  }
  return types.FLOAT32;
};


/**
 * Register GeoTIFF. If not explicitly registered, it will be assumed that
 * GeoTIFF will be loaded in the global namespace.
 *
 * @param {GeoTIFF} geotiff GeoTIFF.
 * @api
 */
GeoTIFF.setGeoTIFF = function(geotiff) {
  setGeoTIFF(geotiff);
};
export default GeoTIFF;
