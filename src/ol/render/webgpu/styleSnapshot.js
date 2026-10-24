/**
 * @module ol/render/webgpu/styleSnapshot
 */
import Icon from '../../style/Icon.js';
import RegularShape from '../../style/RegularShape.js';
import Style from '../../style/Style.js';

/**
 * The last snapshot taken at one index of the style arrays a style function
 * returns. Like the state of a Canvas 2D builder, it is reused while the next
 * features are styled the same, whether the style function changes one shared
 * instance in place, like ol-mapbox-style, or returns new instances.
 *
 * @typedef {Object} SnapshotSlot
 * @property {Style|null} style Style snapshot.
 * @property {import("../../style/Fill.js").default|null} fill Fill snapshot.
 * @property {import("../../style/Stroke.js").default|null} stroke Stroke snapshot.
 * @property {import("../../style/Image.js").default|null} image Image snapshot.
 * @property {import("../../style/Image.js").default|null} imageSource Image the
 * snapshot was taken from. An icon is only compared with a snapshot of the same
 * instance, because not all of its properties can be read.
 * @property {import("../../style/Text.js").default|null} text Text snapshot.
 */

/**
 * Snapshot slots by style index.
 *
 * @typedef {Array<SnapshotSlot>} StyleSnapshots
 */

/**
 * @param {*} a Value or array.
 * @param {*} b Value or array.
 * @return {boolean} The values, or the array items, are identical.
 */
function same(a, b) {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * @param {import("../../style/Fill.js").default|null} fill Fill.
 * @param {import("../../style/Fill.js").default|null} snapshot Snapshot.
 * @return {boolean} The snapshot matches.
 */
function fillEquals(fill, snapshot) {
  if (!fill || !snapshot) {
    return fill === snapshot;
  }
  return (
    same(fill.getColor(), snapshot.getColor()) &&
    same(fill.getDisplacement(), snapshot.getDisplacement()) &&
    fill.getDisplacementAnchor() === snapshot.getDisplacementAnchor()
  );
}

/**
 * @param {import("../../style/Stroke.js").default|null} stroke Stroke.
 * @param {import("../../style/Stroke.js").default|null} snapshot Snapshot.
 * @return {boolean} The snapshot matches.
 */
function strokeEquals(stroke, snapshot) {
  if (!stroke || !snapshot) {
    return stroke === snapshot;
  }
  return (
    same(stroke.getColor(), snapshot.getColor()) &&
    stroke.getLineCap() === snapshot.getLineCap() &&
    same(stroke.getLineDash(), snapshot.getLineDash()) &&
    stroke.getLineDashOffset() === snapshot.getLineDashOffset() &&
    stroke.getLineJoin() === snapshot.getLineJoin() &&
    stroke.getMiterLimit() === snapshot.getMiterLimit() &&
    stroke.getOffset() === snapshot.getOffset() &&
    stroke.getWidth() === snapshot.getWidth()
  );
}

/**
 * @param {import("../../style/Image.js").default} image Image.
 * @param {import("../../style/Image.js").default} snapshot Snapshot.
 * @param {boolean} sameSource The snapshot was taken from `image`.
 * @return {boolean} The snapshot matches.
 */
function imageEquals(image, snapshot, sameSource) {
  if (
    image.constructor !== snapshot.constructor ||
    image.getOpacity() !== snapshot.getOpacity() ||
    image.getRotation() !== snapshot.getRotation() ||
    image.getRotateWithView() !== snapshot.getRotateWithView() ||
    !same(image.getScale(), snapshot.getScale()) ||
    !same(image.getDisplacement(), snapshot.getDisplacement()) ||
    image.getPlacement() !== snapshot.getPlacement() ||
    image.getRepeat() !== snapshot.getRepeat() ||
    image.getDeclutterMode() !== snapshot.getDeclutterMode()
  ) {
    return false;
  }
  if (image instanceof RegularShape) {
    const shape = /** @type {RegularShape} */ (snapshot);
    return (
      image.getPoints() === shape.getPoints() &&
      image.getRadius() === shape.getRadius() &&
      image.getRadius2() === shape.getRadius2() &&
      image.getAngle() === shape.getAngle() &&
      fillEquals(image.getFill(), shape.getFill()) &&
      strokeEquals(image.getStroke(), shape.getStroke())
    );
  }
  if (!sameSource || !(image instanceof Icon)) {
    return false;
  }
  // Only the properties with a setter can differ from the snapshot.
  const icon = /** @type {Icon} */ (snapshot);
  if (
    image.getSrc() !== icon.getSrc() ||
    !same(image.getColor(), icon.getColor())
  ) {
    return false;
  }
  // The anchor has no getter of its own. Both anchors are null until the
  // size is known, and the snapshot is then retaken.
  const anchor = image.getAnchor();
  return !!anchor && same(anchor, icon.getAnchor());
}

/**
 * @param {import("../../style/Text.js").default} text Text.
 * @param {import("../../style/Text.js").default} snapshot Snapshot.
 * @return {boolean} The snapshot matches.
 */
function textEquals(text, snapshot) {
  return (
    same(text.getText(), snapshot.getText()) &&
    text.getFont() === snapshot.getFont() &&
    text.getPlacement() === snapshot.getPlacement() &&
    text.getRepeat() === snapshot.getRepeat() &&
    text.getMaxAngle() === snapshot.getMaxAngle() &&
    text.getMaxWidth() === snapshot.getMaxWidth() &&
    text.getOverflow() === snapshot.getOverflow() &&
    text.getRotation() === snapshot.getRotation() &&
    text.getRotateWithView() === snapshot.getRotateWithView() &&
    text.getKeepUpright() === snapshot.getKeepUpright() &&
    same(text.getScale(), snapshot.getScale()) &&
    text.getTextAlign() === snapshot.getTextAlign() &&
    text.getJustify() === snapshot.getJustify() &&
    text.getTextBaseline() === snapshot.getTextBaseline() &&
    text.getOffsetX() === snapshot.getOffsetX() &&
    text.getOffsetY() === snapshot.getOffsetY() &&
    same(text.getPadding(), snapshot.getPadding()) &&
    text.getDeclutterMode() === snapshot.getDeclutterMode() &&
    fillEquals(text.getFill(), snapshot.getFill()) &&
    strokeEquals(text.getStroke(), snapshot.getStroke()) &&
    fillEquals(text.getBackgroundFill(), snapshot.getBackgroundFill()) &&
    strokeEquals(text.getBackgroundStroke(), snapshot.getBackgroundStroke())
  );
}

/**
 * Get a snapshot of a style that later changes to the style do not affect.
 * The slot's last snapshot is reused when it matches.
 *
 * @param {Style} style Style.
 * @param {StyleSnapshots} snapshots Snapshots.
 * @param {number} index Index of the style in the style function's result.
 * @return {Style} Snapshot.
 */
export function snapshotStyle(style, snapshots, index) {
  let slot = snapshots[index];
  if (!slot) {
    slot = {
      style: null,
      fill: null,
      stroke: null,
      image: null,
      imageSource: null,
      text: null,
    };
    snapshots[index] = slot;
  }

  const fill = style.getFill();
  if (fill && !fillEquals(fill, slot.fill)) {
    slot.fill = fill.clone();
  }
  const stroke = style.getStroke();
  if (stroke && !strokeEquals(stroke, slot.stroke)) {
    slot.stroke = stroke.clone();
  }
  const image = style.getImage();
  if (
    image &&
    !(slot.image && imageEquals(image, slot.image, image === slot.imageSource))
  ) {
    slot.image = image.clone();
    slot.imageSource = image;
  }
  const text = style.getText();
  if (text && !(slot.text && textEquals(text, slot.text))) {
    slot.text = text.clone();
  }

  const fillSnapshot = fill ? slot.fill : null;
  const strokeSnapshot = stroke ? slot.stroke : null;
  const imageSnapshot = image ? slot.image : null;
  const textSnapshot = text ? slot.text : null;
  let geometry = style.getGeometry();
  const previous = slot.style;
  if (geometry && typeof geometry === 'object') {
    // A geometry can be rewritten in place, and comparing it is not worth it.
    geometry = /** @type {import("../../geom/Geometry.js").default} */ (
      geometry
    ).clone();
  } else if (
    previous &&
    previous.getGeometry() === geometry &&
    previous.getFill() === fillSnapshot &&
    previous.getStroke() === strokeSnapshot &&
    previous.getImage() === imageSnapshot &&
    previous.getText() === textSnapshot &&
    previous.getRenderer() === style.getRenderer() &&
    previous.getZIndex() === style.getZIndex()
  ) {
    return previous;
  }
  const snapshot = new Style({
    geometry: geometry ?? undefined,
    fill: fillSnapshot ?? undefined,
    image: imageSnapshot ?? undefined,
    renderer: style.getRenderer() ?? undefined,
    stroke: strokeSnapshot ?? undefined,
    text: textSnapshot ?? undefined,
    zIndex: style.getZIndex(),
  });
  slot.style = snapshot;
  return snapshot;
}
