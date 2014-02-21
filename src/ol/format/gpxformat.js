goog.provide('ol.format.GPX');
goog.provide('ol.format.GPX.v1_1');

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
 * @todo stability experimental
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
  var values = ol.xml.pushParseAndPop(
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
  var values = ol.xml.pushParseAndPop(
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
  var values = ol.xml.pushParseAndPop({
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
  var values = ol.xml.pushParseAndPop({
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
  var values = ol.xml.pushParseAndPop(
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
      'magvar': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
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
    var features = ol.xml.pushParseAndPop(
        /** @type {Array.<ol.Feature>} */ ([]), ol.format.GPX.GPX_PARSERS_,
        node, []);
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


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.GPX.LINK_SEQUENCE_ = ['text', 'type'];


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.LINK_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'text': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'type': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode))
    });


/**
 * @param {Node} node Node.
 * @param {string} value Value for the link's `href` attribute.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GPX.writeLink_ = function(node, value, objectStack) {
  node.setAttribute('href', value);
  var properties = objectStack[objectStack.length - 1].context;
  var link = [
    goog.object.get(properties, 'linkText'),
    goog.object.get(properties, 'linkType')
  ];
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */ ({node: node}),
      ol.format.GPX.LINK_SERIALIZERS_,
      ol.xml.makeChildNodeFactory(node.namespaceURI), link, objectStack,
      ol.format.GPX.LINK_SEQUENCE_);
};


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.GPX.WPT_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, [
      'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
      'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
      'ageofdgpsdata', 'dgpsid'
    ]);


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.WPT_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'time': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDateTimeTextNode)),
      'magvar': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'geoidheight': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'name': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'cmt': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'desc': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'src': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'link': ol.xml.makeChildAppender(ol.format.GPX.writeLink_),
      'sym': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'type': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'fix': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeStringTextNode)),
      'sat': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeNonNegativeIntegerTextNode)),
      'hdop': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'vdop': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'pdop': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'ageofdgpsdata': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeDecimalTextNode)),
      'dgpsid': ol.xml.makeChildAppender(ol.xml.makeSimpleTypeWriter(
          ol.format.XSD.writeNonNegativeIntegerTextNode))
    });


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
ol.format.GPX.GEOMETRY_TYPE_TO_NODENAME_ = {
  'Point': 'wpt',
  'LineString': 'rte',
  'MultiLineString': 'trk'
};


/**
 * @const
 * @param {*} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node} Node.
 * @private
 */
ol.format.GPX.GPX_NODE_FACTORY_ = function(feature, objectStack, opt_nodeName) {
  goog.asserts.assertInstanceof(feature, ol.Feature);
  var geometry = feature.getGeometry();
  if (goog.isDef(geometry)) {
    var parentNode = objectStack[objectStack.length - 1].node;
    goog.asserts.assert(ol.xml.isNode(parentNode));
    return ol.xml.createElementNS(parentNode.namespaceURI,
        ol.format.GPX.GEOMETRY_TYPE_TO_NODENAME_[geometry.getType()]);
  }
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @template T
 */
ol.format.GPX.writeWpt_ = function(node, feature, objectStack) {
  var parentNode = objectStack[objectStack.length - 1].node;
  goog.asserts.assert(ol.xml.isNode(parentNode));
  var namespaceURI = parentNode.namespaceURI;
  var properties = feature.getProperties();
  var geometry = feature.getGeometry();
  if (goog.isDef(geometry)) {
    goog.asserts.assert(geometry instanceof ol.geom.Point);
    var coordinates = geometry.getCoordinates();
    //FIXME Projection handling
    ol.xml.setAttributeNS(node, null, 'lat', coordinates[1]);
    ol.xml.setAttributeNS(node, null, 'lon', coordinates[0]);
    var geometryLayout = geometry.getLayout();
    switch (geometryLayout) {
      case ol.geom.GeometryLayout.XYZM:
        if (coordinates[3] !== 0) {
          goog.object.set(properties, 'time', coordinates[3]);
        }
      case ol.geom.GeometryLayout.XYZ:
        if (coordinates[2] !== 0) {
          goog.object.set(properties, 'ele', coordinates[2]);
        }
        break;
      case ol.geom.GeometryLayout.XYM:
        if (coordinates[2] !== 0) {
          goog.object.set(properties, 'time', coordinates[2]);
        }
    }
  }
  var orderedKeys = ol.format.GPX.WPT_SEQUENCE_[namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      ({node: node, context: properties}), ol.format.GPX.WPT_SERIALIZERS_,
      ol.xml.makeChildNodeFactory(namespaceURI), values, objectStack,
      orderedKeys);
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.GPX_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      //'LineString': ol.xml.makeChildAppender(ol.format.GPX.writeRte_),
      //'MultiLineString': ol.xml.makeChildAppender(ol.format.GPX.writeTrk_),
      'wpt': ol.xml.makeChildAppender(ol.format.GPX.writeWpt_)
    });



/**
 * @constructor
 * @extends {ol.format.GPX}
 * @todo stability experimental
 */
ol.format.GPX.V1_1 = function() {
  goog.base(this);
};
goog.inherits(ol.format.GPX.V1_1, ol.format.GPX);


/**
 * @inheritDoc
 */
ol.format.GPX.V1_1.prototype.writeFeaturesNode = function(features) {
  //FIXME Serialize metadata
  var gpx = ol.xml.createElementNS(ol.format.GPX.NAMESPACE_URIS_[2], 'gpx');
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      ({node: gpx}), ol.format.GPX.GPX_SERIALIZERS_,
      ol.format.GPX.GPX_NODE_FACTORY_, features, []);
  return gpx;
};
