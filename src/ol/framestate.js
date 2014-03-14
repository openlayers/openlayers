// FIXME add view3DState
// FIXME factor out common code between usedTiles and wantedTiles

goog.provide('ol.PostRenderFunction');
goog.provide('ol.PreRenderFunction');


/**
 * @typedef {function(ol.Map, ?oli.FrameState): boolean}
 */
ol.PostRenderFunction;


/**
 * @typedef {function(ol.Map, ?oli.FrameState): boolean}
 */
ol.PreRenderFunction;
