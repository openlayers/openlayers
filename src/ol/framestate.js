// FIXME factor out common code between usedTiles and wantedTiles

goog.provide('ol.PostRenderFunction');
goog.provide('ol.PreRenderFunction');


/**
 * @typedef {function(ol.Map, ?olx.FrameState): boolean}
 */
ol.PostRenderFunction;


/**
 * Function to perform manipulations before rendering. This function is called
 * with the {@link ol.Map} as first and an optional {@link olx.FrameState} as
 * second argument. Return `true` to keep this function for the next frame,
 * `false` to remove it.
 * @typedef {function(ol.Map, ?olx.FrameState): boolean}
 * @api
 */
ol.PreRenderFunction;
