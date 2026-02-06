/**
 * @module ol/Image
 */
import ImageState from './ImageState.js';
import EventType from './events/EventType.js';
import EventTarget from './events/Target.js';
import {listenOnce, unlistenByKey} from './events.js';
import {toPromise} from './functions.js';
import {CREATE_IMAGE_BITMAP, IMAGE_DECODE} from './has.js';

/**
 * A function that takes an {@link module:ol/Image~ImageWrapper} for the image and a
 * `{string}` for the src as arguments. It is supposed to make it so the
 * underlying image {@link module:ol/Image~ImageWrapper#getImage} is assigned the
 * content specified by the src. If not specified, the default is
 *
 *     function(image, src) {
 *       image.getImage().src = src;
 *     }
 *
 * Providing a custom `imageLoadFunction` can be useful to load images with
 * post requests or - in general - through XHR requests, where the src of the
 * image element would be set to a data URI when the content is loaded.
 *
 * @typedef {function(import("./Image.js").default, string): void} LoadFunction
 * @api
 */

/**
 * @typedef {Object} ImageObject
 * @property {import("./extent.js").Extent} [extent] Extent, if different from the requested one.
 * @property {import("./resolution.js").ResolutionLike} [resolution] Resolution, if different from the requested one.
 * When x and y resolution are different, use the array type (`[xResolution, yResolution]`).
 * @property {number} [pixelRatio] Pixel ratio, if different from the requested one.
 * @property {import('./DataTile.js').ImageLike} image Image.
 */

/**
 * Loader function used for image sources. Receives extent, resolution and pixel ratio as arguments.
 * For images that cover any extent and resolution (static images), the loader function should not accept
 * any arguments. The function returns an {@link import("./DataTile.js").ImageLike image}, an
 * {@link import("./Image.js").ImageObject image object}, or a promise for the same.
 * For loaders that generate images, the promise should not resolve until the image is loaded.
 * If the returned image does not match the extent, resolution or pixel ratio passed to the loader,
 * it has to return an {@link import("./Image.js").ImageObject image object} with the `image` and the
 * correct `extent`, `resolution` and `pixelRatio`.
 *
 * @typedef {function(import("./extent.js").Extent, number, number, (function(HTMLImageElement, string): void)=): import("./DataTile.js").ImageLike|ImageObject|Promise<import("./DataTile.js").ImageLike|ImageObject>} Loader
 * @api
 */

/**
 * Loader function used for image sources. Receives extent, resolution and pixel ratio as arguments.
 * The function returns a promise for an  {@link import("./Image.js").ImageObject image object}.
 *
 * @typedef {function(import("./extent.js").Extent, number, number, (function(HTMLImageElement, string): void)=): Promise<import("./DataTile.js").ImageLike|ImageObject>} ImageObjectPromiseLoader
 */

class ImageWrapper extends EventTarget {
  /**
   * @param {import("./extent.js").Extent} extent Extent.
   * @param {number|Array<number>|undefined} resolution Resolution. If provided as array, x and y
   * resolution will be assumed.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("./ImageState.js").default|Loader} stateOrLoader State.
   */
  constructor(extent, resolution, pixelRatio, stateOrLoader) {
    super();

    /**
     * @protected
     * @type {import("./extent.js").Extent}
     */
    this.extent = extent;

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ = pixelRatio;

    /**
     * @protected
     * @type {number|Array<number>|undefined}
     */
    this.resolution = resolution;

    /**
     * @protected
     * @type {import("./ImageState.js").default}
     */
    this.state =
      typeof stateOrLoader === 'function' ? ImageState.IDLE : stateOrLoader;

    /**
     * @private
     * @type {import('./DataTile.js').ImageLike|null}
     */
    this.image_ = null;

    /**
     * @protected
     * @type {Loader|null}
     */
    this.loader = typeof stateOrLoader === 'function' ? stateOrLoader : null;
  }

  /**
   * @protected
   */
  changed() {
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * @return {import("./extent.js").Extent} Extent.
   */
  getExtent() {
    return this.extent;
  }

  /**
   * @return {import('./DataTile.js').ImageLike} Image.
   */
  getImage() {
    return this.image_;
  }

  /**
   * @return {number} PixelRatio.
   */
  getPixelRatio() {
    return this.pixelRatio_;
  }

  /**
   * @return {number|Array<number>} Resolution.
   */
  getResolution() {
    return /** @type {number} */ (this.resolution);
  }

  /**
   * @return {import("./ImageState.js").default} State.
   */
  getState() {
    return this.state;
  }

  /**
   * Load not yet loaded URI.
   */
  load() {
    if (this.state == ImageState.IDLE) {
      if (this.loader) {
        this.state = ImageState.LOADING;
        this.changed();
        const resolution = this.getResolution();
        const requestResolution = Array.isArray(resolution)
          ? resolution[0]
          : resolution;
        toPromise(() =>
          this.loader(
            this.getExtent(),
            requestResolution,
            this.getPixelRatio(),
          ),
        )
          .then((image) => {
            if ('image' in image) {
              this.image_ = image.image;
            }
            if ('extent' in image) {
              this.extent = image.extent;
            }
            if ('resolution' in image) {
              this.resolution = image.resolution;
            }
            if ('pixelRatio' in image) {
              this.pixelRatio_ = image.pixelRatio;
            }
            if (
              image instanceof HTMLImageElement ||
              (CREATE_IMAGE_BITMAP && image instanceof ImageBitmap) ||
              image instanceof HTMLCanvasElement ||
              image instanceof HTMLVideoElement
            ) {
              this.image_ = image;
            }
            this.state = ImageState.LOADED;
          })
          .catch((error) => {
            this.state = ImageState.ERROR;
            console.error(error); // eslint-disable-line no-console
          })
          .finally(() => this.changed());
      }
    }
  }

  /**
   * @param {import('./DataTile.js').ImageLike} image The image.
   */
  setImage(image) {
    this.image_ = image;
  }

  /**
   * @param {number|Array<number>} resolution Resolution.
   */
  setResolution(resolution) {
    this.resolution = resolution;
  }
}

/**
 * @param {import('./DataTile.js').ImageLike} image Image element.
 * @param {function():any} loadHandler Load callback function.
 * @param {function():any} errorHandler Error callback function.
 * @return {function():void} Callback to stop listening.
 */
export function listenImage(image, loadHandler, errorHandler) {
  const img = /** @type {HTMLImageElement} */ (image);
  let listening = true;
  let decoding = false;
  let loaded = false;

  const listenerKeys = [
    listenOnce(img, EventType.LOAD, function () {
      loaded = true;
      if (!decoding) {
        loadHandler();
      }
    }),
  ];

  if (img.src && IMAGE_DECODE) {
    decoding = true;
    img
      .decode()
      .then(function () {
        if (listening) {
          loadHandler();
        }
      })
      .catch(function (error) {
        if (listening) {
          if (loaded) {
            loadHandler();
          } else {
            errorHandler();
          }
        }
      });
  } else {
    listenerKeys.push(listenOnce(img, EventType.ERROR, errorHandler));
  }

  return function unlisten() {
    listening = false;
    listenerKeys.forEach(unlistenByKey);
  };
}

/**
 * Loads an image.
 * @param {HTMLImageElement} image Image, not yet loaded.
 * @param {string} [src] `src` attribute of the image. Optional, not required if already present.
 * @return {Promise<HTMLImageElement>} Promise resolving to an `HTMLImageElement`.
 * @api
 */
export function load(image, src) {
  return new Promise((resolve, reject) => {
    function handleLoad() {
      unlisten();
      resolve(image);
    }
    function handleError() {
      unlisten();
      reject(new Error('Image load error'));
    }
    function unlisten() {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    }
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    if (src) {
      image.src = src;
    }
  });
}

/**
 * @param {HTMLImageElement} image Image, not yet loaded.
 * @param {string} [src] `src` attribute of the image. Optional, not required if already present.
 * @return {Promise<HTMLImageElement>} Promise resolving to an `HTMLImageElement`.
 */
export function decodeFallback(image, src) {
  if (src) {
    image.src = src;
  }
  return image.src && IMAGE_DECODE
    ? new Promise((resolve, reject) =>
        image
          .decode()
          .then(() => resolve(image))
          .catch((e) =>
            image.complete && image.width ? resolve(image) : reject(e),
          ),
      )
    : load(image);
}

/**
 * Loads an image and decodes it to an `ImageBitmap` if `createImageBitmap()` is supported. Returns
 * the loaded image otherwise.
 * @param {HTMLImageElement} image Image, not yet loaded.
 * @param {string} [src] `src` attribute of the image. Optional, not required if already present.
 * @return {Promise<ImageBitmap|HTMLImageElement>} Promise resolving to an `ImageBitmap` or an
 * `HTMLImageElement` if `createImageBitmap()` is not supported.
 * @api
 */
export function decode(image, src) {
  if (src) {
    image.src = src;
  }
  return image.src && IMAGE_DECODE && CREATE_IMAGE_BITMAP
    ? image
        .decode()
        .then(() => createImageBitmap(image))
        .catch((e) => {
          if (image.complete && image.width) {
            return image;
          }
          throw e;
        })
    : decodeFallback(image);
}

export default ImageWrapper;
