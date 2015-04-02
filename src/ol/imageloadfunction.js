goog.provide('ol.ImageLoadFunctionType');


/**
 * A function used to load an image.  The function is called with the image
 * element and the URL for the image.  The simplest image load function (which
 * is provided for you by default) would set the `image.src` attribute to the
 * provided URL.  E.g.
 *
 *     function(image, src) {
 *       image.src = src;
 *     }
 *
 * Providing a custom `imageLoadFunction` can be useful to load images with
 * post requests or - in general - through XHR requests, where the src of the
 * image element would be set to a data URI when the content is loaded.
 *
 * @typedef {function((HTMLCanvasElement|Image|HTMLVideoElement), string)}
 * @api
 */
ol.ImageLoadFunctionType;
