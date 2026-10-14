/**
 * @module ol/render/webgpu/imageBounds
 */

/**
 * Extend bounds with the transformed corners of an image label.
 *
 * @param {{minX:number,minY:number,maxX:number,maxY:number}} bounds Mutable bounds.
 * @param {import("./declutter.js").Label} label Label.
 * @param {number} anchorX Screen anchor x.
 * @param {number} anchorY Screen anchor y.
 * @param {number} viewRotation View rotation.
 */
export function imageBounds(bounds, label, anchorX, anchorY, viewRotation) {
  const corners = label._corners;
  if (!corners) {
    bounds.minX = anchorX + label.minX;
    bounds.minY = anchorY + label.minY;
    bounds.maxX = anchorX + label.maxX;
    bounds.maxY = anchorY + label.maxY;
    return;
  }
  const angle =
    (label._rotation || 0) + (label._rotateWithView ? viewRotation : 0);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  bounds.minX = Infinity;
  bounds.minY = Infinity;
  bounds.maxX = -Infinity;
  bounds.maxY = -Infinity;
  for (let i = 0; i < corners.length; i += 2) {
    const x = anchorX + cos * corners[i] - sin * corners[i + 1];
    const y = anchorY + sin * corners[i] + cos * corners[i + 1];
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
}
