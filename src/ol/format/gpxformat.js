goog.provide('ol.format.GPX');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.format.XML');
goog.require('ol.format.XSD');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.XML}
 */
ol.format.GPX = function() {
  goog.base(this);
};
goog.inherits(ol.format.GPX, ol.format.XML);


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.format.GPX.NAMESPACE_URIS_ = [
  null,
  'http://www.topografix.com/GPX/1/0',
  'http://www.topografix.com/GPX/1/1'
];


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Node} node Node.
 * @param {Object} values Values.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
ol.format.GPX.appendCoordinate_ = function(flatCoordinates, node, values) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  flatCoordinates.push(
      parseFloat(node.getAttribute('lon')),
      parseFloat(node.getAttribute('lat')));
  if (goog.object.containsKey(values, 'ele')) {
    flatCoordinates.push(
        /** @type {number} */ (goog.object.get(values, 'ele')));
    goog.object.remove(values, 'ele');
  } else {
    flatCoordinates.push(0);
  }
  if (goog.object.containsKey(values, 'time')) {
    flatCoordinates.push(
        /** @type {number} */ (goog.object.get(values, 'time')));
    goog.object.remove(values, 'time');
  } else {
    flatCoordinates.push(0);
  }
  return flatCoordinates;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseLink_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'link');
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var href = node.getAttribute('href');
  if (!goog.isNull(href)) {
    goog.object.set(values, 'link', href);
  }
  ol.xml.parse(ol.format.GPX.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseRtePt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'rtept');
  var values = ol.xml.pushAndParse(
      {}, ol.format.GPX.RTEPT_PARSERS_, node, objectStack);
  if (goog.isDef(values)) {
    var rteValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (goog.object.get(rteValues, 'flatCoordinates'));
    ol.format.GPX.appendCoordinate_(flatCoordinates, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseTrkPt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'trkpt');
  var values = ol.xml.pushAndParse(
      {}, ol.format.GPX.TRKPT_PARSERS_, node, objectStack);
  if (goog.isDef(values)) {
    var trkValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (goog.object.get(trkValues, 'flatCoordinates'));
    ol.format.GPX.appendCoordinate_(flatCoordinates, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseTrkSeg_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'trkseg');
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  ol.xml.parse(ol.format.GPX.TRKSEG_PARSERS_, node, objectStack);
  var flatCoordinates = /** @type {Array.<number>} */
      (goog.object.get(values, 'flatCoordinates'));
  var ends = /** @type {Array.<number>} */ (goog.object.get(values, 'ends'));
  ends.push(flatCoordinates.length);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Track.
 */
ol.format.GPX.readRte_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'rte');
  var values = ol.xml.pushAndParse({
    'flatCoordinates': []
  }, ol.format.GPX.RTE_PARSERS_, node, objectStack);
  if (!goog.isDef(values)) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (goog.object.get(values, 'flatCoordinates'));
  goog.object.remove(values, 'flatCoordinates');
  var geometry = new ol.geom.LineString(null);
  geometry.setFlatCoordinates(ol.geom.GeometryLayout.XYZM, flatCoordinates);
  var feature = new ol.Feature(geometry);
  feature.setValues(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Track.
 */
ol.format.GPX.readTrk_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'trk');
  var values = ol.xml.pushAndParse({
    'flatCoordinates': [],
    'ends': []
  }, ol.format.GPX.TRK_PARSERS_, node, objectStack);
  if (!goog.isDef(values)) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (goog.object.get(values, 'flatCoordinates'));
  goog.object.remove(values, 'flatCoordinates');
  var ends = /** @type {Array.<number>} */ (goog.object.get(values, 'ends'));
  goog.object.remove(values, 'ends');
  var geometry = new ol.geom.MultiLineString(null);
  geometry.setFlatCoordinates(
      ol.geom.GeometryLayout.XYZM, flatCoordinates, ends);
  var feature = new ol.Feature(geometry);
  feature.setValues(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Waypoint.
 */
ol.format.GPX.readWpt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.localName == 'wpt');
  var values = ol.xml.pushAndParse(
      {}, ol.format.GPX.WPT_PARSERS_, node, objectStack);
  if (!goog.isDef(values)) {
    return undefined;
  }
  var coordinates = ol.format.GPX.appendCoordinate_([], node, values);
  var geometry = new ol.geom.Point(
      coordinates, ol.geom.GeometryLayout.XYZM);
  var feature = new ol.Feature(geometry);
  feature.setValues(values);
  return feature;
};


/**
 * @const
 * @type {Object.<string, function(Node, Array.<*>): (ol.Feature|undefined)>}
 * @private
 */
ol.format.GPX.FEATURE_READER_ = {
  'rte': ol.format.GPX.readRte_,
  'trk': ol.format.GPX.readTrk_,
  'wpt': ol.format.GPX.readWpt_
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.GPX_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'rte': ol.xml.makeArrayPusher(ol.format.GPX.readRte_),
      'trk': ol.xml.makeArrayPusher(ol.format.GPX.readTrk_),
      'wpt': ol.xml.makeArrayPusher(ol.format.GPX.readWpt_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.LINK_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'text':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readString, 'linkText'),
      'type':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readString, 'linkType')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.RTE_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'cmt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'desc': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'src': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'link': ol.format.GPX.parseLink_,
      'number':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
      'type': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'rtept': ol.format.GPX.parseRtePt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.RTEPT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'time': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRK_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'cmt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'desc': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'src': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'link': ol.format.GPX.parseLink_,
      'number':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
      'type': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'trkseg': ol.format.GPX.parseTrkSeg_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRKSEG_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'trkpt': ol.format.GPX.parseTrkPt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRKPT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'time': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.WPT_PARSERS_ = ol.xml.makeParsersNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'time': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime),
      'geoidheight': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'cmt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'desc': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'src': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'link': ol.format.GPX.parseLink_,
      'sym': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'type': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'fix': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'sat': ol.xml.makeObjectPropertySetter(
          ol.format.XSD.readNonNegativeInteger),
      'hdop': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'vdop': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'pdop': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'ageofdgpsdata':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'dgpsid':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger)
    });


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readFeatureFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  if (goog.array.indexOf(ol.format.GPX.NAMESPACE_URIS_, node.namespaceURI) ==
      -1) {
    return null;
  }
  var featureReader = ol.format.GPX.FEATURE_READER_[node.localName];
  if (!goog.isDef(featureReader)) {
    return null;
  }
  var feature = featureReader(node, []);
  if (!goog.isDef(feature)) {
    return null;
  }
  return feature;
};


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readFeaturesFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  if (goog.array.indexOf(ol.format.GPX.NAMESPACE_URIS_, node.namespaceURI) ==
      -1) {
    return [];
  }
  if (node.localName == 'gpx') {
    var features = ol.xml.pushAndParse(/** @type {Array.<ol.Feature>} */ ([]),
        ol.format.GPX.GPX_PARSERS_, node, []);
    if (goog.isDef(features)) {
      return features;
    } else {
      return [];
    }
  }
  return [];
};


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readProjectionFromDocument = function(doc) {
  return ol.proj.get('EPSG:4326');
};


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readProjectionFromNode = function(node) {
  return ol.proj.get('EPSG:4326');
};
