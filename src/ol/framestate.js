// FIXME factor out common code between usedTiles and wantedTiles

goog.provide('ol.PostRenderFunction');
goog.provide('ol.PreRenderFunction');


/**
 * @callback ol.PostRenderFunction
 * @param {ol.Map} map The map
 * @param {olx.FrameState} [frameState] The frame state
 * @return {boolean}
 */
ol.PostRenderFunction;


/**
 * Function to perform manipulations before rendering. This function is called
 * with the {@link ol.Map} as first and an optional {@link olx.FrameState} as
 * second argument. Return `true` to keep this function for the next frame,
 * `false` to remove it.
 * @api
 * @callback ol.PreRenderFunction
 * @param {ol.Map} map The map
 * @param {olx.FrameState} [frameState] The frame state
 * @return {boolean} Returns true to keep this function for the next frame, returns false to remove it
 */
ol.PreRenderFunction;
