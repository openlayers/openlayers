
/**
 * @typedef {Object} Options
 * @property {string} crossOrigin Cross origin value.
 * @property {number[]} size Size of the image.
 */


/**
 *
 * @param {string} src Source.
 * @param {Options} options Options.
 * @return {Promise<HTMLImageElement>} a promise to an image
 */
export function loadImageUsingDom(src, options) {
  return new Promise(function(resolve, reject) {
    const image = new Image();
    if (options.crossOrigin) {
      image.crossOrigin = options.crossOrigin;
    }
    image.src = src;
    image.onload = function() {
      if (options.size) {
        image.width = options.size[0];
        image.height = options.size[1];
      }
      resolve(image);
    };
    image.onerror = reject;
  });
}

let loadImageHelper = loadImageUsingDom;

export function setLoadImageHelper(helper) {
  loadImageHelper = helper;
}

/**
 *
 * @param {string} src Source.
 * @param {Options} options Options.
 * @return {Promise<HTMLImageElement|ImageBitmap>} a promise to an image.
 */
export function loadImage(src, options) {
  return loadImageHelper(src, options);
}
