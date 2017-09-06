var _ol_render_canvas_ = {};


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
_ol_render_canvas_.defaultFillStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
_ol_render_canvas_.defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultMiterLimit = 10;


/**
 * @const
 * @type {ol.Color}
 */
_ol_render_canvas_.defaultStrokeStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultTextBaseline = 'middle';


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultLineWidth = 1;


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 * @param {number} offsetX X offset.
 * @param {number} offsetY Y offset.
 */
_ol_render_canvas_.rotateAtOffset = function(context, rotation, offsetX, offsetY) {
  if (rotation !== 0) {
    context.translate(offsetX, offsetY);
    context.rotate(rotation);
    context.translate(-offsetX, -offsetY);
  }
};
export default _ol_render_canvas_;
