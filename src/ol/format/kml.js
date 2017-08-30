// FIXME http://earth.google.com/kml/1.0 namespace?
// FIXME why does node.getAttribute return an unknown type?
// FIXME serialize arbitrary feature properties
// FIXME don't parse style if extractStyles is false

goog.provide('ol.format.KML');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.array');
goog.require('ol.asserts');
goog.require('ol.color');
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.math');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.IconAnchorUnits');
goog.require('ol.style.IconOrigin');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.xml');


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
ol.format.KML = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.format.XMLFeature.call(this);

  if (!ol.format.KML.DEFAULT_STYLE_ARRAY_) {
    ol.format.KML.createStyleDefaults_();
  }

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get('EPSG:4326');

  /**
   * @private
   * @type {Array.<ol.style.Style>}
   */
  this.defaultStyle_ = options.defaultStyle ?
    options.defaultStyle : ol.format.KML.DEFAULT_STYLE_ARRAY_;

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
ol.inherits(ol.format.KML, ol.format.XMLFeature);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.KML.GX_NAMESPACE_URIS_ = [
  'http://www.google.com/kml/ext/2.2'
];


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.KML.NAMESPACE_URIS_ = [
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
ol.format.KML.SCHEMA_LOCATION_ = 'http://www.opengis.net/kml/2.2 ' +
    'https://developers.google.com/kml/schema/kml22gx.xsd';


/**
 * @return {Array.<ol.style.Style>} Default style.
 * @private
 */
ol.format.KML.createStyleDefaults_ = function() {
  /**
   * @const
   * @type {ol.Color}
   * @private
   */
  ol.format.KML.DEFAULT_COLOR_ = [255, 255, 255, 1];

  /**
   * @const
   * @type {ol.style.Fill}
   * @private
   */
  ol.format.KML.DEFAULT_FILL_STYLE_ = new ol.style.Fill({
    color: ol.format.KML.DEFAULT_COLOR_
  });

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_ = [20, 2]; // FIXME maybe [8, 32] ?

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_ =
      ol.style.IconAnchorUnits.PIXELS;

  /**
   * @const
   * @type {ol.style.IconAnchorUnits}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_ =
      ol.style.IconAnchorUnits.PIXELS;

  /**
   * @const
   * @type {ol.Size}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_ = [64, 64];

  /**
   * @const
   * @type {string}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_ =
      'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';

  /**
   * @const
   * @type {number}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_ = 0.5;

  /**
   * @const
   * @type {ol.style.Image}
   * @private
   */
  ol.format.KML.DEFAULT_IMAGE_STYLE_ = new ol.style.Icon({
    anchor: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_,
    anchorOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
    anchorXUnits: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_,
    anchorYUnits: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_,
    crossOrigin: 'anonymous',
    rotation: 0,
    scale: ol.format.KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_,
    size: ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_,
    src: ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_
  });

  /**
   * @const
   * @type {string}
   * @private
   */
  ol.format.KML.DEFAULT_NO_IMAGE_STYLE_ = 'NO_IMAGE';

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  ol.format.KML.DEFAULT_STROKE_STYLE_ = new ol.style.Stroke({
    color: ol.format.KML.DEFAULT_COLOR_,
    width: 1
  });

  /**
   * @const
   * @type {ol.style.Stroke}
   * @private
   */
  ol.format.KML.DEFAULT_TEXT_STROKE_STYLE_ = new ol.style.Stroke({
    color: [51, 51, 51, 1],
    width: 2
  });

  /**
   * @const
   * @type {ol.style.Text}
   * @private
   */
  ol.format.KML.DEFAULT_TEXT_STYLE_ = new ol.style.Text({
    font: 'bold 16px Helvetica',
    fill: ol.format.KML.DEFAULT_FILL_STYLE_,
    stroke: ol.format.KML.DEFAULT_TEXT_STROKE_STYLE_,
    scale: 0.8
  });

  /**
   * @const
   * @type {ol.style.Style}
   * @private
   */
  ol.format.KML.DEFAULT_STYLE_ = new ol.style.Style({
    fill: ol.format.KML.DEFAULT_FILL_STYLE_,
    image: ol.format.KML.DEFAULT_IMAGE_STYLE_,
    text: ol.format.KML.DEFAULT_TEXT_STYLE_,
    stroke: ol.format.KML.DEFAULT_STROKE_STYLE_,
    zIndex: 0
  });

  /**
   * @const
   * @type {Array.<ol.style.Style>}
   * @private
   */
  ol.format.KML.DEFAULT_STYLE_ARRAY_ = [ol.format.KML.DEFAULT_STYLE_];

  return ol.format.KML.DEFAULT_STYLE_ARRAY_;
};


/**
 * @const
 * @type {Object.<string, ol.style.IconAnchorUnits>}
 * @private
 */
ol.format.KML.ICON_ANCHOR_UNITS_MAP_ = {
  'fraction': ol.style.IconAnchorUnits.FRACTION,
  'pixels': ol.style.IconAnchorUnits.PIXELS,
  'insetPixels': ol.style.IconAnchorUnits.PIXELS
};


/**
 * @param {ol.style.Style|undefined} foundStyle Style.
 * @param {string} name Name.
 * @return {ol.style.Style} style Style.
 * @private
 */
ol.format.KML.createNameStyleFunction_ = function(foundStyle, name) {
  var textStyle = null;
  var textOffset = [0, 0];
  var textAlign = 'start';
  if (foundStyle.getImage()) {
    var imageSize = foundStyle.getImage().getImageSize();
    if (imageSize === null) {
      imageSize = ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_;
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
    textStyle.setFont(foundText.getFont() || ol.format.KML.DEFAULT_TEXT_STYLE_.getFont());
    textStyle.setScale(foundText.getScale() || ol.format.KML.DEFAULT_TEXT_STYLE_.getScale());
    textStyle.setFill(foundText.getFill() || ol.format.KML.DEFAULT_TEXT_STYLE_.getFill());
    textStyle.setStroke(foundText.getStroke() || ol.format.KML.DEFAULT_TEXT_STROKE_STYLE_);
  } else {
    textStyle = ol.format.KML.DEFAULT_TEXT_STYLE_.clone();
  }
  textStyle.setText(name);
  textStyle.setOffsetX(textOffset[0]);
  textStyle.setOffsetY(textOffset[1]);
  textStyle.setTextAlign(textAlign);

  var nameStyle = new ol.style.Style({
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
ol.format.KML.createFeatureStyleFunction_ = function(style, styleUrl,
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
                        ol.geom.GeometryType.POINT);
        }
      }

      if (drawName) {
        name = /** @type {string} */ (this.get('name'));
        drawName = drawName && name;
      }

      if (style) {
        if (drawName) {
          nameStyle = ol.format.KML.createNameStyleFunction_(style[0],
              name);
          return style.concat(nameStyle);
        }
        return style;
      }
      if (styleUrl) {
        var foundStyle = ol.format.KML.findStyle_(styleUrl, defaultStyle,
            sharedStyles);
        if (drawName) {
          nameStyle = ol.format.KML.createNameStyleFunction_(foundStyle[0],
              name);
          return foundStyle.concat(nameStyle);
        }
        return foundStyle;
      }
      if (drawName) {
        nameStyle = ol.format.KML.createNameStyleFunction_(defaultStyle[0],
            name);
        return defaultStyle.concat(nameStyle);
      }
      return defaultStyle;
    });
};


/**
 * @param {Array.<ol.style.Style>|string|undefined} styleValue Style value.
 * @param {Array.<ol.style.Style>} defaultStyle Default style.
 * @param {Object.<string, (Array.<ol.style.Style>|string)>} sharedStyles
 * Shared styles.
 * @return {Array.<ol.style.Style>} Style.
 * @private
 */
ol.format.KML.findStyle_ = function(styleValue, defaultStyle, sharedStyles) {
  if (Array.isArray(styleValue)) {
    return styleValue;
  } else if (typeof styleValue === 'string') {
    // KML files in the wild occasionally forget the leading `#` on styleUrls
    // defined in the same document.  Add a leading `#` if it enables to find
    // a style.
    if (!(styleValue in sharedStyles) && ('#' + styleValue in sharedStyles)) {
      styleValue = '#' + styleValue;
    }
    return ol.format.KML.findStyle_(
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
ol.format.KML.readColor_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
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
ol.format.KML.readFlatCoordinates_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
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
ol.format.KML.readURI_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false).trim();
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
ol.format.KML.readVec2_ = function(node) {
  var xunits = node.getAttribute('xunits');
  var yunits = node.getAttribute('yunits');
  var origin;
  if (xunits !== 'insetPixels') {
    if (yunits !== 'insetPixels') {
      origin = ol.style.IconOrigin.BOTTOM_LEFT;
    } else {
      origin = ol.style.IconOrigin.TOP_LEFT;
    }
  } else {
    if (yunits !== 'insetPixels') {
      origin = ol.style.IconOrigin.BOTTOM_RIGHT;
    } else {
      origin = ol.style.IconOrigin.TOP_RIGHT;
    }
  }
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: ol.format.KML.ICON_ANCHOR_UNITS_MAP_[xunits],
    y: parseFloat(node.getAttribute('y')),
    yunits: ol.format.KML.ICON_ANCHOR_UNITS_MAP_[yunits],
    origin: origin
  };
};


/**
 * @param {Node} node Node.
 * @private
 * @return {number|undefined} Scale.
 */
ol.format.KML.readScale_ = function(node) {
  return ol.format.XSD.readDecimal(node);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.style.Style>|string|undefined} StyleMap.
 */
ol.format.KML.readStyleMapValue_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(undefined,
      ol.format.KML.STYLE_MAP_PARSERS_, node, objectStack);
};
/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.IconStyleParser_ = function(node, objectStack) {
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  var object = ol.xml.pushParseAndPop(
      {}, ol.format.KML.ICON_STYLE_PARSERS_, node, objectStack);
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
    src = ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_;
  }
  var anchor, anchorXUnits, anchorYUnits;
  var anchorOrigin = ol.style.IconOrigin.BOTTOM_LEFT;
  var hotSpot = /** @type {ol.KMLVec2_|undefined} */
      (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
    anchorOrigin = hotSpot.origin;
  } else if (src === ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_) {
    anchor = ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_;
    anchorXUnits = ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_;
    anchorYUnits = ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_;
  } else if (/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(src)) {
    anchor = [0.5, 0];
    anchorXUnits = ol.style.IconAnchorUnits.FRACTION;
    anchorYUnits = ol.style.IconAnchorUnits.FRACTION;
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
    rotation = ol.math.toRadians(heading);
  }

  var scale = /** @type {number|undefined} */
      (object['scale']);

  if (drawIcon) {
    if (src == ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_) {
      size = ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_;
      if (scale === undefined) {
        scale = ol.format.KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_;
      }
    }

    var imageStyle = new ol.style.Icon({
      anchor: anchor,
      anchorOrigin: anchorOrigin,
      anchorXUnits: anchorXUnits,
      anchorYUnits: anchorYUnits,
      crossOrigin: 'anonymous', // FIXME should this be configurable?
      offset: offset,
      offsetOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
      rotation: rotation,
      scale: scale,
      size: size,
      src: src
    });
    styleObject['imageStyle'] = imageStyle;
  } else {
    // handle the case when we explicitly want to draw no icon.
    styleObject['imageStyle'] = ol.format.KML.DEFAULT_NO_IMAGE_STYLE_;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.LabelStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  var object = ol.xml.pushParseAndPop(
      {}, ol.format.KML.LABEL_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var textStyle = new ol.style.Text({
    fill: new ol.style.Fill({
      color: /** @type {ol.Color} */
          ('color' in object ? object['color'] : ol.format.KML.DEFAULT_COLOR_)
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
ol.format.KML.LineStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  var object = ol.xml.pushParseAndPop(
      {}, ol.format.KML.LINE_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var strokeStyle = new ol.style.Stroke({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : ol.format.KML.DEFAULT_COLOR_),
    width: /** @type {number} */ ('width' in object ? object['width'] : 1)
  });
  styleObject['strokeStyle'] = strokeStyle;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.PolyStyleParser_ = function(node, objectStack) {
  // FIXME colorMode
  var object = ol.xml.pushParseAndPop(
      {}, ol.format.KML.POLY_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  var fillStyle = new ol.style.Fill({
    color: /** @type {ol.Color} */
        ('color' in object ? object['color'] : ol.format.KML.DEFAULT_COLOR_)
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
ol.format.KML.readFlatLinearRing_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(null,
      ol.format.KML.FLAT_LINEAR_RING_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.gxCoordParser_ = function(node, objectStack) {
  var gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  var flatCoordinates = gxTrackObject.flatCoordinates;
  var s = ol.xml.getAllTextContent(node, false);
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
ol.format.KML.readGxMultiTrack_ = function(node, objectStack) {
  var lineStrings = ol.xml.pushParseAndPop([],
      ol.format.KML.GX_MULTITRACK_GEOMETRY_PARSERS_, node, objectStack);
  if (!lineStrings) {
    return undefined;
  }
  var multiLineString = new ol.geom.MultiLineString(null);
  multiLineString.setLineStrings(lineStrings);
  return multiLineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.KML.readGxTrack_ = function(node, objectStack) {
  var gxTrackObject = ol.xml.pushParseAndPop(
      /** @type {ol.KMLGxTrackObject_} */ ({
        flatCoordinates: [],
        whens: []
      }), ol.format.KML.GX_TRACK_PARSERS_, node, objectStack);
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
  var lineString = new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XYZM, flatCoordinates);
  return lineString;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object} Icon object.
 */
ol.format.KML.readIcon_ = function(node, objectStack) {
  var iconObject = ol.xml.pushParseAndPop(
      {}, ol.format.KML.ICON_PARSERS_, node, objectStack);
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
ol.format.KML.readFlatCoordinatesFromNode_ = function(node, objectStack) {
  return ol.xml.pushParseAndPop(null,
      ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.KML.readLineString_ = function(node, objectStack) {
  var properties = ol.xml.pushParseAndPop({},
      ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      ol.format.KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var lineString = new ol.geom.LineString(null);
    lineString.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
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
ol.format.KML.readLinearRing_ = function(node, objectStack) {
  var properties = ol.xml.pushParseAndPop({},
      ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      ol.format.KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var polygon = new ol.geom.Polygon(null);
    polygon.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates,
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
ol.format.KML.readMultiGeometry_ = function(node, objectStack) {
  var geometries = ol.xml.pushParseAndPop([],
      ol.format.KML.MULTI_GEOMETRY_PARSERS_, node, objectStack);
  if (!geometries) {
    return null;
  }
  if (geometries.length === 0) {
    return new ol.geom.GeometryCollection(geometries);
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
    if (type == ol.geom.GeometryType.POINT) {
      var point = geometries[0];
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        ol.array.extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      multiGeometry = new ol.geom.MultiPoint(null);
      multiGeometry.setFlatCoordinates(layout, flatCoordinates);
      ol.format.KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == ol.geom.GeometryType.LINE_STRING) {
      multiGeometry = new ol.geom.MultiLineString(null);
      multiGeometry.setLineStrings(geometries);
      ol.format.KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == ol.geom.GeometryType.POLYGON) {
      multiGeometry = new ol.geom.MultiPolygon(null);
      multiGeometry.setPolygons(geometries);
      ol.format.KML.setCommonGeometryProperties_(multiGeometry, geometries);
    } else if (type == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
      multiGeometry = new ol.geom.GeometryCollection(geometries);
    } else {
      ol.asserts.assert(false, 37); // Unknown geometry type found
    }
  } else {
    multiGeometry = new ol.geom.GeometryCollection(geometries);
  }
  return /** @type {ol.geom.Geometry} */ (multiGeometry);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
ol.format.KML.readPoint_ = function(node, objectStack) {
  var properties = ol.xml.pushParseAndPop({},
      ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatCoordinates =
      ol.format.KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (flatCoordinates) {
    var point = new ol.geom.Point(null);
    point.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
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
ol.format.KML.readPolygon_ = function(node, objectStack) {
  var properties = ol.xml.pushParseAndPop(/** @type {Object<string,*>} */ ({}),
      ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_, node,
      objectStack);
  var flatLinearRings = ol.xml.pushParseAndPop([null],
      ol.format.KML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (flatLinearRings && flatLinearRings[0]) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      ol.array.extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
        ol.geom.GeometryLayout.XYZ, flatCoordinates, ends);
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
ol.format.KML.readStyle_ = function(node, objectStack) {
  var styleObject = ol.xml.pushParseAndPop(
      {}, ol.format.KML.STYLE_PARSERS_, node, objectStack);
  if (!styleObject) {
    return null;
  }
  var fillStyle = /** @type {ol.style.Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : ol.format.KML.DEFAULT_FILL_STYLE_);
  var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  if (fill !== undefined && !fill) {
    fillStyle = null;
  }
  var imageStyle = /** @type {ol.style.Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : ol.format.KML.DEFAULT_IMAGE_STYLE_);
  if (imageStyle == ol.format.KML.DEFAULT_NO_IMAGE_STYLE_) {
    imageStyle = undefined;
  }
  var textStyle = /** @type {ol.style.Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : ol.format.KML.DEFAULT_TEXT_STYLE_);
  var strokeStyle = /** @type {ol.style.Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : ol.format.KML.DEFAULT_STROKE_STYLE_);
  var outline = /** @type {boolean|undefined} */
      (styleObject['outline']);
  if (outline !== undefined && !outline) {
    strokeStyle = null;
  }
  return [new ol.style.Style({
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
ol.format.KML.setCommonGeometryProperties_ = function(multiGeometry,
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
ol.format.KML.DataParser_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  ol.xml.parseNode(ol.format.KML.DATA_PARSERS_, node, objectStack);
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
ol.format.KML.ExtendedDataParser_ = function(node, objectStack) {
  ol.xml.parseNode(ol.format.KML.EXTENDED_DATA_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.RegionParser_ = function(node, objectStack) {
  ol.xml.parseNode(ol.format.KML.REGION_PARSERS_, node, objectStack);
};

/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.PairDataParser_ = function(node, objectStack) {
  var pairObject = ol.xml.pushParseAndPop(
      {}, ol.format.KML.PAIR_PARSERS_, node, objectStack);
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
ol.format.KML.PlacemarkStyleMapParser_ = function(node, objectStack) {
  var styleMapValue = ol.format.KML.readStyleMapValue_(node, objectStack);
  if (!styleMapValue) {
    return;
  }
  var placemarkObject = objectStack[objectStack.length - 1];
  if (Array.isArray(styleMapValue)) {
    placemarkObject['Style'] = styleMapValue;
  } else if (typeof styleMapValue === 'string') {
    placemarkObject['styleUrl'] = styleMapValue;
  } else {
    ol.asserts.assert(false, 38); // `styleMapValue` has an unknown type
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.SchemaDataParser_ = function(node, objectStack) {
  ol.xml.parseNode(ol.format.KML.SCHEMA_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.SimpleDataParser_ = function(node, objectStack) {
  var name = node.getAttribute('name');
  if (name !== null) {
    var data = ol.format.XSD.readString(node);
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
ol.format.KML.LatLonAltBoxParser_ = function(node, objectStack) {
  var object = ol.xml.pushParseAndPop({}, ol.format.KML.LAT_LON_ALT_BOX_PARSERS_, node, objectStack);
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
ol.format.KML.LodParser_ = function(node, objectStack) {
  var object = ol.xml.pushParseAndPop({}, ol.format.KML.LOD_PARSERS_, node, objectStack);
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
ol.format.KML.innerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      ol.format.KML.INNER_BOUNDARY_IS_PARSERS_, node, objectStack);
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
ol.format.KML.outerBoundaryIsParser_ = function(node, objectStack) {
  /** @type {Array.<number>|undefined} */
  var flatLinearRing = ol.xml.pushParseAndPop(undefined,
      ol.format.KML.OUTER_BOUNDARY_IS_PARSERS_, node, objectStack);
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
ol.format.KML.LinkParser_ = function(node, objectStack) {
  ol.xml.parseNode(ol.format.KML.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.whenParser_ = function(node, objectStack) {
  var gxTrackObject = /** @type {ol.KMLGxTrackObject_} */
      (objectStack[objectStack.length - 1]);
  var whens = gxTrackObject.whens;
  var s = ol.xml.getAllTextContent(node, false);
  var when = Date.parse(s);
  whens.push(isNaN(when) ? 0 : when);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.DATA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'displayName': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'value': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.EXTENDED_DATA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Data': ol.format.KML.DataParser_,
      'SchemaData': ol.format.KML.SchemaDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.REGION_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LatLonAltBox': ol.format.KML.LatLonAltBoxParser_,
      'Lod': ol.format.KML.LodParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.LAT_LON_ALT_BOX_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'minAltitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'maxAltitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'north': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'south': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'east': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'west': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.LOD_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'minLodPixels': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'maxLodPixels': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'minFadeExtent': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'maxFadeExtent': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.EXTRUDE_AND_ALTITUDE_MODE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'extrude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'tessellate': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.FLAT_LINEAR_RING_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'coordinates': ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.FLAT_LINEAR_RINGS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'innerBoundaryIs': ol.format.KML.innerBoundaryIsParser_,
      'outerBoundaryIs': ol.format.KML.outerBoundaryIsParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.GX_TRACK_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'when': ol.format.KML.whenParser_
    }, ol.xml.makeStructureNS(
        ol.format.KML.GX_NAMESPACE_URIS_, {
          'coord': ol.format.KML.gxCoordParser_
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'coordinates': ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.ICON_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'href': ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_)
    }, ol.xml.makeStructureNS(
        ol.format.KML.GX_NAMESPACE_URIS_, {
          'x': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
          'y': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
          'w': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
          'h': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
        }));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.ICON_STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Icon': ol.xml.makeObjectPropertySetter(ol.format.KML.readIcon_),
      'heading': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'hotSpot': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'scale': ol.xml.makeObjectPropertySetter(ol.format.KML.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.INNER_BOUNDARY_IS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.KML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.LABEL_STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeObjectPropertySetter(ol.format.KML.readColor_),
      'scale': ol.xml.makeObjectPropertySetter(ol.format.KML.readScale_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.LINE_STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeObjectPropertySetter(ol.format.KML.readColor_),
      'width': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.MULTI_GEOMETRY_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LineString': ol.xml.makeArrayPusher(ol.format.KML.readLineString_),
      'LinearRing': ol.xml.makeArrayPusher(ol.format.KML.readLinearRing_),
      'MultiGeometry': ol.xml.makeArrayPusher(ol.format.KML.readMultiGeometry_),
      'Point': ol.xml.makeArrayPusher(ol.format.KML.readPoint_),
      'Polygon': ol.xml.makeArrayPusher(ol.format.KML.readPolygon_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.GX_MULTITRACK_GEOMETRY_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.GX_NAMESPACE_URIS_, {
      'Track': ol.xml.makeArrayPusher(ol.format.KML.readGxTrack_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.NETWORK_LINK_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'ExtendedData': ol.format.KML.ExtendedDataParser_,
      'Region': ol.format.KML.RegionParser_,
      'Link': ol.format.KML.LinkParser_,
      'address': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'description': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'open': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'phoneNumber': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'visibility': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.LINK_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'href': ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.OUTER_BOUNDARY_IS_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.KML.readFlatLinearRing_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.PAIR_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Style': ol.xml.makeObjectPropertySetter(ol.format.KML.readStyle_),
      'key': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'styleUrl': ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.PLACEMARK_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'ExtendedData': ol.format.KML.ExtendedDataParser_,
      'Region': ol.format.KML.RegionParser_,
      'MultiGeometry': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readMultiGeometry_, 'geometry'),
      'LineString': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readLineString_, 'geometry'),
      'LinearRing': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readLinearRing_, 'geometry'),
      'Point': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readPoint_, 'geometry'),
      'Polygon': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readPolygon_, 'geometry'),
      'Style': ol.xml.makeObjectPropertySetter(ol.format.KML.readStyle_),
      'StyleMap': ol.format.KML.PlacemarkStyleMapParser_,
      'address': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'description': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'open': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'phoneNumber': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'styleUrl': ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_),
      'visibility': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean)
    }, ol.xml.makeStructureNS(
        ol.format.KML.GX_NAMESPACE_URIS_, {
          'MultiTrack': ol.xml.makeObjectPropertySetter(
              ol.format.KML.readGxMultiTrack_, 'geometry'),
          'Track': ol.xml.makeObjectPropertySetter(
              ol.format.KML.readGxTrack_, 'geometry')
        }
    ));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.POLY_STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeObjectPropertySetter(ol.format.KML.readColor_),
      'fill': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'outline': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.SCHEMA_DATA_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'SimpleData': ol.format.KML.SimpleDataParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.STYLE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'IconStyle': ol.format.KML.IconStyleParser_,
      'LabelStyle': ol.format.KML.LabelStyleParser_,
      'LineStyle': ol.format.KML.LineStyleParser_,
      'PolyStyle': ol.format.KML.PolyStyleParser_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
ol.format.KML.STYLE_MAP_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Pair': ol.format.KML.PairDataParser_
    });


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.Feature>|undefined} Features.
 */
ol.format.KML.prototype.readDocumentOrFolder_ = function(node, objectStack) {
  // FIXME use scope somehow
  var parsersNS = ol.xml.makeStructureNS(
      ol.format.KML.NAMESPACE_URIS_, {
        'Document': ol.xml.makeArrayExtender(this.readDocumentOrFolder_, this),
        'Folder': ol.xml.makeArrayExtender(this.readDocumentOrFolder_, this),
        'Placemark': ol.xml.makeArrayPusher(this.readPlacemark_, this),
        'Style': this.readSharedStyle_.bind(this),
        'StyleMap': this.readSharedStyleMap_.bind(this)
      });
  /** @type {Array.<ol.Feature>} */
  var features = ol.xml.pushParseAndPop([], parsersNS, node, objectStack, this);
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
ol.format.KML.prototype.readPlacemark_ = function(node, objectStack) {
  var object = ol.xml.pushParseAndPop({'geometry': null},
      ol.format.KML.PLACEMARK_PARSERS_, node, objectStack);
  if (!object) {
    return undefined;
  }
  var feature = new ol.Feature();
  var id = node.getAttribute('id');
  if (id !== null) {
    feature.setId(id);
  }
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);

  var geometry = object['geometry'];
  if (geometry) {
    ol.format.Feature.transformWithOptions(geometry, false, options);
  }
  feature.setGeometry(geometry);
  delete object['geometry'];

  if (this.extractStyles_) {
    var style = object['Style'];
    var styleUrl = object['styleUrl'];
    var styleFunction = ol.format.KML.createFeatureStyleFunction_(
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
ol.format.KML.prototype.readSharedStyle_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  if (id !== null) {
    var style = ol.format.KML.readStyle_(node, objectStack);
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
ol.format.KML.prototype.readSharedStyleMap_ = function(node, objectStack) {
  var id = node.getAttribute('id');
  if (id === null) {
    return;
  }
  var styleMapValue = ol.format.KML.readStyleMapValue_(node, objectStack);
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
ol.format.KML.prototype.readFeature;


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!ol.array.includes(ol.format.KML.NAMESPACE_URIS_, node.namespaceURI)) {
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
ol.format.KML.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!ol.array.includes(ol.format.KML.NAMESPACE_URIS_, node.namespaceURI)) {
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
        ol.array.extend(features, fs);
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
ol.format.KML.prototype.readName = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readNameFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readNameFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    return this.readNameFromDocument(doc);
  } else {
    return undefined;
  }
};


/**
 * @param {Document} doc Document.
 * @return {string|undefined} Name.
 */
ol.format.KML.prototype.readNameFromDocument = function(doc) {
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
ol.format.KML.prototype.readNameFromNode = function(node) {
  var n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'name') {
      return ol.format.XSD.readString(n);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
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
ol.format.KML.prototype.readNetworkLinks = function(source) {
  var networkLinks = [];
  if (ol.xml.isDocument(source)) {
    ol.array.extend(networkLinks, this.readNetworkLinksFromDocument(
        /** @type {Document} */ (source)));
  } else if (ol.xml.isNode(source)) {
    ol.array.extend(networkLinks, this.readNetworkLinksFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    ol.array.extend(networkLinks, this.readNetworkLinksFromDocument(doc));
  }
  return networkLinks;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Network links.
 */
ol.format.KML.prototype.readNetworkLinksFromDocument = function(doc) {
  var n, networkLinks = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      ol.array.extend(networkLinks, this.readNetworkLinksFromNode(n));
    }
  }
  return networkLinks;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Network links.
 */
ol.format.KML.prototype.readNetworkLinksFromNode = function(node) {
  var n, networkLinks = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'NetworkLink') {
      var obj = ol.xml.pushParseAndPop({}, ol.format.KML.NETWORK_LINK_PARSERS_,
          n, []);
      networkLinks.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      ol.array.extend(networkLinks, this.readNetworkLinksFromNode(n));
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
ol.format.KML.prototype.readRegion = function(source) {
  var regions = [];
  if (ol.xml.isDocument(source)) {
    ol.array.extend(regions, this.readRegionFromDocument(
        /** @type {Document} */ (source)));
  } else if (ol.xml.isNode(source)) {
    ol.array.extend(regions, this.readRegionFromNode(
        /** @type {Node} */ (source)));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
    ol.array.extend(regions, this.readRegionFromDocument(doc));
  }
  return regions;
};


/**
 * @param {Document} doc Document.
 * @return {Array.<Object>} Region.
 */
ol.format.KML.prototype.readRegionFromDocument = function(doc) {
  var n, regions = [];
  for (n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      ol.array.extend(regions, this.readRegionFromNode(n));
    }
  }
  return regions;
};


/**
 * @param {Node} node Node.
 * @return {Array.<Object>} Region.
 * @api
 */
ol.format.KML.prototype.readRegionFromNode = function(node) {
  var n, regions = [];
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
        n.localName == 'Region') {
      var obj = ol.xml.pushParseAndPop({}, ol.format.KML.REGION_PARSERS_,
          n, []);
      regions.push(obj);
    }
  }
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    var localName = n.localName;
    if (ol.array.includes(ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) &&
        (localName == 'Document' ||
         localName == 'Folder' ||
         localName == 'kml')) {
      ol.array.extend(regions, this.readRegionFromNode(n));
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
ol.format.KML.prototype.readProjection;


/**
 * @param {Node} node Node to append a TextNode with the color to.
 * @param {ol.Color|string} color Color.
 * @private
 */
ol.format.KML.writeColorTextNode_ = function(node, color) {
  var rgba = ol.color.asArray(color);
  var opacity = (rgba.length == 4) ? rgba[3] : 1;
  var abgr = [opacity * 255, rgba[2], rgba[1], rgba[0]];
  var i;
  for (i = 0; i < 4; ++i) {
    var hex = parseInt(abgr[i], 10).toString(16);
    abgr[i] = (hex.length == 1) ? '0' + hex : hex;
  }
  ol.format.XSD.writeStringTextNode(node, abgr.join(''));
};


/**
 * @param {Node} node Node to append a TextNode with the coordinates to.
 * @param {Array.<number>} coordinates Coordinates.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeCoordinatesTextNode_ = function(node, coordinates, objectStack) {
  var context = objectStack[objectStack.length - 1];

  var layout = context['layout'];
  var stride = context['stride'];

  var dimension;
  if (layout == ol.geom.GeometryLayout.XY ||
      layout == ol.geom.GeometryLayout.XYM) {
    dimension = 2;
  } else if (layout == ol.geom.GeometryLayout.XYZ ||
      layout == ol.geom.GeometryLayout.XYZM) {
    dimension = 3;
  } else {
    ol.asserts.assert(false, 34); // Invalid geometry layout
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
  ol.format.XSD.writeStringTextNode(node, text);
};


/**
 * @param {Node} node Node.
 * @param {{name: *, value: *}} pair Name value pair.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeDataNode_ = function(node, pair, objectStack) {
  node.setAttribute('name', pair.name);
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var value = pair.value;

  if (typeof value == 'object') {
    if (value !== null && value.displayName) {
      ol.xml.pushSerializeAndPop(context, ol.format.KML.EXTENDEDDATA_NODE_SERIALIZERS_,
          ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value.displayName], objectStack, ['displayName']);
    }

    if (value !== null && value.value) {
      ol.xml.pushSerializeAndPop(context, ol.format.KML.EXTENDEDDATA_NODE_SERIALIZERS_,
          ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value.value], objectStack, ['value']);
    }
  } else {
    ol.xml.pushSerializeAndPop(context, ol.format.KML.EXTENDEDDATA_NODE_SERIALIZERS_,
        ol.xml.OBJECT_PROPERTY_NODE_FACTORY, [value], objectStack, ['value']);
  }
};


/**
 * @param {Node} node Node to append a TextNode with the name to.
 * @param {string} name DisplayName.
 * @private
 */
ol.format.KML.writeDataNodeName_ = function(node, name) {
  ol.format.XSD.writeCDATASection(node, name);
};


/**
 * @param {Node} node Node to append a CDATA Section with the value to.
 * @param {string} value Value.
 * @private
 */
ol.format.KML.writeDataNodeValue_ = function(node, value) {
  ol.format.XSD.writeStringTextNode(node, value);
};


/**
 * @param {Node} node Node.
 * @param {Array.<ol.Feature>} features Features.
 * @param {Array.<*>} objectStack Object stack.
 * @this {ol.format.KML}
 * @private
 */
ol.format.KML.writeDocument_ = function(node, features, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  ol.xml.pushSerializeAndPop(context, ol.format.KML.DOCUMENT_SERIALIZERS_,
      ol.format.KML.DOCUMENT_NODE_FACTORY_, features, objectStack, undefined,
      this);
};


/**
 * @param {Node} node Node.
 * @param {{names: Array<string>, values: (Array<*>)}} namesAndValues Names and values.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeExtendedData_ = function(node, namesAndValues, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var names = namesAndValues.names, values = namesAndValues.values;
  var length = names.length;

  for (var i = 0; i < length; i++) {
    ol.xml.pushSerializeAndPop(context, ol.format.KML.EXTENDEDDATA_NODE_SERIALIZERS_,
        ol.format.KML.DATA_NODE_FACTORY_, [{name: names[i], value: values[i]}], objectStack);
  }
};


/**
 * @param {Node} node Node.
 * @param {Object} icon Icon object.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeIcon_ = function(node, icon, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.KML.ICON_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(icon, orderedKeys);
  ol.xml.pushSerializeAndPop(context,
      ol.format.KML.ICON_SERIALIZERS_, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
  orderedKeys =
      ol.format.KML.ICON_SEQUENCE_[ol.format.KML.GX_NAMESPACE_URIS_[0]];
  values = ol.xml.makeSequence(icon, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.ICON_SERIALIZERS_,
      ol.format.KML.GX_NODE_FACTORY_, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Icon} style Icon style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeIconStyle_ = function(node, style, objectStack) {
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
        xunits: ol.style.IconAnchorUnits.PIXELS,
        y: size[1] - anchor[1],
        yunits: ol.style.IconAnchorUnits.PIXELS
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
  var orderedKeys = ol.format.KML.ICON_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.ICON_STYLE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Text} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeLabelStyle_ = function(node, style, objectStack) {
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
      ol.format.KML.LABEL_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.LABEL_STYLE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Stroke} style style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeLineStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {
    'color': style.getColor(),
    'width': style.getWidth()
  };
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.KML.LINE_STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.LINE_STYLE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeMultiGeometry_ = function(node, geometry, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var context = {node: node};
  var type = geometry.getType();
  /** @type {Array.<ol.geom.Geometry>} */
  var geometries;
  /** @type {function(*, Array.<*>, string=): (Node|undefined)} */
  var factory;
  if (type == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    geometries = /** @type {ol.geom.GeometryCollection} */ (geometry).getGeometries();
    factory = ol.format.KML.GEOMETRY_NODE_FACTORY_;
  } else if (type == ol.geom.GeometryType.MULTI_POINT) {
    geometries = /** @type {ol.geom.MultiPoint} */ (geometry).getPoints();
    factory = ol.format.KML.POINT_NODE_FACTORY_;
  } else if (type == ol.geom.GeometryType.MULTI_LINE_STRING) {
    geometries =
        (/** @type {ol.geom.MultiLineString} */ (geometry)).getLineStrings();
    factory = ol.format.KML.LINE_STRING_NODE_FACTORY_;
  } else if (type == ol.geom.GeometryType.MULTI_POLYGON) {
    geometries =
        (/** @type {ol.geom.MultiPolygon} */ (geometry)).getPolygons();
    factory = ol.format.KML.POLYGON_NODE_FACTORY_;
  } else {
    ol.asserts.assert(false, 39); // Unknown geometry type
  }
  ol.xml.pushSerializeAndPop(context,
      ol.format.KML.MULTI_GEOMETRY_SERIALIZERS_, factory,
      geometries, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LinearRing} linearRing Linear ring.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeBoundaryIs_ = function(node, linearRing, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  ol.xml.pushSerializeAndPop(context,
      ol.format.KML.BOUNDARY_IS_SERIALIZERS_,
      ol.format.KML.LINEAR_RING_NODE_FACTORY_, [linearRing], objectStack);
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
ol.format.KML.writePlacemark_ = function(node, feature, objectStack) {
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
    var sequence = ol.xml.makeSequence(properties, keys);
    var namesAndValues = {names: keys, values: sequence};
    ol.xml.pushSerializeAndPop(context, ol.format.KML.PLACEMARK_SERIALIZERS_,
        ol.format.KML.EXTENDEDDATA_NODE_FACTORY_, [namesAndValues], objectStack);
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
  var orderedKeys = ol.format.KML.PLACEMARK_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.PLACEMARK_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);

  // serialize geometry
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry =
        ol.format.Feature.transformWithOptions(geometry, true, options);
  }
  ol.xml.pushSerializeAndPop(context, ol.format.KML.PLACEMARK_SERIALIZERS_,
      ol.format.KML.GEOMETRY_NODE_FACTORY_, [geometry], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.SimpleGeometry} geometry Geometry.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writePrimitiveGeometry_ = function(node, geometry, objectStack) {
  var flatCoordinates = geometry.getFlatCoordinates();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  context['layout'] = geometry.getLayout();
  context['stride'] = geometry.getStride();

  // serialize properties (properties unknown to KML are not serialized)
  var properties = geometry.getProperties();
  properties.coordinates = flatCoordinates;

  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.KML.PRIMITIVE_GEOMETRY_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.PRIMITIVE_GEOMETRY_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writePolygon_ = function(node, polygon, objectStack) {
  var linearRings = polygon.getLinearRings();
  var outerRing = linearRings.shift();
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  // inner rings
  ol.xml.pushSerializeAndPop(context,
      ol.format.KML.POLYGON_SERIALIZERS_,
      ol.format.KML.INNER_BOUNDARY_NODE_FACTORY_,
      linearRings, objectStack);
  // outer ring
  ol.xml.pushSerializeAndPop(context,
      ol.format.KML.POLYGON_SERIALIZERS_,
      ol.format.KML.OUTER_BOUNDARY_NODE_FACTORY_,
      [outerRing], objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Fill} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writePolyStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  ol.xml.pushSerializeAndPop(context, ol.format.KML.POLY_STYLE_SERIALIZERS_,
      ol.format.KML.COLOR_NODE_FACTORY_, [style.getColor()], objectStack);
};


/**
 * @param {Node} node Node to append a TextNode with the scale to.
 * @param {number|undefined} scale Scale.
 * @private
 */
ol.format.KML.writeScaleTextNode_ = function(node, scale) {
  // the Math is to remove any excess decimals created by float arithmetic
  ol.format.XSD.writeDecimalTextNode(node,
      Math.round(scale * 1e6) / 1e6);
};


/**
 * @param {Node} node Node.
 * @param {ol.style.Style} style Style.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.writeStyle_ = function(node, style, objectStack) {
  var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
  var properties = {};
  var fillStyle = style.getFill();
  var strokeStyle = style.getStroke();
  var imageStyle = style.getImage();
  var textStyle = style.getText();
  if (imageStyle instanceof ol.style.Icon) {
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
  var orderedKeys = ol.format.KML.STYLE_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.STYLE_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node to append a TextNode with the Vec2 to.
 * @param {ol.KMLVec2_} vec2 Vec2.
 * @private
 */
ol.format.KML.writeVec2_ = function(node, vec2) {
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
ol.format.KML.KML_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'Document', 'Placemark'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.KML_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Document': ol.xml.makeChildAppender(ol.format.KML.writeDocument_),
      'Placemark': ol.xml.makeChildAppender(ol.format.KML.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.DOCUMENT_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Placemark': ol.xml.makeChildAppender(ol.format.KML.writePlacemark_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.EXTENDEDDATA_NODE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Data': ol.xml.makeChildAppender(ol.format.KML.writeDataNode_),
      'value': ol.xml.makeChildAppender(ol.format.KML.writeDataNodeValue_),
      'displayName': ol.xml.makeChildAppender(ol.format.KML.writeDataNodeName_)
    });


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
ol.format.KML.GEOMETRY_TYPE_TO_NODENAME_ = {
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
ol.format.KML.ICON_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'href'
    ],
    ol.xml.makeStructureNS(ol.format.KML.GX_NAMESPACE_URIS_, [
      'x', 'y', 'w', 'h'
    ]));


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.ICON_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'href': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
    }, ol.xml.makeStructureNS(
        ol.format.KML.GX_NAMESPACE_URIS_, {
          'x': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
          'y': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
          'w': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
          'h': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode)
        }));


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.ICON_STYLE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'scale', 'heading', 'Icon', 'hotSpot'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.ICON_STYLE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Icon': ol.xml.makeChildAppender(ol.format.KML.writeIcon_),
      'heading': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'hotSpot': ol.xml.makeChildAppender(ol.format.KML.writeVec2_),
      'scale': ol.xml.makeChildAppender(ol.format.KML.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.LABEL_STYLE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'color', 'scale'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.LABEL_STYLE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeChildAppender(ol.format.KML.writeColorTextNode_),
      'scale': ol.xml.makeChildAppender(ol.format.KML.writeScaleTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.LINE_STYLE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'color', 'width'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.LINE_STYLE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeChildAppender(ol.format.KML.writeColorTextNode_),
      'width': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.BOUNDARY_IS_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.MULTI_GEOMETRY_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LineString': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_),
      'Point': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_),
      'Polygon': ol.xml.makeChildAppender(ol.format.KML.writePolygon_),
      'GeometryCollection': ol.xml.makeChildAppender(
          ol.format.KML.writeMultiGeometry_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.PLACEMARK_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'name', 'open', 'visibility', 'address', 'phoneNumber', 'description',
      'styleUrl', 'Style'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.PLACEMARK_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'ExtendedData': ol.xml.makeChildAppender(
          ol.format.KML.writeExtendedData_),
      'MultiGeometry': ol.xml.makeChildAppender(
          ol.format.KML.writeMultiGeometry_),
      'LineString': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_),
      'LinearRing': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_),
      'Point': ol.xml.makeChildAppender(
          ol.format.KML.writePrimitiveGeometry_),
      'Polygon': ol.xml.makeChildAppender(ol.format.KML.writePolygon_),
      'Style': ol.xml.makeChildAppender(ol.format.KML.writeStyle_),
      'address': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'description': ol.xml.makeChildAppender(
          ol.format.XSD.writeStringTextNode),
      'name': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'open': ol.xml.makeChildAppender(ol.format.XSD.writeBooleanTextNode),
      'phoneNumber': ol.xml.makeChildAppender(
          ol.format.XSD.writeStringTextNode),
      'styleUrl': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'visibility': ol.xml.makeChildAppender(
          ol.format.XSD.writeBooleanTextNode)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.PRIMITIVE_GEOMETRY_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'extrude', 'tessellate', 'altitudeMode', 'coordinates'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.PRIMITIVE_GEOMETRY_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'extrude': ol.xml.makeChildAppender(ol.format.XSD.writeBooleanTextNode),
      'tessellate': ol.xml.makeChildAppender(ol.format.XSD.writeBooleanTextNode),
      'altitudeMode': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'coordinates': ol.xml.makeChildAppender(
          ol.format.KML.writeCoordinatesTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.POLYGON_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'outerBoundaryIs': ol.xml.makeChildAppender(
          ol.format.KML.writeBoundaryIs_),
      'innerBoundaryIs': ol.xml.makeChildAppender(
          ol.format.KML.writeBoundaryIs_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.POLY_STYLE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeChildAppender(ol.format.KML.writeColorTextNode_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.KML.STYLE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, [
      'IconStyle', 'LabelStyle', 'LineStyle', 'PolyStyle'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
ol.format.KML.STYLE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'IconStyle': ol.xml.makeChildAppender(ol.format.KML.writeIconStyle_),
      'LabelStyle': ol.xml.makeChildAppender(ol.format.KML.writeLabelStyle_),
      'LineStyle': ol.xml.makeChildAppender(ol.format.KML.writeLineStyle_),
      'PolyStyle': ol.xml.makeChildAppender(ol.format.KML.writePolyStyle_)
    });


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.KML.GX_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  return ol.xml.createElementNS(ol.format.KML.GX_NAMESPACE_URIS_[0],
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
ol.format.KML.DOCUMENT_NODE_FACTORY_ = function(value, objectStack,
    opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  return ol.xml.createElementNS(parentNode.namespaceURI, 'Placemark');
};


/**
 * @const
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.KML.GEOMETRY_NODE_FACTORY_ = function(value, objectStack,
    opt_nodeName) {
  if (value) {
    var parentNode = objectStack[objectStack.length - 1].node;
    return ol.xml.createElementNS(parentNode.namespaceURI,
        ol.format.KML.GEOMETRY_TYPE_TO_NODENAME_[/** @type {ol.geom.Geometry} */ (value).getType()]);
  }
};


/**
 * A factory for creating coordinates nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.COLOR_NODE_FACTORY_ = ol.xml.makeSimpleNodeFactory('color');


/**
 * A factory for creating Data nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
ol.format.KML.DATA_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('Data');


/**
 * A factory for creating ExtendedData nodes.
 * @const
 * @type {function(*, Array.<*>): (Node|undefined)}
 * @private
 */
ol.format.KML.EXTENDEDDATA_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('ExtendedData');


/**
 * A factory for creating innerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.INNER_BOUNDARY_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('innerBoundaryIs');


/**
 * A factory for creating Point nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.POINT_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('Point');


/**
 * A factory for creating LineString nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.LINE_STRING_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('LineString');


/**
 * A factory for creating LinearRing nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.LINEAR_RING_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('LinearRing');


/**
 * A factory for creating Polygon nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.POLYGON_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('Polygon');


/**
 * A factory for creating outerBoundaryIs nodes.
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.KML.OUTER_BOUNDARY_NODE_FACTORY_ =
    ol.xml.makeSimpleNodeFactory('outerBoundaryIs');


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
ol.format.KML.prototype.writeFeatures;


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
ol.format.KML.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  var kml = ol.xml.createElementNS(ol.format.KML.NAMESPACE_URIS_[4], 'kml');
  var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  var xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  ol.xml.setAttributeNS(kml, xmlnsUri, 'xmlns:gx',
      ol.format.KML.GX_NAMESPACE_URIS_[0]);
  ol.xml.setAttributeNS(kml, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  ol.xml.setAttributeNS(kml, xmlSchemaInstanceUri, 'xsi:schemaLocation',
      ol.format.KML.SCHEMA_LOCATION_);

  var /** @type {ol.XmlNodeStackItem} */ context = {node: kml};
  var properties = {};
  if (features.length > 1) {
    properties['Document'] = features;
  } else if (features.length == 1) {
    properties['Placemark'] = features[0];
  }
  var orderedKeys = ol.format.KML.KML_SEQUENCE_[kml.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.KML_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, [opt_options], orderedKeys,
      this);
  return kml;
};
