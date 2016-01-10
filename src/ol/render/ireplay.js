goog.provide('ol.render.IReplayGroup');

goog.require('ol.render.VectorContext');


/**
 * @enum {string}
 */
ol.render.ReplayType = {
  IMAGE: 'Image',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon',
  TEXT: 'Text'
};


/**
 * @const
 * @type {Array.<ol.render.ReplayType>}
 */
ol.render.REPLAY_ORDER = [
  ol.render.ReplayType.POLYGON,
  ol.render.ReplayType.LINE_STRING,
  ol.render.ReplayType.IMAGE,
  ol.render.ReplayType.TEXT
];


/**
 * @interface
 */
ol.render.IReplayGroup = function() {
};


/* eslint-disable valid-jsdoc */
// TODO: enable valid-jsdoc for @interface methods when this issue is resolved
// https://github.com/eslint/eslint/issues/4887


/**
 * @param {number|undefined} zIndex Z index.
 * @param {ol.render.ReplayType} replayType Replay type.
 * @return {ol.render.VectorContext} Replay.
 */
ol.render.IReplayGroup.prototype.getReplay = function(zIndex, replayType) {
};


/**
 * @return {boolean} Is empty.
 */
ol.render.IReplayGroup.prototype.isEmpty = function() {
};
