goog.provide('ol.renderer.webgl');

goog.require('ol.webgl');


/**
 * @define {boolean} Free resources immediately.
 */
ol.renderer.webgl.FREE_RESOURCES_IMMEDIATELY = false;


/**
 * @return {boolean} Is supported.
 */
ol.renderer.webgl.isSupported = ol.webgl.isSupported;
