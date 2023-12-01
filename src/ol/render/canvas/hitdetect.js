/**
 * @module ol/render/canvas/hitdetect
 */

import CanvasImmediateRenderer from './Immediate.js';
import {Icon} from '../../style.js';
import {ascending} from '../../array.js';
import {clamp} from '../../math.js';
import {createCanvasContext2D} from '../../dom.js';
import {intersects} from '../../extent.js';

export const HIT_DETECT_RESOLUTION = 0.5;

/**
 * @param {import("../../size.js").Size} size Canvas size in css pixels.
 * @param {Array<import("../../transform.js").Transform>} transforms Transforms
 * for rendering features to all worlds of the viewport, from coordinates to css
 * pixels.
 * @param {Array<import("../../Feature.js").FeatureLike>} features
 * Features to consider for hit detection.
 * @param {import("../../style/Style.js").StyleFunction|undefined} styleFunction
 * Layer style function.
 * @param {import("../../extent.js").Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @return {ImageData} Hit detection image data.
 */
export function createHitDetectionImageData(
  size,
  transforms,
  features,
  styleFunction,
  extent,
  resolution,
  rotation
) {
  const width = size[0] * HIT_DETECT_RESOLUTION;
  const height = size[1] * HIT_DETECT_RESOLUTION;
  const context = createCanvasContext2D(width, height);
  context.imageSmoothingEnabled = false;
  const canvas = context.canvas;
  const renderer = new CanvasImmediateRenderer(
    context,
    HIT_DETECT_RESOLUTION,
    extent,
    null,
    rotation
  );
  const featureCount = features.length;
  // Stretch hit detection index to use the whole available color range
  const indexFactor = Math.floor((256 * 256 * 256 - 1) / featureCount);
  const featuresByZIndex = {};
  for (let i = 1; i <= featureCount; ++i) {
    const feature = features[i - 1];
    const featureStyleFunction = feature.getStyleFunction() || styleFunction;
    if (!featureStyleFunction) {
      continue;
    }
    let styles = featureStyleFunction(feature, resolution);
    if (!styles) {
      continue;
    }
    if (!Array.isArray(styles)) {
      styles = [styles];
    }
    const index = i * indexFactor;
    const color = index.toString(16).padStart(7, '#00000');
    for (let j = 0, jj = styles.length; j < jj; ++j) {
      const originalStyle = styles[j];
      const geometry = originalStyle.getGeometryFunction()(feature);
      if (!geometry || !intersects(extent, geometry.getExtent())) {
        continue;
      }
      const style = originalStyle.clone();
      const fill = style.getFill();
      if (fill) {
        fill.setColor(color);
      }
      const stroke = style.getStroke();
      if (stroke) {
        stroke.setColor(color);
        stroke.setLineDash(null);
      }
      style.setText(undefined);
      const image = originalStyle.getImage();
      if (image) {
        const imgSize = image.getImageSize();
        if (!imgSize) {
          continue;
        }

        const imgContext = createCanvasContext2D(
          imgSize[0],
          imgSize[1],
          undefined,
          {alpha: false}
        );
        const img = imgContext.canvas;
        imgContext.fillStyle = color;
        imgContext.fillRect(0, 0, img.width, img.height);
        style.setImage(
          new Icon({
            img: img,
            anchor: image.getAnchor(),
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            offset: image.getOrigin(),
            opacity: 1,
            size: image.getSize(),
            scale: image.getScale(),
            rotation: image.getRotation(),
            rotateWithView: image.getRotateWithView(),
          })
        );
      }
      const zIndex = style.getZIndex() || 0;
      let byGeometryType = featuresByZIndex[zIndex];
      if (!byGeometryType) {
        byGeometryType = {};
        featuresByZIndex[zIndex] = byGeometryType;
        byGeometryType['Polygon'] = [];
        byGeometryType['Circle'] = [];
        byGeometryType['LineString'] = [];
        byGeometryType['Point'] = [];
      }
      const type = geometry.getType();
      if (type === 'GeometryCollection') {
        const geometries =
          /** @type {import("../../geom/GeometryCollection.js").default} */ (
            geometry
          ).getGeometriesArrayRecursive();
        for (let i = 0, ii = geometries.length; i < ii; ++i) {
          const geometry = geometries[i];
          byGeometryType[geometry.getType().replace('Multi', '')].push(
            geometry,
            style
          );
        }
      } else {
        byGeometryType[type.replace('Multi', '')].push(geometry, style);
      }
    }
  }

  const zIndexKeys = Object.keys(featuresByZIndex).map(Number).sort(ascending);
  for (let i = 0, ii = zIndexKeys.length; i < ii; ++i) {
    const byGeometryType = featuresByZIndex[zIndexKeys[i]];
    for (const type in byGeometryType) {
      const geomAndStyle = byGeometryType[type];
      for (let j = 0, jj = geomAndStyle.length; j < jj; j += 2) {
        renderer.setStyle(geomAndStyle[j + 1]);
        for (let k = 0, kk = transforms.length; k < kk; ++k) {
          renderer.setTransform(transforms[k]);
          renderer.drawGeometry(geomAndStyle[j]);
        }
      }
    }
  }
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * @param {import("../../pixel").Pixel} pixel Pixel coordinate on the hit
 * detection canvas in css pixels.
 * @param {Array<F>} features Features. Has to
 * match the `features` array that was passed to `createHitDetectionImageData()`.
 * @param {ImageData} imageData Hit detection image data generated by
 * `createHitDetectionImageData()`.
 * @return {Array<F>} Features.
 * @template {import("../../Feature.js").FeatureLike} F
 */
export function hitDetect(pixel, features, imageData) {
  /** @type {Array<F>} */
  const resultFeatures = [];
  if (imageData) {
    const x = Math.floor(Math.round(pixel[0]) * HIT_DETECT_RESOLUTION);
    const y = Math.floor(Math.round(pixel[1]) * HIT_DETECT_RESOLUTION);
    // The pixel coordinate is clamped down to the hit-detect canvas' size to account
    // for browsers returning coordinates slightly larger than the actual canvas size
    // due to a non-integer pixel ratio.
    const index =
      (clamp(x, 0, imageData.width - 1) +
        clamp(y, 0, imageData.height - 1) * imageData.width) *
      4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    const i = b + 256 * (g + 256 * r);
    const indexFactor = Math.floor((256 * 256 * 256 - 1) / features.length);
    if (i && i % indexFactor === 0) {
      resultFeatures.push(features[i / indexFactor - 1]);
    }
  }
  return resultFeatures;
}
