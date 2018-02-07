/**
 * @module ol/format/KML
 */
import {inherits} from '../index.js';
import Feature from '../Feature.js';
import {extend, includes} from '../array.js';
import {assert} from '../asserts.js';
import {asArray} from '../color.js';
import {transformWithOptions} from '../format/Feature.js';
import XMLFeature from '../format/XMLFeature.js';
import XSD from '../format/XSD.js';
import GeometryCollection from '../geom/GeometryCollection.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import LineString from '../geom/LineString.js';
import MultiLineString from '../geom/MultiLineString.js';
import MultiPoint from '../geom/MultiPoint.js';
import MultiPolygon from '../geom/MultiPolygon.js';
import Point from '../geom/Point.js';
import Polygon from '../geom/Polygon.js';
import {toRadians} from '../math.js';
import {get as getProjection} from '../proj.js';
import Fill from '../style/Fill.js';
import Icon from '../style/Icon.js';
import IconAnchorUnits from '../style/IconAnchorUnits.js';
import IconOrigin from '../style/IconOrigin.js';
import Stroke from '../style/Stroke.js';
import Style from '../style/Style.js';
import Text from '../style/Text.js';
import {createElementNS, getAllTextContent, isDocument, isNode, makeArrayExtender,
  makeArrayPusher, makeChildAppender, makeObjectPropertySetter,
  makeReplacer, makeSequence, makeSimpleNodeFactory, makeStructureNS,
  OBJECT_PROPERTY_NODE_FACTORY, parse, parseNode, pushParseAndPop,
  pushSerializeAndPop, setAttributeNS} from '../xml.js';

/**
 * @classdesc
 * Feature format for reading and writing data in the KML format.
 *
 * Note that the KML format uses the URL() constructor. Older browsers such as IE
 * which do not support this will need a URL polyfill to be loaded before use.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @param {olx.format.KMLOptions=} opt_options Options.
 * @api
 */
const KML = function(opt_options) {

  const options = opt_options ? opt_options : {};

  XMLFeature.call(this);

  if (!KML.DEFAULT_STYLE_ARRAY_) {
    KML.createStyleDefaults_();
  }

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = getProjection('EPSG:4326');

  /**
   * @private
   * @type {Array.<ol.style.Style>}
   */
  this.defaultStyle_ = options.defaultStyle ?
    options.defaultStyle : KML.DEFAULT_STYLE_ARRAY_;

  /**
   * @private
   * @type {boolean}
   */
  this.extractStyles_ = options.extractStyles !== undefined ?
    options.extractStyles : true;

  /**
   * @private
   * @type {boolean}
   */
  this.writeStyles_ = options.writeStyles !== undefined ?
    options.writeStyles : true;

  /**
   * @private
   * @type {Object.<string, (Array.<ol.style.Style>|string)>}
   */
  this.sharedStyles_ = {};

  /**
   * @private
   * @type {boolean}
   */
  this.showPointNames_ = options.showPointNames !== undefined ?
    options.showPointNames : true;

};

inherits(KML, XMLFeature);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
KML.GX_NAMESPACE_URIS_ = [
  'http://www.google.com/kml/ext/2.2'
];


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
KML.NAMESPACE_URIS_ = [
  null,
  'http://earth.google.com/kml/2.0',
  'http://earth.google.com/kml/2.1',
  'http://earth.google.com/kml/2.2',
  'http://www.opengis.net/kml/2.2'
];


/**
 * @const
 * @type {string}
 * @private
 */
KML.SCHEMA_LOCATION_ = 'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';


/**
 * @return {Array.<ol.style.Style>} Default style.
 * @private
 */
KML.createStyleDefaults_ = function() {
  /**
   * @const
   * @type {ol.Color}
   * @private
   */
  KML.DEFAULT_COLOR_ = [255, 255, 255, 1];

  /**
   * @const
   * @type {ol.style.Fill}
   * @private
   */
  KML.DEFAULT_FILL_STYLE_ = new Fill({
    color: KML.DEFAULT_COLOR_
  });

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_ANCHOR_ = [20, 2]; // FIXME maybe [8, 32] ?

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_ = IconAnchorUnits.PIXELS;

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_ = IconAnchorUnits.PIXELS;

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_SIZE_ = [64, 64];

  /**
   * @const
   * @type {string}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_SRC_ =
      'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

  /**
   * @const
   * @type {number}
   * @private
   */
  KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_ = 0.5;

  /**
   * @const
   * @type {ol.style.Image}
   * @private
   */
  KML.DEFAULT_IMAGE_STYLE_ = new Icon({
    anchor: KML.DEFAULT_IMAGE_STYLE_ANCHOR_,
    anchorOrigin: IconOrigin.BOTTOM_LEFT,
    anchorXUnits: KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_,
    anchorYUnits: KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_,
    crossOrigin: 'anonymous',
    rotation: 0,
    scale: KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_,
    size: KML.DEFAULT_IMAGE_STYLE_SIZE_,
    src: KML.DEFAULT_IMAGE_STYLE_SRC_
  });

  /**
   * @const
   * @type {string}
   * @private
   */
  KML.DEFAULT_NO_IMAGE_STYLE_ = 'NO_IMAGE';

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  KML.DEFAULT_STROKE_STYLE_ = new Stroke({
    color: KML.DEFAULT_COLOR_,
    width: 1
  });

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  KML.DEFAULT_TEXT_STROKE_STYLE_ = new Stroke({
    color: [51, 51, 51, 1],
    width: 2
  });

  /**
   * @const
   * @type {ol.style.Text}
   * @private
   */
  KML.DEFAULT_TEXT_STYLE_ = new Text({
    font: 'bold 16px Helvetica',
    fill: KML.DEFAULT_FILL_STYLE_,
    stroke: KML.DEFAULT_TEXT_STROKE_STYLE_,
    scale: 0.8
  });

  /**
   * @const
   * @type {ol.style.Style}
   * @private
   */
  KML.DEFAULT_STYLE_ = new Style({
    fill: KML.DEFAULT_FILL_STYLE_,
    image: KML.DEFAULT_IMAGE_STYLE_,
    text: KML.DEFAULT_TEXT_STYLE_,
    stroke: KML.DEFAULT_STROKE_STYLE_,
    zIndex: 0
  });

  /**
   * @const
   * @type {Array.<ol.style.Style>}
   * @private
   */
  KML.DEFAULT_STYLE_ARRAY_ = [KML.DEFAULT_STYLE_];

  return KML.DEFAULT_STYLE_ARRAY_;
};


/**
 * @const
 * @type {Object.<string, ol.style.IconAnchorUnits>}
 * @private
 */
KML.ICON_ANCHOR_UNITS_MAP_ = {
  'fraction': IconAnchorUnits.FRACTION,
  'pixels': IconAnchorUnits.PIXELS,
  'insetPixels': IconAnchorUnits.PIXELS
};


/**
 * @param {ol.style.Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {ol.style.Style} style Style.
 * @private
 */
KML.createNameStyleFunction_ = function(foundStyle, name) {
  let textStyle = null;
  const textOffset = [0, 0];
  let textAlign = 'start';
  if (foundStyle.getImage()) {
    let imageSize = foundStyle.getImage().getImageSize();
    if (imageSize === null) {
      imageSize = KML.DEFAULT_IMAGE_STYLE_SIZE_;
    }
    if (imageSize.length == 2) {
      const imageScale = foundStyle.getImage().getScale();
      // Offset the label to be centered to the right of the icon, if there is
      // one.
      textOffset[0] = imageScale * imageSize[0] / 2;
      textOffset[1] = -imageScale * imageSize[1] / 2;
      textAlign = 'left';
    }
  }
  if (foundStyle.getText() !== null) {
    // clone the text style, customizing it with name, alignments and offset.
    // Note that kml does not support many text options that OpenLayers does (rotation, textBaseline).
    const foundText = foundStyle.getText();
    textStyle = foundText.clone();
    textStyle.setFont(foundText.getFont() || KML.DEFAULT_TEXT_STYLE_.getFont());
    textStyle.setScale(foundText.getScale() || KML.DEFAULT_TEXT_STYLE_.getScale());
    textStyle.setFill(foundText.getFill() || KML.DEFAULT_TEXT_STYLE_.getFill());
    textStyle.setStroke(foundText.getStroke() || KML.DEFAULT_TEXT_STROKE_STYLE_);
  } else {
    textStyle = KML.DEFAULT_TEXT_STYLE_.clone();
  }
  textStyle.setText(name);
  textStyle.setOffsetX(textOffset[0]);
  textStyle.setOffsetY(textOffset[1]);
  textStyle.setTextAlign(textAlign);

  const nameStyle = new Style({
    text: textStyle
  });
  return nameStyle;
};


/**
 * @param {Array.<ol.style.Style>|undefined} style Style.
 * @param {string} styleUrl Style URL.
 * @param {Array.<ol.style.Style>} defaultStyle Default style.
 * @param {Object.<string, (Array.<ol.style.Style>|string)>} sharedStyles Shared
 *          styles.
 * @param {boolean|undefined} showPointNames true to show names for point
 *          placemarks.
 * @return {ol.FeatureStyleFunction} Feature style function.
 * @private
 */
KML.createFeatureStyleFunction_ = function(style, styleUrl,
  defaultStyle, sharedStyles, showPointNames) {

  return (
    /**
         * @param {number} resolution Resolution.
         * @return {Array.<ol.style.Style>} Style.
         * @this {ol.Feature}
         */
    function(resolution) {
      let drawName = showPointNames;
      /** @type {ol.style.Style|undefined} */
      let nameStyle;
      let name = '';
      if (drawName) {
        if (this.getGeometry()) {
          drawName = (this.getGeometry().getType() ===
                        GeometryType.POINT);
        }
      }

      if (drawName) {
        name = /** @type {string} */ (this.get('name'));
        drawName = drawName && name;
      }

      if (style) {
        if (drawName) {
          nameStyle = KML.createNameStyleFunction_(style[0],
            name);
          return style.concat(nameStyle);
        }
        return style;
      }
      if (styleUrl) {
        const foundStyle = KML.findStyle_(styleUrl, defaultStyle,
          sharedStyles);
        if (drawName) {
          nameStyle = KML.createNameStyleFunction_(foundStyle[0],
            name);
          return foundStyle.concat(nameStyle);
        }
        return foundStyle;
      }
      if (drawName) {
        nameStyle = KML.createNameStyleFunction_(defaultStyle[0],
          name);
        return defaultStyle.concat(nameStyle);
      }
      return defaultStyle;
    }
  );
};


/**
 * @param {Array.<ol.style.Style>|string|undefined} styleValue Style value.
 * @param {Array.<ol.style.Style>} defaultStyle Default style.
 * @param {Object.<string, (Array.<ol.style.Style>|string)>} sharedStyles
 * Shared styles.
 * @return {Array.<ol.style.Style>} Style.
 * @private
 */
KML.findStyle_ = function(styleValue, defaultStyle, sharedStyles) {
  if (Array.isArray(styleValue)) {
    return styleValue;
  } else if (typeof styleValue === 'string') {
    // KML files in the wild occasionally forget the leading `#` on styleUrls
    // defined in the same document.  Add a leading `#` if it enables to find
    // a style.
    if (!(styleValue in sharedStyles) && ('#' + styleValue in sharedStyles)) {
      styleValue = '#' + styleValue;
    }
    return KML.findStyle_(
      sharedStyles[styleValue], defaultStyle, sharedStyles);
  } else {
    return defaultStyle;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.Color|undefined} Color.
 */
KML.readColor_ = function(node) {
  const s = getAllTextContent(node, false);
  // The KML specification states that colors should not include a leading `#`
  // but we tolerate them.
  const m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    const hexColor = m[1];
    return [
      parseInt(hexColor.substr(6, 2), 16),
      parseInt(hexColor.substr(4, 2), 16),
      parseInt(hexColor.substr(2, 2), 16),
      parseInt(hexColor.substr(0, 2), 16) / 255
    ];

  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {Array.<number>|undefined} Flat coordinates.
 */
KML.readFlatCoordinates_ = function(node) {
  let s = getAllTextContent(node, false);
  const flatCoordinates = [];
  // The KML specification states that coordinate tuples should not include
  // spaces, but we tolerate them.
  const re =
      /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i;
  let m;
  while ((m = re.exec(s))) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = m[3] ? parseFloat(m[3]) : 0;
    flatCoordinates.push(x, y, z);
    s = s.substr(m[0].length);
  }
  if (s !== '') {
    return undefined;
  }
  return flatCoordinates;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {string} URI.
 */
KML.readURI_ = function(node) {
  const s = getAllTextContent(node, false).trim();
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL(s, baseURI);
    return url.href;
  } else {
    return s;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.KMLVec2_} Vec2.
 */
KML.readVec2_ = function(node) {
  const xunits = node.getAttribute('xunits');
  const yunits = node.getAttribute('yunits');
  let origin;
  if (xunits !== 'insetPixels') {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_LEFT;
    } else {
      origin = IconOrigin.TOP_LEFT;
    }
  } else {
    if (yunits !== 'insetPixels') {
      origin = IconOrigin.BOTTOM_RIGHT;
    } else {
      origin = IconOrigin.TOP_RIGHT;
    }
  }
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: KML.ICON_ANCHOR_UNITS_MAP_[xunits],
    y: parseFloat(node.getAttribute('y')),
    yunits: KML.ICON_ANCHOR_UNITS_MAP_[yunits],
    origin: origin
  };
};


/**
 * @param {Node} node Node.
 * @private
 * @return {number|undefined} Scale.
 */
KML.readScale_ = function(node) {
  return XSD.readDecimal(node);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.style.Style>|string|undefined} StyleMap.
 */
KML.readStyleMapValue_ = function(node, objectStack) {
  return pushParseAndPop(undefined,
    KML.STYLE_MAP_PARSERS_, node, objectStack);
};
/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.IconStyleParser_ = function(node, objectStack) {
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  const object = pushParseAndPop(
    {}, KML.ICON_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const IconObject = 'Icon' in object ? object['Icon'] : {};
  const drawIcon = (!('Icon' in object) || Object.keys(IconObject).length > 0);
  let src;
  const href = /** @type {string|undefined} */
      (IconObject['href']);
  if (href) {
    src = href;
  } else if (drawIcon) {
    src = KML.DEFAULT_IMAGE_STYLE_SRC_;
  }
  let anchor, anchorXUnits, anchorYUnits;
  let anchorOrigin = IconOrigin.BOTTOM_LEFT;
  const hotSpot = /** @type {ol.KMLVec2_|undefined} */
      (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
    anchorOrigin = hotSpot.origin;
  } else if (src === KML.DEFAULT_IMAGE_STYLE_SRC_) {
    anchor = KML.DEFAULT_IMAGE_STYLE_ANCHOR_;
    anchorXUnits = KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_;
    anchorYUnits = KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_;
  } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
    anchor = [0.5, 0];
    anchorXUnits = IconAnchorUnits.FRACTION;
    anchorYUnits = IconAnchorUnits.FRACTION;
  }

  let offset;
  const x = /** @type {number|undefined} */
      (IconObject['x']);
  const y = /** @type {number|undefined} */
      (IconObject['y']);
  if (x !== undefined && y !== undefined) {
    offset = [x, y];
  }

  let size;
  const w = /** @type {number|undefined} */
      (IconObject['w']);
  const h = /** @type {number|undefined} */
      (IconObject['h']);
  if (w !== undefined && h !== undefined) {
    size = [w, h];
  }

  let rotation;
  const heading = /** @type {number} */
      (object['heading']);
  if (heading !== undefined) {
    rotation = toRadians(heading);
  }

  let scale = /** @type {number|undefined} */
      (object['scale']);

  if (drawIcon) {
    if (src == KML.DEFAULT_IMAGE_STYLE_SRC_) {
      size = KML.DEFAULT_IMAGE_STYLE_SIZE_;
      if (scale === undefined) {
        scale = KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_;
      }
    }

    const imageStyle = new Icon({
      anchor: anchor,
      anchorOrigin: anchorOrigin,
      anchorXUnits: anchorXUnits,
      anchorYUnits: anchorYUnits,
      crossOrigin: 'anonymous', // FIXME should this be configurable?
      offset: offset,
      offsetOrigin: IconOrigin.BOTTOM_LEFT,
      rotation: rotation,
      scale: scale,
      size: size,
      src: src
    });
    styleObject['imageStyle'] = imageStyle;
  } else {
    // handle the case when we explicitly want to draw no icon.
    styleObject['imageStyle'] = KML.DEFAULT_NO_IMAGE_STYLE_;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.LabelStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop(
    {}, KML.LABEL_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const textStyle = new Text({
    fill: new Fill({
      color: /** @type {ol.Color} */
          ('color' in object ? object['color'] : KML.DEFAULT_COLOR_)
    }),
    scale: /** @type {number|undefined} */
        (object['scale'])
  });
  styleObject['textStyle'] = textStyle;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.LineStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  const object = pushParseAndPop(
    {}, KML.LINE_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const strokeStyle = new Stroke({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : KML.DEFAULT_COLOR_),
    width: /** @type {number} */ ('width' in object ? object['width'] : 1)
  });
  styleObject['strokeStyle'] = strokeStyle;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.PolyStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  const object = pushParseAndPop(
    {}, KML.POLY_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const styleObject = objectStack[objectStack.length - 1];
  const fillStyle = new Fill({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : KML.DEFAULT_COLOR_)
  });
  styleObject['fillStyle'] = fillStyle;
  const fill = /** @type {boolean|undefined} */ (object['fill']);
  if (fill !== undefined) {
    styleObject['fill'] = fill;
  }
  const outline =
      /** @type {boolean|undefined} */ (object['outline']);
  if (outline !== undefined) {
    styleObject['outline'] = outline;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} LinearRing flat coordinates.
 */
KML.readFlatLinearRing_ = function(node, objectStack) {
  return pushParseAndPop(null,
    KML.FLAT_LINEAR_RING_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.gxCoordParser_ = function(node, objectStack) {
  const gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const s = getAllTextContent(node, false);
  const re =
      /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
  const m = re.exec(s);
  if (m) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = parseFloat(m[3]);
    flatCoordinates.push(x, y, z, 0);
  } else {
    flatCoordinates.push(0, 0, 0, 0);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
KML.readGxMultiTrack_ = function(node, objectStack) {
  const lineStrings = pushParseAndPop([],
    KML.GX_MULTITRACK_GEOMETRY_PARSERS_, node, objectStack);
  if (!lineStrings) {
    return undefined;
  }
  const multiLineString = new MultiLineString(null);
  multiLineString.setLineStrings(lineStrings);
  return multiLineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
KML.readGxTrack_ = function(node, objectStack) {
  const gxTrackObject = pushParseAndPop(
    /** @type {ol.KMLGxTrackObject_} */ ({
      flatCoordinates: [],
      whens: []
    }), KML.GX_TRACK_PARSERS_, node, objectStack);
  if (!gxTrackObject) {
    return undefined;
  }
  const flatCoordinates = gxTrackObject.flatCoordinates;
  const whens = gxTrackObject.whens;
  let i, ii;
  for (i = 0, ii = Math.min(flatCoordinates.length, whens.length); i < ii;
    ++i) {
    flatCoordinates[4 * i + 3] = whens[i];
  }
  const lineString = new LineString(null);
  lineString.setFlatCoordinates(GeometryLayout.XYZM, flatCoordinates);
  return lineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object} Icon object.
 */
KML.readIcon_ = function(node, objectStack) {
  const iconObject = pushParseAndPop(
    {}, KML.ICON_PARSERS_, node, objectStack);
  if (iconObject) {
    return iconObject;
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
KML.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  return pushParseAndPop(null,
    KML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
KML.readLineString_ = function(node, objectStack) {
  const properties = pushParseAndPop({},
    KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
    objectStack);
  const flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const lineString = new LineString(null);
    lineString.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    lineString.setProperties(properties);
    return lineString;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
KML.readLinearRing_ = function(node, objectStack) {
  const properties = pushParseAndPop({},
    KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
    objectStack);
  const flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const polygon = new Polygon(null);
    polygon.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates,
      [flatCoordinates.length]);
    polygon.setProperties(properties);
    return polygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Geometry} Geometry.
 */
KML.readMultiGeometry_ = function(node, objectStack) {
  const geometries = pushParseAndPop([],
    KML.MULTI_GEOMETRY_PARSERS_, node, objectStack);
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new GeometryCollection(geometries);
  }
  /** @type {ol.geom.Geometry} */
  let multiGeometry;
  let homogeneous = true;
  const type = geometries[0].getType();
  let geometry, i, ii;
  for (i = 1, ii = geometries.length; i < ii; ++i) {
    geometry = geometries[i];
    if (geometry.getType() != type) {
      homogeneous = false;
      break;
    }
  }
  if (homogeneous) {
    let layout;
    let flatCoordinates;
    if (type == GeometryType.POINT) {
      const point = geometries[0];
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      multiGeometry = new MultiPoint(null);
      multiGeometry.setFlatCoordinates(layout, flatCoordinates);
      KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == GeometryType.LINE_STRING) {
      multiGeometry = new MultiLineString(null);
      multiGeometry.setLineStrings(geometries);
      KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == GeometryType.POLYGON) {
      multiGeometry = new MultiPolygon(null);
      multiGeometry.setPolygons(geometries);
      KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == GeometryType.GEOMETRY_COLLECTION) {
      multiGeometry = new GeometryCollection(geometries);
    } else {
      assert(false, 37); // Unknown geometry type found
    }
  } else {
    multiGeometry = new GeometryCollection(geometries);
  }
  return /** @type {ol.geom.Geometry} */ (multiGeometry);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
KML.readPoint_ = function(node, objectStack) {
  const properties = pushParseAndPop({},
    KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
    objectStack);
  const flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    const point = new Point(null);
    point.setFlatCoordinates(GeometryLayout.XYZ, flatCoordinates);
    point.setProperties(properties);
    return point;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Polygon|undefined} Polygon.
 */
KML.readPolygon_ = function(node, objectStack) {
  const properties = pushParseAndPop(/** @type {Object<string,*>} */ ({}),
    KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
    objectStack);
  const flatLinearRings = pushParseAndPop([null],
    KML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (flatLinearRings && flatLinearRings[0]) {
    const polygon = new Polygon(null);
    const flatCoordinates = flatLinearRings[0];
    const ends = [flatCoordinates.length];
    let i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
      GeometryLayout.XYZ, flatCoordinates, ends);
    polygon.setProperties(properties);
    return polygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.style.Style>} Style.
 */
KML.readStyle_ = function(node, objectStack) {
  const styleObject = pushParseAndPop(
    {}, KML.STYLE_PARSERS_, node, objectStack);
  if (!styleObject) {
    return null;
  }
  let fillStyle = /** @type {ol.style.Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : KML.DEFAULT_FILL_STYLE_);
  const fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  let imageStyle = /** @type {ol.style.Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : KML.DEFAULT_IMAGE_STYLE_);
  if (imageStyle == KML.DEFAULT_NO_IMAGE_STYLE_) {
    imageStyle = undefined;
  }
  const textStyle = /** @type {ol.style.Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : KML.DEFAULT_TEXT_STYLE_);
  let strokeStyle = /** @type {ol.style.Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : KML.DEFAULT_STROKE_STYLE_);
  const outline = /** @type {boolean|undefined} */
      (styleObject['outline']);
  if (outline !== undefined && !outline) {
    strokeStyle = null;
  }
  return [new Style({
    fill: fillStyle,
    image: imageStyle,
    stroke: strokeStyle,
    text: textStyle,
    zIndex: undefined // FIXME
  })];
};


/**
 * Reads an array of geometries and creates arrays for common geometry
 * properties. Then sets them to the multi geometry.
 * @param {ol.geom.MultiPoint|ol.geom.MultiLineString|ol.geom.MultiPolygon}
 *     multiGeometry A multi-geometry.
 * @param {Array.<ol.geom.Geometry>} geometries List of geometries.
 * @private
 */
KML.setCommonGeometryProperties_ = function(multiGeometry,
  geometries) {
  const ii = geometries.length;
  const extrudes = new Array(geometries.length);
  const tessellates = new Array(geometries.length);
  const altitudeModes = new Array(geometries.length);
  let geometry, i, hasExtrude, hasTessellate, hasAltitudeMode;
  hasExtrude = hasTessellate = hasAltitudeMode = false;
  for (i = 0; i < ii; ++i) {
    geometry = geometries[i];
    extrudes[i] = geometry.get('extrude');
    tessellates[i] = geometry.get('tessellate');
    altitudeModes[i] = geometry.get('altitudeMode');
    hasExtrude = hasExtrude || extrudes[i] !== undefined;
    hasTessellate = hasTessellate || tessellates[i] !== undefined;
    hasAltitudeMode = hasAltitudeMode || altitudeModes[i];
  }
  if (hasExtrude) {
    multiGeometry.set('extrude', extrudes);
  }
  if (hasTessellate) {
    multiGeometry.set('tessellate', tessellates);
  }
  if (hasAltitudeMode) {
    multiGeometry.set('altitudeMode', altitudeModes);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.DataParser_ = function(node, objectStack) {
  const name = node.getAttribute('name');
  parseNode(KML.DATA_PARSERS_, node, objectStack);
  const featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  if (name !== null) {
    featureObject[name] = featureObject.value;
  } else if (featureObject.displayName !== null) {
    featureObject[featureObject.displayName] = featureObject.value;
  }
  delete featureObject['value'];
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.ExtendedDataParser_ = function(node, objectStack) {
  parseNode(KML.EXTENDED_DATA_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.RegionParser_ = function(node, objectStack) {
  parseNode(KML.REGION_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.PairDataParser_ = function(node, objectStack) {
  const pairObject = pushParseAndPop(
    {}, KML.PAIR_PARSERS_, node, objectStack);
  if (!pairObject) {
    return;
  }
  const key = /** @type {string|undefined} */
      (pairObject['key']);
  if (key && key == 'normal') {
    const styleUrl = /** @type {string|undefined} */
        (pairObject['styleUrl']);
    if (styleUrl) {
      objectStack[objectStack.length - 1] = styleUrl;
    }
    const Style = /** @type {ol.style.Style} */
        (pairObject['Style']);
    if (Style) {
      objectStack[objectStack.length - 1] = Style;
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.PlacemarkStyleMapParser_ = function(node, objectStack) {
  const styleMapValue = KML.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  const placemarkObject = objectStack[objectStack.length - 1];
  if (Array.isArray(styleMapValue)) {
    placemarkObject['Style'] = styleMapValue;
  } else if (typeof styleMapValue === 'string') {
    placemarkObject['styleUrl'] = styleMapValue;
  } else {
    assert(false, 38); // `styleMapValue` has an unknown type
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.SchemaDataParser_ = function(node, objectStack) {
  parseNode(KML.SCHEMA_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.SimpleDataParser_ = function(node, objectStack) {
  const name = node.getAttribute('name');
  if (name !== null) {
    const data = XSD.readString(node);
    const featureObject =
        /** @type {Object} */ (objectStack[objectStack.length - 1]);
    featureObject[name] = data;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.LatLonAltBoxParser_ = function(node, objectStack) {
  const object = pushParseAndPop({}, KML.LAT_LON_ALT_BOX_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const regionObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  const extent = [
    parseFloat(object['west']),
    parseFloat(object['south']),
    parseFloat(object['east']),
    parseFloat(object['north'])
  ];
  regionObject['extent'] = extent;
  regionObject['altitudeMode'] = object['altitudeMode'];
  regionObject['minAltitude'] = parseFloat(object['minAltitude']);
  regionObject['maxAltitude'] = parseFloat(object['maxAltitude']);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.LodParser_ = function(node, objectStack) {
  const object = pushParseAndPop({}, KML.LOD_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  const lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  lodObject['minLodPixels'] = parseFloat(object['minLodPixels']);
  lodObject['maxLodPixels'] = parseFloat(object['maxLodPixels']);
  lodObject['minFadeExtent'] = parseFloat(object['minFadeExtent']);
  lodObject['maxFadeExtent'] = parseFloat(object['maxFadeExtent']);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.innerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  const flatLinearRing = pushParseAndPop(undefined,
    KML.INNER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (flatLinearRing) {
    const flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.outerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  const flatLinearRing = pushParseAndPop(undefined,
    KML.OUTER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (flatLinearRing) {
    const flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.LinkParser_ = function(node, objectStack) {
  parseNode(KML.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.whenParser_ = function(node, objectStack) {
  const gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  const whens = gxTrackObject.whens;
  const s = getAllTextContent(node, false);
  const when = Date.parse(s);
  whens.push(isNaN(when) ? 0 : when);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.DATA_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'displayName': makeObjectPropertySetter(XSD.readString),
    'value': makeObjectPropertySetter(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.EXTENDED_DATA_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Data': KML.DataParser_,
    'SchemaData': KML.SchemaDataParser_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.REGION_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LatLonAltBox': KML.LatLonAltBoxParser_,
    'Lod': KML.LodParser_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LAT_LON_ALT_BOX_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'altitudeMode': makeObjectPropertySetter(XSD.readString),
    'minAltitude': makeObjectPropertySetter(XSD.readDecimal),
    'maxAltitude': makeObjectPropertySetter(XSD.readDecimal),
    'north': makeObjectPropertySetter(XSD.readDecimal),
    'south': makeObjectPropertySetter(XSD.readDecimal),
    'east': makeObjectPropertySetter(XSD.readDecimal),
    'west': makeObjectPropertySetter(XSD.readDecimal)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LOD_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'minLodPixels': makeObjectPropertySetter(XSD.readDecimal),
    'maxLodPixels': makeObjectPropertySetter(XSD.readDecimal),
    'minFadeExtent': makeObjectPropertySetter(XSD.readDecimal),
    'maxFadeExtent': makeObjectPropertySetter(XSD.readDecimal)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'extrude': makeObjectPropertySetter(XSD.readBoolean),
    'tessellate': makeObjectPropertySetter(XSD.readBoolean),
    'altitudeMode': makeObjectPropertySetter(XSD.readString)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.FLAT_LINEAR_RING_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'coordinates': makeReplacer(KML.readFlatCoordinates_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.FLAT_LINEAR_RINGS_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'innerBoundaryIs': KML.innerBoundaryIsParser_,
    'outerBoundaryIs': KML.outerBoundaryIsParser_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GX_TRACK_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'when': KML.whenParser_
  }, makeStructureNS(
    KML.GX_NAMESPACE_URIS_, {
      'coord': KML.gxCoordParser_
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'coordinates': makeReplacer(KML.readFlatCoordinates_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.ICON_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'href': makeObjectPropertySetter(KML.readURI_)
  }, makeStructureNS(
    KML.GX_NAMESPACE_URIS_, {
      'x': makeObjectPropertySetter(XSD.readDecimal),
      'y': makeObjectPropertySetter(XSD.readDecimal),
      'w': makeObjectPropertySetter(XSD.readDecimal),
      'h': makeObjectPropertySetter(XSD.readDecimal)
    }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.ICON_STYLE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Icon': makeObjectPropertySetter(KML.readIcon_),
    'heading': makeObjectPropertySetter(XSD.readDecimal),
    'hotSpot': makeObjectPropertySetter(KML.readVec2_),
    'scale': makeObjectPropertySetter(KML.readScale_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.INNER_BOUNDARY_IS_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LinearRing': makeReplacer(KML.readFlatLinearRing_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LABEL_STYLE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeObjectPropertySetter(KML.readColor_),
    'scale': makeObjectPropertySetter(KML.readScale_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LINE_STYLE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeObjectPropertySetter(KML.readColor_),
    'width': makeObjectPropertySetter(XSD.readDecimal)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.MULTI_GEOMETRY_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LineString': makeArrayPusher(KML.readLineString_),
    'LinearRing': makeArrayPusher(KML.readLinearRing_),
    'MultiGeometry': makeArrayPusher(KML.readMultiGeometry_),
    'Point': makeArrayPusher(KML.readPoint_),
    'Polygon': makeArrayPusher(KML.readPolygon_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GX_MULTITRACK_GEOMETRY_PARSERS_ = makeStructureNS(
  KML.GX_NAMESPACE_URIS_, {
    'Track': makeArrayPusher(KML.readGxTrack_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.NETWORK_LINK_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'ExtendedData': KML.ExtendedDataParser_,
    'Region': KML.RegionParser_,
    'Link': KML.LinkParser_,
    'address': makeObjectPropertySetter(XSD.readString),
    'description': makeObjectPropertySetter(XSD.readString),
    'name': makeObjectPropertySetter(XSD.readString),
    'open': makeObjectPropertySetter(XSD.readBoolean),
    'phoneNumber': makeObjectPropertySetter(XSD.readString),
    'visibility': makeObjectPropertySetter(XSD.readBoolean)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LINK_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'href': makeObjectPropertySetter(KML.readURI_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.OUTER_BOUNDARY_IS_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LinearRing': makeReplacer(KML.readFlatLinearRing_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.PAIR_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Style': makeObjectPropertySetter(KML.readStyle_),
    'key': makeObjectPropertySetter(XSD.readString),
    'styleUrl': makeObjectPropertySetter(KML.readURI_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.PLACEMARK_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'ExtendedData': KML.ExtendedDataParser_,
    'Region': KML.RegionParser_,
    'MultiGeometry': makeObjectPropertySetter(
      KML.readMultiGeometry_, 'geometry'),
    'LineString': makeObjectPropertySetter(
      KML.readLineString_, 'geometry'),
    'LinearRing': makeObjectPropertySetter(
      KML.readLinearRing_, 'geometry'),
    'Point': makeObjectPropertySetter(
      KML.readPoint_, 'geometry'),
    'Polygon': makeObjectPropertySetter(
      KML.readPolygon_, 'geometry'),
    'Style': makeObjectPropertySetter(KML.readStyle_),
    'StyleMap': KML.PlacemarkStyleMapParser_,
    'address': makeObjectPropertySetter(XSD.readString),
    'description': makeObjectPropertySetter(XSD.readString),
    'name': makeObjectPropertySetter(XSD.readString),
    'open': makeObjectPropertySetter(XSD.readBoolean),
    'phoneNumber': makeObjectPropertySetter(XSD.readString),
    'styleUrl': makeObjectPropertySetter(KML.readURI_),
    'visibility': makeObjectPropertySetter(XSD.readBoolean)
  }, makeStructureNS(
    KML.GX_NAMESPACE_URIS_, {
      'MultiTrack': makeObjectPropertySetter(
        KML.readGxMultiTrack_, 'geometry'),
      'Track': makeObjectPropertySetter(
        KML.readGxTrack_, 'geometry')
    }
  ));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.POLY_STYLE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeObjectPropertySetter(KML.readColor_),
    'fill': makeObjectPropertySetter(XSD.readBoolean),
    'outline': makeObjectPropertySetter(XSD.readBoolean)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.SCHEMA_DATA_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'SimpleData': KML.SimpleDataParser_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.STYLE_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'IconStyle': KML.IconStyleParser_,
    'LabelStyle': KML.LabelStyleParser_,
    'LineStyle': KML.LineStyleParser_,
    'PolyStyle': KML.PolyStyleParser_
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.STYLE_MAP_PARSERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Pair': KML.PairDataParser_
  });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.Feature>|undefined} Features.
 */
KML.prototype.readDocumentOrFolder_ = function(node, objectStack) {
  // FIXME use scope somehow
  const parsersNS = makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Document': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Folder': makeArrayExtender(this.readDocumentOrFolder_, this),
      'Placemark': makeArrayPusher(this.readPlacemark_, this),
      'Style': this.readSharedStyle_.bind(this),
      'StyleMap': this.readSharedStyleMap_.bind(this)
    });
  /** @type {Array.<ol.Feature>} */
  const features = pushParseAndPop([], parsersNS, node, objectStack, this);
  if (features) {
    return features;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Feature.
 */
KML.prototype.readPlacemark_ = function(node, objectStack) {
  const object = pushParseAndPop({'geometry': null},
    KML.PLACEMARK_PARSERS_, node, objectStack);
  if (!object) {
    return undefined;
  }
  const feature = new Feature();
  const id = node.getAttribute('id');
  if (id !== null) {
    feature.setId(id);
  }
  const options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);

  const geometry = object['geometry'];
  if (geometry) {
    transformWithOptions(geometry, false, options);
  }
  feature.setGeometry(geometry);
  delete object['geometry'];

  if (this.extractStyles_) {
    const style = object['Style'];
    const styleUrl = object['styleUrl'];
    const styleFunction = KML.createFeatureStyleFunction_(
      style, styleUrl, this.defaultStyle_, this.sharedStyles_,
      this.showPointNames_);
    feature.setStyle(styleFunction);
  }
  delete object['Style'];
  // we do not remove the styleUrl property from the object, so it
  // gets stored on feature when setProperties is called

  feature.setProperties(object);

  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.prototype.readSharedStyle_ = function(node, objectStack) {
  const id = node.getAttribute('id');
  if (id !== null) {
    const style = KML.readStyle_(node, objectStack);
    if (style) {
      let styleUri;
      let baseURI = node.baseURI;
      if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
      }
      if (baseURI) {
        const url = new URL('#' + id, baseURI);
        styleUri = url.href;
      } else {
        styleUri = '#' + id;
      }
      this.sharedStyles_[styleUri] = style;
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.prototype.readSharedStyleMap_ = function(node, objectStack) {
  const id = node.getAttribute('id');
  if (id === null) {
    return;
  }
  const styleMapValue = KML.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  let styleUri;
  let baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    const url = new URL('#' + id, baseURI);
    styleUri = url.href;
  } else {
    styleUri = '#' + id;
  }
  this.sharedStyles_[styleUri] = styleMapValue;
};


/**
 * Read the first feature from a KML source. MultiGeometries are converted into
 * GeometryCollections if they are a mix of geometry types, and into MultiPoint/
 * MultiLineString/MultiPolygon if they are all of the same type.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
KML.prototype.readFeature;


/**
 * @inheritDoc
 */
KML.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!includes(KML.NAMESPACE_URIS_, node.namespaceURI)) {
    return null;
  }
  const feature = this.readPlacemark_(
    node, [this.getReadOptions(node, opt_options)]);
  if (feature) {
    return feature;
  } else {
    return null;
  }
};


/**
 * Read all features from a KML source. MultiGeometries are converted into
 * GeometryCollections if they are a mix of geometry types, and into MultiPoint/
 * MultiLineString/MultiPolygon if they are all of the same type.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
KML.prototype.readFeatures;


/**
 * @inheritDoc
 */
KML.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!includes(KML.NAMESPACE_URIS_, node.namespaceURI)) {
    return [];
  }
  let features;
  const localName = node.localName;
  if (localName == 'Document' || localName == 'Folder') {
    features = this.readDocumentOrFolder_(
      node, [this.getReadOptions(node, opt_options)]);
    if (features) {
      return features;
    } else {
      return [];
    }
  } else if (localName == 'Placemark') {
    const feature = this.readPlacemark_(
      node, [this.getReadOptions(node, opt_options)]);
    if (feature) {
      return [feature];
    } else {
      return [];
    }
  } else if (localName == 'kml') {
    features = [];
    let n;
    for (n = node.firstElementChild; n; n = n.nextElementSibling) {
      const fs = this.readFeaturesFromNode(n, opt_options);
      if (fs) {
        extend(features, fs);
      }
    }
    return features;
  } else {
    return [];
  }
};


/**
 * Read the name of the KML.
 *
 * @param {Document|Node|string} source Souce.
 * @return {string|undefined} Name.
 * @api
 */
KML.prototype.readName = function(source) {
  if (isDocument(source)) {
    return this.readNameFromDocument(/** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readNameFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    return this.readNameFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {string|undefined} Name.
 */
KML.prototype.readNameFromDocument = function(doc) {
  let n;
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      const name = this.readNameFromNode(n);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
};


/**
 * @param {Node} node Node.
 * @return {string|undefined} Name.
 */
KML.prototype.readNameFromNode = function(node) {
  let n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'name') {
      return XSD.readString(n);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'Placemark' ||
         localName == 'kml')) {
      const name = this.readNameFromNode(n);
      if (name) {
        return name;
      }
    }
  }
  return undefined;
};


/**
 * Read the network links of the KML.
 *
 * @param {Document|Node|string} source Source.
 * @return {Array.<Object>} Network links.
 * @api
 */
KML.prototype.readNetworkLinks = function(source) {
  const networkLinks = [];
  if (isDocument(source)) {
    extend(networkLinks, this.readNetworkLinksFromDocument(
      /** @type {Document} */ (source)));
  } else if (isNode(source)) {
    extend(networkLinks, this.readNetworkLinksFromNode(
      /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    extend(networkLinks, this.readNetworkLinksFromDocument(doc));
  }
  return networkLinks;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Network links.
 */
KML.prototype.readNetworkLinksFromDocument = function(doc) {
  const networkLinks = [];
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Network links.
 */
KML.prototype.readNetworkLinksFromNode = function(node) {
  const networkLinks = [];
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'NetworkLink') {
      const obj = pushParseAndPop({}, KML.NETWORK_LINK_PARSERS_,
        n, []);
      networkLinks.push(obj);
    }
  }
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * Read the regions of the KML.
 *
 * @param {Document|Node|string} source Source.
 * @return {Array.<Object>} Regions.
 * @api
 */
KML.prototype.readRegion = function(source) {
  const regions = [];
  if (isDocument(source)) {
    extend(regions, this.readRegionFromDocument(
      /** @type {Document} */ (source)));
  } else if (isNode(source)) {
    extend(regions, this.readRegionFromNode(
      /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    const doc = parse(source);
    extend(regions, this.readRegionFromDocument(doc));
  }
  return regions;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Region.
 */
KML.prototype.readRegionFromDocument = function(doc) {
  const regions = [];
  for (let n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Region.
 * @api
 */
KML.prototype.readRegionFromNode = function(node) {
  const regions = [];
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'Region') {
      const obj = pushParseAndPop({}, KML.REGION_PARSERS_,
        n, []);
      regions.push(obj);
    }
  }
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    const localName = n.localName;
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * Read the projection from a KML source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
KML.prototype.readProjection;


/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {ol.Color|string} color Color.
 * @private
 */
KML.writeColorTextNode_ = function(node, color) {
  const rgba = asArray(color);
  const opacity = (rgba.length == 4) ? rgba[3] : 1;
  const abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  let i;
  for (i = 0; i < 4; ++i) {
    const hex = parseInt(abgr[i], 10).toString(16);
    abgr[i] = (hex.length == 1) ? '0' + hex : hex;
  }
  XSD.writeStringTextNode(node, abgr.join(''));
};


/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array.<number>} coordinates Coordinates.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeCoordinatesTextNode_ = function(node, coordinates, objectStack) {
  const context = objectStack[objectStack.length - 1];

  const layout = context['layout'];
  const stride = context['stride'];

  let dimension;
  if (layout == GeometryLayout.XY ||
      layout == GeometryLayout.XYM) {
    dimension = 2;
  } else if (layout == GeometryLayout.XYZ ||
      layout == GeometryLayout.XYZM) {
    dimension = 3;
  } else {
    assert(false, 34); // Invalid geometry layout
  }

  let d, i;
  const ii = coordinates.length;
  let text = '';
  if (ii > 0) {
    text += coordinates[0];
    for (d = 1; d < dimension; ++d) {
      text += ',' + coordinates[d];
    }
    for (i = stride; i < ii; i += stride) {
      text += ' ' + coordinates[i];
      for (d = 1; d < dimension; ++d) {
        text += ',' + coordinates[i + d];
      }
    }
  }
  XSD.writeStringTextNode(node, text);
};


/**
 * @param {Node} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeDataNode_ = function(node, pair, objectStack) {
  node.setAttribute('name', pair.name);
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
        OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
    }

    if (value !== null && value.value) {
      pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
        OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
    }
  } else {
    pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
      OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
  }
};


/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 * @private
 */
KML.writeDataNodeName_ = function(node, name) {
  XSD.writeCDATASection(node, name);
};


/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 * @private
 */
KML.writeDataNodeValue_ = function(node, value) {
  XSD.writeStringTextNode(node, value);
};


/**
 * @param {Node} node Node.
 * @param {Array.<ol.Feature>} features Features.
 * @param {Array.<*>} objectStack Object stack.
 * @this {ol.format.KML}
 * @private
 */
KML.writeDocument_ = function(node, features, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context, KML.DOCUMENT_SERIALIZERS_,
    KML.DOCUMENT_NODE_FACTORY_, features, objectStack, undefined,
    this);
};


/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeExtendedData_ = function(node, namesAndValues, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const names = namesAndValues.names;
  const values = namesAndValues.values;
  const length = names.length;

  for (let i = 0; i < length; i++) {
    pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
      KML.DATA_NODE_FACTORY_, [{name: names[i], value: values[i]}], objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeIcon_ = function(node, icon, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const parentNode = objectStack[objectStack.length - 1].node;
  let orderedKeys = KML.ICON_SEQUENCE_[parentNode.namespaceURI];
  let values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(context,
    KML.ICON_SERIALIZERS_, OBJECT_PROPERTY_NODE_FACTORY,
    values, objectStack, orderedKeys);
  orderedKeys =
      KML.ICON_SEQUENCE_[KML.GX_NAMESPACE_URIS_[0]];
  values = makeSequence(icon, orderedKeys);
  pushSerializeAndPop(context, KML.ICON_SERIALIZERS_,
    KML.GX_NODE_FACTORY_, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Icon} style Icon style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeIconStyle_ = function(node, style, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const properties = {};
  const src = style.getSrc();
  const size = style.getSize();
  const iconImageSize = style.getImageSize();
  const iconProperties = {
    'href': src
  };

  if (size) {
    iconProperties['w'] = size[0];
    iconProperties['h'] = size[1];
    const anchor = style.getAnchor(); // top-left
    const origin = style.getOrigin(); // top-left

    if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
      iconProperties['x'] = origin[0];
      iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
    }

    if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
      const /** @type {ol.KMLVec2_} */ hotSpot = {
        x: anchor[0],
        xunits: IconAnchorUnits.PIXELS,
        y: size[1] - anchor[1],
        yunits: IconAnchorUnits.PIXELS
      };
      properties['hotSpot'] = hotSpot;
    }
  }

  properties['Icon'] = iconProperties;

  const scale = style.getScale();
  if (scale !== 1) {
    properties['scale'] = scale;
  }

  const rotation = style.getRotation();
  if (rotation !== 0) {
    properties['heading'] = rotation; // 0-360
  }

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = KML.ICON_STYLE_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.ICON_STYLE_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Text} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeLabelStyle_ = function(node, style, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const properties = {};
  const fill = style.getFill();
  if (fill) {
    properties['color'] = fill.getColor();
  }
  const scale = style.getScale();
  if (scale && scale !== 1) {
    properties['scale'] = scale;
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys =
      KML.LABEL_STYLE_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.LABEL_STYLE_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Stroke} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeLineStyle_ = function(node, style, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const properties = {
    'color': style.getColor(),
    'width': style.getWidth()
  };
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = KML.LINE_STYLE_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.LINE_STYLE_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeMultiGeometry_ = function(node, geometry, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  const context = {node: node};
  const type = geometry.getType();
  /** @type {Array.<ol.geom.Geometry>} */
  let geometries;
  /** @type {function(*, Array.<*>, string=): (Node|undefined)} */
  let factory;
  if (type == GeometryType.GEOMETRY_COLLECTION) {
    geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    factory = KML.GEOMETRY_NODE_FACTORY_;
  } else if (type == GeometryType.MULTI_POINT) {
    geometries = /** @type {ol.geom.MultiPoint} */ (geometry).getPoints();
    factory = KML.POINT_NODE_FACTORY_;
  } else if (type == GeometryType.MULTI_LINE_STRING) {
    geometries =
        (/** @type {ol.geom.MultiLineString} */ (geometry)).getLineStrings();
    factory = KML.LINE_STRING_NODE_FACTORY_;
  } else if (type == GeometryType.MULTI_POLYGON) {
    geometries =
        (/** @type {ol.geom.MultiPolygon} */ (geometry)).getPolygons();
    factory = KML.POLYGON_NODE_FACTORY_;
  } else {
    assert(false, 39); // Unknown geometry type
  }
  pushSerializeAndPop(context,
    KML.MULTI_GEOMETRY_SERIALIZERS_, factory,
    geometries, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeBoundaryIs_ = function(node, linearRing, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context,
    KML.BOUNDARY_IS_SERIALIZERS_,
    KML.LINEAR_RING_NODE_FACTORY_, [linearRing], objectStack);
};


/**
 * FIXME currently we do serialize arbitrary/custom feature properties
 * (ExtendedData).
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @this {ol.format.KML}
 * @private
 */
KML.writePlacemark_ = function(node, feature, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};

  // set id
  if (feature.getId()) {
    node.setAttribute('id', feature.getId());
  }

  // serialize properties (properties unknown to KML are not serialized)
  const properties = feature.getProperties();

  // don't export these to ExtendedData
  const filter = {'address': 1, 'description': 1, 'name': 1, 'open': 1,
    'phoneNumber': 1, 'styleUrl': 1, 'visibility': 1};
  filter[feature.getGeometryName()] = 1;
  const keys = Object.keys(properties || {}).sort().filter(function(v) {
    return !filter[v];
  });

  if (keys.length > 0) {
    const sequence = makeSequence(properties, keys);
    const namesAndValues = {names: keys, values: sequence};
    pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
      KML.EXTENDEDDATA_NODE_FACTORY_, [namesAndValues], objectStack);
  }

  const styleFunction = feature.getStyleFunction();
  if (styleFunction) {
    // FIXME the styles returned by the style function are supposed to be
    // resolution-independent here
    const styles = styleFunction.call(feature, 0);
    if (styles) {
      const style = Array.isArray(styles) ? styles[0] : styles;
      if (this.writeStyles_) {
        properties['Style'] = style;
      }
      const textStyle = style.getText();
      if (textStyle) {
        properties['name'] = textStyle.getText();
      }
    }
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = KML.PLACEMARK_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

  // serialize geometry
  const options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  let geometry = feature.getGeometry();
  if (geometry) {
    geometry = transformWithOptions(geometry, true, options);
  }
  pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
    KML.GEOMETRY_NODE_FACTORY_, [geometry], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writePrimitiveGeometry_ = function(node, geometry, objectStack) {
  const flatCoordinates = geometry.getFlatCoordinates();
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  const properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = KML.PRIMITIVE_GEOMETRY_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.PRIMITIVE_GEOMETRY_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writePolygon_ = function(node, polygon, objectStack) {
  const linearRings = polygon.getLinearRings();
  const outerRing = linearRings.shift();
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  // inner rings
  pushSerializeAndPop(context,
    KML.POLYGON_SERIALIZERS_,
    KML.INNER_BOUNDARY_NODE_FACTORY_,
    linearRings, objectStack);
  // outer ring
  pushSerializeAndPop(context,
    KML.POLYGON_SERIALIZERS_,
    KML.OUTER_BOUNDARY_NODE_FACTORY_,
    [outerRing], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Fill} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writePolyStyle_ = function(node, style, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  pushSerializeAndPop(context, KML.POLY_STYLE_SERIALIZERS_,
    KML.COLOR_NODE_FACTORY_, [style.getColor()], objectStack);
};


/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 * @private
 */
KML.writeScaleTextNode_ = function(node, scale) {
  // the Math is to remove any excess decimals created by float arithmetic
  XSD.writeDecimalTextNode(node,
    Math.round(scale * 1e6) / 1e6);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Style} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeStyle_ = function(node, style, objectStack) {
  const /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  const properties = {};
  const fillStyle = style.getFill();
  const strokeStyle = style.getStroke();
  const imageStyle = style.getImage();
  const textStyle = style.getText();
  if (imageStyle instanceof Icon) {
    properties['IconStyle'] = imageStyle;
  }
  if (textStyle) {
    properties['LabelStyle'] = textStyle;
  }
  if (strokeStyle) {
    properties['LineStyle'] = strokeStyle;
  }
  if (fillStyle) {
    properties['PolyStyle'] = fillStyle;
  }
  const parentNode = objectStack[objectStack.length - 1].node;
  const orderedKeys = KML.STYLE_SEQUENCE_[parentNode.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.STYLE_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node to append a TextNode with the Vec2 to.
 * @param {ol.KMLVec2_} vec2 Vec2.
 * @private
 */
KML.writeVec2_ = function(node, vec2) {
  node.setAttribute('x', vec2.x);
  node.setAttribute('y', vec2.y);
  node.setAttribute('xunits', vec2.xunits);
  node.setAttribute('yunits', vec2.yunits);
};


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.KML_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'Document', 'Placemark'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.KML_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Document': makeChildAppender(KML.writeDocument_),
    'Placemark': makeChildAppender(KML.writePlacemark_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.DOCUMENT_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Placemark': makeChildAppender(KML.writePlacemark_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.EXTENDEDDATA_NODE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Data': makeChildAppender(KML.writeDataNode_),
    'value': makeChildAppender(KML.writeDataNodeValue_),
    'displayName': makeChildAppender(KML.writeDataNodeName_)
  });


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
KML.GEOMETRY_TYPE_TO_NODENAME_ = {
  'Point': 'Point',
  'LineString': 'LineString',
  'LinearRing': 'LinearRing',
  'Polygon': 'Polygon',
  'MultiPoint': 'MultiGeometry',
  'MultiLineString': 'MultiGeometry',
  'MultiPolygon': 'MultiGeometry',
  'GeometryCollection': 'MultiGeometry'
};

/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.ICON_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'href'
  ],
  makeStructureNS(KML.GX_NAMESPACE_URIS_, [
    'x', 'y', 'w', 'h'
  ]));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.ICON_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'href': makeChildAppender(XSD.writeStringTextNode)
  }, makeStructureNS(
    KML.GX_NAMESPACE_URIS_, {
      'x': makeChildAppender(XSD.writeDecimalTextNode),
      'y': makeChildAppender(XSD.writeDecimalTextNode),
      'w': makeChildAppender(XSD.writeDecimalTextNode),
      'h': makeChildAppender(XSD.writeDecimalTextNode)
    }));


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.ICON_STYLE_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'scale', 'heading', 'Icon', 'hotSpot'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.ICON_STYLE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'Icon': makeChildAppender(KML.writeIcon_),
    'heading': makeChildAppender(XSD.writeDecimalTextNode),
    'hotSpot': makeChildAppender(KML.writeVec2_),
    'scale': makeChildAppender(KML.writeScaleTextNode_)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.LABEL_STYLE_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'color', 'scale'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.LABEL_STYLE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeChildAppender(KML.writeColorTextNode_),
    'scale': makeChildAppender(KML.writeScaleTextNode_)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.LINE_STYLE_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'color', 'width'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.LINE_STYLE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeChildAppender(KML.writeColorTextNode_),
    'width': makeChildAppender(XSD.writeDecimalTextNode)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.BOUNDARY_IS_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LinearRing': makeChildAppender(
      KML.writePrimitiveGeometry_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.MULTI_GEOMETRY_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'LineString': makeChildAppender(
      KML.writePrimitiveGeometry_),
    'Point': makeChildAppender(
      KML.writePrimitiveGeometry_),
    'Polygon': makeChildAppender(KML.writePolygon_),
    'GeometryCollection': makeChildAppender(
      KML.writeMultiGeometry_)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.PLACEMARK_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
    'styleUrl', 'Style'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.PLACEMARK_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'ExtendedData': makeChildAppender(
      KML.writeExtendedData_),
    'MultiGeometry': makeChildAppender(
      KML.writeMultiGeometry_),
    'LineString': makeChildAppender(
      KML.writePrimitiveGeometry_),
    'LinearRing': makeChildAppender(
      KML.writePrimitiveGeometry_),
    'Point': makeChildAppender(
      KML.writePrimitiveGeometry_),
    'Polygon': makeChildAppender(KML.writePolygon_),
    'Style': makeChildAppender(KML.writeStyle_),
    'address': makeChildAppender(XSD.writeStringTextNode),
    'description': makeChildAppender(
      XSD.writeStringTextNode),
    'name': makeChildAppender(XSD.writeStringTextNode),
    'open': makeChildAppender(XSD.writeBooleanTextNode),
    'phoneNumber': makeChildAppender(
      XSD.writeStringTextNode),
    'styleUrl': makeChildAppender(XSD.writeStringTextNode),
    'visibility': makeChildAppender(
      XSD.writeBooleanTextNode)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.PRIMITIVE_GEOMETRY_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'extrude', 'tessellate', 'altitudeMode', 'coordinates'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.PRIMITIVE_GEOMETRY_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'extrude': makeChildAppender(XSD.writeBooleanTextNode),
    'tessellate': makeChildAppender(XSD.writeBooleanTextNode),
    'altitudeMode': makeChildAppender(XSD.writeStringTextNode),
    'coordinates': makeChildAppender(
      KML.writeCoordinatesTextNode_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.POLYGON_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'outerBoundaryIs': makeChildAppender(
      KML.writeBoundaryIs_),
    'innerBoundaryIs': makeChildAppender(
      KML.writeBoundaryIs_)
  });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.POLY_STYLE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'color': makeChildAppender(KML.writeColorTextNode_)
  });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.STYLE_SEQUENCE_ = makeStructureNS(
  KML.NAMESPACE_URIS_, [
    'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
  ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.STYLE_SERIALIZERS_ = makeStructureNS(
  KML.NAMESPACE_URIS_, {
    'IconStyle': makeChildAppender(KML.writeIconStyle_),
    'LabelStyle': makeChildAppender(KML.writeLabelStyle_),
    'LineStyle': makeChildAppender(KML.writeLineStyle_),
    'PolyStyle': makeChildAppender(KML.writePolyStyle_)
  });


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
KML.GX_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  return createElementNS(KML.GX_NAMESPACE_URIS_[0],
    'gx:' + opt_nodeName);
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
KML.DOCUMENT_NODE_FACTORY_ = function(value, objectStack,
  opt_nodeName) {
  const parentNode = objectStack[objectStack.length - 1].node;
  return createElementNS(parentNode.namespaceURI, 'Placemark');
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
KML.GEOMETRY_NODE_FACTORY_ = function(value, objectStack,
  opt_nodeName) {
  if (value) {
    const parentNode = objectStack[objectStack.length - 1].node;
    return createElementNS(parentNode.namespaceURI,
      KML.GEOMETRY_TYPE_TO_NODENAME_[/** @type {ol.geom.Geometry} */ (value).getType()]);
  }
};


/**
 * A factory for creating coordinates nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.COLOR_NODE_FACTORY_ = makeSimpleNodeFactory('color');


/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
KML.DATA_NODE_FACTORY_ =
    makeSimpleNodeFactory('Data');


/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
KML.EXTENDEDDATA_NODE_FACTORY_ =
    makeSimpleNodeFactory('ExtendedData');


/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.INNER_BOUNDARY_NODE_FACTORY_ =
    makeSimpleNodeFactory('innerBoundaryIs');


/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.POINT_NODE_FACTORY_ =
    makeSimpleNodeFactory('Point');


/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.LINE_STRING_NODE_FACTORY_ =
    makeSimpleNodeFactory('LineString');


/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.LINEAR_RING_NODE_FACTORY_ =
    makeSimpleNodeFactory('LinearRing');


/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.POLYGON_NODE_FACTORY_ =
    makeSimpleNodeFactory('Polygon');


/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.OUTER_BOUNDARY_NODE_FACTORY_ =
    makeSimpleNodeFactory('outerBoundaryIs');


/**
 * Encode an array of features in the KML format. GeometryCollections, MultiPoints,
 * MultiLineStrings, and MultiPolygons are output as MultiGeometries.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {string} Result.
 * @api
 */
KML.prototype.writeFeatures;


/**
 * Encode an array of features in the KML format as an XML node. GeometryCollections,
 * MultiPoints, MultiLineStrings, and MultiPolygons are output as MultiGeometries.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
KML.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  const kml = createElementNS(KML.NAMESPACE_URIS_[4], 'kml');
  const xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  const xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  setAttributeNS(kml, xmlnsUri, 'xmlns:gx',
    KML.GX_NAMESPACE_URIS_[0]);
  setAttributeNS(kml, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  setAttributeNS(kml, xmlSchemaInstanceUri, 'xsi:schemaLocation',
    KML.SCHEMA_LOCATION_);

  const /** @type {ol.XmlNodeStackItem} */ context = {node: kml};
  const properties = {};
  if (features.length > 1) {
    properties['Document'] = features;
  } else if (features.length == 1) {
    properties['Placemark'] = features[0];
  }
  const orderedKeys = KML.KML_SEQUENCE_[kml.namespaceURI];
  const values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.KML_SERIALIZERS_,
    OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys,
    this);
  return kml;
};
export default KML;
