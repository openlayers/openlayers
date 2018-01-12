/**
 * @module ol/render/replay
 */
import ReplayType from '../render/ReplayType.js';
const _ol_render_replay_ = {};


/**
 * @const
 * @type {Array.<ol.render.ReplayType>}
 */
_ol_render_replay_.ORDER = [
  ReplayType.POLYGON,
  ReplayType.CIRCLE,
  ReplayType.LINE_STRING,
  ReplayType.IMAGE,
  ReplayType.TEXT,
  ReplayType.DEFAULT
];

/**
 * @const
 * @enum {number}
 */
_ol_render_replay_.TEXT_ALIGN = {};
_ol_render_replay_.TEXT_ALIGN['left'] = 0;
_ol_render_replay_.TEXT_ALIGN['end'] = 0;
_ol_render_replay_.TEXT_ALIGN['center'] = 0.5;
_ol_render_replay_.TEXT_ALIGN['right'] = 1;
_ol_render_replay_.TEXT_ALIGN['start'] = 1;
_ol_render_replay_.TEXT_ALIGN['top'] = 0;
_ol_render_replay_.TEXT_ALIGN['middle'] = 0.5;
_ol_render_replay_.TEXT_ALIGN['hanging'] = 0.2;
_ol_render_replay_.TEXT_ALIGN['alphabetic'] = 0.8;
_ol_render_replay_.TEXT_ALIGN['ideographic'] = 0.8;
_ol_render_replay_.TEXT_ALIGN['bottom'] = 1;
export default _ol_render_replay_;
