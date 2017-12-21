goog.provide('ol.source.ArcGrid');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.coverage.Band');
goog.require('ol.coverage.MatrixType');
goog.require('ol.extent');
goog.require('ol.source.Coverage');
goog.require('ol.source.State');
goog.require('ol.uri');


if (ol.ENABLE_COVERAGE) {

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
  ol.source.ArcGrid = function(options) {

    ol.asserts.assert(options.raster || options.url, 63);

    /**
     * @private
     * @type {string|undefined}
     */
    this.data_ = options.data;


    /**
     * @private
     * @type {ol.coverage.MatrixType}
     */
    this.type_ = options.type || ol.coverage.MatrixType.FLOAT32;

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
  ol.inherits(ol.source.ArcGrid, ol.source.Coverage);


  /**
   * @inheritDoc
   */
  ol.source.ArcGrid.prototype.getCoverage = function(extent, index) {
    var band = this.getBands()[0];
    var coverageExtent = band.getExtent();
    if (coverageExtent && ol.extent.intersects(extent, coverageExtent)) {
      return band;
    }
    return null;
  };


  /**
   * @inheritDoc
   */
  ol.source.ArcGrid.prototype.loadBands = function() {
    if (this.getURL()) {
      this.loadCoverageXhr_();
    } else {
      this.parseCoverage_();
    }
  };


  /**
   * @inheritDoc
   */
  ol.source.ArcGrid.prototype.createWCSGetCoverageURL = function(url, wcsParams) {
    var getCoverageURL = ol.source.Coverage.prototype.createWCSGetCoverageURL.call(
        this, url, wcsParams);
    var arcGridParams = {};
    arcGridParams['FORMAT'] = wcsParams.format ? wcsParams.format : 'ArcGrid';

    return ol.uri.appendParams(getCoverageURL, arcGridParams);
  };


  /**
   * @private
   */
  ol.source.ArcGrid.prototype.loadCoverageXhr_ = function() {
    this.setState(ol.source.State.LOADING);

    var xhr = new XMLHttpRequest();
    var url = /** @type {string} */ (this.getURL());
    xhr.open('GET', url, true);
    /**
     * @param {Event} event Event.
     * @private
     */
    xhr.onload = function(event) {
      // status will be 0 for file:// urls
      if (!xhr.status || xhr.status >= 200 && xhr.status < 300) {
        var source = xhr.responseText;
        if (source) {
          this.data_ = source;
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
  ol.source.ArcGrid.prototype.parseCoverage_ = function() {
    if (this.getState() !== ol.source.State.LOADING) {
      this.setState(ol.source.State.LOADING);
    }

    var source = this.data_.split('\n');
    var i, ii;

    // Parse the header and check for its validity.
    var header = {};
    for (i = 0; i < 6; ++i) {
      var headerElem = source[i].split(' ');
      var headerName = headerElem[0].toUpperCase();
      header[headerName] = parseFloat(headerElem[1]);
    }
    if (!('NCOLS' in header && 'NROWS' in header && 'XLLCORNER' in header &&
        'YLLCORNER' in header && 'CELLSIZE' in header &&
        'NODATA_VALUE' in header && Object.keys(header).length === 6)) {
      this.setState(ol.source.State.ERROR);
      return;
    }

    // Parse the raster.
    var matrix = [];
    for (i = 6, ii = source.length; i < ii; ++i) {
      matrix = matrix.concat(source[i].split(' ').map(parseFloat));
    }

    // Calculate and set the layer's extent.
    var extent = [header['XLLCORNER'], header['YLLCORNER']];
    extent.push(header['XLLCORNER'] + header['CELLSIZE'] * header['NCOLS']);
    extent.push(header['YLLCORNER'] + header['CELLSIZE'] * header['NROWS']);

    // Create a band from the parsed data.
    var band = new ol.coverage.Band({
      extent: extent,
      nodata: header['NODATA_VALUE'],
      matrix: matrix,
      resolution: [header['CELLSIZE'], header['CELLSIZE']],
      stride: /** @type {number} */ (header['NCOLS']),
      type: this.type_
    });
    this.addBand(band);

    this.data_ = undefined;
    this.setState(ol.source.State.READY);
  };

}
