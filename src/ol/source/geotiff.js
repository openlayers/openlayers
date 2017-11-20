goog.provide('ol.source.GeoTIFF');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.ext.GeoTIFF');
goog.require('ol.extent');
goog.require('ol.has');
goog.require('ol.Raster');
goog.require('ol.RasterBand');
goog.require('ol.RasterType');
goog.require('ol.source.RasterBase');
goog.require('ol.source.State');
goog.require('ol.uri');


if (ol.ENABLE_RASTER && ol.ENABLE_GEOTIFF) {

  /**
  * @classdesc
  * Layer source for GeoTIFF rasters.
  *
  * @constructor
  * @extends {ol.source.RasterBase}
  * @fires ol.source.RasterBase.Event
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
    this.raster_ = options.raster;

    /**
     * @private
     * @type {ol.Extent|undefined}
     */
    this.extent_ = options.wcsParams ? options.wcsParams.extent : undefined;

    ol.source.RasterBase.call(this, {
      attributions: options.attributions,
      logo: options.logo,
      projection: options.projection,
      state: ol.source.State.READY,
      url: options.url,
      wcsParams: options.wcsParams,
      wrapX: options.wrapX
    });
  };
  ol.inherits(ol.source.GeoTIFF, ol.source.RasterBase);


  /**
   * @inheritDoc
   */
  ol.source.GeoTIFF.prototype.getRaster = function(extent, index) {
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
      this.loadRasterXhr_();
    } else {
      this.parseRaster_();
    }
  };


  /**
   * @inheritDoc
   */
  ol.source.GeoTIFF.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
    var getCoverageURL = ol.source.RasterBase.prototype.createWCSGetCoverageURL.call(
        this, url, wcsParams);
    var geoTiffParams = {};
    geoTiffParams['FORMAT'] = wcsParams.format ? wcsParams.format : 'image/tiff';

    return ol.uri.appendParams(getCoverageURL, geoTiffParams);
  };


  /**
   * @private
   */
  ol.source.GeoTIFF.prototype.loadRasterXhr_ = function() {
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
          this.raster_ = source;
          this.parseRaster_();
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
  ol.source.GeoTIFF.prototype.parseRaster_ = function() {
    if (this.getState() !== ol.source.State.LOADING) {
      this.setState(ol.source.State.LOADING);
    }

    var tiff = ol.ext.GeoTIFF.parse(this.raster_);
    var numBands = tiff.getImageCount();
    var band, buffer, height, width, resolution, extent, raster, type, nodata, i;

    for (i = 0; i < numBands; ++i) {
      band = tiff.getImage(i);
      height = band.getHeight();
      width = band.getWidth();
      raster = band.readRasters()[0];
      buffer = raster.buffer;
      nodata = band.getFileDirectory() ? parseFloat(
          band.getFileDirectory().GDAL_NODATA) : undefined;
      type = this.getType_(raster);

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
      this.addBand(new ol.RasterBand({
        extent: extent,
        nodata: nodata,
        raster: buffer,
        resolution: resolution,
        stride: width,
        type: type
      }));

      this.raster_ = undefined;
    }

    if (this.getState() === ol.source.State.LOADING) {
      this.setState(ol.source.State.READY);
    }
  };


  /**
   * @param {ol.TypedArray} typedArr Typed array.
   * @returns {ol.RasterType} Raster type.
   * @private
   */
  ol.source.GeoTIFF.prototype.getType_ = function(typedArr) {
    var ctor, i;
    for (i in ol.RasterType) {
      ctor = ol.Raster.getArrayConstructor(ol.RasterType[i]);
      if (typedArr instanceof ctor) {
        return ol.RasterType[i];
      }
    }
    return ol.RasterType.FLOAT32;
  };

}
