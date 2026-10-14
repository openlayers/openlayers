/**
 * @module ol/render/ImageStyle
 */

/**
 * Values shared by renderers when drawing an image style.
 *
 * Sprite coordinates and dimensions are in source-image pixels. Anchor,
 * destination size, and scale are in CSS pixels.
 *
 * @typedef {Object} ImageStyleData
 * @property {import("../DataTile.js").ImageLike} image Image source.
 * @property {import("../DataTile.js").ImageLike} hitDetectionImage Hit image.
 * @property {number} imagePixelRatio Source pixels per CSS pixel.
 * @property {number} sourceX Sprite source X.
 * @property {number} sourceY Sprite source Y.
 * @property {number} sourceWidth Sprite source width.
 * @property {number} sourceHeight Sprite source height.
 * @property {number} anchorX Anchor X in source pixels.
 * @property {number} anchorY Anchor Y in source pixels.
 * @property {number} width Destination width before style scale.
 * @property {number} height Destination height before style scale.
 * @property {Array<number>} scale Style scale.
 * @property {number} opacity Style opacity.
 * @property {number} rotation Style rotation.
 * @property {boolean} rotateWithView Rotate with the view.
 * @property {import("../style/Style.js").DeclutterMode|undefined} declutterMode Declutter mode.
 */

/**
 * Get normalized rendering values from an image style.
 *
 * @param {import("../style/Image.js").default} imageStyle Image style.
 * @param {number} pixelRatio Requested pixel ratio.
 * @param {boolean} [includeHitDetection] Resolve the hit-detection image.
 * @return {ImageStyleData|null} Rendering values, or null while dimensions are unavailable.
 */
export function getImageStyleData(
  imageStyle,
  pixelRatio,
  includeHitDetection = true,
) {
  const anchor = imageStyle.getAnchor();
  const size = imageStyle.getSize();
  const origin = imageStyle.getOrigin();
  if (!anchor || !size || !origin) {
    return null;
  }
  const imagePixelRatio = imageStyle.getPixelRatio(pixelRatio);
  const scale = imageStyle.getScaleArray();
  const image = imageStyle.getImage(pixelRatio);
  return {
    image,
    hitDetectionImage: includeHitDetection
      ? imageStyle.getHitDetectionImage()
      : image,
    imagePixelRatio,
    sourceX: origin[0] * imagePixelRatio,
    sourceY: origin[1] * imagePixelRatio,
    sourceWidth: size[0] * imagePixelRatio,
    sourceHeight: size[1] * imagePixelRatio,
    anchorX: anchor[0] * imagePixelRatio,
    anchorY: anchor[1] * imagePixelRatio,
    width: size[0],
    height: size[1],
    scale,
    opacity: imageStyle.getOpacity(),
    rotation: imageStyle.getRotation(),
    rotateWithView: imageStyle.getRotateWithView(),
    declutterMode: imageStyle.getDeclutterMode(),
  };
}
