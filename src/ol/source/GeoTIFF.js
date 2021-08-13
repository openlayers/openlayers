/**
 * @module ol/source/GeoTIFF
 */
import DataTile from './DataTile.js';
import State from './State.js';
import TileGrid from '../tilegrid/TileGrid.js';
import {Pool, fromUrl as tiffFromUrl, fromUrls as tiffFromUrls} from 'geotiff';
import {create as createDecoderWorker} from '../worker/geotiff-decoder.js';
import {getIntersection} from '../extent.js';
import {get as getProjection} from '../proj.js';
import {toSize} from '../size.js';

/**
 * @typedef {Object} SourceInfo
 * @property {string} url URL for the source GeoTIFF.
 * @property {Array<string>} [overviews] List of any overview URLs.
 * @property {number} [min=0] The minimum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.
 * @property {number} [max] The maximum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.
 * @property {number} [nodata] Values to discard. When provided, an additional band (alpha) will be added
 * to the data.
 * @property {Array<number>} [bands] Indices of the bands to be read from. If not provided, all bands will
 * be read. If, for example, a GeoTIFF has red, green, blue and near-infrared bands and you only need the
 * infrared band, configure `bands: [3]`.
 */

let workerPool;
function getWorkerPool() {
  if (!workerPool) {
    workerPool = new Pool(undefined, createDecoderWorker());
  }
  return workerPool;
}

/**
 * @param {import("geotiff/src/geotiff.js").GeoTIFF|import("geotiff/src/geotiff.js").MultiGeoTIFF} tiff A GeoTIFF.
 * @return {Promise<Array<import("geotiff/src/geotiffimage.js").GeoTIFFImage>>} Resolves to a list of images.
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
 * @return {Promise<Array<import("geotiff/src/geotiffimage.js").GeoTIFFImage>>} Resolves to a list of images.
 */
function getImagesForSource(source) {
  let request;
  if (source.overviews) {
    request = tiffFromUrls(source.url, source.overviews);
  } else {
    request = tiffFromUrl(source.url);
  }
  return request.then(getImagesForTIFF);
}

/**
 * @param {number|Array<number>|Array<Array<number>>} expected Expected value.
 * @param {number|Array<number>|Array<Array<number>>} got Actual value.
 * @param {number} tolerance Accepted tolerance in fraction of expected between expected and got.
 * @param {string} message The error message.
 */
function assertEqual(expected, got, tolerance, message) {
  if (Array.isArray(expected)) {
    const length = expected.length;
    if (!Array.isArray(got) || length != got.length) {
      throw new Error(message);
    }
    for (let i = 0; i < length; ++i) {
      assertEqual(expected[i], got[i], tolerance, message);
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
 * @typedef {Object} Options
 * @property {Array<SourceInfo>} sources List of information about GeoTIFF sources.
 * Multiple sources can be combined when their resolution sets are equal after applying a scale.
 * The list of sources defines a mapping between input bands as they are read from each GeoTIFF, and
 * the output bands that are provided by data tiles. To control which bands to read from each GeoTIFF,
 * use the {@link import("./GeoTIFF.js").SourceInfo bands} property. If, for example, you spedify two
 * sources, one with 3 bands and {@link import("./GeoTIFF.js").SourceInfo nodata} configured, and
 * another with 1 band, the resulting data tiles will have 5 bands: 3 from the first source, 1 alpha
 * band from the first source, and 1 band from the second source.
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
    });

    /**
     * @type {Array<SourceInfo>}
     * @private
     */
    this.sourceInfo_ = options.sources;

    const numSources = this.sourceInfo_.length;

    /**
     * @type {Array<Array<import("geotiff/src/geotiffimage.js").GeoTIFFImage>>}
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
     * @type {boolean}
     * @private
     */
    this.addAlpha_ = false;

    /**
     * @type {Error}
     * @private
     */
    this.error_ = null;

    this.setKey(this.sourceInfo_.map((source) => source.url).join(','));

    const self = this;
    const requests = new Array(numSources);
    for (let i = 0; i < numSources; ++i) {
      requests[i] = getImagesForSource(this.sourceInfo_[i]);
    }
    Promise.all(requests)
      .then(function (sources) {
        self.configure_(sources);
      })
      .catch(function (error) {
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
   * @param {Array<Array<import("geotiff/src/geotiffimage.js").GeoTIFFImage>>} sources Each source is a list of images
   * from a single GeoTIFF.
   * @private
   */
  configure_(sources) {
    let extent;
    let origin;
    let tileSizes;
    let resolutions;
    const samplesPerPixel = new Array(sources.length);
    let minZoom = 0;

    const sourceCount = sources.length;
    for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      const images = sources[sourceIndex];
      const imageCount = images.length;

      let sourceExtent;
      let sourceOrigin;
      const sourceTileSizes = new Array(imageCount);
      const sourceResolutions = new Array(imageCount);

      for (let imageIndex = 0; imageIndex < imageCount; ++imageIndex) {
        const image = images[imageIndex];
        const wantedSamples = this.sourceInfo_[sourceIndex].bands;
        samplesPerPixel[sourceIndex] = wantedSamples
          ? wantedSamples.length
          : image.getSamplesPerPixel();
        const level = imageCount - (imageIndex + 1);

        if (!sourceExtent) {
          sourceExtent = image.getBoundingBox();
        }

        if (!sourceOrigin) {
          sourceOrigin = image.getOrigin().slice(0, 2);
        }

        sourceResolutions[level] = image.getResolution(images[0])[0];
        sourceTileSizes[level] = [image.getTileWidth(), image.getTileHeight()];
      }

      if (!extent) {
        extent = sourceExtent;
      } else {
        getIntersection(extent, sourceExtent);
      }

      if (!origin) {
        origin = sourceOrigin;
      } else {
        const message = `Origin mismatch for source ${sourceIndex}, got [${sourceOrigin}] but expected [${origin}]`;
        assertEqual(origin, sourceOrigin, 0, message);
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
          message
        );
      }

      if (!tileSizes) {
        tileSizes = sourceTileSizes;
      } else {
        assertEqual(
          tileSizes.slice(minZoom, tileSizes.length),
          sourceTileSizes,
          0,
          `Tile size mismatch for source ${sourceIndex}`
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
      const firstImage = sources[0][0];
      if (firstImage.geoKeys) {
        const code =
          firstImage.geoKeys.ProjectedCSTypeGeoKey ||
          firstImage.geoKeys.GeographicTypeGeoKey;
        if (code) {
          this.projection = getProjection(`EPSG:${code}`);
        }
      }
    }

    this.samplesPerPixel_ = samplesPerPixel;
    const sourceInfo = this.sourceInfo_;
    for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
      if (sourceInfo[sourceIndex].nodata !== undefined) {
        this.addAlpha_ = true;
        break;
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
  }

  loadTile_(z, x, y) {
    const size = toSize(this.tileGrid.getTileSize(z));

    const sourceCount = this.sourceImagery_.length;
    const requests = new Array(sourceCount);
    const addAlpha = this.addAlpha_;
    const bandCount = this.bandCount;
    const samplesPerPixel = this.samplesPerPixel_;
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
      requests[sourceIndex] = image.readRasters({
        window: pixelBounds,
        width: size[0],
        height: size[1],
        samples: source.bands,
        fillValue: source.nodata,
        pool: getWorkerPool(),
      });
    }

    const pixelCount = size[0] * size[1];
    const dataLength = pixelCount * bandCount;

    return Promise.all(requests).then(function (sourceSamples) {
      const data = new Uint8ClampedArray(dataLength);
      let dataIndex = 0;
      for (let pixelIndex = 0; pixelIndex < pixelCount; ++pixelIndex) {
        let transparent = addAlpha;
        for (let sourceIndex = 0; sourceIndex < sourceCount; ++sourceIndex) {
          const source = sourceInfo[sourceIndex];
          let min = source.min;
          if (min === undefined) {
            min = getMinForDataType(sourceSamples[sourceIndex][0]);
          }
          let max = source.max;
          if (max === undefined) {
            max = getMaxForDataType(sourceSamples[sourceIndex][0]);
          }

          const gain = 255 / (max - min);
          const bias = -min * gain;

          const nodata = source.nodata;

          for (
            let sampleIndex = 0;
            sampleIndex < samplesPerPixel[sourceIndex];
            ++sampleIndex
          ) {
            const sourceValue =
              sourceSamples[sourceIndex][sampleIndex][pixelIndex];

            const value = gain * sourceValue + bias;
            if (!addAlpha) {
              data[dataIndex] = value;
            } else {
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

export default GeoTIFFSource;
