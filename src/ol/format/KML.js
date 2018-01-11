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
import _ol_style_Icon_ from '../style/Icon.js';
import IconAnchorUnits from '../style/IconAnchorUnits.js';
import IconOrigin from '../style/IconOrigin.js';
import _ol_style_Stroke_ from '../style/Stroke.js';
import Style from '../style/Style.js';
import _ol_style_Text_ from '../style/Text.js';
import _ol_xml_ from '../xml.js';

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
var KML = function(opt_options) {

  var options = opt_options ? opt_options : {};

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
  KML.DEFAULT_IMAGE_STYLE_ = new _ol_style_Icon_({
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
  KML.DEFAULT_STROKE_STYLE_ = new _ol_style_Stroke_({
    color: KML.DEFAULT_COLOR_,
    width: 1
  });

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  KML.DEFAULT_TEXT_STROKE_STYLE_ = new _ol_style_Stroke_({
    color: [51, 51, 51, 1],
    width: 2
  });

  /**
   * @const
   * @type {ol.style.Text}
   * @private
   */
  KML.DEFAULT_TEXT_STYLE_ = new _ol_style_Text_({
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
  var textStyle = null;
  var textOffset = [0, 0];
  var textAlign = 'start';
  if (foundStyle.getImage()) {
    var imageSize = foundStyle.getImage().getImageSize();
    if (imageSize === null) {
      imageSize = KML.DEFAULT_IMAGE_STYLE_SIZE_;
    }
    if (imageSize.length == 2) {
      var imageScale = foundStyle.getImage().getScale();
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
    var foundText = foundStyle.getText();
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

  var nameStyle = new Style({
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
      var drawName = showPointNames;
      /** @type {ol.style.Style|undefined} */
      var nameStyle;
      var name = '';
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
        var foundStyle = KML.findStyle_(styleUrl, defaultStyle,
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
  var s = _ol_xml_.getAllTextContent(node, false);
  // The KML specification states that colors should not include a leading `#`
  // but we tolerate them.
  var m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    var hexColor = m[1];
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
  var s = _ol_xml_.getAllTextContent(node, false);
  var flatCoordinates = [];
  // The KML specification states that coordinate tuples should not include
  // spaces, but we tolerate them.
  var re =
      /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i;
  var m;
  while ((m = re.exec(s))) {
    var x = parseFloat(m[1]);
    var y = parseFloat(m[2]);
    var z = m[3] ? parseFloat(m[3]) : 0;
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
  var s = _ol_xml_.getAllTextContent(node, false).trim();
  var baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    var url = new URL(s, baseURI);
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
  var xunits = node.getAttribute('xunits');
  var yunits = node.getAttribute('yunits');
  var origin;
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
  return _ol_xml_.pushParseAndPop(undefined,
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
  var object = _ol_xml_.pushParseAndPop(
      {}, KML.ICON_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var IconObject = 'Icon' in object ? object['Icon'] : {};
  var drawIcon = (!('Icon' in object) || Object.keys(IconObject).length > 0);
  var src;
  var href = /** @type {string|undefined} */
      (IconObject['href']);
  if (href) {
    src = href;
  } else if (drawIcon) {
    src = KML.DEFAULT_IMAGE_STYLE_SRC_;
  }
  var anchor, anchorXUnits, anchorYUnits;
  var anchorOrigin = IconOrigin.BOTTOM_LEFT;
  var hotSpot = /** @type {ol.KMLVec2_|undefined} */
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

  var offset;
  var x = /** @type {number|undefined} */
      (IconObject['x']);
  var y = /** @type {number|undefined} */
      (IconObject['y']);
  if (x !== undefined && y !== undefined) {
    offset = [x, y];
  }

  var size;
  var w = /** @type {number|undefined} */
      (IconObject['w']);
  var h = /** @type {number|undefined} */
      (IconObject['h']);
  if (w !== undefined && h !== undefined) {
    size = [w, h];
  }

  var rotation;
  var heading = /** @type {number} */
      (object['heading']);
  if (heading !== undefined) {
    rotation = toRadians(heading);
  }

  var scale = /** @type {number|undefined} */
      (object['scale']);

  if (drawIcon) {
    if (src == KML.DEFAULT_IMAGE_STYLE_SRC_) {
      size = KML.DEFAULT_IMAGE_STYLE_SIZE_;
      if (scale === undefined) {
        scale = KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_;
      }
    }

    var imageStyle = new _ol_style_Icon_({
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
  var object = _ol_xml_.pushParseAndPop(
      {}, KML.LABEL_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var textStyle = new _ol_style_Text_({
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
  var object = _ol_xml_.pushParseAndPop(
      {}, KML.LINE_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var strokeStyle = new _ol_style_Stroke_({
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
  var object = _ol_xml_.pushParseAndPop(
      {}, KML.POLY_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var fillStyle = new Fill({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : KML.DEFAULT_COLOR_)
  });
  styleObject['fillStyle'] = fillStyle;
  var fill = /** @type {boolean|undefined} */ (object['fill']);
  if (fill !== undefined) {
    styleObject['fill'] = fill;
  }
  var outline =
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
  return _ol_xml_.pushParseAndPop(null,
      KML.FLAT_LINEAR_RING_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.gxCoordParser_ = function(node, objectStack) {
  var gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  var flatCoordinates = gxTrackObject.flatCoordinates;
  var s = _ol_xml_.getAllTextContent(node, false);
  var re =
      /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i;
  var m = re.exec(s);
  if (m) {
    var x = parseFloat(m[1]);
    var y = parseFloat(m[2]);
    var z = parseFloat(m[3]);
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
  var lineStrings = _ol_xml_.pushParseAndPop([],
      KML.GX_MULTITRACK_GEOMETRY_PARSERS_, node, objectStack);
  if (!lineStrings) {
    return undefined;
  }
  var multiLineString = new MultiLineString(null);
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
  var gxTrackObject = _ol_xml_.pushParseAndPop(
      /** @type {ol.KMLGxTrackObject_} */ ({
        flatCoordinates: [],
        whens: []
      }), KML.GX_TRACK_PARSERS_, node, objectStack);
  if (!gxTrackObject) {
    return undefined;
  }
  var flatCoordinates = gxTrackObject.flatCoordinates;
  var whens = gxTrackObject.whens;
  var i, ii;
  for (i = 0, ii = Math.min(flatCoordinates.length, whens.length); i < ii;
    ++i) {
    flatCoordinates[4 * i + 3] = whens[i];
  }
  var lineString = new LineString(null);
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
  var iconObject = _ol_xml_.pushParseAndPop(
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
  return _ol_xml_.pushParseAndPop(null,
      KML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
KML.readLineString_ = function(node, objectStack) {
  var properties = _ol_xml_.pushParseAndPop({},
      KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var lineString = new LineString(null);
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
  var properties = _ol_xml_.pushParseAndPop({},
      KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var polygon = new Polygon(null);
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
  var geometries = _ol_xml_.pushParseAndPop([],
      KML.MULTI_GEOMETRY_PARSERS_, node, objectStack);
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new GeometryCollection(geometries);
  }
  /** @type {ol.geom.Geometry} */
  var multiGeometry;
  var homogeneous = true;
  var type = geometries[0].getType();
  var geometry, i, ii;
  for (i = 1, ii = geometries.length; i < ii; ++i) {
    geometry = geometries[i];
    if (geometry.getType() != type) {
      homogeneous = false;
      break;
    }
  }
  if (homogeneous) {
    var layout;
    var flatCoordinates;
    if (type == GeometryType.POINT) {
      var point = geometries[0];
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
  var properties = _ol_xml_.pushParseAndPop({},
      KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var point = new Point(null);
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
  var properties = _ol_xml_.pushParseAndPop(/** @type {Object<string,*>} */ ({}),
      KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatLinearRings = _ol_xml_.pushParseAndPop([null],
      KML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (flatLinearRings && flatLinearRings[0]) {
    var polygon = new Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
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
  var styleObject = _ol_xml_.pushParseAndPop(
      {}, KML.STYLE_PARSERS_, node, objectStack);
  if (!styleObject) {
    return null;
  }
  var fillStyle = /** @type {ol.style.Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : KML.DEFAULT_FILL_STYLE_);
  var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  var imageStyle = /** @type {ol.style.Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : KML.DEFAULT_IMAGE_STYLE_);
  if (imageStyle == KML.DEFAULT_NO_IMAGE_STYLE_) {
    imageStyle = undefined;
  }
  var textStyle = /** @type {ol.style.Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : KML.DEFAULT_TEXT_STYLE_);
  var strokeStyle = /** @type {ol.style.Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : KML.DEFAULT_STROKE_STYLE_);
  var outline = /** @type {boolean|undefined} */
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
  var ii = geometries.length;
  var extrudes = new Array(geometries.length);
  var tessellates = new Array(geometries.length);
  var altitudeModes = new Array(geometries.length);
  var geometry, i, hasExtrude, hasTessellate, hasAltitudeMode;
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
  var name = node.getAttribute('name');
  _ol_xml_.parseNode(KML.DATA_PARSERS_, node, objectStack);
  var featureObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
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
  _ol_xml_.parseNode(KML.EXTENDED_DATA_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.RegionParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(KML.REGION_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.PairDataParser_ = function(node, objectStack) {
  var pairObject = _ol_xml_.pushParseAndPop(
      {}, KML.PAIR_PARSERS_, node, objectStack);
  if (!pairObject) {
    return;
  }
  var key = /** @type {string|undefined} */
      (pairObject['key']);
  if (key && key == 'normal') {
    var styleUrl = /** @type {string|undefined} */
        (pairObject['styleUrl']);
    if (styleUrl) {
      objectStack[objectStack.length - 1] = styleUrl;
    }
    var Style = /** @type {ol.style.Style} */
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
  var styleMapValue = KML.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  var placemarkObject = objectStack[objectStack.length - 1];
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
  _ol_xml_.parseNode(KML.SCHEMA_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.SimpleDataParser_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  if (name !== null) {
    var data = XSD.readString(node);
    var featureObject =
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
  var object = _ol_xml_.pushParseAndPop({}, KML.LAT_LON_ALT_BOX_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var regionObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var extent = [
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
  var object = _ol_xml_.pushParseAndPop({}, KML.LOD_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var lodObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
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
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
      KML.INNER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
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
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
      KML.OUTER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (flatLinearRing) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
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
  _ol_xml_.parseNode(KML.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.whenParser_ = function(node, objectStack) {
  var gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  var whens = gxTrackObject.whens;
  var s = _ol_xml_.getAllTextContent(node, false);
  var when = Date.parse(s);
  whens.push(isNaN(when) ? 0 : when);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'displayName': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'value': _ol_xml_.makeObjectPropertySetter(XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.EXTENDED_DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Data': KML.DataParser_,
      'SchemaData': KML.SchemaDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.REGION_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LatLonAltBox': KML.LatLonAltBoxParser_,
      'Lod': KML.LodParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LAT_LON_ALT_BOX_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'altitudeMode': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'minAltitude': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'maxAltitude': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'north': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'south': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'east': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'west': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LOD_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'minLodPixels': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'maxLodPixels': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'minFadeExtent': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'maxFadeExtent': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'extrude': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean),
      'tessellate': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean),
      'altitudeMode': _ol_xml_.makeObjectPropertySetter(XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.FLAT_LINEAR_RING_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'coordinates': _ol_xml_.makeReplacer(KML.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.FLAT_LINEAR_RINGS_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'innerBoundaryIs': KML.innerBoundaryIsParser_,
      'outerBoundaryIs': KML.outerBoundaryIsParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GX_TRACK_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'when': KML.whenParser_
    }, _ol_xml_.makeStructureNS(
        KML.GX_NAMESPACE_URIS_, {
          'coord': KML.gxCoordParser_
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'coordinates': _ol_xml_.makeReplacer(KML.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.ICON_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeObjectPropertySetter(KML.readURI_)
    }, _ol_xml_.makeStructureNS(
        KML.GX_NAMESPACE_URIS_, {
          'x': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
          'y': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
          'w': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
          'h': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal)
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.ICON_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Icon': _ol_xml_.makeObjectPropertySetter(KML.readIcon_),
      'heading': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal),
      'hotSpot': _ol_xml_.makeObjectPropertySetter(KML.readVec2_),
      'scale': _ol_xml_.makeObjectPropertySetter(KML.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.INNER_BOUNDARY_IS_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeReplacer(KML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LABEL_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(KML.readColor_),
      'scale': _ol_xml_.makeObjectPropertySetter(KML.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LINE_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(KML.readColor_),
      'width': _ol_xml_.makeObjectPropertySetter(XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.MULTI_GEOMETRY_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LineString': _ol_xml_.makeArrayPusher(KML.readLineString_),
      'LinearRing': _ol_xml_.makeArrayPusher(KML.readLinearRing_),
      'MultiGeometry': _ol_xml_.makeArrayPusher(KML.readMultiGeometry_),
      'Point': _ol_xml_.makeArrayPusher(KML.readPoint_),
      'Polygon': _ol_xml_.makeArrayPusher(KML.readPolygon_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.GX_MULTITRACK_GEOMETRY_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.GX_NAMESPACE_URIS_, {
      'Track': _ol_xml_.makeArrayPusher(KML.readGxTrack_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.NETWORK_LINK_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'ExtendedData': KML.ExtendedDataParser_,
      'Region': KML.RegionParser_,
      'Link': KML.LinkParser_,
      'address': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'description': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'name': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'open': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean),
      'phoneNumber': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'visibility': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.LINK_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeObjectPropertySetter(KML.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.OUTER_BOUNDARY_IS_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeReplacer(KML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.PAIR_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Style': _ol_xml_.makeObjectPropertySetter(KML.readStyle_),
      'key': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'styleUrl': _ol_xml_.makeObjectPropertySetter(KML.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.PLACEMARK_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'ExtendedData': KML.ExtendedDataParser_,
      'Region': KML.RegionParser_,
      'MultiGeometry': _ol_xml_.makeObjectPropertySetter(
          KML.readMultiGeometry_, 'geometry'),
      'LineString': _ol_xml_.makeObjectPropertySetter(
          KML.readLineString_, 'geometry'),
      'LinearRing': _ol_xml_.makeObjectPropertySetter(
          KML.readLinearRing_, 'geometry'),
      'Point': _ol_xml_.makeObjectPropertySetter(
          KML.readPoint_, 'geometry'),
      'Polygon': _ol_xml_.makeObjectPropertySetter(
          KML.readPolygon_, 'geometry'),
      'Style': _ol_xml_.makeObjectPropertySetter(KML.readStyle_),
      'StyleMap': KML.PlacemarkStyleMapParser_,
      'address': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'description': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'name': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'open': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean),
      'phoneNumber': _ol_xml_.makeObjectPropertySetter(XSD.readString),
      'styleUrl': _ol_xml_.makeObjectPropertySetter(KML.readURI_),
      'visibility': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean)
    }, _ol_xml_.makeStructureNS(
        KML.GX_NAMESPACE_URIS_, {
          'MultiTrack': _ol_xml_.makeObjectPropertySetter(
              KML.readGxMultiTrack_, 'geometry'),
          'Track': _ol_xml_.makeObjectPropertySetter(
              KML.readGxTrack_, 'geometry')
        }
    ));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.POLY_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(KML.readColor_),
      'fill': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean),
      'outline': _ol_xml_.makeObjectPropertySetter(XSD.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.SCHEMA_DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'SimpleData': KML.SimpleDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
KML.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
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
KML.STYLE_MAP_PARSERS_ = _ol_xml_.makeStructureNS(
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
  var parsersNS = _ol_xml_.makeStructureNS(
      KML.NAMESPACE_URIS_, {
        'Document': _ol_xml_.makeArrayExtender(this.readDocumentOrFolder_, this),
        'Folder': _ol_xml_.makeArrayExtender(this.readDocumentOrFolder_, this),
        'Placemark': _ol_xml_.makeArrayPusher(this.readPlacemark_, this),
        'Style': this.readSharedStyle_.bind(this),
        'StyleMap': this.readSharedStyleMap_.bind(this)
      });
  /** @type {Array.<ol.Feature>} */
  var features = _ol_xml_.pushParseAndPop([], parsersNS, node, objectStack, this);
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
  var object = _ol_xml_.pushParseAndPop({'geometry': null},
      KML.PLACEMARK_PARSERS_, node, objectStack);
  if (!object) {
    return undefined;
  }
  var feature = new Feature();
  var id = node.getAttribute('id');
  if (id !== null) {
    feature.setId(id);
  }
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);

  var geometry = object['geometry'];
  if (geometry) {
    transformWithOptions(geometry, false, options);
  }
  feature.setGeometry(geometry);
  delete object['geometry'];

  if (this.extractStyles_) {
    var style = object['Style'];
    var styleUrl = object['styleUrl'];
    var styleFunction = KML.createFeatureStyleFunction_(
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
  var id = node.getAttribute('id');
  if (id !== null) {
    var style = KML.readStyle_(node, objectStack);
    if (style) {
      var styleUri;
      var baseURI = node.baseURI;
      if (!baseURI || baseURI == 'about:blank') {
        baseURI = window.location.href;
      }
      if (baseURI) {
        var url = new URL('#' + id, baseURI);
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
  var id = node.getAttribute('id');
  if (id === null) {
    return;
  }
  var styleMapValue = KML.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  var styleUri;
  var baseURI = node.baseURI;
  if (!baseURI || baseURI == 'about:blank') {
    baseURI = window.location.href;
  }
  if (baseURI) {
    var url = new URL('#' + id, baseURI);
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
  var feature = this.readPlacemark_(
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
  var features;
  var localName = node.localName;
  if (localName == 'Document' || localName == 'Folder') {
    features = this.readDocumentOrFolder_(
        node, [this.getReadOptions(node, opt_options)]);
    if (features) {
      return features;
    } else {
      return [];
    }
  } else if (localName == 'Placemark') {
    var feature = this.readPlacemark_(
        node, [this.getReadOptions(node, opt_options)]);
    if (feature) {
      return [feature];
    } else {
      return [];
    }
  } else if (localName == 'kml') {
    features = [];
    var n;
    for (n = node.firstElementChild; n; n = n.nextElementSibling) {
      var fs = this.readFeaturesFromNode(n, opt_options);
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
  if (_ol_xml_.isDocument(source)) {
    return this.readNameFromDocument(/** @type {Document} */ (source));
  } else if (_ol_xml_.isNode(source)) {
    return this.readNameFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
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
  var n;
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      var name = this.readNameFromNode(n);
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
  var n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'name') {
      return XSD.readString(n);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'Placemark' ||
         localName == 'kml')) {
      var name = this.readNameFromNode(n);
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
  var networkLinks = [];
  if (_ol_xml_.isDocument(source)) {
    extend(networkLinks, this.readNetworkLinksFromDocument(
        /** @type {Document} */ (source)));
  } else if (_ol_xml_.isNode(source)) {
    extend(networkLinks, this.readNetworkLinksFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    extend(networkLinks, this.readNetworkLinksFromDocument(doc));
  }
  return networkLinks;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Network links.
 */
KML.prototype.readNetworkLinksFromDocument = function(doc) {
  var n, networkLinks = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
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
  var n, networkLinks = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'NetworkLink') {
      var obj = _ol_xml_.pushParseAndPop({}, KML.NETWORK_LINK_PARSERS_,
          n, []);
      networkLinks.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
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
  var regions = [];
  if (_ol_xml_.isDocument(source)) {
    extend(regions, this.readRegionFromDocument(
        /** @type {Document} */ (source)));
  } else if (_ol_xml_.isNode(source)) {
    extend(regions, this.readRegionFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    extend(regions, this.readRegionFromDocument(doc));
  }
  return regions;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Region.
 */
KML.prototype.readRegionFromDocument = function(doc) {
  var n, regions = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
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
  var n, regions = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (includes(KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'Region') {
      var obj = _ol_xml_.pushParseAndPop({}, KML.REGION_PARSERS_,
          n, []);
      regions.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
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
  var rgba = asArray(color);
  var opacity = (rgba.length == 4) ? rgba[3] : 1;
  var abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  var i;
  for (i = 0; i < 4; ++i) {
    var hex = parseInt(abgr[i], 10).toString(16);
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
  var context = objectStack[objectStack.length - 1];

  var layout = context['layout'];
  var stride = context['stride'];

  var dimension;
  if (layout == GeometryLayout.XY ||
      layout == GeometryLayout.XYM) {
    dimension = 2;
  } else if (layout == GeometryLayout.XYZ ||
      layout == GeometryLayout.XYZM) {
    dimension = 3;
  } else {
    assert(false, 34); // Invalid geometry layout
  }

  var d, i;
  var ii = coordinates.length;
  var text = '';
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      _ol_xml_.pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
          _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
    }

    if (value !== null && value.value) {
      _ol_xml_.pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
          _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
    }
  } else {
    _ol_xml_.pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
        _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context, KML.DOCUMENT_SERIALIZERS_,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var names = namesAndValues.names, values = namesAndValues.values;
  var length = names.length;

  for (var i = 0; i < length; i++) {
    _ol_xml_.pushSerializeAndPop(context, KML.EXTENDEDDATA_NODE_SERIALIZERS_,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.ICON_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(icon, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
      KML.ICON_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
  orderedKeys =
      KML.ICON_SEQUENCE_[KML.GX_NAMESPACE_URIS_[0]];
  values = _ol_xml_.makeSequence(icon, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.ICON_SERIALIZERS_,
      KML.GX_NODE_FACTORY_, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Icon} style Icon style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeIconStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {};
  var src = style.getSrc();
  var size = style.getSize();
  var iconImageSize = style.getImageSize();
  var iconProperties = {
    'href': src
  };

  if (size) {
    iconProperties['w'] = size[0];
    iconProperties['h'] = size[1];
    var anchor = style.getAnchor(); // top-left
    var origin = style.getOrigin(); // top-left

    if (origin && iconImageSize && origin[0] !== 0 && origin[1] !== size[1]) {
      iconProperties['x'] = origin[0];
      iconProperties['y'] = iconImageSize[1] - (origin[1] + size[1]);
    }

    if (anchor && (anchor[0] !== size[0] / 2 || anchor[1] !== size[1] / 2)) {
      var /** @type {ol.KMLVec2_} */ hotSpot = {
        x: anchor[0],
        xunits: IconAnchorUnits.PIXELS,
        y: size[1] - anchor[1],
        yunits: IconAnchorUnits.PIXELS
      };
      properties['hotSpot'] = hotSpot;
    }
  }

  properties['Icon'] = iconProperties;

  var scale = style.getScale();
  if (scale !== 1) {
    properties['scale'] = scale;
  }

  var rotation = style.getRotation();
  if (rotation !== 0) {
    properties['heading'] = rotation; // 0-360
  }

  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.ICON_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.ICON_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Text} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeLabelStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {};
  var fill = style.getFill();
  if (fill) {
    properties['color'] = fill.getColor();
  }
  var scale = style.getScale();
  if (scale && scale !== 1) {
    properties['scale'] = scale;
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys =
      KML.LABEL_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.LABEL_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Stroke} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeLineStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {
    'color': style.getColor(),
    'width': style.getWidth()
  };
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.LINE_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.LINE_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writeMultiGeometry_ = function(node, geometry, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var context = {node: node};
  var type = geometry.getType();
  /** @type {Array.<ol.geom.Geometry>} */
  var geometries;
  /** @type {function(*, Array.<*>, string=): (Node|undefined)} */
  var factory;
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
  _ol_xml_.pushSerializeAndPop(context,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};

  // set id
  if (feature.getId()) {
    node.setAttribute('id', feature.getId());
  }

  // serialize properties (properties unknown to KML are not serialized)
  var properties = feature.getProperties();

  // don't export these to ExtendedData
  var filter = {'address': 1, 'description': 1, 'name': 1, 'open': 1,
    'phoneNumber': 1, 'styleUrl': 1, 'visibility': 1};
  filter[feature.getGeometryName()] = 1;
  var keys = Object.keys(properties || {}).sort().filter(function(v) {
    return !filter[v];
  });

  if (keys.length > 0) {
    var sequence = _ol_xml_.makeSequence(properties, keys);
    var namesAndValues = {names: keys, values: sequence};
    _ol_xml_.pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
        KML.EXTENDEDDATA_NODE_FACTORY_, [namesAndValues], objectStack);
  }

  var styleFunction = feature.getStyleFunction();
  if (styleFunction) {
    // FIXME the styles returned by the style function are supposed to be
    // resolution-independent here
    var styles = styleFunction.call(feature, 0);
    if (styles) {
      var style = Array.isArray(styles) ? styles[0] : styles;
      if (this.writeStyles_) {
        properties['Style'] = style;
      }
      var textStyle = style.getText();
      if (textStyle) {
        properties['name'] = textStyle.getText();
      }
    }
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.PLACEMARK_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

  // serialize geometry
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry = transformWithOptions(geometry, true, options);
  }
  _ol_xml_.pushSerializeAndPop(context, KML.PLACEMARK_SERIALIZERS_,
      KML.GEOMETRY_NODE_FACTORY_, [geometry], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writePrimitiveGeometry_ = function(node, geometry, objectStack) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  var properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.PRIMITIVE_GEOMETRY_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.PRIMITIVE_GEOMETRY_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
KML.writePolygon_ = function(node, polygon, objectStack) {
  var linearRings = polygon.getLinearRings();
  var outerRing = linearRings.shift();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  // inner rings
  _ol_xml_.pushSerializeAndPop(context,
      KML.POLYGON_SERIALIZERS_,
      KML.INNER_BOUNDARY_NODE_FACTORY_,
      linearRings, objectStack);
  // outer ring
  _ol_xml_.pushSerializeAndPop(context,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context, KML.POLY_STYLE_SERIALIZERS_,
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
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {};
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  var imageStyle = style.getImage();
  var textStyle = style.getText();
  if (imageStyle instanceof _ol_style_Icon_) {
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
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
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
KML.KML_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'Document', 'Placemark'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.KML_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Document': _ol_xml_.makeChildAppender(KML.writeDocument_),
      'Placemark': _ol_xml_.makeChildAppender(KML.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.DOCUMENT_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Placemark': _ol_xml_.makeChildAppender(KML.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.EXTENDEDDATA_NODE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Data': _ol_xml_.makeChildAppender(KML.writeDataNode_),
      'value': _ol_xml_.makeChildAppender(KML.writeDataNodeValue_),
      'displayName': _ol_xml_.makeChildAppender(KML.writeDataNodeName_)
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
KML.ICON_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'href'
    ],
    _ol_xml_.makeStructureNS(KML.GX_NAMESPACE_URIS_, [
      'x', 'y', 'w', 'h'
    ]));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.ICON_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeChildAppender(XSD.writeStringTextNode)
    }, _ol_xml_.makeStructureNS(
        KML.GX_NAMESPACE_URIS_, {
          'x': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
          'y': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
          'w': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
          'h': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode)
        }));


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.ICON_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'scale', 'heading', 'Icon', 'hotSpot'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.ICON_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'Icon': _ol_xml_.makeChildAppender(KML.writeIcon_),
      'heading': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode),
      'hotSpot': _ol_xml_.makeChildAppender(KML.writeVec2_),
      'scale': _ol_xml_.makeChildAppender(KML.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.LABEL_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'color', 'scale'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.LABEL_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(KML.writeColorTextNode_),
      'scale': _ol_xml_.makeChildAppender(KML.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.LINE_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'color', 'width'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.LINE_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(KML.writeColorTextNode_),
      'width': _ol_xml_.makeChildAppender(XSD.writeDecimalTextNode)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.BOUNDARY_IS_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.MULTI_GEOMETRY_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'LineString': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_),
      'Point': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_),
      'Polygon': _ol_xml_.makeChildAppender(KML.writePolygon_),
      'GeometryCollection': _ol_xml_.makeChildAppender(
          KML.writeMultiGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.PLACEMARK_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
      'styleUrl', 'Style'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.PLACEMARK_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'ExtendedData': _ol_xml_.makeChildAppender(
          KML.writeExtendedData_),
      'MultiGeometry': _ol_xml_.makeChildAppender(
          KML.writeMultiGeometry_),
      'LineString': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_),
      'LinearRing': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_),
      'Point': _ol_xml_.makeChildAppender(
          KML.writePrimitiveGeometry_),
      'Polygon': _ol_xml_.makeChildAppender(KML.writePolygon_),
      'Style': _ol_xml_.makeChildAppender(KML.writeStyle_),
      'address': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
      'description': _ol_xml_.makeChildAppender(
          XSD.writeStringTextNode),
      'name': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
      'open': _ol_xml_.makeChildAppender(XSD.writeBooleanTextNode),
      'phoneNumber': _ol_xml_.makeChildAppender(
          XSD.writeStringTextNode),
      'styleUrl': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
      'visibility': _ol_xml_.makeChildAppender(
          XSD.writeBooleanTextNode)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.PRIMITIVE_GEOMETRY_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'extrude', 'tessellate', 'altitudeMode', 'coordinates'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.PRIMITIVE_GEOMETRY_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'extrude': _ol_xml_.makeChildAppender(XSD.writeBooleanTextNode),
      'tessellate': _ol_xml_.makeChildAppender(XSD.writeBooleanTextNode),
      'altitudeMode': _ol_xml_.makeChildAppender(XSD.writeStringTextNode),
      'coordinates': _ol_xml_.makeChildAppender(
          KML.writeCoordinatesTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.POLYGON_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'outerBoundaryIs': _ol_xml_.makeChildAppender(
          KML.writeBoundaryIs_),
      'innerBoundaryIs': _ol_xml_.makeChildAppender(
          KML.writeBoundaryIs_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.POLY_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(KML.writeColorTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
KML.STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, [
      'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
KML.STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    KML.NAMESPACE_URIS_, {
      'IconStyle': _ol_xml_.makeChildAppender(KML.writeIconStyle_),
      'LabelStyle': _ol_xml_.makeChildAppender(KML.writeLabelStyle_),
      'LineStyle': _ol_xml_.makeChildAppender(KML.writeLineStyle_),
      'PolyStyle': _ol_xml_.makeChildAppender(KML.writePolyStyle_)
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
  return _ol_xml_.createElementNS(KML.GX_NAMESPACE_URIS_[0],
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
  var parentNode = objectStack[objectStack.length - 1].node;
  return _ol_xml_.createElementNS(parentNode.namespaceURI, 'Placemark');
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
    var parentNode = objectStack[objectStack.length - 1].node;
    return _ol_xml_.createElementNS(parentNode.namespaceURI,
        KML.GEOMETRY_TYPE_TO_NODENAME_[/** @type {ol.geom.Geometry} */ (value).getType()]);
  }
};


/**
 * A factory for creating coordinates nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.COLOR_NODE_FACTORY_ = _ol_xml_.makeSimpleNodeFactory('color');


/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
KML.DATA_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Data');


/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
KML.EXTENDEDDATA_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('ExtendedData');


/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.INNER_BOUNDARY_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('innerBoundaryIs');


/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.POINT_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Point');


/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.LINE_STRING_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('LineString');


/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.LINEAR_RING_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('LinearRing');


/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.POLYGON_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Polygon');


/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
KML.OUTER_BOUNDARY_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('outerBoundaryIs');


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
  var kml = _ol_xml_.createElementNS(KML.NAMESPACE_URIS_[4], 'kml');
  var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  var xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  _ol_xml_.setAttributeNS(kml, xmlnsUri, 'xmlns:gx',
      KML.GX_NAMESPACE_URIS_[0]);
  _ol_xml_.setAttributeNS(kml, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  _ol_xml_.setAttributeNS(kml, xmlSchemaInstanceUri, 'xsi:schemaLocation',
      KML.SCHEMA_LOCATION_);

  var /** @type {ol.XmlNodeStackItem} */ context = {node: kml};
  var properties = {};
  if (features.length > 1) {
    properties['Document'] = features;
  } else if (features.length == 1) {
    properties['Placemark'] = features[0];
  }
  var orderedKeys = KML.KML_SEQUENCE_[kml.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, KML.KML_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys,
      this);
  return kml;
};
export default KML;
