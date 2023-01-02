/**
 * @module ol/style/flat
 */

import Circle from '../style/Circle.js';
import Fill from './Fill.js';
import Icon from './Icon.js';
import RegularShape from './RegularShape.js';
import Stroke from './Stroke.js';
import Style from './Style.js';
import Text from './Text.js';

/**
 * For static styling, the [layer.setStyle()]{@link module:ol/layer/Vector~VectorLayer#setStyle} method
 * can be called with an object literal that has fill, stroke, text, icon, regular shape, and/or circle properties.
 * @api
 *
 * @typedef {FlatFill & FlatStroke & FlatText & FlatIcon & FlatShape & FlatCircle} FlatStyle
 */

/**
 * A flat style literal or an array of the same.
 *
 * @typedef {FlatStyle|Array<FlatStyle>} FlatStyleLike
 */

/**
 * Fill style properties applied to polygon features.
 *
 * @typedef {Object} FlatFill
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [fill-color] The fill color.
 */

/**
 * Stroke style properties applied to line strings and polygon boundaries.  To apply a stroke, at least one of
 * `stroke-color` or `stroke-width` must be provided.
 *
 * @typedef {Object} FlatStroke
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [stroke-color] The stroke color.
 * @property {number} [stroke-width] Stroke pixel width.
 * @property {CanvasLineCap} [stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [stroke-line-dash] Line dash pattern.
 * @property {number} [stroke-line-dash-offset=0] Line dash offset.
 * @property {number} [stroke-miter-limit=10] Miter limit.
 */

/**
 * Label style properties applied to all features.  At a minimum, a `text-value` must be provided.
 *
 * @typedef {Object} FlatText
 * @property {string|Array<string>} [text-value] Text content or rich text content. For plain text provide a string, which can
 * contain line breaks (`\n`). For rich text provide an array of text/font tuples. A tuple consists of the text to
 * render and the font to use (or `''` to use the text style's font). A line break has to be a separate tuple (i.e. `'\n', ''`).
 * **Example:** `['foo', 'bold 10px sans-serif', ' bar', 'italic 10px sans-serif', ' baz', '']` will yield "**foo** *bar* baz".
 * **Note:** Rich text is not supported for the immediate rendering API.
 * @property {string} [text-font] Font style as CSS `font` value, see:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font. Default is `'10px sans-serif'`
 * @property {number} [text-max-angle=Math.PI/4] When `text-placement` is set to `'line'`, allow a maximum angle between adjacent characters.
 * The expected value is in radians, and the default is 45° (`Math.PI / 4`).
 * @property {number} [text-offset-x=0] Horizontal text offset in pixels. A positive will shift the text right.
 * @property {number} [text-offset-y=0] Vertical text offset in pixels. A positive will shift the text down.
 * @property {boolean} [text-overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
 * the width of the polygon at the label position or the length of the path that it follows.
 * @property {import("./Text.js").TextPlacement} [text-placement='point'] Text placement.
 * @property {number} [text-repeat] Repeat interval in pixels. When set, the text will be repeated at this interval. Only available when
 * `text-placement` is set to `'line'`. Overrides `text-align`.
 * @property {number|import("../size.js").Size} [text-scale] Scale.
 * @property {boolean} [text-rotate-with-view=false] Whether to rotate the text with the view.
 * @property {number} [text-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {CanvasTextAlign} [text-align] Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
 * Default is `'center'` for `text-placement: 'point'`. For `text-placement: 'line'`, the default is to let the renderer choose a
 * placement where `text-max-angle` is not exceeded.
 * @property {import('./Text.js').TextJustify} [text-justify] Text justification within the text box.
 * If not set, text is justified towards the `textAlign` anchor.
 * Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
 * **Note:** `text-justify` is ignored for immediate rendering and also for `text-placement: 'line'`.
 * @property {CanvasTextBaseline} [text-baseline='middle'] Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
 * `'hanging'`, `'ideographic'`.
 * @property {Array<number>} [text-padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
 * values in the array is `[top, right, bottom, left]`.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [text-fill-color] The fill color.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [text-background-fill-color] The fill color.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [text-stroke-color] The stroke color.
 * @property {CanvasLineCap} [text-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [text-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [text-stroke-line-dash] Line dash pattern.
 * @property {number} [text-stroke-line-dash-offset=0] Line dash offset.
 * @property {number} [text-stroke-miter-limit=10] Miter limit.
 * @property {number} [text-stroke-width] Stroke pixel width.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [text-background-stroke-color] The stroke color.
 * @property {CanvasLineCap} [text-background-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [text-background-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [text-background-stroke-line-dash] Line dash pattern.
 * @property {number} [text-background-stroke-line-dash-offset=0] Line dash offset.
 * @property {number} [text-background-stroke-miter-limit=10] Miter limit.
 * @property {number} [text-background-stroke-width] Stroke pixel width.
 */

/**
 * Icon style properties applied to point features.  One of `icon-src` or `icon-img` must be provided to render
 * points with an icon.
 *
 * @typedef {Object} FlatIcon
 * @property {string} [icon-src] Image source URI.
 * @property {HTMLImageElement|HTMLCanvasElement} [icon-img] Image object for the icon. If the `icon-src` option is not provided then the
 * provided image must already be loaded. And in that case, it is required
 * to provide the size of the image, with the `icon-img-size` option.
 * @property {import("../size.js").Size} [icon-img-size] Image size in pixels. Only required if `icon-img` is set and `icon-src` is not.
 * The provided size needs to match the actual size of the image.
 * @property {Array<number>} [icon-anchor=[0.5, 0.5]] Anchor. Default value is the icon center.
 * @property {import("./Icon.js").IconOrigin} [icon-anchor-origin='top-left'] Origin of the anchor: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-x-units='fraction'] Units in which the anchor x value is
 * specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
 * the x value in pixels.
 * @property {import("./Icon.js").IconAnchorUnits} [icon-anchor-y-units='fraction'] Units in which the anchor y value is
 * specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
 * the y value in pixels.
 * @property {import("../color.js").Color|string} [icon-color] Color to tint the icon. If not specified,
 * the icon will be left as is.
 * @property {null|string} [icon-cross-origin] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `icon-cross-origin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {Array<number>} [icon-offset=[0, 0]] Offset, which, together with the size and the offset origin, define the
 * sub-rectangle to use from the original icon image.
 * @property {Array<number>} [icon-displacement=[0,0]] Displacement of the icon.
 * @property {import("./Icon.js").IconOrigin} [icon-offset-origin='top-left'] Origin of the offset: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {number} [icon-opacity=1] Opacity of the icon.
 * @property {number|import("../size.js").Size} [icon-scale=1] Scale.
 * @property {number} [icon-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [icon-rotate-with-view=false] Whether to rotate the icon with the view.
 * @property {import("../size.js").Size} [icon-size] Icon size in pixel. Can be used together with `icon-offset` to define the
 * sub-rectangle to use from the origin (sprite) icon image.
 * @property {"declutter"|"obstacle"|"none"|undefined} [icon-declutter-mode] Declutter mode
 */

/**
 * Regular shape style properties for rendering point features.  At least `shape-points` must be provided.
 *
 * @typedef {Object} FlatShape
 * @property {number} [shape-points] Number of points for stars and regular polygons. In case of a polygon, the number of points
 * is the number of sides.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [shape-fill-color] The fill color.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [shape-stroke-color] The stroke color.
 * @property {number} [shape-stroke-width] Stroke pixel width.
 * @property {CanvasLineCap} [shape-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [shape-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [shape-stroke-line-dash] Line dash pattern.
 * @property {number} [shape-stroke-line-dash-offset=0] Line dash offset.
 * @property {number} [shape-stroke-miter-limit=10] Miter limit.
 * @property {number} [shape-radius] Radius of a regular polygon.
 * @property {number} [shape-radius1] First radius of a star. Ignored if radius is set.
 * @property {number} [shape-radius2] Second radius of a star.
 * @property {number} [shape-angle=0] Shape's angle in radians. A value of 0 will have one of the shape's point facing up.
 * @property {Array<number>} [shape-displacement=[0,0]] Displacement of the shape
 * @property {number} [shape-rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {boolean} [shape-rotate-with-view=false] Whether to rotate the shape with the view.
 * @property {number|import("../size.js").Size} [shape-scale=1] Scale. Unless two dimensional scaling is required a better
 * result may be obtained with appropriate settings for `shape-radius`, `shape-radius1` and `shape-radius2`.
 * @property {"declutter"|"obstacle"|"none"|undefined} [shape-declutter-mode] Declutter mode.
 */

/**
 * Circle style properties for rendering point features.  At least `circle-radius` must be provided.
 *
 * @typedef {Object} FlatCircle
 * @property {number} [circle-radius] Circle radius.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [circle-fill-color] The fill color.
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [circle-stroke-color] The stroke color.
 * @property {number} [circle-stroke-width] Stroke pixel width.
 * @property {CanvasLineCap} [circle-stroke-line-cap='round'] Line cap style: `butt`, `round`, or `square`.
 * @property {CanvasLineJoin} [circle-stroke-line-join='round'] Line join style: `bevel`, `round`, or `miter`.
 * @property {Array<number>} [circle-stroke-line-dash] Line dash pattern.
 * @property {number} [circle-stroke-line-dash-offset=0] Line dash offset.
 * @property {number} [circle-stroke-miter-limit=10] Miter limit.
 * @property {Array<number>} [circle-displacement=[0,0]] displacement
 * @property {number|import("../size.js").Size} [circle-scale=1] Scale. A two dimensional scale will produce an ellipse.
 * Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `circle-radius`.
 * @property {number} [circle-rotation=0] Rotation in radians
 * (positive rotation clockwise, meaningful only when used in conjunction with a two dimensional scale).
 * @property {boolean} [circle-rotate-with-view=false] Whether to rotate the shape with the view
 * (meaningful only when used in conjunction with a two dimensional scale).
 * @property {"declutter"|"obstacle"|"none"|undefined} [circle-declutter-mode] Declutter mode
 */

/**
 * @param {FlatStyle} flatStyle A flat style literal.
 * @return {import("./Style.js").default} A style instance.
 */
export function toStyle(flatStyle) {
  const style = new Style({
    fill: getFill(flatStyle, ''),
    stroke: getStroke(flatStyle, ''),
    text: getText(flatStyle),
    image: getImage(flatStyle),
  });

  return style;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} prefix The property prefix.
 * @return {Fill|undefined} The fill (if any).
 */
function getFill(flatStyle, prefix) {
  const color = flatStyle[prefix + 'fill-color'];
  if (!color) {
    return;
  }

  return new Fill({color: color});
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @param {string} prefix The property prefix.
 * @return {Stroke|undefined} The stroke (if any).
 */
function getStroke(flatStyle, prefix) {
  const width = flatStyle[prefix + 'stroke-width'];
  const color = flatStyle[prefix + 'stroke-color'];
  if (!width && !color) {
    return;
  }

  return new Stroke({
    width: width,
    color: color,
    lineCap: flatStyle[prefix + 'stroke-line-cap'],
    lineJoin: flatStyle[prefix + 'stroke-line-join'],
    lineDash: flatStyle[prefix + 'stroke-line-dash'],
    lineDashOffset: flatStyle[prefix + 'stroke-line-dash-offset'],
    miterLimit: flatStyle[prefix + 'stroke-miter-limit'],
  });
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @return {Text|undefined} The text (if any).
 */
function getText(flatStyle) {
  const value = flatStyle['text-value'];
  if (!value) {
    return;
  }

  const text = new Text({
    text: value,
    font: flatStyle['text-font'],
    maxAngle: flatStyle['text-max-angle'],
    offsetX: flatStyle['text-offset-x'],
    offsetY: flatStyle['text-offset-y'],
    overflow: flatStyle['text-overflow'],
    placement: flatStyle['text-placement'],
    repeat: flatStyle['text-repeat'],
    scale: flatStyle['text-scale'],
    rotateWithView: flatStyle['text-rotate-with-view'],
    rotation: flatStyle['text-rotation'],
    textAlign: flatStyle['text-align'],
    justify: flatStyle['text-justify'],
    textBaseline: flatStyle['text-baseline'],
    padding: flatStyle['text-padding'],
    fill: getFill(flatStyle, 'text-'),
    backgroundFill: getFill(flatStyle, 'text-background-'),
    stroke: getStroke(flatStyle, 'text-'),
    backgroundStroke: getStroke(flatStyle, 'text-background-'),
  });

  return text;
}

/**
 * @param {FlatStyle} flatStyle The flat style.
 * @return {import("./Image.js").default|undefined} The image (if any).
 */
function getImage(flatStyle) {
  const iconSrc = flatStyle['icon-src'];
  const iconImg = flatStyle['icon-img'];
  if (iconSrc || iconImg) {
    const icon = new Icon({
      src: iconSrc,
      img: iconImg,
      imgSize: flatStyle['icon-img-size'],
      anchor: flatStyle['icon-anchor'],
      anchorOrigin: flatStyle['icon-anchor-origin'],
      anchorXUnits: flatStyle['icon-anchor-x-units'],
      anchorYUnits: flatStyle['icon-anchor-y-units'],
      color: flatStyle['icon-color'],
      crossOrigin: flatStyle['icon-cross-origin'],
      offset: flatStyle['icon-offset'],
      displacement: flatStyle['icon-displacement'],
      opacity: flatStyle['icon-opacity'],
      scale: flatStyle['icon-scale'],
      rotation: flatStyle['icon-rotation'],
      rotateWithView: flatStyle['icon-rotate-with-view'],
      size: flatStyle['icon-size'],
      declutterMode: flatStyle['icon-declutter-mode'],
    });
    return icon;
  }

  const shapePoints = flatStyle['shape-points'];
  if (shapePoints) {
    const prefix = 'shape-';
    const shape = new RegularShape({
      points: shapePoints,
      fill: getFill(flatStyle, prefix),
      stroke: getStroke(flatStyle, prefix),
      radius: flatStyle['shape-radius'],
      radius1: flatStyle['shape-radius1'],
      radius2: flatStyle['shape-radius2'],
      angle: flatStyle['shape-angle'],
      displacement: flatStyle['shape-displacement'],
      rotation: flatStyle['shape-rotation'],
      rotateWithView: flatStyle['shape-rotate-with-view'],
      scale: flatStyle['shape-scale'],
      declutterMode: flatStyle['shape-declutter-mode'],
    });

    return shape;
  }

  const circleRadius = flatStyle['circle-radius'];
  if (circleRadius) {
    const prefix = 'circle-';
    const circle = new Circle({
      radius: circleRadius,
      fill: getFill(flatStyle, prefix),
      stroke: getStroke(flatStyle, prefix),
      displacement: flatStyle['circle-displacement'],
      scale: flatStyle['circle-scale'],
      rotation: flatStyle['circle-rotation'],
      rotateWithView: flatStyle['circle-rotate-with-view'],
      declutterMode: flatStyle['circle-declutter-mode'],
    });

    return circle;
  }

  return;
}
