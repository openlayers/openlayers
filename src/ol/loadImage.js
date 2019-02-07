
/**
 * @typedef {Object} Options
 * @property {string} crossOrigin Cross origin value.
 * @property {number[]} size Size of the image.
 */


/**
 *
 * @param {string} src Source.
 * @param {Options} options Options.
 * @param {function((HTMLImageElement|ImageBitmap)): any} onSuccess Success .
 * @param {function(any): any} onError Error callback.
 */
export function loadImageUsingDom(src, options, onSuccess, onError) {
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
    onSuccess(image);
  };
  image.onerror = onError;
}

let loadImageHelper = loadImageUsingDom;

export function setLoadImageHelper(helper) {
  loadImageHelper = helper;
}

/**
 * @param {string} src Source.
 * @param {Options} options Options.
 * @param {function((HTMLImageElement|ImageBitmap)): any} onSuccess Success .
 * @param {function(any): any} onError Error callback.
 */
export function loadImage(src, options, onSuccess, onError) {
  loadImageHelper(src, options, onSuccess, onError);
}
