/**
 * @module ol/renderer/webgl/hitDetectUtil
 */
import {colorDecodeId} from '../../render/webgl/encodeUtil.js';

/**
 * @type {Array<number>}
 */
const tmpColor = [0, 0, 0, 0];

/**
 * Decodes the feature ref found at the given texel of a hit detection render target.
 * Returns 0 when no feature was rendered at this position.
 * @param {import("../../webgl/RenderTarget.js").default} hitRenderTarget Hit detection render target
 * @param {number} x Texel coordinate
 * @param {number} y Texel coordinate
 * @return {number} Decoded feature ref
 */
function readRefAtTexel(hitRenderTarget, x, y) {
  const data = hitRenderTarget.readPixel(x, y);
  tmpColor[0] = data[0] / 255;
  tmpColor[1] = data[1] / 255;
  tmpColor[2] = data[2] / 255;
  tmpColor[3] = data[3] / 255;
  return colorDecodeId(tmpColor);
}

/**
 * Looks up the features rendered in a hit detection render target at a given pixel and,
 * if a tolerance is given, within a radius around it. The hit detection render target is
 * expected to be rendered at half the size of the frame, with each feature encoded as a
 * unique color; the given `featureFromRef` function is used to resolve decoded colors
 * back to features.
 *
 * A feature found exactly at the pixel is passed to `callback` right away; a truthy
 * callback result stops the lookup and is returned. Otherwise, features found within the
 * tolerance radius are *not* passed to the callback; instead they are pushed to the
 * `matches` array together with their squared distance to the pixel, so that the map
 * renderer can sort them against the matches of other layers before invoking the
 * callback (see `ol/renderer/Map`).
 * @param {import("../../webgl/RenderTarget.js").default} hitRenderTarget Hit detection render target, rendered at half the frame size
 * @param {import("../../pixel.js").Pixel} pixel Pixel around which to look up features (in css pixels)
 * @param {number} hitTolerance Hit tolerance in css pixels
 * @param {function(number): (import("../../Feature.js").FeatureLike|null|undefined)} featureFromRef Resolves a decoded ref to a feature
 * @param {import("../../layer/Layer.js").default} layer The layer being hit detected
 * @param {import("../vector.js").FeatureCallback<T>} callback Feature callback
 * @param {Array<import("../Map.js").HitMatch<T>>} matches The hit detected matches with tolerance
 * @return {T|undefined} Callback result
 * @template T
 */
export function hitDetectFeaturesAtPixel(
  hitRenderTarget,
  pixel,
  hitTolerance,
  featureFromRef,
  layer,
  callback,
  matches,
) {
  const texelX = Math.floor(pixel[0] / 2);
  const texelY = Math.floor(pixel[1] / 2);

  const centerRef = readRefAtTexel(hitRenderTarget, texelX, texelY);
  const centerFeature = centerRef ? featureFromRef(centerRef) : undefined;
  if (centerFeature) {
    const result = callback(centerFeature, layer, null);
    if (result) {
      return result;
    }
  }
  if (!hitTolerance || !matches) {
    return undefined;
  }

  // the hit render target is rendered at half size, so one texel covers two css pixels;
  // the worst-case css pixel distance for a texel `n` texels away is `2 * n - 1`
  const radius = Math.ceil((hitTolerance + 1) / 2);
  const toleranceSq = hitTolerance * hitTolerance;

  // distances are measured between css pixel centers, like in canvas hit detection
  const clickX = Math.floor(pixel[0]) + 0.5;
  const clickY = Math.floor(pixel[1]) + 0.5;

  /**
   * Smallest squared distance to the pixel found so far, by feature ref
   * @type {Map<number, number>}
   */
  const candidates = new Map();
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      // distance from the click css pixel center to the closest of the two css
      // pixel centers the sampled texel covers on each axis
      const distX = Math.max(
        0,
        Math.abs(clickX - ((texelX + dx) * 2 + 1)) - 0.5,
      );
      const distY = Math.max(
        0,
        Math.abs(clickY - ((texelY + dy) * 2 + 1)) - 0.5,
      );
      const distanceSq = distX * distX + distY * distY;
      if (distanceSq > toleranceSq) {
        continue;
      }
      const ref = readRefAtTexel(hitRenderTarget, texelX + dx, texelY + dy);
      if (!ref || ref === centerRef) {
        continue;
      }
      const previous = candidates.get(ref);
      if (previous === undefined || distanceSq < previous) {
        candidates.set(ref, distanceSq);
      }
    }
  }

  for (const [ref, distanceSq] of candidates) {
    const feature = featureFromRef(ref);
    if (feature) {
      matches.push({
        feature: feature,
        layer: layer,
        geometry: null,
        distanceSq: distanceSq,
        callback: callback,
      });
    }
  }
  return undefined;
}
