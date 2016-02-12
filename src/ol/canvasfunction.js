goog.provide('ol.CanvasFunctionType');


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link ol.Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link ol.Size} the image size, and
 * {@link ol.proj.Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link ol.source.ImageCanvas}.
 *
 * @callback ol.CanvasFunctionType
 * @param {ol.Extent} extent The image extent
 * @param {number} imgResolution The image resolution
 * @param {number} pixelRatio The device pixel ratio
 * @param {ol.Size} imgSize The image size
 * @param {ol.proj.Projection} proj The image projection
 * @api
 */
ol.CanvasFunctionType;
