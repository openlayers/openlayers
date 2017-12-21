goog.provide('ol.source.GeoTIFF');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.coverage.Band');
goog.require('ol.coverage.geotiff');
goog.require('ol.coverage.Matrix');
goog.require('ol.coverage.MatrixType');
goog.require('ol.extent');
goog.require('ol.has');
goog.require('ol.source.Coverage');
goog.require('ol.source.State');
goog.require('ol.uri');


if (ol.ENABLE_COVERAGE) {

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
  ol.source.GeoTIFF = function(options) {

    ol.asserts.assert(options.raster || options.url, 63);
    ol.asserts.assert(ol.has.TYPED_ARRAY, 60);

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

    ol.source.Coverage.call(this, {
      attributions: options.attributions,
      logo: options.logo,
      projection: options.projection,
      state: ol.source.State.UNDEFINED,
      url: options.url,
      wcsParams: options.wcsParams,
      wrapX: options.wrapX
    });
  };
  ol.inherits(ol.source.GeoTIFF, ol.source.Coverage);


  /**
   * @inheritDoc
   */
  ol.source.GeoTIFF.prototype.getCoverage = function(extent, index) {
    var band = this.getBands()[index];
    var rasterExtent = band.getExtent();
    if (rasterExtent && ol.extent.intersects(extent, rasterExtent)) {
      return band;
    }
    return null;
  };


  /**
   * @inheritDoc
   */
  ol.source.GeoTIFF.prototype.loadBands = function() {
    if (this.getURL()) {
      this.loadCoverageXhr_();
    } else {
      this.parseCoverage_();
    }
  };


  /**
   * @inheritDoc
   */
  ol.source.GeoTIFF.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
    var getCoverageURL = ol.source.Coverage.prototype.createWCSGetCoverageURL.call(
        this, url, wcsParams);
    var geoTiffParams = {};
    geoTiffParams['FORMAT'] = wcsParams.format ? wcsParams.format : 'image/tiff';

    return ol.uri.appendParams(getCoverageURL, geoTiffParams);
  };


  /**
   * @private
   */
  ol.source.GeoTIFF.prototype.loadCoverageXhr_ = function() {
    this.setState(ol.source.State.LOADING);

    var xhr = new XMLHttpRequest();
    var url = /** @type {string} */ (this.getURL());
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    /**
     * @param {Event} event Event.
     * @private
     */
    xhr.onload = function(event) {
      // status will be 0 for file:// urls
      if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
        var source = xhr.response;
        if (source) {
          this.data_ = /**  @type {ArrayBuffer} */ (source);
          this.parseCoverage_();
        } else {
          this.setState(ol.source.State.ERROR);
        }
      } else {
        this.setState(ol.source.State.ERROR);
      }
    }.bind(this);
    /**
     * @private
     */
    xhr.onerror = function() {
      this.setState(ol.source.State.ERROR);
    }.bind(this);
    xhr.send();
  };


  /**
   * @private
   */
  ol.source.GeoTIFF.prototype.parseCoverage_ = function() {
    if (this.getState() !== ol.source.State.LOADING) {
      this.setState(ol.source.State.LOADING);
    }

    var GeoTIFF = ol.coverage.geotiff.get();
    ol.asserts.assert(GeoTIFF, 64);

    var tiff = GeoTIFF.parse(/** @type {ArrayBuffer} */ (this.data_));
    var numBands = tiff.getImageCount();
    var band, buffer, height, width, resolution, extent, matrix, type, nodata, i;

    for (i = 0; i < numBands; ++i) {
      band = tiff.getImage(i);
      height = band.getHeight();
      width = band.getWidth();
      matrix = band.readRasters()[0];
      buffer = matrix.buffer;
      nodata =  band.getFileDirectory() ? parseFloat(
          /** @type {string} */ (band.getFileDirectory()['GDAL_NODATA'])) : undefined;
      type = this.getType_(matrix);

      try {
        resolution = band.getResolution().slice(0, 2);
        extent = band.getBoundingBox();

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
          this.setState(ol.source.State.ERROR);
          continue;
        }
      }
      this.addBand(new ol.coverage.Band({
        extent: extent,
        nodata: nodata,
        matrix: buffer,
        resolution: resolution,
        stride: width,
        type: type
      }));

      this.data_ = undefined;
    }

    if (this.getState() === ol.source.State.LOADING) {
      this.setState(ol.source.State.READY);
    }
  };


  /**
   * @param {ol.TypedArray} typedArr Typed array.
   * @returns {ol.coverage.MatrixType} Raster type.
   * @private
   */
  ol.source.GeoTIFF.prototype.getType_ = function(typedArr) {
    var ctor, i;
    var types = ol.coverage.MatrixType;
    for (i in types) {
      ctor = ol.coverage.Matrix.getArrayConstructor(types[i]);
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
  ol.source.GeoTIFF.setGeoTIFF = function(geotiff) {
    ol.coverage.geotiff.set(geotiff);
  };

}
