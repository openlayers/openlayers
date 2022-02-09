/**
 * @module ol/source/GeoTIFF
 */
import DataTile from './DataTile.js';
import State from './State.js';
import TileGrid from '../tilegrid/TileGrid.js';
import {Pool, fromUrl as tiffFromUrl, fromUrls as tiffFromUrls} from 'geotiff';
import {
  Projection,
  get as getCachedProjection,
  toUserCoordinate,
  toUserExtent,
} from '../proj.js';
import {clamp} from '../math.js';
import {getCenter, getIntersection} from '../extent.js';
import {toSize} from '../size.js';
import {fromCode as unitsFromCode} from '../proj/Units.js';

/**
 * @typedef {Object} SourceInfo
 * @property {string} url URL for the source GeoTIFF.
 * @property {Array<string>} [overviews] List of any overview URLs.
 * @property {number} [min=0] The minimum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.  If not provided and raster statistics are available, those will be used instead.
 * If neither are available, the minimum for the data type will be used.  To disable this behavior, set
 * the `normalize` option to `false` in the constructor.
 * @property {number} [max] The maximum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.  If not provided and raster statistics are available, those will be used instead.
 * If neither are available, the maximum for the data type will be used.  To disable this behavior, set
 * the `normalize` option to `false` in the constructor.
 * @property {number} [nodata] Values to discard (overriding any nodata values in the metadata).
 * When provided, an additional alpha band will be added to the data.  Often the GeoTIFF metadata
 * will include information about nodata values, so you should only need to set this property if
 * you find that it is not already extracted from the metadata.
 * @property {Array<number>} [bands] Band numbers to be read from (where the first band is `1`). If not provided, all bands will
 * be read. For example, if a GeoTIFF has blue (1), green (2), red (3), and near-infrared (4) bands, and you only need the
 * near-infrared band, configure `bands: [4]`.
 */

/**
 * @typedef {Object} GeoKeys
 * @property {number} GTModelTypeGeoKey Model type.
 * @property {number} GTRasterTypeGeoKey Raster type.
 * @property {number} GeogAngularUnitsGeoKey Angular units.
 * @property {number} GeogInvFlatteningGeoKey Inverse flattening.
 * @property {number} GeogSemiMajorAxisGeoKey Semi-major axis.
 * @property {number} GeographicTypeGeoKey Geographic coordinate system code.
 * @property {number} ProjLinearUnitsGeoKey Projected linear unit code.
 * @property {number} ProjectedCSTypeGeoKey Projected coordinate system code.
 */

/**
 * @typedef {import("geotiff").GeoTIFF} GeoTIFF
 */

/**
 * @typedef {import("geotiff").MultiGeoTIFF} MultiGeoTIFF
 */

/**
 * @typedef {Object} GDALMetadata
 * @property {string} STATISTICS_MINIMUM The minimum value (as a string).
 * @property {string} STATISTICS_MAXIMUM The maximum value (as a string).
 */

const STATISTICS_MAXIMUM = 'STATISTICS_MAXIMUM';
const STATISTICS_MINIMUM = 'STATISTICS_MINIMUM';

/**
 * @typedef {import("geotiff").GeoTIFFImage} GeoTIFFImage
 */

let workerPool;
function getWorkerPool() {
  if (!workerPool) {
    workerPool = new Pool();
  }
  return workerPool;
}

/**
 * Get the bounding box of an image.  If the image does not have an affine transform,
 * the pixel bounds are returned.
 * @param {GeoTIFFImage} image The image.
 * @return {Array<number>} The image bounding box.
 */
function getBoundingBox(image) {
  try {
    return image.getBoundingBox();
  } catch (_) {
    const fileDirectory = image.fileDirectory;
    return [0, 0, fileDirectory.ImageWidth, fileDirectory.ImageLength];
  }
}

/**
 * Get the origin of an image.  If the image does not have an affine transform,
 * the top-left corner of the pixel bounds is returned.
 * @param {GeoTIFFImage} image The image.
 * @return {Array<number>} The image origin.
 */
function getOrigin(image) {
  try {
    return image.getOrigin().slice(0, 2);
  } catch (_) {
    return [0, image.fileDirectory.ImageLength];
  }
}

/**
 * Get the resolution of an image.  If the image does not have an affine transform,
 * the width of the image is compared with the reference image.
 * @param {GeoTIFFImage} image The image.
 * @param {GeoTIFFImage} referenceImage The reference image.
 * @return {number} The image resolution.
 */
function getResolution(image, referenceImage) {
  try {
    return image.getResolution(referenceImage)[0];
  } catch (_) {
    return (
      referenceImage.fileDirectory.ImageWidth / image.fileDirectory.ImageWidth
    );
  }
}

/**
 * @param {GeoTIFFImage} image A GeoTIFF.
 * @return {import("../proj/Projection.js").default} The image projection.
 */
function getProjection(image) {
  const geoKeys = image.geoKeys;
  if (!geoKeys) {
    return null;
  }

  if (geoKeys.ProjectedCSTypeGeoKey) {
    const code = 'EPSG:' + geoKeys.ProjectedCSTypeGeoKey;
    let projection = getCachedProjection(code);
    if (!projection) {
      const units = unitsFromCode(geoKeys.ProjLinearUnitsGeoKey);
      if (units) {
        projection = new Projection({
          code: code,
          units: units,
        });
      }
    }
    return projection;
  }

  if (geoKeys.GeographicTypeGeoKey) {
    const code = 'EPSG:' + geoKeys.GeographicTypeGeoKey;
    let projection = getCachedProjection(code);
    if (!projection) {
      const units = unitsFromCode(geoKeys.GeogAngularUnitsGeoKey);
      if (units) {
        projection = new Projection({
          code: code,
          units: units,
        });
      }
    }
    return projection;
  }

  return null;
}

/**
 * @param {GeoTIFF|MultiGeoTIFF} tiff A GeoTIFF.
 * @return {Promise<Array<GeoTIFFImage>>} Resolves to a list of images.
 */
function getImagesForTIFF(tiff) {
  return tiff.getImageCount().then(function (count) {
    const requests = new Array(count);
    for (let i = 0; i < count; ++i) {
      requests[i] = tiff.getImage(i);
    }
    return Promise.all(requests);
  });
}

/**
 * @param {SourceInfo} source The GeoTIFF source.
 * @param {object} options Options for the GeoTIFF source.
 * @return {Promise<Array<GeoTIFFImage>>} Resolves to a list of images.
 */
function getImagesForSource(source, options) {
  let request;
  if (source.overviews) {
    request = tiffFromUrls(source.url, source.overviews, options);
  } else {
    request = tiffFromUrl(source.url, options);
  }
  return request.then(getImagesForTIFF);
}

/**
 * @param {number|Array<number>|Array<Array<number>>} expected Expected value.
 * @param {number|Array<number>|Array<Array<number>>} got Actual value.
 * @param {number} tolerance Accepted tolerance in fraction of expected between expected and got.
 * @param {string} message The error message.
 * @param {function(Error):void} rejector A function to be called with any error.
 */
function assertEqual(expected, got, tolerance, message, rejector) {
  if (Array.isArray(expected)) {
    const length = expected.length;
    if (!Array.isArray(got) || length != got.length) {
      const error = new Error(message);
      rejector(error);
      throw error;
    }
    for (let i = 0; i < length; ++i) {
      assertEqual(expected[i], got[i], tolerance, message, rejector);
    }
    return;
  }

  got = /** @type {number} */ (got);
  if (Math.abs(expected - got) > tolerance * expected) {
    throw new Error(message);
  }
}

/**
 * @param {Array} array The data array.
 * @return {number} The minimum value.
 */
function getMinForDataType(array) {
  if (array instanceof Int8Array) {
    return -128;
  }
  if (array instanceof Int16Array) {
    return -32768;
  }
  if (array instanceof Int32Array) {
    return -2147483648;
  }
  if (array instanceof Float32Array) {
    return 1.2e-38;
  }
  return 0;
}

/**
 * @param {Array} array The data array.
 * @return {number} The maximum value.
 */
function getMaxForDataType(array) {
  if (array instanceof Int8Array) {
    return 127;
  }
  if (array instanceof Uint8Array) {
    return 255;
  }
  if (array instanceof Uint8ClampedArray) {
    return 255;
  }
  if (array instanceof Int16Array) {
    return 32767;
  }
  if (array instanceof Uint16Array) {
    return 65535;
  }
  if (array instanceof Int32Array) {
    return 2147483647;
  }
  if (array instanceof Uint32Array) {
    return 4294967295;
  }
  if (array instanceof Float32Array) {
    return 3.4e38;
  }
  return 255;
}

/**
 * @typedef {Object} GeoTIFFSourceOptions
 * @property {boolean} [forceXHR=false] Whether to force the usage of the browsers XMLHttpRequest API.
 * @property {Object<string, string>} [headers] additional key-value pairs of headers to be passed with each request. Key is the header name, value the header value.
 * @property {string} [credentials] How credentials shall be handled. See
 * https://developer.mozilla.org/en-US/docs/Web/API/fetch for reference and possible values
 * @property {number} [maxRanges] The maximum amount of ranges to request in a single multi-range request.
 * By default only a single range is used.
 * @property {boolean} [allowFullFile=false] Whether or not a full file is accepted when only a portion is
 * requested. Only use this when you know the source image to be small enough to fit in memory.
 * @property {number} [blockSize=65536] The block size to use.
 * @property {number} [cacheSize=100] The number of blocks that shall be held in a LRU cache.
 */

/**
 * @typedef {Object} Options
 * @property {Array<SourceInfo>} sources List of information about GeoTIFF sources.
 * Multiple sources can be combined when their resolution sets are equal after applying a scale.
 * The list of sources defines a mapping between input bands as they are read from each GeoTIFF and
 * the output bands that are provided by data tiles. To control which bands to read from each GeoTIFF,
 * use the {@link import("./GeoTIFF.js").SourceInfo bands} property. If, for example, you specify two
 * sources, one with 3 bands and {@link import("./GeoTIFF.js").SourceInfo nodata} configured, and
 * another with 1 band, the resulting data tiles will have 5 bands: 3 from the first source, 1 alpha
 * band from the first source, and 1 band from the second source.
 * @property {GeoTIFFSourceOptions} [sourceOptions] Additional options to be passed to [geotiff.js](https://geotiffjs.github.io/geotiff.js/module-geotiff.html)'s `fromUrl` or `fromUrls` methods.
 * @property {boolean} [convertToRGB = false] By default, bands from the sources are read as-is. When
 * reading GeoTIFFs with the purpose of displaying them as RGB images, setting this to `true` will
 * convert other color spaces (YCbCr, CMYK) to RGB.
 * @property {boolean} [normalize=true] By default, the source data is normalized to values between
 * 0 and 1 with scaling factors based on the raster statistics or `min` and `max` properties of each source.
 * If instead you want to work with the raw values in a style expression, set this to `false`.  Setting this option
 * to `false` will make it so any `min` and `max` properties on sources are ignored.
 * @property {boolean} [opaque=false] Whether the layer is opaque.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * the linear interpolation is used to resample the data.  If false, nearest neighbor is used.
 */

/**
 * @classdesc
 * A source for working with GeoTIFF data.
 * @api
 */
class GeoTIFFSource extends DataTile {
  /**
   * @param {Options} options Data tile options.
   */
  constructor(options) {
    super({
      state: State.LOADING,
      tileGrid: null,
      projection: null,
      opaque: options.opaque,
      transition: options.transition,
      interpolate: options.interpolate !== false,
      wrapX: options.wrapX,
    });

    /**
     * @type {Array<SourceInfo>}
     * @private
     */
    this.sourceInfo_ = options.sources;

    const numSources = this.sourceInfo_.length;

    /**
     * @type {object}
     * @private
     */
    this.sourceOptions_ = options.sourceOptions;

    /**
     * @type {Array<Array<GeoTIFFImage>>}
     * @private
     */
    this.sourceImagery_ = new Array(numSources);

    /**
     * @type {Array<number>}
     * @private
     */
    this.resolutionFactors_ = new Array(numSources);

    /**
     * @type {Array<number>}
     * @private
     */
    this.samplesPerPixel_;

    /**
     * @type {Array<Array<number>>}
     * @private
     */
    this.nodataValues_;

    /**
     * @type {Array<Array<GDALMetadata>>}
     * @private
     */
    this.metadata_;

    /**
     * @type {boolean}
     * @private
     */
    this.normalize_ = options.normalize !== false;

    /**
     * @type {boolean}
     * @private
     */
    this.addAlpha_ = false;

    /**
     * @type {Error}
     * @private
     */
    this.error_ = null;

    /**
     * @type {'readRasters' | 'readRGB'}
     */
    this.readMethod_ = options.convertToRGB ? 'readRGB' : 'readRasters';

    this.setKey(this.sourceInfo_.map((source) => source.url).join(','));

    const self = this;
    const requests = new Array(numSources);
    for (let i = 0; i < numSources; ++i) {
      requests[i] = getImagesForSource(
        this.sourceInfo_[i],
        this.sourceOptions_
      );
    }
    Promise.all(requests)
      .then(function (sources) {
        self.configure_(sources);
      })
      .catch(function (error) {
        console.error(error); // eslint-disable-line no-console
        self.error_ = error;
        self.setState(State.ERROR);
      });
  }

  /**
   * @return {Error} A source loading error. When the source state is `error`, use this function
   * to get more information about the error. To debug a faulty configuration, you may want to use
   * a listener like
   * ```js
   * geotiffSource.on('change', () => {
   *   if (geotiffSource.getState() === 'error') {
   *     console.error(geotiffSource.getError());
   *   }
   * });
   * ```
   */
  getError() {
    return this.error_;
  }

  /**
   * Configure the tile grid based on images within the source GeoTIFFs.  Each GeoTIFF
   * must have the same internal tiled structure.
   * @param {Array<Array<GeoTIFFImage>>} sources Each source is a list of images
   * from a single GeoTIFF.
   * @private
   */
  configure_(sources) {
    let extent;
    let origin;
    let tileSizes;
    let resolutions;
    const samplesPerPixel = new Array(sources.length);
    const nodataValues = new Array(sources.length);
    const metadata = new Array(sources.length);
    let minZoom = 0;

    const sourceCount = sources.length;
    for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      const images = sources[sourceIndex];
      const imageCount = images.length;

      let sourceExtent;
      let sourceOrigin;
      const sourceTileSizes = new Array(imageCount);
      const sourceResolutions = new Array(imageCount);

      nodataValues[sourceIndex] = new Array(imageCount);
      metadata[sourceIndex] = new Array(imageCount);

      for (let imageIndex = 0; imageIndex < imageCount; ++imageIndex) {
        const image = images[imageIndex];
        const nodataValue = image.getGDALNoData();
        metadata[sourceIndex][imageIndex] = image.getGDALMetadata(0);
        nodataValues[sourceIndex][imageIndex] =
          nodataValue === null ? NaN : nodataValue;

        const wantedSamples = this.sourceInfo_[sourceIndex].bands;
        samplesPerPixel[sourceIndex] = wantedSamples
          ? wantedSamples.length
          : image.getSamplesPerPixel();
        const level = imageCount - (imageIndex + 1);

        if (!sourceExtent) {
          sourceExtent = getBoundingBox(image);
        }

        if (!sourceOrigin) {
          sourceOrigin = getOrigin(image);
        }

        sourceResolutions[level] = getResolution(image, images[0]);
        sourceTileSizes[level] = [image.getTileWidth(), image.getTileHeight()];
      }

      if (!extent) {
        extent = sourceExtent;
      } else {
        getIntersection(extent, sourceExtent, extent);
      }

      if (!origin) {
        origin = sourceOrigin;
      } else {
        const message = `Origin mismatch for source ${sourceIndex}, got [${sourceOrigin}] but expected [${origin}]`;
        assertEqual(origin, sourceOrigin, 0, message, this.viewRejector);
      }

      if (!resolutions) {
        resolutions = sourceResolutions;
        this.resolutionFactors_[sourceIndex] = 1;
      } else {
        if (resolutions.length - minZoom > sourceResolutions.length) {
          minZoom = resolutions.length - sourceResolutions.length;
        }
        const resolutionFactor =
          resolutions[resolutions.length - 1] /
          sourceResolutions[sourceResolutions.length - 1];
        this.resolutionFactors_[sourceIndex] = resolutionFactor;
        const scaledSourceResolutions = sourceResolutions.map(
          (resolution) => (resolution *= resolutionFactor)
        );
        const message = `Resolution mismatch for source ${sourceIndex}, got [${scaledSourceResolutions}] but expected [${resolutions}]`;
        assertEqual(
          resolutions.slice(minZoom, resolutions.length),
          scaledSourceResolutions,
          0.005,
          message,
          this.viewRejector
        );
      }

      if (!tileSizes) {
        tileSizes = sourceTileSizes;
      } else {
        assertEqual(
          tileSizes.slice(minZoom, tileSizes.length),
          sourceTileSizes,
          0,
          `Tile size mismatch for source ${sourceIndex}`,
          this.viewRejector
        );
      }

      this.sourceImagery_[sourceIndex] = images.reverse();
    }

    for (let i = 0, ii = this.sourceImagery_.length; i < ii; ++i) {
      const sourceImagery = this.sourceImagery_[i];
      while (sourceImagery.length < resolutions.length) {
        sourceImagery.unshift(undefined);
      }
    }

    if (!this.getProjection()) {
      const firstSource = sources[0];
      for (let i = firstSource.length - 1; i >= 0; --i) {
        const image = firstSource[i];
        const projection = getProjection(image);
        if (projection) {
          this.projection = projection;
          break;
        }
      }
    }

    this.samplesPerPixel_ = samplesPerPixel;
    this.nodataValues_ = nodataValues;
    this.metadata_ = metadata;

    // decide if we need to add an alpha band to handle nodata
    outer: for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      // option 1: source is configured with a nodata value
      if (this.sourceInfo_[sourceIndex].nodata !== undefined) {
        this.addAlpha_ = true;
        break;
      }

      const values = nodataValues[sourceIndex];

      // option 2: check image metadata for limited bands
      const bands = this.sourceInfo_[sourceIndex].bands;
      if (bands) {
        for (let i = 0; i < bands.length; ++i) {
          if (!isNaN(values[bands[i] - 1])) {
            this.addAlpha_ = true;
            break outer;
          }
        }
        continue;
      }

      // option 3: check image metadata for all bands
      for (let imageIndex = 0; imageIndex < values.length; ++imageIndex) {
        if (!isNaN(values[imageIndex])) {
          this.addAlpha_ = true;
          break outer;
        }
      }
    }

    const additionalBands = this.addAlpha_ ? 1 : 0;
    this.bandCount =
      samplesPerPixel.reduce((accumulator, value) => {
        accumulator += value;
        return accumulator;
      }, 0) + additionalBands;

    const tileGrid = new TileGrid({
      extent: extent,
      minZoom: minZoom,
      origin: origin,
      resolutions: resolutions,
      tileSizes: tileSizes,
    });

    this.tileGrid = tileGrid;

    this.setLoader(this.loadTile_.bind(this));
    this.setState(State.READY);
    this.viewResolver({
      projection: this.projection,
      resolutions: resolutions,
      center: toUserCoordinate(getCenter(extent), this.projection),
      extent: toUserExtent(extent, this.projection),
      zoom: 0,
    });
  }

  loadTile_(z, x, y) {
    const size = toSize(this.tileGrid.getTileSize(z));

    const sourceCount = this.sourceImagery_.length;
    const requests = new Array(sourceCount);
    const addAlpha = this.addAlpha_;
    const bandCount = this.bandCount;
    const samplesPerPixel = this.samplesPerPixel_;
    const nodataValues = this.nodataValues_;
    const sourceInfo = this.sourceInfo_;
    for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      const source = sourceInfo[sourceIndex];
      const resolutionFactor = this.resolutionFactors_[sourceIndex];
      const pixelBounds = [
        Math.round(x * (size[0] * resolutionFactor)),
        Math.round(y * (size[1] * resolutionFactor)),
        Math.round((x + 1) * (size[0] * resolutionFactor)),
        Math.round((y + 1) * (size[1] * resolutionFactor)),
      ];
      const image = this.sourceImagery_[sourceIndex][z];
      let samples;
      if (source.bands) {
        samples = source.bands.map(function (bandNumber) {
          return bandNumber - 1;
        });
      }

      /** @type {number|Array<number>} */
      let fillValue;
      if (!isNaN(source.nodata)) {
        fillValue = source.nodata;
      } else {
        if (!samples) {
          fillValue = nodataValues[sourceIndex];
        } else {
          fillValue = samples.map(function (sampleIndex) {
            return nodataValues[sourceIndex][sampleIndex];
          });
        }
      }

      requests[sourceIndex] = image[this.readMethod_]({
        window: pixelBounds,
        width: size[0],
        height: size[1],
        samples: samples,
        fillValue: fillValue,
        pool: getWorkerPool(),
        interleave: false,
      });
    }

    const pixelCount = size[0] * size[1];
    const dataLength = pixelCount * bandCount;
    const normalize = this.normalize_;
    const metadata = this.metadata_;

    return Promise.all(requests).then(function (sourceSamples) {
      /** @type {Uint8Array|Float32Array} */
      let data;
      if (normalize) {
        data = new Uint8Array(dataLength);
      } else {
        data = new Float32Array(dataLength);
      }

      let dataIndex = 0;
      for (let pixelIndex = 0; pixelIndex < pixelCount; ++pixelIndex) {
        let transparent = addAlpha;
        for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
          const source = sourceInfo[sourceIndex];

          let min = source.min;
          let max = source.max;
          let gain, bias;
          if (normalize) {
            const stats = metadata[sourceIndex][0];
            if (min === undefined) {
              if (stats && STATISTICS_MINIMUM in stats) {
                min = parseFloat(stats[STATISTICS_MINIMUM]);
              } else {
                min = getMinForDataType(sourceSamples[sourceIndex][0]);
              }
            }
            if (max === undefined) {
              if (stats && STATISTICS_MAXIMUM in stats) {
                max = parseFloat(stats[STATISTICS_MAXIMUM]);
              } else {
                max = getMaxForDataType(sourceSamples[sourceIndex][0]);
              }
            }

            gain = 255 / (max - min);
            bias = -min * gain;
          }

          for (
            let sampleIndex = 0;
            sampleIndex < samplesPerPixel[sourceIndex];
            ++sampleIndex
          ) {
            const sourceValue =
              sourceSamples[sourceIndex][sampleIndex][pixelIndex];

            let value;
            if (normalize) {
              value = clamp(gain * sourceValue + bias, 0, 255);
            } else {
              value = sourceValue;
            }

            if (!addAlpha) {
              data[dataIndex] = value;
            } else {
              let nodata = source.nodata;
              if (nodata === undefined) {
                let bandIndex;
                if (source.bands) {
                  bandIndex = source.bands[sampleIndex] - 1;
                } else {
                  bandIndex = sampleIndex;
                }
                nodata = nodataValues[sourceIndex][bandIndex];
              }

              if (sourceValue !== nodata) {
                transparent = false;
                data[dataIndex] = value;
              }
            }
            dataIndex++;
          }
        }
        if (addAlpha) {
          if (!transparent) {
            data[dataIndex] = 255;
          }
          dataIndex++;
        }
      }

      return data;
    });
  }
}

/**
 * Get a promise for view properties based on the source.  Use the result of this function
 * as the `view` option in a map constructor.
 *
 *     const source = new GeoTIFF(options);
 *
 *     const map = new Map({
 *       target: 'map',
 *       layers: [
 *         new TileLayer({
 *           source: source,
 *         }),
 *       ],
 *       view: source.getView(),
 *     });
 *
 * @function
 * @return {Promise<import("../View.js").ViewOptions>} A promise for view-related properties.
 * @api
 *
 */
GeoTIFFSource.prototype.getView;

export default GeoTIFFSource;
