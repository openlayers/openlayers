/**
 * @module ol/style/Circle
 */

import RegularShape from './RegularShape.js';

/**
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {Array<number>} [displacement=[0,0]] displacement
 * @property {number|import("../size.js").Size} [scale=1] Scale. A two dimensional scale will produce an ellipse.
 * Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `radius`.
 * @property {number} [rotation=0] Rotation in radians
 * (positive rotation clockwise, meaningful only when used in conjunction with a two dimensional scale).
 * @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view
 * (meaningful only when used in conjunction with a two dimensional scale).
 * @property {import("./Image.js").ImageStylePlacement} [placement='point'] Placement.
 * @property {number} [repeat] Repeat interval. When set, the circle will be repeated at this interval, which specifies
 * the distance between two anchors in pixels. Only available when `placement` is set to `'line'`.
 * @property {import('./Style.js').DeclutterMode} [declutterMode] Declutter mode
 */

/**
 * @classdesc
 * Set circle style for vector features.
 * @api
 */
class CircleStyle extends RegularShape {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options ? options : {radius: 5};

    super({
      points: Infinity,
      fill: options.fill,
      radius: options.radius,
      stroke: options.stroke,
      scale: options.scale !== undefined ? options.scale : 1,
      rotation: options.rotation !== undefined ? options.rotation : 0,
      rotateWithView:
        options.rotateWithView !== undefined ? options.rotateWithView : false,
      displacement:
        options.displacement !== undefined ? options.displacement : [0, 0],
      placement: options.placement,
      repeat: options.repeat,
      declutterMode: options.declutterMode,
    });
  }

  /**
   * Clones the style.
   * @return {CircleStyle} The cloned style.
   * @api
   * @override
   */
  clone() {
    const scale = this.getScale();
    const style = new CircleStyle({
      fill: this.getFill()?.clone(),
      stroke: this.getStroke()?.clone(),
      radius: this.getRadius(),
      scale: Array.isArray(scale) ? scale.slice() : scale,
      rotation: this.getRotation(),
      rotateWithView: this.getRotateWithView(),
      displacement: this.getDisplacement().slice(),
      placement: this.getPlacement(),
      repeat: this.getRepeat(),
      declutterMode: this.getDeclutterMode(),
    });
    style.setOpacity(this.getOpacity());
    return style;
  }
}

export default CircleStyle;
