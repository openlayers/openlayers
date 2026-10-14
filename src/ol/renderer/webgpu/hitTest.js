/**
 * @module ol/renderer/webgpu/hitTest
 */
import Geometry from '../../geom/Geometry.js';
import {comparePaint} from '../../render/webgpu/drawOrder.js';
import {extendGlyphBounds} from '../../render/webgpu/glyphLayout.js';
import {imageBounds} from '../../render/webgpu/imageBounds.js';
import {apply as applyTransform} from '../../transform.js';

/**
 * One command plus the batch it was drawn from.
 *
 * @typedef {Object} HitItem
 * @property {import("../../render/webgpu/drawOrder.js").DrawCommand} command Command.
 * @property {import("../../render/webgpu/buffers.js").VectorBuffers} buffers Buffers.
 * @property {number} worldOffset World offset of the batch.
 * @property {number} labelOffset Index of this batch's first label in the visibility array.
 * @property {number} tileOrder Tile draw order.
 */

/**
 * Features under a coordinate, from the top of the paint order down.
 * Geometry uses `containsXY`. Icons and text use their label boxes.
 *
 * @param {Array<HitItem>} items Commands to test.
 * @param {import("../../coordinate.js").Coordinate} coordinate View coordinate.
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @param {number} hitTolerance Extra pixels around a label box.
 * @param {Array<boolean>|null|undefined} visibility Label visibility. A missing entry is visible.
 * @param {import("../../coordinate.js").Coordinate|null} featureCoordinate Coordinate in feature space, or null to skip geometry.
 * @return {Array<import("../../Feature.js").FeatureLike>} Hit features, top first.
 */
export function hitFeatures(
  items,
  coordinate,
  frameState,
  hitTolerance,
  visibility,
  featureCoordinate,
) {
  const transform = frameState.coordinateToPixelTransform;
  const pixel = applyTransform(transform, coordinate.slice());
  const ordered = items
    .slice()
    .sort((a, b) =>
      comparePaint(a.command, a.tileOrder, b.command, b.tileOrder),
    );
  /** @type {Array<import("../../Feature.js").FeatureLike>} */
  const features = [];
  const seen = new Set();
  for (let i = ordered.length - 1; i >= 0; --i) {
    const feature = featureForItem(
      ordered[i],
      pixel,
      transform,
      hitTolerance,
      visibility,
      featureCoordinate,
      frameState.viewState.rotation,
    );
    if (!feature || seen.has(feature)) {
      continue;
    }
    seen.add(feature);
    features.push(feature);
  }
  return features;
}

/**
 * @param {HitItem} item Item.
 * @param {import("../../pixel.js").Pixel} pixel Pixel.
 * @param {import("../../transform.js").Transform} transform Coordinate to pixel.
 * @param {number} hitTolerance Hit tolerance.
 * @param {Array<boolean>|null|undefined} visibility Visibility.
 * @param {import("../../coordinate.js").Coordinate|null} featureCoordinate Feature coordinate.
 * @param {number} viewRotation View rotation.
 * @return {import("../../Feature.js").FeatureLike|undefined} Feature.
 */
function featureForItem(
  item,
  pixel,
  transform,
  hitTolerance,
  visibility,
  featureCoordinate,
  viewRotation,
) {
  const command = item.command;
  const buffers = item.buffers;
  if (
    command.pipeline === 'symbol' ||
    command.pipeline === 'icon' ||
    command.pipeline === 'glyph'
  ) {
    const index = command.labelIndex;
    if (index === undefined) {
      return undefined;
    }
    if (visibility && !visibility[item.labelOffset + index]) {
      return undefined;
    }
    const label = buffers.labels[index];
    if (
      !label ||
      !labelContainsPixel(
        label,
        buffers.glyphs,
        pixel,
        transform,
        item.worldOffset,
        hitTolerance,
        viewRotation,
      )
    ) {
      return undefined;
    }
    return buffers.featuresByRef[command.featureRef];
  }
  if (!featureCoordinate) {
    return undefined;
  }
  const feature = buffers.featuresByRef[command.featureRef];
  const geometry = feature?.getGeometry?.();
  const x = featureCoordinate[0] - item.worldOffset;
  const y = featureCoordinate[1];
  // Render features do not implement containment. They stay hittable through
  // their label boxes above.
  if (geometry instanceof Geometry && geometry.containsXY(x, y)) {
    return feature;
  }
  return undefined;
}

/**
 * @param {import("../../render/webgpu/declutter.js").Label} label Label.
 * @param {Array<import("../../render/webgpu/glyphLayout.js").GlyphInstance>} glyphs Glyphs.
 * @param {import("../../pixel.js").Pixel} pixel Pixel.
 * @param {import("../../transform.js").Transform} transform Coordinate to pixel.
 * @param {number} worldOffset World offset.
 * @param {number} tolerance Extra pixels.
 * @param {number} viewRotation View rotation.
 * @return {boolean} The pixel is inside the label.
 */
function labelContainsPixel(
  label,
  glyphs,
  pixel,
  transform,
  worldOffset,
  tolerance,
  viewRotation,
) {
  const pad = tolerance || 0;
  if (label.glyphCount) {
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    const start = label.glyphStart || 0;
    for (let g = 0; g < label.glyphCount; ++g) {
      const glyph = glyphs[start + g];
      if (!glyph) {
        continue;
      }
      const x = glyph.x + worldOffset;
      const pixelX = transform[0] * x + transform[2] * glyph.y + transform[4];
      const pixelY = transform[1] * x + transform[3] * glyph.y + transform[5];
      extendGlyphBounds(bounds, glyph, pixelX, pixelY);
    }
    if (bounds[0] === Infinity) {
      return false;
    }
    return (
      pixel[0] >= bounds[0] - pad &&
      pixel[0] <= bounds[2] + pad &&
      pixel[1] >= bounds[1] - pad &&
      pixel[1] <= bounds[3] + pad
    );
  }
  const anchor =
    /** @type {import("../../coordinate.js").Coordinate|undefined} */ (
      /** @type {any} */ (label)._anchor
    );
  if (!anchor) {
    return false;
  }
  const shifted = [anchor[0] + worldOffset, anchor[1]];
  const p = applyTransform(transform, shifted);
  const bounds = {minX: 0, minY: 0, maxX: 0, maxY: 0};
  imageBounds(bounds, label, p[0], p[1], viewRotation);
  return (
    pixel[0] >= bounds.minX - pad &&
    pixel[0] <= bounds.maxX + pad &&
    pixel[1] >= bounds.minY - pad &&
    pixel[1] <= bounds.maxY + pad
  );
}
