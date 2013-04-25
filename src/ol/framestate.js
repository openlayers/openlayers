// FIXME add view3DState
// FIXME factor out common code between usedTiles and wantedTiles

goog.provide('ol.FrameState');
goog.provide('ol.PostRenderFunction');
goog.provide('ol.PreRenderFunction');

goog.require('goog.vec.Mat4');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.TileQueue');
goog.require('ol.TileRange');
goog.require('ol.View2DState');
goog.require('ol.layer.Layer');
goog.require('ol.layer.LayerState');


/**
 * @typedef {{animate: boolean,
 *            attributions: Object.<string, ol.Attribution>,
 *            coordinateToPixelMatrix: goog.vec.Mat4.Number,
 *            extent: (null|ol.Extent),
 *            focus: ol.Coordinate,
 *            index: number,
 *            layersArray: Array.<ol.layer.Layer>,
 *            layerStates: Object.<number, ol.layer.LayerState>,
 *            logos: Object.<string, boolean>,
 *            pixelToCoordinateMatrix: goog.vec.Mat4.Number,
 *            postRenderFunctions: Array.<ol.PostRenderFunction>,
 *            size: ol.Size,
 *            tileQueue: ol.TileQueue,
 *            time: number,
 *            usedTiles: Object.<string, Object.<string, ol.TileRange>>,
 *            view2DState: ol.View2DState,
 *            viewHints: Array.<number>,
 *            wantedTiles: Object.<string, Object.<string, boolean>>}}
 */
ol.FrameState;


/**
 * @typedef {function(ol.Map, ?ol.FrameState): boolean}
 */
ol.PostRenderFunction;


/**
 * @typedef {function(ol.Map, ?ol.FrameState): boolean}
 */
ol.PreRenderFunction;
