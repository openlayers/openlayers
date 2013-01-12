// FIXME add view3DState

goog.provide('ol.FrameState');
goog.provide('ol.PostRenderFunction');
goog.provide('ol.PreRenderFunction');

goog.require('ol.Color');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.TileQueue');
goog.require('ol.View2DState');
goog.require('ol.layer.LayerState');


/**
 * @typedef {{animate: boolean,
 *            backgroundColor: ol.Color,
 *            extent: (null|ol.Extent),
 *            layersArray: Array.<ol.layer.Layer>,
 *            layerStates: Object.<number, ol.layer.LayerState>,
 *            postRenderFunctions: Array.<ol.PostRenderFunction>,
 *            size: ol.Size,
 *            tileQueue: ol.TileQueue,
 *            time: number,
 *            view2DState: ol.View2DState,
 *            viewHints: Array.<number>}}
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
