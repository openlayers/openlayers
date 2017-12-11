/**
 * @module ol/render/replay
 */
import _ol_render_ReplayType_ from '../render/ReplayType.js';
var _ol_render_replay_ = {};


/**
 * @const
 * @type {Array.<ol.render.ReplayType>}
 */
_ol_render_replay_.ORDER = [
  _ol_render_ReplayType_.POLYGON,
  _ol_render_ReplayType_.CIRCLE,
  _ol_render_ReplayType_.LINE_STRING,
  _ol_render_ReplayType_.IMAGE,
  _ol_render_ReplayType_.TEXT,
  _ol_render_ReplayType_.DEFAULT
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
