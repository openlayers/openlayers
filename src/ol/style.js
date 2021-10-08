/**
 * @module ol/style
 */
import Circle from './style/Circle.js';
import Fill from './style/Fill.js';
import Icon from './style/Icon.js';
import RegularShape from './style/RegularShape.js';
import Stroke from './style/Stroke.js';
import Style from './style/Style.js';
import Text from './style/Text.js';

export {default as IconImage} from './style/IconImage.js';
export {default as Image} from './style/Image.js';

/**
 * @typedef {Object} Config
 * @property {import("./style/Fill.js").Options} [fill] Fill style.
 * @property {import("./style/Stroke.js").Options} [stroke] Stroke style.
 * @property {import("./style/Icon.js").Options} [icon] Icon style.
 * @property {import("./style/Circle.js").Options} [circle] Circle style.  This property is ignored if `icon` is provided.
 * @property {import("./style/RegularShape.js").Options} [shape] Shape style.  This property is ignored if `icon` or `circle` is provided.
 * @property {import("./style/Text.js").Options} [text] Text style.
 */

/**
 * @param {Config} config The style configuration.
 * @return {import("./style/Style.js").default} A new style.
 */
function style(config) {
  const options = {};
  if (config.fill) {
    options.fill = new Fill(config.fill);
  }

  if (config.stroke) {
    options.stroke = new Stroke(config.stroke);
  }

  if (config.text) {
    options.text = new Text(config.text);
  }

  if (config.icon) {
    options.image = new Icon(config.icon);
  } else if (config.circle) {
    options.image = new Circle(config.circle);
  } else if (config.shape) {
    options.image = new RegularShape(config.shape);
  }

  return new Style(options);
}

export {Style, Text, RegularShape, Circle, Stroke, Icon, Fill, style};
