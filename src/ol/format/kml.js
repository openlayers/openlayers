// FIXME http://earth.google.com/kml/1.0 namespace?
// FIXME why does node.getAttribute return an unknown type?
// FIXME serialize arbitrary feature properties
// FIXME don't parse style if extractStyles is false

import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_array_ from '../array';
import _ol_asserts_ from '../asserts';
import _ol_color_ from '../color';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_XMLFeature_ from '../format/xmlfeature';
import _ol_format_XSD_ from '../format/xsd';
import _ol_geom_GeometryCollection_ from '../geom/geometrycollection';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_MultiPoint_ from '../geom/multipoint';
import _ol_geom_MultiPolygon_ from '../geom/multipolygon';
import _ol_geom_Point_ from '../geom/point';
import _ol_geom_Polygon_ from '../geom/polygon';
import _ol_math_ from '../math';
import _ol_proj_ from '../proj';
import _ol_style_Fill_ from '../style/fill';
import _ol_style_Icon_ from '../style/icon';
import _ol_style_IconAnchorUnits_ from '../style/iconanchorunits';
import _ol_style_IconOrigin_ from '../style/iconorigin';
import _ol_style_Stroke_ from '../style/stroke';
import _ol_style_Style_ from '../style/style';
import _ol_style_Text_ from '../style/text';
import _ol_xml_ from '../xml';

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
var _ol_format_KML_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_XMLFeature_.call(this);

  if (!_ol_format_KML_.DEFAULT_STYLE_ARRAY_) {
    _ol_format_KML_.createStyleDefaults_();
  }

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get('EPSG:4326');

  /**
   * @private
   * @type {Array.<ol.style.Style>}
   */
  this.defaultStyle_ = options.defaultStyle ?
    options.defaultStyle : _ol_format_KML_.DEFAULT_STYLE_ARRAY_;

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

_ol_.inherits(_ol_format_KML_, _ol_format_XMLFeature_);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
_ol_format_KML_.GX_NAMESPACE_URIS_ = [
  'http://www.google.com/kml/ext/2.2'
];


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
_ol_format_KML_.NAMESPACE_URIS_ = [
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
_ol_format_KML_.SCHEMA_LOCATION_ = 'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';


/**
 * @return {Array.<ol.style.Style>} Default style.
 * @private
 */
_ol_format_KML_.createStyleDefaults_ = function() {
  /**
   * @const
   * @type {ol.Color}
   * @private
   */
  _ol_format_KML_.DEFAULT_COLOR_ = [255, 255, 255, 1];

  /**
   * @const
   * @type {ol.style.Fill}
   * @private
   */
  _ol_format_KML_.DEFAULT_FILL_STYLE_ = new _ol_style_Fill_({
    color: _ol_format_KML_.DEFAULT_COLOR_
  });

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_ = [20, 2]; // FIXME maybe [8, 32] ?

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_ =
      _ol_style_IconAnchorUnits_.PIXELS;

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_ =
      _ol_style_IconAnchorUnits_.PIXELS;

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_SIZE_ = [64, 64];

  /**
   * @const
   * @type {string}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_SRC_ =
      'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

  /**
   * @const
   * @type {number}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_SCALE_MULTIPLIER_ = 0.5;

  /**
   * @const
   * @type {ol.style.Image}
   * @private
   */
  _ol_format_KML_.DEFAULT_IMAGE_STYLE_ = new _ol_style_Icon_({
    anchor: _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_,
    anchorOrigin: _ol_style_IconOrigin_.BOTTOM_LEFT,
    anchorXUnits: _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_,
    anchorYUnits: _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_,
    crossOrigin: 'anonymous',
    rotation: 0,
    scale: _ol_format_KML_.DEFAULT_IMAGE_SCALE_MULTIPLIER_,
    size: _ol_format_KML_.DEFAULT_IMAGE_STYLE_SIZE_,
    src: _ol_format_KML_.DEFAULT_IMAGE_STYLE_SRC_
  });

  /**
   * @const
   * @type {string}
   * @private
   */
  _ol_format_KML_.DEFAULT_NO_IMAGE_STYLE_ = 'NO_IMAGE';

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  _ol_format_KML_.DEFAULT_STROKE_STYLE_ = new _ol_style_Stroke_({
    color: _ol_format_KML_.DEFAULT_COLOR_,
    width: 1
  });

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  _ol_format_KML_.DEFAULT_TEXT_STROKE_STYLE_ = new _ol_style_Stroke_({
    color: [51, 51, 51, 1],
    width: 2
  });

  /**
   * @const
   * @type {ol.style.Text}
   * @private
   */
  _ol_format_KML_.DEFAULT_TEXT_STYLE_ = new _ol_style_Text_({
    font: 'bold 16px Helvetica',
    fill: _ol_format_KML_.DEFAULT_FILL_STYLE_,
    stroke: _ol_format_KML_.DEFAULT_TEXT_STROKE_STYLE_,
    scale: 0.8
  });

  /**
   * @const
   * @type {ol.style.Style}
   * @private
   */
  _ol_format_KML_.DEFAULT_STYLE_ = new _ol_style_Style_({
    fill: _ol_format_KML_.DEFAULT_FILL_STYLE_,
    image: _ol_format_KML_.DEFAULT_IMAGE_STYLE_,
    text: _ol_format_KML_.DEFAULT_TEXT_STYLE_,
    stroke: _ol_format_KML_.DEFAULT_STROKE_STYLE_,
    zIndex: 0
  });

  /**
   * @const
   * @type {Array.<ol.style.Style>}
   * @private
   */
  _ol_format_KML_.DEFAULT_STYLE_ARRAY_ = [_ol_format_KML_.DEFAULT_STYLE_];

  return _ol_format_KML_.DEFAULT_STYLE_ARRAY_;
};


/**
 * @const
 * @type {Object.<string, ol.style.IconAnchorUnits>}
 * @private
 */
_ol_format_KML_.ICON_ANCHOR_UNITS_MAP_ = {
  'fraction': _ol_style_IconAnchorUnits_.FRACTION,
  'pixels': _ol_style_IconAnchorUnits_.PIXELS,
  'insetPixels': _ol_style_IconAnchorUnits_.PIXELS
};


/**
 * @param {ol.style.Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {ol.style.Style} style Style.
 * @private
 */
_ol_format_KML_.createNameStyleFunction_ = function(foundStyle, name) {
  var textStyle = null;
  var textOffset = [0, 0];
  var textAlign = 'start';
  if (foundStyle.getImage()) {
    var imageSize = foundStyle.getImage().getImageSize();
    if (imageSize === null) {
      imageSize = _ol_format_KML_.DEFAULT_IMAGE_STYLE_SIZE_;
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
    textStyle.setFont(foundText.getFont() || _ol_format_KML_.DEFAULT_TEXT_STYLE_.getFont());
    textStyle.setScale(foundText.getScale() || _ol_format_KML_.DEFAULT_TEXT_STYLE_.getScale());
    textStyle.setFill(foundText.getFill() || _ol_format_KML_.DEFAULT_TEXT_STYLE_.getFill());
    textStyle.setStroke(foundText.getStroke() || _ol_format_KML_.DEFAULT_TEXT_STROKE_STYLE_);
  } else {
    textStyle = _ol_format_KML_.DEFAULT_TEXT_STYLE_.clone();
  }
  textStyle.setText(name);
  textStyle.setOffsetX(textOffset[0]);
  textStyle.setOffsetY(textOffset[1]);
  textStyle.setTextAlign(textAlign);

  var nameStyle = new _ol_style_Style_({
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
_ol_format_KML_.createFeatureStyleFunction_ = function(style, styleUrl,
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
                        _ol_geom_GeometryType_.POINT);
        }
      }

      if (drawName) {
        name = /** @type {string} */ (this.get('name'));
        drawName = drawName && name;
      }

      if (style) {
        if (drawName) {
          nameStyle = _ol_format_KML_.createNameStyleFunction_(style[0],
              name);
          return style.concat(nameStyle);
        }
        return style;
      }
      if (styleUrl) {
        var foundStyle = _ol_format_KML_.findStyle_(styleUrl, defaultStyle,
            sharedStyles);
        if (drawName) {
          nameStyle = _ol_format_KML_.createNameStyleFunction_(foundStyle[0],
              name);
          return foundStyle.concat(nameStyle);
        }
        return foundStyle;
      }
      if (drawName) {
        nameStyle = _ol_format_KML_.createNameStyleFunction_(defaultStyle[0],
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
_ol_format_KML_.findStyle_ = function(styleValue, defaultStyle, sharedStyles) {
  if (Array.isArray(styleValue)) {
    return styleValue;
  } else if (typeof styleValue === 'string') {
    // KML files in the wild occasionally forget the leading `#` on styleUrls
    // defined in the same document.  Add a leading `#` if it enables to find
    // a style.
    if (!(styleValue in sharedStyles) && ('#' + styleValue in sharedStyles)) {
      styleValue = '#' + styleValue;
    }
    return _ol_format_KML_.findStyle_(
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
_ol_format_KML_.readColor_ = function(node) {
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
_ol_format_KML_.readFlatCoordinates_ = function(node) {
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
_ol_format_KML_.readURI_ = function(node) {
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
_ol_format_KML_.readVec2_ = function(node) {
  var xunits = node.getAttribute('xunits');
  var yunits = node.getAttribute('yunits');
  var origin;
  if (xunits !== 'insetPixels') {
    if (yunits !== 'insetPixels') {
      origin = _ol_style_IconOrigin_.BOTTOM_LEFT;
    } else {
      origin = _ol_style_IconOrigin_.TOP_LEFT;
    }
  } else {
    if (yunits !== 'insetPixels') {
      origin = _ol_style_IconOrigin_.BOTTOM_RIGHT;
    } else {
      origin = _ol_style_IconOrigin_.TOP_RIGHT;
    }
  }
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: _ol_format_KML_.ICON_ANCHOR_UNITS_MAP_[xunits],
    y: parseFloat(node.getAttribute('y')),
    yunits: _ol_format_KML_.ICON_ANCHOR_UNITS_MAP_[yunits],
    origin: origin
  };
};


/**
 * @param {Node} node Node.
 * @private
 * @return {number|undefined} Scale.
 */
_ol_format_KML_.readScale_ = function(node) {
  return _ol_format_XSD_.readDecimal(node);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.style.Style>|string|undefined} StyleMap.
 */
_ol_format_KML_.readStyleMapValue_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(undefined,
      _ol_format_KML_.STYLE_MAP_PARSERS_, node, objectStack);
};
/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.IconStyleParser_ = function(node, objectStack) {
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  var object = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.ICON_STYLE_PARSERS_, node, objectStack);
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
    src = _ol_format_KML_.DEFAULT_IMAGE_STYLE_SRC_;
  }
  var anchor, anchorXUnits, anchorYUnits;
  var anchorOrigin = _ol_style_IconOrigin_.BOTTOM_LEFT;
  var hotSpot = /** @type {ol.KMLVec2_|undefined} */
      (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
    anchorOrigin = hotSpot.origin;
  } else if (src === _ol_format_KML_.DEFAULT_IMAGE_STYLE_SRC_) {
    anchor = _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_;
    anchorXUnits = _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_;
    anchorYUnits = _ol_format_KML_.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_;
  } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
    anchor = [0.5, 0];
    anchorXUnits = _ol_style_IconAnchorUnits_.FRACTION;
    anchorYUnits = _ol_style_IconAnchorUnits_.FRACTION;
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
    rotation = _ol_math_.toRadians(heading);
  }

  var scale = /** @type {number|undefined} */
      (object['scale']);

  if (drawIcon) {
    if (src == _ol_format_KML_.DEFAULT_IMAGE_STYLE_SRC_) {
      size = _ol_format_KML_.DEFAULT_IMAGE_STYLE_SIZE_;
      if (scale === undefined) {
        scale = _ol_format_KML_.DEFAULT_IMAGE_SCALE_MULTIPLIER_;
      }
    }

    var imageStyle = new _ol_style_Icon_({
      anchor: anchor,
      anchorOrigin: anchorOrigin,
      anchorXUnits: anchorXUnits,
      anchorYUnits: anchorYUnits,
      crossOrigin: 'anonymous', // FIXME should this be configurable?
      offset: offset,
      offsetOrigin: _ol_style_IconOrigin_.BOTTOM_LEFT,
      rotation: rotation,
      scale: scale,
      size: size,
      src: src
    });
    styleObject['imageStyle'] = imageStyle;
  } else {
    // handle the case when we explicitly want to draw no icon.
    styleObject['imageStyle'] = _ol_format_KML_.DEFAULT_NO_IMAGE_STYLE_;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.LabelStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  var object = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.LABEL_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var textStyle = new _ol_style_Text_({
    fill: new _ol_style_Fill_({
      color: /** @type {ol.Color} */
          ('color' in object ? object['color'] : _ol_format_KML_.DEFAULT_COLOR_)
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
_ol_format_KML_.LineStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  var object = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.LINE_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var strokeStyle = new _ol_style_Stroke_({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : _ol_format_KML_.DEFAULT_COLOR_),
    width: /** @type {number} */ ('width' in object ? object['width'] : 1)
  });
  styleObject['strokeStyle'] = strokeStyle;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.PolyStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  var object = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.POLY_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var fillStyle = new _ol_style_Fill_({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : _ol_format_KML_.DEFAULT_COLOR_)
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
_ol_format_KML_.readFlatLinearRing_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(null,
      _ol_format_KML_.FLAT_LINEAR_RING_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.gxCoordParser_ = function(node, objectStack) {
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
_ol_format_KML_.readGxMultiTrack_ = function(node, objectStack) {
  var lineStrings = _ol_xml_.pushParseAndPop([],
      _ol_format_KML_.GX_MULTITRACK_GEOMETRY_PARSERS_, node, objectStack);
  if (!lineStrings) {
    return undefined;
  }
  var multiLineString = new _ol_geom_MultiLineString_(null);
  multiLineString.setLineStrings(lineStrings);
  return multiLineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
_ol_format_KML_.readGxTrack_ = function(node, objectStack) {
  var gxTrackObject = _ol_xml_.pushParseAndPop(
      /** @type {ol.KMLGxTrackObject_} */ ({
        flatCoordinates: [],
        whens: []
      }), _ol_format_KML_.GX_TRACK_PARSERS_, node, objectStack);
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
  var lineString = new _ol_geom_LineString_(null);
  lineString.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZM, flatCoordinates);
  return lineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object} Icon object.
 */
_ol_format_KML_.readIcon_ = function(node, objectStack) {
  var iconObject = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.ICON_PARSERS_, node, objectStack);
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
_ol_format_KML_.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  return _ol_xml_.pushParseAndPop(null,
      _ol_format_KML_.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
_ol_format_KML_.readLineString_ = function(node, objectStack) {
  var properties = _ol_xml_.pushParseAndPop({},
      _ol_format_KML_.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      _ol_format_KML_.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var lineString = new _ol_geom_LineString_(null);
    lineString.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates);
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
_ol_format_KML_.readLinearRing_ = function(node, objectStack) {
  var properties = _ol_xml_.pushParseAndPop({},
      _ol_format_KML_.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      _ol_format_KML_.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var polygon = new _ol_geom_Polygon_(null);
    polygon.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates,
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
_ol_format_KML_.readMultiGeometry_ = function(node, objectStack) {
  var geometries = _ol_xml_.pushParseAndPop([],
      _ol_format_KML_.MULTI_GEOMETRY_PARSERS_, node, objectStack);
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new _ol_geom_GeometryCollection_(geometries);
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
    if (type == _ol_geom_GeometryType_.POINT) {
      var point = geometries[0];
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        _ol_array_.extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      multiGeometry = new _ol_geom_MultiPoint_(null);
      multiGeometry.setFlatCoordinates(layout, flatCoordinates);
      _ol_format_KML_.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == _ol_geom_GeometryType_.LINE_STRING) {
      multiGeometry = new _ol_geom_MultiLineString_(null);
      multiGeometry.setLineStrings(geometries);
      _ol_format_KML_.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == _ol_geom_GeometryType_.POLYGON) {
      multiGeometry = new _ol_geom_MultiPolygon_(null);
      multiGeometry.setPolygons(geometries);
      _ol_format_KML_.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == _ol_geom_GeometryType_.GEOMETRY_COLLECTION) {
      multiGeometry = new _ol_geom_GeometryCollection_(geometries);
    } else {
      _ol_asserts_.assert(false, 37); // Unknown geometry type found
    }
  } else {
    multiGeometry = new _ol_geom_GeometryCollection_(geometries);
  }
  return /** @type {ol.geom.Geometry} */ (multiGeometry);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
_ol_format_KML_.readPoint_ = function(node, objectStack) {
  var properties = _ol_xml_.pushParseAndPop({},
      _ol_format_KML_.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      _ol_format_KML_.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var point = new _ol_geom_Point_(null);
    point.setFlatCoordinates(_ol_geom_GeometryLayout_.XYZ, flatCoordinates);
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
_ol_format_KML_.readPolygon_ = function(node, objectStack) {
  var properties = _ol_xml_.pushParseAndPop(/** @type {Object<string,*>} */ ({}),
      _ol_format_KML_.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatLinearRings = _ol_xml_.pushParseAndPop([null],
      _ol_format_KML_.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (flatLinearRings && flatLinearRings[0]) {
    var polygon = new _ol_geom_Polygon_(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      _ol_array_.extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
        _ol_geom_GeometryLayout_.XYZ, flatCoordinates, ends);
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
_ol_format_KML_.readStyle_ = function(node, objectStack) {
  var styleObject = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.STYLE_PARSERS_, node, objectStack);
  if (!styleObject) {
    return null;
  }
  var fillStyle = /** @type {ol.style.Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : _ol_format_KML_.DEFAULT_FILL_STYLE_);
  var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  var imageStyle = /** @type {ol.style.Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : _ol_format_KML_.DEFAULT_IMAGE_STYLE_);
  if (imageStyle == _ol_format_KML_.DEFAULT_NO_IMAGE_STYLE_) {
    imageStyle = undefined;
  }
  var textStyle = /** @type {ol.style.Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : _ol_format_KML_.DEFAULT_TEXT_STYLE_);
  var strokeStyle = /** @type {ol.style.Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : _ol_format_KML_.DEFAULT_STROKE_STYLE_);
  var outline = /** @type {boolean|undefined} */
      (styleObject['outline']);
  if (outline !== undefined && !outline) {
    strokeStyle = null;
  }
  return [new _ol_style_Style_({
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
_ol_format_KML_.setCommonGeometryProperties_ = function(multiGeometry,
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
_ol_format_KML_.DataParser_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  _ol_xml_.parseNode(_ol_format_KML_.DATA_PARSERS_, node, objectStack);
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
_ol_format_KML_.ExtendedDataParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(_ol_format_KML_.EXTENDED_DATA_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.RegionParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(_ol_format_KML_.REGION_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.PairDataParser_ = function(node, objectStack) {
  var pairObject = _ol_xml_.pushParseAndPop(
      {}, _ol_format_KML_.PAIR_PARSERS_, node, objectStack);
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
_ol_format_KML_.PlacemarkStyleMapParser_ = function(node, objectStack) {
  var styleMapValue = _ol_format_KML_.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  var placemarkObject = objectStack[objectStack.length - 1];
  if (Array.isArray(styleMapValue)) {
    placemarkObject['Style'] = styleMapValue;
  } else if (typeof styleMapValue === 'string') {
    placemarkObject['styleUrl'] = styleMapValue;
  } else {
    _ol_asserts_.assert(false, 38); // `styleMapValue` has an unknown type
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.SchemaDataParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(_ol_format_KML_.SCHEMA_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.SimpleDataParser_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  if (name !== null) {
    var data = _ol_format_XSD_.readString(node);
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
_ol_format_KML_.LatLonAltBoxParser_ = function(node, objectStack) {
  var object = _ol_xml_.pushParseAndPop({}, _ol_format_KML_.LAT_LON_ALT_BOX_PARSERS_, node, objectStack);
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
_ol_format_KML_.LodParser_ = function(node, objectStack) {
  var object = _ol_xml_.pushParseAndPop({}, _ol_format_KML_.LOD_PARSERS_, node, objectStack);
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
_ol_format_KML_.innerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
      _ol_format_KML_.INNER_BOUNDARY_IS_PARSERS_, node, objectStack);
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
_ol_format_KML_.outerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = _ol_xml_.pushParseAndPop(undefined,
      _ol_format_KML_.OUTER_BOUNDARY_IS_PARSERS_, node, objectStack);
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
_ol_format_KML_.LinkParser_ = function(node, objectStack) {
  _ol_xml_.parseNode(_ol_format_KML_.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.whenParser_ = function(node, objectStack) {
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
_ol_format_KML_.DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'displayName': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'value': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.EXTENDED_DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Data': _ol_format_KML_.DataParser_,
      'SchemaData': _ol_format_KML_.SchemaDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.REGION_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LatLonAltBox': _ol_format_KML_.LatLonAltBoxParser_,
      'Lod': _ol_format_KML_.LodParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.LAT_LON_ALT_BOX_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'altitudeMode': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'minAltitude': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'maxAltitude': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'north': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'south': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'east': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'west': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.LOD_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'minLodPixels': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'maxLodPixels': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'minFadeExtent': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'maxFadeExtent': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'extrude': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean),
      'tessellate': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean),
      'altitudeMode': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.FLAT_LINEAR_RING_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'coordinates': _ol_xml_.makeReplacer(_ol_format_KML_.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.FLAT_LINEAR_RINGS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'innerBoundaryIs': _ol_format_KML_.innerBoundaryIsParser_,
      'outerBoundaryIs': _ol_format_KML_.outerBoundaryIsParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.GX_TRACK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'when': _ol_format_KML_.whenParser_
    }, _ol_xml_.makeStructureNS(
        _ol_format_KML_.GX_NAMESPACE_URIS_, {
          'coord': _ol_format_KML_.gxCoordParser_
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.GEOMETRY_FLAT_COORDINATES_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'coordinates': _ol_xml_.makeReplacer(_ol_format_KML_.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.ICON_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readURI_)
    }, _ol_xml_.makeStructureNS(
        _ol_format_KML_.GX_NAMESPACE_URIS_, {
          'x': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
          'y': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
          'w': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
          'h': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal)
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.ICON_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Icon': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readIcon_),
      'heading': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'hotSpot': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readVec2_),
      'scale': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.INNER_BOUNDARY_IS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeReplacer(_ol_format_KML_.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.LABEL_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readColor_),
      'scale': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.LINE_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readColor_),
      'width': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.MULTI_GEOMETRY_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LineString': _ol_xml_.makeArrayPusher(_ol_format_KML_.readLineString_),
      'LinearRing': _ol_xml_.makeArrayPusher(_ol_format_KML_.readLinearRing_),
      'MultiGeometry': _ol_xml_.makeArrayPusher(_ol_format_KML_.readMultiGeometry_),
      'Point': _ol_xml_.makeArrayPusher(_ol_format_KML_.readPoint_),
      'Polygon': _ol_xml_.makeArrayPusher(_ol_format_KML_.readPolygon_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.GX_MULTITRACK_GEOMETRY_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.GX_NAMESPACE_URIS_, {
      'Track': _ol_xml_.makeArrayPusher(_ol_format_KML_.readGxTrack_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.NETWORK_LINK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'ExtendedData': _ol_format_KML_.ExtendedDataParser_,
      'Region': _ol_format_KML_.RegionParser_,
      'Link': _ol_format_KML_.LinkParser_,
      'address': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'description': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'open': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean),
      'phoneNumber': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'visibility': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.LINK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.OUTER_BOUNDARY_IS_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeReplacer(_ol_format_KML_.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.PAIR_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Style': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readStyle_),
      'key': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'styleUrl': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.PLACEMARK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'ExtendedData': _ol_format_KML_.ExtendedDataParser_,
      'Region': _ol_format_KML_.RegionParser_,
      'MultiGeometry': _ol_xml_.makeObjectPropertySetter(
          _ol_format_KML_.readMultiGeometry_, 'geometry'),
      'LineString': _ol_xml_.makeObjectPropertySetter(
          _ol_format_KML_.readLineString_, 'geometry'),
      'LinearRing': _ol_xml_.makeObjectPropertySetter(
          _ol_format_KML_.readLinearRing_, 'geometry'),
      'Point': _ol_xml_.makeObjectPropertySetter(
          _ol_format_KML_.readPoint_, 'geometry'),
      'Polygon': _ol_xml_.makeObjectPropertySetter(
          _ol_format_KML_.readPolygon_, 'geometry'),
      'Style': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readStyle_),
      'StyleMap': _ol_format_KML_.PlacemarkStyleMapParser_,
      'address': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'description': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'open': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean),
      'phoneNumber': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'styleUrl': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readURI_),
      'visibility': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean)
    }, _ol_xml_.makeStructureNS(
        _ol_format_KML_.GX_NAMESPACE_URIS_, {
          'MultiTrack': _ol_xml_.makeObjectPropertySetter(
              _ol_format_KML_.readGxMultiTrack_, 'geometry'),
          'Track': _ol_xml_.makeObjectPropertySetter(
              _ol_format_KML_.readGxTrack_, 'geometry')
        }
    ));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.POLY_STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeObjectPropertySetter(_ol_format_KML_.readColor_),
      'fill': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean),
      'outline': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.SCHEMA_DATA_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'SimpleData': _ol_format_KML_.SimpleDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.STYLE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'IconStyle': _ol_format_KML_.IconStyleParser_,
      'LabelStyle': _ol_format_KML_.LabelStyleParser_,
      'LineStyle': _ol_format_KML_.LineStyleParser_,
      'PolyStyle': _ol_format_KML_.PolyStyleParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_KML_.STYLE_MAP_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Pair': _ol_format_KML_.PairDataParser_
    });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.Feature>|undefined} Features.
 */
_ol_format_KML_.prototype.readDocumentOrFolder_ = function(node, objectStack) {
  // FIXME use scope somehow
  var parsersNS = _ol_xml_.makeStructureNS(
      _ol_format_KML_.NAMESPACE_URIS_, {
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
_ol_format_KML_.prototype.readPlacemark_ = function(node, objectStack) {
  var object = _ol_xml_.pushParseAndPop({'geometry': null},
      _ol_format_KML_.PLACEMARK_PARSERS_, node, objectStack);
  if (!object) {
    return undefined;
  }
  var feature = new _ol_Feature_();
  var id = node.getAttribute('id');
  if (id !== null) {
    feature.setId(id);
  }
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);

  var geometry = object['geometry'];
  if (geometry) {
    _ol_format_Feature_.transformWithOptions(geometry, false, options);
  }
  feature.setGeometry(geometry);
  delete object['geometry'];

  if (this.extractStyles_) {
    var style = object['Style'];
    var styleUrl = object['styleUrl'];
    var styleFunction = _ol_format_KML_.createFeatureStyleFunction_(
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
_ol_format_KML_.prototype.readSharedStyle_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  if (id !== null) {
    var style = _ol_format_KML_.readStyle_(node, objectStack);
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
_ol_format_KML_.prototype.readSharedStyleMap_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  if (id === null) {
    return;
  }
  var styleMapValue = _ol_format_KML_.readStyleMapValue_(node, objectStack);
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
_ol_format_KML_.prototype.readFeature;


/**
 * @inheritDoc
 */
_ol_format_KML_.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, node.namespaceURI)) {
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
_ol_format_KML_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_KML_.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, node.namespaceURI)) {
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
        _ol_array_.extend(features, fs);
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
_ol_format_KML_.prototype.readName = function(source) {
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
_ol_format_KML_.prototype.readNameFromDocument = function(doc) {
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
_ol_format_KML_.prototype.readNameFromNode = function(node) {
  var n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'name') {
      return _ol_format_XSD_.readString(n);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
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
_ol_format_KML_.prototype.readNetworkLinks = function(source) {
  var networkLinks = [];
  if (_ol_xml_.isDocument(source)) {
    _ol_array_.extend(networkLinks, this.readNetworkLinksFromDocument(
        /** @type {Document} */ (source)));
  } else if (_ol_xml_.isNode(source)) {
    _ol_array_.extend(networkLinks, this.readNetworkLinksFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    _ol_array_.extend(networkLinks, this.readNetworkLinksFromDocument(doc));
  }
  return networkLinks;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Network links.
 */
_ol_format_KML_.prototype.readNetworkLinksFromDocument = function(doc) {
  var n, networkLinks = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      _ol_array_.extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Network links.
 */
_ol_format_KML_.prototype.readNetworkLinksFromNode = function(node) {
  var n, networkLinks = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'NetworkLink') {
      var obj = _ol_xml_.pushParseAndPop({}, _ol_format_KML_.NETWORK_LINK_PARSERS_,
          n, []);
      networkLinks.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      _ol_array_.extend(networkLinks, this.readNetworkLinksFromNode(n));
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
_ol_format_KML_.prototype.readRegion = function(source) {
  var regions = [];
  if (_ol_xml_.isDocument(source)) {
    _ol_array_.extend(regions, this.readRegionFromDocument(
        /** @type {Document} */ (source)));
  } else if (_ol_xml_.isNode(source)) {
    _ol_array_.extend(regions, this.readRegionFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    _ol_array_.extend(regions, this.readRegionFromDocument(doc));
  }
  return regions;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Region.
 */
_ol_format_KML_.prototype.readRegionFromDocument = function(doc) {
  var n, regions = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      _ol_array_.extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Region.
 * @api
 */
_ol_format_KML_.prototype.readRegionFromNode = function(node) {
  var n, regions = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'Region') {
      var obj = _ol_xml_.pushParseAndPop({}, _ol_format_KML_.REGION_PARSERS_,
          n, []);
      regions.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (_ol_array_.includes(_ol_format_KML_.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      _ol_array_.extend(regions, this.readRegionFromNode(n));
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
_ol_format_KML_.prototype.readProjection;


/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {ol.Color|string} color Color.
 * @private
 */
_ol_format_KML_.writeColorTextNode_ = function(node, color) {
  var rgba = _ol_color_.asArray(color);
  var opacity = (rgba.length == 4) ? rgba[3] : 1;
  var abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  var i;
  for (i = 0; i < 4; ++i) {
    var hex = parseInt(abgr[i], 10).toString(16);
    abgr[i] = (hex.length == 1) ? '0' + hex : hex;
  }
  _ol_format_XSD_.writeStringTextNode(node, abgr.join(''));
};


/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array.<number>} coordinates Coordinates.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeCoordinatesTextNode_ = function(node, coordinates, objectStack) {
  var context = objectStack[objectStack.length - 1];

  var layout = context['layout'];
  var stride = context['stride'];

  var dimension;
  if (layout == _ol_geom_GeometryLayout_.XY ||
      layout == _ol_geom_GeometryLayout_.XYM) {
    dimension = 2;
  } else if (layout == _ol_geom_GeometryLayout_.XYZ ||
      layout == _ol_geom_GeometryLayout_.XYZM) {
    dimension = 3;
  } else {
    _ol_asserts_.assert(false, 34); // Invalid geometry layout
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
  _ol_format_XSD_.writeStringTextNode(node, text);
};


/**
 * @param {Node} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeDataNode_ = function(node, pair, objectStack) {
  node.setAttribute('name', pair.name);
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.EXTENDEDDATA_NODE_SERIALIZERS_,
          _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
    }

    if (value !== null && value.value) {
      _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.EXTENDEDDATA_NODE_SERIALIZERS_,
          _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
    }
  } else {
    _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.EXTENDEDDATA_NODE_SERIALIZERS_,
        _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
  }
};


/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 * @private
 */
_ol_format_KML_.writeDataNodeName_ = function(node, name) {
  _ol_format_XSD_.writeCDATASection(node, name);
};


/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 * @private
 */
_ol_format_KML_.writeDataNodeValue_ = function(node, value) {
  _ol_format_XSD_.writeStringTextNode(node, value);
};


/**
 * @param {Node} node Node.
 * @param {Array.<ol.Feature>} features Features.
 * @param {Array.<*>} objectStack Object stack.
 * @this {ol.format.KML}
 * @private
 */
_ol_format_KML_.writeDocument_ = function(node, features, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.DOCUMENT_SERIALIZERS_,
      _ol_format_KML_.DOCUMENT_NODE_FACTORY_, features, objectStack, undefined,
      this);
};


/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeExtendedData_ = function(node, namesAndValues, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var names = namesAndValues.names, values = namesAndValues.values;
  var length = names.length;

  for (var i = 0; i < length; i++) {
    _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.EXTENDEDDATA_NODE_SERIALIZERS_,
        _ol_format_KML_.DATA_NODE_FACTORY_, [{name: names[i], value: values[i]}], objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeIcon_ = function(node, icon, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = _ol_format_KML_.ICON_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(icon, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_KML_.ICON_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
  orderedKeys =
      _ol_format_KML_.ICON_SEQUENCE_[_ol_format_KML_.GX_NAMESPACE_URIS_[0]];
  values = _ol_xml_.makeSequence(icon, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.ICON_SERIALIZERS_,
      _ol_format_KML_.GX_NODE_FACTORY_, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Icon} style Icon style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeIconStyle_ = function(node, style, objectStack) {
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
        xunits: _ol_style_IconAnchorUnits_.PIXELS,
        y: size[1] - anchor[1],
        yunits: _ol_style_IconAnchorUnits_.PIXELS
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
  var orderedKeys = _ol_format_KML_.ICON_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.ICON_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Text} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeLabelStyle_ = function(node, style, objectStack) {
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
      _ol_format_KML_.LABEL_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.LABEL_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Stroke} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeLineStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {
    'color': style.getColor(),
    'width': style.getWidth()
  };
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = _ol_format_KML_.LINE_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.LINE_STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeMultiGeometry_ = function(node, geometry, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var context = {node: node};
  var type = geometry.getType();
  /** @type {Array.<ol.geom.Geometry>} */
  var geometries;
  /** @type {function(*, Array.<*>, string=): (Node|undefined)} */
  var factory;
  if (type == _ol_geom_GeometryType_.GEOMETRY_COLLECTION) {
    geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    factory = _ol_format_KML_.GEOMETRY_NODE_FACTORY_;
  } else if (type == _ol_geom_GeometryType_.MULTI_POINT) {
    geometries = /** @type {ol.geom.MultiPoint} */ (geometry).getPoints();
    factory = _ol_format_KML_.POINT_NODE_FACTORY_;
  } else if (type == _ol_geom_GeometryType_.MULTI_LINE_STRING) {
    geometries =
        (/** @type {ol.geom.MultiLineString} */ (geometry)).getLineStrings();
    factory = _ol_format_KML_.LINE_STRING_NODE_FACTORY_;
  } else if (type == _ol_geom_GeometryType_.MULTI_POLYGON) {
    geometries =
        (/** @type {ol.geom.MultiPolygon} */ (geometry)).getPolygons();
    factory = _ol_format_KML_.POLYGON_NODE_FACTORY_;
  } else {
    _ol_asserts_.assert(false, 39); // Unknown geometry type
  }
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_KML_.MULTI_GEOMETRY_SERIALIZERS_, factory,
      geometries, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeBoundaryIs_ = function(node, linearRing, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_KML_.BOUNDARY_IS_SERIALIZERS_,
      _ol_format_KML_.LINEAR_RING_NODE_FACTORY_, [linearRing], objectStack);
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
_ol_format_KML_.writePlacemark_ = function(node, feature, objectStack) {
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
    _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.PLACEMARK_SERIALIZERS_,
        _ol_format_KML_.EXTENDEDDATA_NODE_FACTORY_, [namesAndValues], objectStack);
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
  var orderedKeys = _ol_format_KML_.PLACEMARK_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.PLACEMARK_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

  // serialize geometry
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry =
        _ol_format_Feature_.transformWithOptions(geometry, true, options);
  }
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.PLACEMARK_SERIALIZERS_,
      _ol_format_KML_.GEOMETRY_NODE_FACTORY_, [geometry], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writePrimitiveGeometry_ = function(node, geometry, objectStack) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  var properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = _ol_format_KML_.PRIMITIVE_GEOMETRY_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.PRIMITIVE_GEOMETRY_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writePolygon_ = function(node, polygon, objectStack) {
  var linearRings = polygon.getLinearRings();
  var outerRing = linearRings.shift();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  // inner rings
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_KML_.POLYGON_SERIALIZERS_,
      _ol_format_KML_.INNER_BOUNDARY_NODE_FACTORY_,
      linearRings, objectStack);
  // outer ring
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_KML_.POLYGON_SERIALIZERS_,
      _ol_format_KML_.OUTER_BOUNDARY_NODE_FACTORY_,
      [outerRing], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Fill} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writePolyStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.POLY_STYLE_SERIALIZERS_,
      _ol_format_KML_.COLOR_NODE_FACTORY_, [style.getColor()], objectStack);
};


/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 * @private
 */
_ol_format_KML_.writeScaleTextNode_ = function(node, scale) {
  // the Math is to remove any excess decimals created by float arithmetic
  _ol_format_XSD_.writeDecimalTextNode(node,
      Math.round(scale * 1e6) / 1e6);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Style} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_KML_.writeStyle_ = function(node, style, objectStack) {
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
  var orderedKeys = _ol_format_KML_.STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.STYLE_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node to append a TextNode with the Vec2 to.
 * @param {ol.KMLVec2_} vec2 Vec2.
 * @private
 */
_ol_format_KML_.writeVec2_ = function(node, vec2) {
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
_ol_format_KML_.KML_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'Document', 'Placemark'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.KML_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Document': _ol_xml_.makeChildAppender(_ol_format_KML_.writeDocument_),
      'Placemark': _ol_xml_.makeChildAppender(_ol_format_KML_.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.DOCUMENT_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Placemark': _ol_xml_.makeChildAppender(_ol_format_KML_.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.EXTENDEDDATA_NODE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Data': _ol_xml_.makeChildAppender(_ol_format_KML_.writeDataNode_),
      'value': _ol_xml_.makeChildAppender(_ol_format_KML_.writeDataNodeValue_),
      'displayName': _ol_xml_.makeChildAppender(_ol_format_KML_.writeDataNodeName_)
    });


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
_ol_format_KML_.GEOMETRY_TYPE_TO_NODENAME_ = {
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
_ol_format_KML_.ICON_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'href'
    ],
    _ol_xml_.makeStructureNS(_ol_format_KML_.GX_NAMESPACE_URIS_, [
      'x', 'y', 'w', 'h'
    ]));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.ICON_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'href': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode)
    }, _ol_xml_.makeStructureNS(
        _ol_format_KML_.GX_NAMESPACE_URIS_, {
          'x': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
          'y': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
          'w': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
          'h': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode)
        }));


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.ICON_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'scale', 'heading', 'Icon', 'hotSpot'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.ICON_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'Icon': _ol_xml_.makeChildAppender(_ol_format_KML_.writeIcon_),
      'heading': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'hotSpot': _ol_xml_.makeChildAppender(_ol_format_KML_.writeVec2_),
      'scale': _ol_xml_.makeChildAppender(_ol_format_KML_.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.LABEL_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'color', 'scale'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.LABEL_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(_ol_format_KML_.writeColorTextNode_),
      'scale': _ol_xml_.makeChildAppender(_ol_format_KML_.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.LINE_STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'color', 'width'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.LINE_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(_ol_format_KML_.writeColorTextNode_),
      'width': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.BOUNDARY_IS_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LinearRing': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.MULTI_GEOMETRY_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'LineString': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_),
      'Point': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_),
      'Polygon': _ol_xml_.makeChildAppender(_ol_format_KML_.writePolygon_),
      'GeometryCollection': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeMultiGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.PLACEMARK_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
      'styleUrl', 'Style'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.PLACEMARK_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'ExtendedData': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeExtendedData_),
      'MultiGeometry': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeMultiGeometry_),
      'LineString': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_),
      'LinearRing': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_),
      'Point': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writePrimitiveGeometry_),
      'Polygon': _ol_xml_.makeChildAppender(_ol_format_KML_.writePolygon_),
      'Style': _ol_xml_.makeChildAppender(_ol_format_KML_.writeStyle_),
      'address': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'description': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeStringTextNode),
      'name': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'open': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeBooleanTextNode),
      'phoneNumber': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeStringTextNode),
      'styleUrl': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'visibility': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeBooleanTextNode)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.PRIMITIVE_GEOMETRY_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'extrude', 'tessellate', 'altitudeMode', 'coordinates'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.PRIMITIVE_GEOMETRY_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'extrude': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeBooleanTextNode),
      'tessellate': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeBooleanTextNode),
      'altitudeMode': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'coordinates': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeCoordinatesTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.POLYGON_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'outerBoundaryIs': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeBoundaryIs_),
      'innerBoundaryIs': _ol_xml_.makeChildAppender(
          _ol_format_KML_.writeBoundaryIs_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.POLY_STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'color': _ol_xml_.makeChildAppender(_ol_format_KML_.writeColorTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_KML_.STYLE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, [
      'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_KML_.STYLE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_KML_.NAMESPACE_URIS_, {
      'IconStyle': _ol_xml_.makeChildAppender(_ol_format_KML_.writeIconStyle_),
      'LabelStyle': _ol_xml_.makeChildAppender(_ol_format_KML_.writeLabelStyle_),
      'LineStyle': _ol_xml_.makeChildAppender(_ol_format_KML_.writeLineStyle_),
      'PolyStyle': _ol_xml_.makeChildAppender(_ol_format_KML_.writePolyStyle_)
    });


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
_ol_format_KML_.GX_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  return _ol_xml_.createElementNS(_ol_format_KML_.GX_NAMESPACE_URIS_[0],
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
_ol_format_KML_.DOCUMENT_NODE_FACTORY_ = function(value, objectStack,
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
_ol_format_KML_.GEOMETRY_NODE_FACTORY_ = function(value, objectStack,
    opt_nodeName) {
  if (value) {
    var parentNode = objectStack[objectStack.length - 1].node;
    return _ol_xml_.createElementNS(parentNode.namespaceURI,
        _ol_format_KML_.GEOMETRY_TYPE_TO_NODENAME_[/** @type {ol.geom.Geometry} */ (value).getType()]);
  }
};


/**
 * A factory for creating coordinates nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.COLOR_NODE_FACTORY_ = _ol_xml_.makeSimpleNodeFactory('color');


/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
_ol_format_KML_.DATA_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Data');


/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
_ol_format_KML_.EXTENDEDDATA_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('ExtendedData');


/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.INNER_BOUNDARY_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('innerBoundaryIs');


/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.POINT_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Point');


/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.LINE_STRING_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('LineString');


/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.LINEAR_RING_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('LinearRing');


/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.POLYGON_NODE_FACTORY_ =
    _ol_xml_.makeSimpleNodeFactory('Polygon');


/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_KML_.OUTER_BOUNDARY_NODE_FACTORY_ =
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
_ol_format_KML_.prototype.writeFeatures;


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
_ol_format_KML_.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var kml = _ol_xml_.createElementNS(_ol_format_KML_.NAMESPACE_URIS_[4], 'kml');
  var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  var xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  _ol_xml_.setAttributeNS(kml, xmlnsUri, 'xmlns:gx',
      _ol_format_KML_.GX_NAMESPACE_URIS_[0]);
  _ol_xml_.setAttributeNS(kml, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  _ol_xml_.setAttributeNS(kml, xmlSchemaInstanceUri, 'xsi:schemaLocation',
      _ol_format_KML_.SCHEMA_LOCATION_);

  var /** @type {ol.XmlNodeStackItem} */ context = {node: kml};
  var properties = {};
  if (features.length > 1) {
    properties['Document'] = features;
  } else if (features.length == 1) {
    properties['Placemark'] = features[0];
  }
  var orderedKeys = _ol_format_KML_.KML_SEQUENCE_[kml.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context, _ol_format_KML_.KML_SERIALIZERS_,
      _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys,
      this);
  return kml;
};
export default _ol_format_KML_;
