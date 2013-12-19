// FIXME add Styles with ids to sharedStyles_
// FIXME refactor StyleMap handling
// FIXME handle highlighted keys in StyleMaps - use styleFunctions
// FIXME extractAttributes
// FIXME extractStyles
// FIXME gx:Track
// FIXME http://earth.google.com/kml/1.0 namespace?
// FIXME why does node.getAttribute return an unknown type?
// FIXME text

goog.provide('ol.format.KML');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.xml');
goog.require('goog.math');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.XML');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Image');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.xml');


/**
 * @define {boolean} Respect visibility.
 */
ol.KML_RESPECT_VISIBILITY = false;


/**
 * @typedef {{x: number, xunits: (string|null),
 *            y: number, yunits: (string|null)}}
 */
ol.format.KMLVec2_;



/**
 * @constructor
 * @extends {ol.format.XML}
 * @param {olx.format.KMLOptions=} opt_options Options.
 */
ol.format.KML = function(opt_options) {

  //var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /** @type {Object.<string, Array.<ol.style.Style>>} */
  var sharedStyles = {};

  /**
   * @private
   * @type {Object.<string, Array.<ol.style.Style>>}
   */
  this.sharedStyles_ = sharedStyles;

  /**
   * @private
   * @type {function(this: ol.Feature, number): Array.<ol.style.Style>}
   */
  this.sharedStyleFeatureStyleFunction_ =
      /**
       * @param {number} resolution Resolution.
       * @return {Array.<ol.style.Style>} Style.
       * @this {ol.Feature}
       */
      function(resolution) {
    if (ol.KML_RESPECT_VISIBILITY) {
      var visibility = this.get('visibility');
      if (goog.isDef(visibility) && !visibility) {
        return null;
      }
    }
    var styleUrl = /** @type {string|undefined} */ (this.get('styleUrl'));
    goog.asserts.assert(goog.isDef(styleUrl));
    var style = sharedStyles[styleUrl];
    if (goog.isDef(style)) {
      return style;
    } else {
      return null;
    }
  };

};
goog.inherits(ol.format.KML, ol.format.XML);


/**
 * @const {Array.<string>}
 * @private
 */
ol.format.KML.EXTENSIONS_ = ['.kml'];


/**
 * @const {Array.<string>}
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
 * @const {ol.Color}
 * @private
 */
ol.format.KML.DEFAULT_COLOR_ = [255, 255, 255, 1];


/**
 * @const {ol.style.Fill}
 * @private
 */
ol.format.KML.DEFAULT_FILL_STYLE_ = new ol.style.Fill({
  color: ol.format.KML.DEFAULT_COLOR_
});


/**
 * @const {ol.Size}
 * @private
 */
ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_ = [2, 20]; // FIXME maybe [8, 32] ?


/**
 * @const {ol.Size}
 * @private
 */
ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_ = [32, 32];


/**
 * @const {string}
 * @private
 */
ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_ =
    'https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';


/**
 * @const {ol.style.Image}
 * @private
 */
ol.format.KML.DEFAULT_IMAGE_STYLE_ = new ol.style.Icon({
  anchor: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_,
  crossOrigin: 'anonymous',
  rotation: 0,
  scale: 1,
  size: ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_,
  src: ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_
});


/**
 * @const {ol.style.Stroke}
 * @private
 */
ol.format.KML.DEFAULT_STROKE_STYLE_ = new ol.style.Stroke({
  color: ol.format.KML.DEFAULT_COLOR_,
  width: 1
});


/**
 * @const {ol.style.Style}
 * @private
 */
ol.format.KML.DEFAULT_STYLE_ = new ol.style.Style({
  fill: ol.format.KML.DEFAULT_FILL_STYLE_,
  image: ol.format.KML.DEFAULT_IMAGE_STYLE_,
  text: null, // FIXME
  stroke: ol.format.KML.DEFAULT_STROKE_STYLE_,
  zIndex: 0
});


/**
 * @const {Array.<ol.style.Style>}
 * @private
 */
ol.format.KML.DEFAULT_STYLE_ARRAY_ = [ol.format.KML.DEFAULT_STYLE_];


/**
 * @param {number} resolution Resolution.
 * @private
 * @return {Array.<ol.style.Style>}
 * @this {ol.Feature}
 */
ol.format.KML.defaultFeatureStyleFunction_ = function(resolution) {
  if (ol.KML_RESPECT_VISIBILITY) {
    var visibility = this.get('visibility');
    if (goog.isDef(visibility) && !visibility) {
      return null;
    }
  }
  return ol.format.KML.DEFAULT_STYLE_ARRAY_;
};


/**
 * @param {ol.style.Style} style Style.
 * @private
 * @return {function(this: ol.Feature, number): Array.<ol.style.Style>} Feature
 *     style function.
 */
ol.format.KML.makeFeatureStyleFunction_ = function(style) {
  // FIXME handle styleMap?
  var styleArray = [style];
  return (
      /**
       * @param {number} resolution Resolution.
       * @return {Array.<ol.style.Style>} Style.
       * @this {ol.Feature}
       */
      function(resolution) {
        if (ol.KML_RESPECT_VISIBILITY) {
          var visibility = this.get('visibility');
          if (goog.isDef(visibility) && !visibility) {
            return null;
          }
        }
        return styleArray;
      });
};


/**
 * @param {Node} node Node.
 * @private
 * @return {boolean|undefined} Boolean.
 */
ol.format.KML.readBoolean_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  var m = /^\s*(0|1)\s*$/.exec(s);
  if (m) {
    return m[1] == '1';
  } else {
    return undefined;
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
      /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*,\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)(?:\s*,\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?))?\s*/i;
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
 * @return {number|undefined}
 */
ol.format.KML.readNumber_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  var m = /^\s*(\d+(?:\.\d*)?)\s*$/.exec(s);
  if (m) {
    return parseFloat(m[1]);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {string} String.
 */
ol.format.KML.readString_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  return goog.string.trim(s);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {string|undefined} Style URL.
 */
ol.format.KML.readStyleUrl_ = function(node) {
  var s = goog.string.trim(ol.xml.getAllTextContent(node, false));
  if (goog.isNull(node.baseURI)) {
    return s;
  } else {
    return goog.Uri.resolve(node.baseURI, s).toString();
  }

};


/**
 * @param {Node} node Node.
 * @private
 * @return {string} URI.
 */
ol.format.KML.readURI_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  if (goog.isNull(node.baseURI)) {
    return goog.string.trim(s);
  } else {
    return goog.Uri.resolve(node.baseURI, goog.string.trim(s)).toString();
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.format.KMLVec2_} Vec2.
 */
ol.format.KML.readVec2_ = function(node) {
  return {
    x: parseFloat(node.getAttribute('x')),
    xunits: node.getAttribute('xunits'),
    y: parseFloat(node.getAttribute('y')),
    yunits: node.getAttribute('yunits')
  };
};


/**
 * @param {Node} node Node.
 * @private
 * @return {number|undefined} Scale.
 */
ol.format.KML.readscale_ = function(node) {
  var number = ol.format.KML.readNumber_(node);
  if (goog.isDef(number)) {
    return Math.sqrt(number);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.IconStyleParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'IconStyle');
  // FIXME gx:x
  // FIXME gx:y
  // FIXME gx:w
  // FIXME gx:h
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  var object = ol.xml.pushAndParse(
      {}, ol.format.KML.ICON_STYLE_PARSERS_, node, objectStack);
  if (!goog.isDef(object)) {
    return;
  }
  var styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  goog.asserts.assert(goog.isObject(styleObject));
  var IconObject = /** @type {Object} */ (goog.object.get(object, 'Icon', {}));
  var src;
  var href = /** @type {string|undefined} */
      (goog.object.get(IconObject, 'href'));
  if (goog.isDef(href)) {
    src = href;
  } else {
    src = ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_;
  }
  var anchor;
  var hotSpot = /** @type {ol.format.KMLVec2_|undefined} */
      (goog.object.get(object, 'hotSpot'));
  if (goog.isDef(hotSpot)) {
    goog.asserts.assert(hotSpot.xunits == 'pixels');
    goog.asserts.assert(hotSpot.yunits == 'pixels');
    anchor = [hotSpot.x, hotSpot.y];
  } else if (src === ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_) {
    anchor = ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_;
  } else {
    anchor = null;
  }
  var rotation;
  var heading = /** @type {number|undefined} */
      (goog.object.get(object, 'heading'));
  if (goog.isDef(heading)) {
    rotation = goog.math.toRadians(heading);
  } else {
    rotation = 0;
  }
  var scale = /** @type {number|undefined} */
      (goog.object.get(object, 'scale'));
  var size;
  if (src == ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_) {
    size = ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_;
  } else {
    size = null;
  }
  var imageStyle = new ol.style.Icon({
    anchor: anchor,
    crossOrigin: 'anonymous', // FIXME should this be configurable?
    rotation: rotation,
    scale: scale,
    size: size,
    src: src
  });
  goog.object.set(styleObject, 'imageStyle', imageStyle);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.LineStyleParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineStyle');
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  var object = ol.xml.pushAndParse(
      {}, ol.format.KML.LINE_STYLE_PARSERS_, node, objectStack);
  if (!goog.isDef(object)) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(styleObject));
  var strokeStyle = new ol.style.Stroke({
    color: /** @type {ol.Color} */
        (goog.object.get(object, 'color', ol.format.KML.DEFAULT_COLOR_)),
    width: /** @type {number} */ (goog.object.get(object, 'width', 1))
  });
  goog.object.set(styleObject, 'strokeStyle', strokeStyle);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.PolyStyleParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'PolyStyle');
  // FIXME colorMode
  var object = ol.xml.pushAndParse(
      {}, ol.format.KML.POLY_STYLE_PARSERS_, node, objectStack);
  if (!goog.isDef(object)) {
    return;
  }
  var styleObject = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(styleObject));
  var fillStyle = new ol.style.Fill({
    color: /** @type {ol.Color} */
        (goog.object.get(object, 'color', ol.format.KML.DEFAULT_COLOR_))
  });
  goog.object.set(styleObject, 'fillStyle', fillStyle);
  var fill = /** @type {boolean|undefined} */ (goog.object.get(object, 'fill'));
  if (goog.isDef(fill)) {
    goog.object.set(styleObject, 'fill', fill);
  }
  var outline =
      /** @type {boolean|undefined} */ (goog.object.get(object, 'outline'));
  if (goog.isDef(outline)) {
    goog.object.set(styleObject, 'outline', outline);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<number>} LinearRing flat coordinates.
 */
ol.format.KML.readFlatLinearRing_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LinearRing');
  return /** @type {Array.<number>} */ (ol.xml.pushAndParse(
      null, ol.format.KML.FLAT_LINEAR_RING_PARSERS_, node, objectStack));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Object} Icon object.
 */
ol.format.KML.readIcon_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Icon');
  var iconObject = ol.xml.pushAndParse(
      {}, ol.format.KML.ICON_PARSERS_, node, objectStack);
  if (goog.isDef(iconObject)) {
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return /** @type {Array.<number>} */ (ol.xml.pushAndParse(null,
      ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_, node, objectStack));
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.LineString|undefined} LineString.
 */
ol.format.KML.readLineString_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'LineString');
  var flatCoordinates =
      ol.format.KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDef(flatCoordinates)) {
    var lineString = new ol.geom.LineString(null);
    lineString.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
    return lineString;
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'MultiGeometry');
  var geometries = ol.xml.pushAndParse(
      /** @type {Array.<ol.geom.Geometry>} */ ([]),
      ol.format.KML.MULTI_GEOMETRY_PARSERS_, node, objectStack);
  if (!goog.isDef(geometries)) {
    return null;
  }
  if (geometries.length === 0) {
    return new ol.geom.GeometryCollection(geometries);
  }
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
    /** @type {ol.geom.GeometryLayout} */
    var layout;
    /** @type {Array.<number>} */
    var flatCoordinates;
    /** @type {Array.<number>} */
    var ends;
    /** @type {Array.<Array.<number>>} */
    var endss;
    if (type == ol.geom.GeometryType.POINT) {
      var point = geometries[0];
      goog.asserts.assertInstanceof(point, ol.geom.Point);
      layout = point.getLayout();
      flatCoordinates = point.getFlatCoordinates();
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.Point);
        goog.asserts.assert(geometry.getLayout() == layout);
        goog.array.extend(flatCoordinates, geometry.getFlatCoordinates());
      }
      var multiPoint = new ol.geom.MultiPoint(null);
      multiPoint.setFlatCoordinates(layout, flatCoordinates);
      return multiPoint;
    } else if (type == ol.geom.GeometryType.LINE_STRING) {
      var lineString = geometries[0];
      goog.asserts.assertInstanceof(lineString, ol.geom.LineString);
      layout = lineString.getLayout();
      flatCoordinates = lineString.getFlatCoordinates();
      ends = [flatCoordinates.length];
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
        goog.asserts.assert(geometry.getLayout() == layout);
        goog.array.extend(flatCoordinates, geometry.getFlatCoordinates());
        ends.push(flatCoordinates.length);
      }
      var multiLineString = new ol.geom.MultiLineString(null);
      multiLineString.setFlatCoordinates(layout, flatCoordinates, ends);
      return multiLineString;
    } else if (type == ol.geom.GeometryType.POLYGON) {
      var polygon = geometries[0];
      goog.asserts.assertInstanceof(polygon, ol.geom.Polygon);
      layout = polygon.getLayout();
      flatCoordinates = polygon.getFlatCoordinates();
      endss = [polygon.getEnds()];
      for (i = 1, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
        goog.asserts.assert(geometry.getLayout() == layout);
        var offset = flatCoordinates.length;
        ends = geometry.getEnds();
        var j, jj;
        for (j = 0, jj = ends.length; j < jj; ++j) {
          ends[j] += offset;
        }
        goog.array.extend(flatCoordinates, geometry.getFlatCoordinates());
        endss.push(ends);
      }
      var multiPolygon = new ol.geom.MultiPolygon(null);
      multiPolygon.setFlatCoordinates(layout, flatCoordinates, endss);
      return multiPolygon;
    } else if (type == ol.geom.GeometryType.GEOMETRY_COLLECTION) {
      return new ol.geom.GeometryCollection(geometries);
    } else {
      goog.asserts.fail();
      return null;
    }
  } else {
    return new ol.geom.GeometryCollection(geometries);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.geom.Point|undefined} Point.
 */
ol.format.KML.readPoint_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Point');
  var flatCoordinates =
      ol.format.KML.readFlatCoordinatesFromNode_(node, objectStack);
  if (goog.isDefAndNotNull(flatCoordinates)) {
    var point = new ol.geom.Point(null);
    goog.asserts.assert(flatCoordinates.length == 3);
    point.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, flatCoordinates);
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Polygon');
  var flatLinearRings = ol.xml.pushAndParse(
      /** @type {Array.<Array.<number>>} */ ([null]),
      ol.format.KML.FLAT_LINEAR_RINGS_PARSERS_, node, objectStack);
  if (goog.isDefAndNotNull(flatLinearRings) &&
      !goog.isNull(flatLinearRings[0])) {
    var polygon = new ol.geom.Polygon(null);
    var flatCoordinates = flatLinearRings[0];
    var ends = [flatCoordinates.length];
    var i, ii;
    for (i = 1, ii = flatLinearRings.length; i < ii; ++i) {
      goog.array.extend(flatCoordinates, flatLinearRings[i]);
      ends.push(flatCoordinates.length);
    }
    polygon.setFlatCoordinates(
        ol.geom.GeometryLayout.XYZ, flatCoordinates, ends);
    return polygon;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.style.Style} Style.
 */
ol.format.KML.readStyle_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Style');
  var styleObject = ol.xml.pushAndParse(
      {}, ol.format.KML.STYLE_PARSERS_, node, objectStack);
  if (!goog.isDef(styleObject)) {
    return null;
  }
  var fillStyle = /** @type {ol.style.Fill} */ (goog.object.get(
      styleObject, 'fillStyle', ol.format.KML.DEFAULT_FILL_STYLE_));
  var fill = /** @type {boolean|undefined} */
      (goog.object.get(styleObject, 'fill'));
  if (goog.isDef(fill) && !fill) {
    fillStyle = null;
  }
  var imageStyle = /** @type {ol.style.Image} */ (goog.object.get(
      styleObject, 'imageStyle', ol.format.KML.DEFAULT_IMAGE_STYLE_));
  var strokeStyle = /** @type {ol.style.Stroke} */ (goog.object.get(
      styleObject, 'strokeStyle', ol.format.KML.DEFAULT_STROKE_STYLE_));
  var outline = /** @type {boolean|undefined} */
      (goog.object.get(styleObject, 'outline'));
  if (goog.isDef(outline) && !outline) {
    strokeStyle = null;
  }
  var style = new ol.style.Style({
    fill: fillStyle,
    image: imageStyle,
    stroke: strokeStyle,
    text: null, // FIXME
    zIndex: undefined // FIXME
  });
  return style;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.DataParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Data');
  var name = node.getAttribute('name');
  if (!goog.isNull(name)) {
    var data = ol.xml.pushAndParse(
        undefined, ol.format.KML.DATA_PARSERS_, node, objectStack);
    if (goog.isDef(data)) {
      var featureObject =
          /** @type {Object} */ (objectStack[objectStack.length - 1]);
      goog.asserts.assert(goog.isObject(featureObject));
      goog.object.set(featureObject, name, data);
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.ExtendedDataParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'ExtendedData');
  ol.xml.parse(ol.format.KML.EXTENDED_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.PairDataParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Pair');
  var pairObject = ol.xml.pushAndParse(
      {}, ol.format.KML.PAIR_PARSERS_, node, objectStack);
  if (!goog.isDef(pairObject)) {
    return;
  }
  var key = /** @type {string|undefined} */
      (goog.object.get(pairObject, 'key'));
  if (goog.isDef(key) && key == 'normal') {
    var featureObject = /** @type {Object} */
        (objectStack[objectStack.length - 1]);
    var Style = /** @type {ol.style.Style} */
        (goog.object.get(pairObject, 'Style', null));
    if (!goog.isNull(Style)) {
      goog.object.set(featureObject, 'Style', Style);
    }
    var styleUrl = /** @type {string|undefined} */
        (goog.object.get(pairObject, 'styleUrl'));
    if (goog.isDef(styleUrl)) {
      goog.object.set(featureObject, 'styleUrl', styleUrl);
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.SchemaDataParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'SchemaData');
  ol.xml.parse(ol.format.KML.SCHEMA_DATA_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.SimpleDataParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'SimpleData');
  var name = node.getAttribute('name');
  if (!goog.isNull(name)) {
    var data = ol.format.KML.readString_(node);
    var featureObject =
        /** @type {Object} */ (objectStack[objectStack.length - 1]);
    goog.object.set(featureObject, name, data);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.StyleMapParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'StyleMap');
  ol.xml.parse(ol.format.KML.STYLE_MAP_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.innerBoundaryIsParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'innerBoundaryIs');
  var flatLinearRing = ol.xml.pushAndParse(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.KML.INNER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (goog.isDef(flatLinearRing)) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings));
    goog.asserts.assert(flatLinearRings.length > 0);
    flatLinearRings.push(flatLinearRing);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.outerBoundaryIsParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'outerBoundaryIs');
  var flatLinearRing = ol.xml.pushAndParse(
      /** @type {Array.<number>|undefined} */ (undefined),
      ol.format.KML.OUTER_BOUNDARY_IS_PARSERS_, node, objectStack);
  if (goog.isDef(flatLinearRing)) {
    var flatLinearRings = /** @type {Array.<Array.<number>>} */
        (objectStack[objectStack.length - 1]);
    goog.asserts.assert(goog.isArray(flatLinearRings));
    goog.asserts.assert(flatLinearRings.length > 0);
    flatLinearRings[0] = flatLinearRing;
  }
};


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.DATA_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'value': ol.xml.makeReplacer(ol.format.KML.readString_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.EXTENDED_DATA_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Data': ol.format.KML.DataParser_,
      'SchemaData': ol.format.KML.SchemaDataParser_
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.FLAT_LINEAR_RING_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'coordinates': ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.FLAT_LINEAR_RINGS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'innerBoundaryIs': ol.format.KML.innerBoundaryIsParser_,
      'outerBoundaryIs': ol.format.KML.outerBoundaryIsParser_
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'coordinates': ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.ICON_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'href': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.ICON_STYLE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Icon': ol.xml.makeObjectPropertySetter(ol.format.KML.readIcon_),
      'heading': ol.xml.makeObjectPropertySetter(ol.format.KML.readNumber_),
      'hotSpot': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'scale': ol.xml.makeObjectPropertySetter(ol.format.KML.readscale_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.INNER_BOUNDARY_IS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.KML.readFlatLinearRing_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.LINE_STYLE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeObjectPropertySetter(ol.format.KML.readColor_),
      'width': ol.xml.makeObjectPropertySetter(ol.format.KML.readNumber_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.MULTI_GEOMETRY_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LineString': ol.xml.makeArrayPusher(ol.format.KML.readLineString_),
      'MultiGeometry': ol.xml.makeArrayPusher(ol.format.KML.readMultiGeometry_),
      'Point': ol.xml.makeArrayPusher(ol.format.KML.readPoint_),
      'Polygon': ol.xml.makeArrayPusher(ol.format.KML.readPolygon_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.OUTER_BOUNDARY_IS_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'LinearRing': ol.xml.makeReplacer(ol.format.KML.readFlatLinearRing_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.PAIR_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Style': ol.xml.makeObjectPropertySetter(ol.format.KML.readStyle_),
      'key': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_),
      'styleUrl': ol.xml.makeObjectPropertySetter(ol.format.KML.readStyleUrl_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.PLACEMARK_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'ExtendedData': ol.format.KML.ExtendedDataParser_,
      'MultiGeometry': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readMultiGeometry_, 'geometry'),
      'LineString': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readLineString_, 'geometry'),
      'Point': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readPoint_, 'geometry'),
      'Polygon': ol.xml.makeObjectPropertySetter(
          ol.format.KML.readPolygon_, 'geometry'),
      'Style': ol.xml.makeObjectPropertySetter(ol.format.KML.readStyle_),
      'StyleMap': ol.format.KML.StyleMapParser_,
      'address': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_),
      'description': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_),
      'name': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_),
      'open': ol.xml.makeObjectPropertySetter(ol.format.KML.readBoolean_),
      'phoneNumber': ol.xml.makeObjectPropertySetter(ol.format.KML.readString_),
      'styleUrl': ol.xml.makeObjectPropertySetter(ol.format.KML.readURI_),
      'visibility': ol.xml.makeObjectPropertySetter(ol.format.KML.readBoolean_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.POLY_STYLE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'color': ol.xml.makeObjectPropertySetter(ol.format.KML.readColor_),
      'fill': ol.xml.makeObjectPropertySetter(ol.format.KML.readBoolean_),
      'outline': ol.xml.makeObjectPropertySetter(ol.format.KML.readBoolean_)
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.SCHEMA_DATA_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'SimpleData': ol.format.KML.SimpleDataParser_
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.STYLE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'IconStyle': ol.format.KML.IconStyleParser_,
      'LineStyle': ol.format.KML.LineStyleParser_,
      'PolyStyle': ol.format.KML.PolyStyleParser_
    });


/**
 * @const {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.KML.STYLE_MAP_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'Pair': ol.format.KML.PairDataParser_
    });


/**
 * @inheritDoc
 */
ol.format.KML.prototype.getExtensions = function() {
  return ol.format.KML.EXTENSIONS_;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {Array.<ol.Feature>|undefined} Features.
 */
ol.format.KML.prototype.readDocumentOrFolder_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Document' ||
                      node.localName == 'Folder');
  // FIXME use scope somehow
  var parsersNS = ol.xml.makeParsersNS(
      ol.format.KML.NAMESPACE_URIS_, {
        'Folder': ol.xml.makeArrayExtender(this.readDocumentOrFolder_, this),
        'Placemark': ol.xml.makeArrayPusher(this.readPlacemark_, this),
        'Style': goog.bind(this.readSharedStyle_, this),
        'StyleMap': goog.bind(this.readSharedStyleMap_, this)
      });
  var features = ol.xml.pushAndParse(/** @type {Array.<ol.Feature>} */ ([]),
      parsersNS, node, objectStack, this);
  if (goog.isDef(features)) {
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Placemark');
  var object = ol.xml.pushAndParse({'geometry': null},
      ol.format.KML.PLACEMARK_PARSERS_, node, objectStack);
  if (!goog.isDef(object)) {
    return undefined;
  }
  var style = /** @type {ol.style.Style} */
      (goog.object.get(object, 'Style', null));
  goog.object.remove(object, 'Style');
  var feature = new ol.Feature();
  var id = node.getAttribute('id');
  if (!goog.isNull(id)) {
    feature.setId(id);
  }
  feature.setValues(object);
  var styleUrl = /** @type {string|undefined} */
      (goog.object.get(object, 'styleUrl'));
  var featureStyleFunction;
  if (goog.isDef(styleUrl)) {
    featureStyleFunction = this.sharedStyleFeatureStyleFunction_;
  } else if (goog.isNull(style)) {
    featureStyleFunction = ol.format.KML.defaultFeatureStyleFunction_;
  } else {
    featureStyleFunction = ol.format.KML.makeFeatureStyleFunction_(style);
  }
  feature.setStyleFunction(featureStyleFunction);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.prototype.readSharedStyle_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'Style');
  var id = node.getAttribute('id');
  if (!goog.isNull(id)) {
    var style = ol.format.KML.readStyle_(node, objectStack);
    if (goog.isDef(style)) {
      var baseURI = goog.isNull(node.baseURI) ? '' : node.baseURI;
      this.sharedStyles_[baseURI + '#' + id] = [style];
    }
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.KML.prototype.readSharedStyleMap_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'StyleMap');
  var id = node.getAttribute('id');
  if (!goog.isNull(id)) {
    var styleObject = ol.xml.pushAndParse(/** @type {Object} */ ({}),
        ol.format.KML.STYLE_MAP_PARSERS_, node, objectStack);
    if (!goog.isDef(styleObject)) {
      return;
    }
    var baseURI = goog.isNull(node.baseURI) ? '' : node.baseURI;
    var style = /** @type {ol.style.Style} */
        (goog.object.get(styleObject, 'style', null));
    if (!goog.isNull(style)) {
      this.sharedStyles_[baseURI + '#' + id] = [style];
    }
    var styleUrl = /** @type {string|undefined} */
        (goog.object.get(styleObject, 'styleUrl'));
    if (goog.isDef(styleUrl)) {
      var styleUri;
      if (goog.isNull(node.baseURI)) {
        styleUri = '#' + goog.string.trim(styleUrl);
      } else {
        styleUri = goog.Uri.resolve(baseURI, styleUrl).toString();
      }
      goog.asserts.assert(styleUri in this.sharedStyles_);
      this.sharedStyles_[baseURI + '#' + id] = this.sharedStyles_[styleUri];
    }
  }
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeatureFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  if (goog.array.indexOf(ol.format.KML.NAMESPACE_URIS_, node.namespaceURI) ==
      -1) {
    return null;
  }
  goog.asserts.assert(node.localName == 'Placemark');
  var feature = this.readPlacemark_(node, []);
  if (goog.isDef(feature)) {
    return feature;
  } else {
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeaturesFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  if (goog.array.indexOf(ol.format.KML.NAMESPACE_URIS_, node.namespaceURI) ==
      -1) {
    return [];
  }
  var features;
  if (node.localName == 'Document' || node.localName == 'Folder') {
    features = this.readDocumentOrFolder_(node, []);
    if (goog.isDef(features)) {
      return features;
    } else {
      return [];
    }
  } else if (node.localName == 'Placemark') {
    var feature = this.readPlacemark_(node, []);
    if (goog.isDef(feature)) {
      return [feature];
    } else {
      return [];
    }
  } else if (node.localName == 'kml') {
    features = [];
    var n;
    for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
      if (n.nodeType == goog.dom.NodeType.ELEMENT) {
        var fs = this.readFeaturesFromNode(n);
        if (goog.isDef(fs)) {
          goog.array.extend(features, fs);
        }
      }
    }
    return features;
  } else {
    return [];
  }
};


/**
 * @param {Document|Node|string} source Souce.
 * @return {string|undefined} Name.
 */
ol.format.KML.prototype.readName = function(source) {
  if (source instanceof Node) {
    return this.readNameFromNode(source);
  } else if (goog.isString(source)) {
    var doc = goog.dom.xml.loadXml(source);
    return this.readNameFromNode(doc);
  } else {
    goog.asserts.fail();
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @return {string|undefined} Name.
 */
ol.format.KML.prototype.readNameFromNode = function(node) {
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT &&
        goog.array.indexOf(
            ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) != -1 &&
        n.localName == 'name') {
      return ol.format.KML.readString_(n);
    }
  }
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT &&
        goog.array.indexOf(
            ol.format.KML.NAMESPACE_URIS_, n.namespaceURI) != -1 &&
        (n.localName == 'Document' ||
         n.localName == 'Folder' ||
         n.localName == 'Placemark' ||
         n.localName == 'kml')) {
      var name = this.readNameFromNode(n);
      if (goog.isDef(name)) {
        return name;
      }
    }
  }
  return undefined;
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readProjectionFromDocument = function(doc) {
  return ol.proj.get('EPSG:4326');
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readProjectionFromNode = function(node) {
  return ol.proj.get('EPSG:4326');
};
