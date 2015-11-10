goog.provide('ol.format.GPX');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');
goog.require('ol.Feature');
goog.require('ol.array');
goog.require('ol.format.Feature');
goog.require('ol.format.XMLFeature');
goog.require('ol.format.XSD');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.xml');



/**
 * @classdesc
 * Feature format for reading and writing data in the GPX format.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @param {olx.format.GPXOptions=} opt_options Options.
 * @api stable
 */
ol.format.GPX = function(opt_options) {

  var options = opt_options ? opt_options : {};

  goog.base(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get('EPSG:4326');

  /**
   * @type {function(ol.Feature, Node)|undefined}
   * @private
   */
  this.readExtensions_ = options.readExtensions;
};
goog.inherits(ol.format.GPX, ol.format.XMLFeature);


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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  flatCoordinates.push(
      parseFloat(node.getAttribute('lon')),
      parseFloat(node.getAttribute('lat')));
  if ('ele' in values) {
    flatCoordinates.push(/** @type {number} */ (values['ele']));
    delete values['ele'];
  } else {
    flatCoordinates.push(0);
  }
  if ('time' in values) {
    flatCoordinates.push(/** @type {number} */ (values['time']));
    delete values['time'];
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
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'link', 'localName should be link');
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var href = node.getAttribute('href');
  if (href !== null) {
    values['link'] = href;
  }
  ol.xml.parseNode(ol.format.GPX.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseExtensions_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'extensions',
      'localName should be extensions');
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values['extensionsNode_'] = node;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseRtePt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'rtept', 'localName should be rtept');
  var values = ol.xml.pushParseAndPop(
      {}, ol.format.GPX.RTEPT_PARSERS_, node, objectStack);
  if (values) {
    var rteValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (rteValues['flatCoordinates']);
    ol.format.GPX.appendCoordinate_(flatCoordinates, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseTrkPt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'trkpt', 'localName should be trkpt');
  var values = ol.xml.pushParseAndPop(
      {}, ol.format.GPX.TRKPT_PARSERS_, node, objectStack);
  if (values) {
    var trkValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (trkValues['flatCoordinates']);
    ol.format.GPX.appendCoordinate_(flatCoordinates, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.parseTrkSeg_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'trkseg',
      'localName should be trkseg');
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  ol.xml.parseNode(ol.format.GPX.TRKSEG_PARSERS_, node, objectStack);
  var flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  var ends = /** @type {Array.<number>} */ (values['ends']);
  ends.push(flatCoordinates.length);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Track.
 */
ol.format.GPX.readRte_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'rte', 'localName should be rte');
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = ol.xml.pushParseAndPop({
    'flatCoordinates': []
  }, ol.format.GPX.RTE_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  var geometry = new ol.geom.LineString(null);
  geometry.setFlatCoordinates(ol.geom.GeometryLayout.XYZM, flatCoordinates);
  ol.format.Feature.transformWithOptions(geometry, false, options);
  var feature = new ol.Feature(geometry);
  feature.setProperties(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Track.
 */
ol.format.GPX.readTrk_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'trk', 'localName should be trk');
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = ol.xml.pushParseAndPop({
    'flatCoordinates': [],
    'ends': []
  }, ol.format.GPX.TRK_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  var ends = /** @type {Array.<number>} */ (values['ends']);
  delete values['ends'];
  var geometry = new ol.geom.MultiLineString(null);
  geometry.setFlatCoordinates(
      ol.geom.GeometryLayout.XYZM, flatCoordinates, ends);
  ol.format.Feature.transformWithOptions(geometry, false, options);
  var feature = new ol.Feature(geometry);
  feature.setProperties(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Waypoint.
 */
ol.format.GPX.readWpt_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'wpt', 'localName should be wpt');
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = ol.xml.pushParseAndPop(
      {}, ol.format.GPX.WPT_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var coordinates = ol.format.GPX.appendCoordinate_([], node, values);
  var geometry = new ol.geom.Point(
      coordinates, ol.geom.GeometryLayout.XYZM);
  ol.format.Feature.transformWithOptions(geometry, false, options);
  var feature = new ol.Feature(geometry);
  feature.setProperties(values);
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
ol.format.GPX.GPX_PARSERS_ = ol.xml.makeStructureNS(
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
ol.format.GPX.LINK_PARSERS_ = ol.xml.makeStructureNS(
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
ol.format.GPX.RTE_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'cmt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'desc': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'src': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'link': ol.format.GPX.parseLink_,
      'number':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
      'extensions': ol.format.GPX.parseExtensions_,
      'type': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'rtept': ol.format.GPX.parseRtePt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.RTEPT_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'time': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRK_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'cmt': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'desc': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'src': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'link': ol.format.GPX.parseLink_,
      'number':
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
      'type': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'extensions': ol.format.GPX.parseExtensions_,
      'trkseg': ol.format.GPX.parseTrkSeg_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRKSEG_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'trkpt': ol.format.GPX.parseTrkPt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.TRKPT_PARSERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'time': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Parser>>}
 * @private
 */
ol.format.GPX.WPT_PARSERS_ = ol.xml.makeStructureNS(
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
          ol.xml.makeObjectPropertySetter(ol.format.XSD.readNonNegativeInteger),
      'extensions': ol.format.GPX.parseExtensions_
    });


/**
 * @param {Array.<ol.Feature>} features
 * @private
 */
ol.format.GPX.prototype.handleReadExtensions_ = function(features) {
  if (!features) {
    features = [];
  }
  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    if (this.readExtensions_) {
      var extensionsNode = feature.get('extensionsNode_') || null;
      this.readExtensions_(feature, extensionsNode);
    }
    feature.set('extensionsNode_', undefined);
  }
};


/**
 * Read the first feature from a GPX source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api stable
 */
ol.format.GPX.prototype.readFeature;


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readFeatureFromNode = function(node, opt_options) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  if (!ol.array.includes(ol.format.GPX.NAMESPACE_URIS_, node.namespaceURI)) {
    return null;
  }
  var featureReader = ol.format.GPX.FEATURE_READER_[node.localName];
  if (!featureReader) {
    return null;
  }
  var feature = featureReader(node, [this.getReadOptions(node, opt_options)]);
  if (!feature) {
    return null;
  }
  this.handleReadExtensions_([feature]);
  return feature;
};


/**
 * Read all features from a GPX source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api stable
 */
ol.format.GPX.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.GPX.prototype.readFeaturesFromNode = function(node, opt_options) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  if (!ol.array.includes(ol.format.GPX.NAMESPACE_URIS_, node.namespaceURI)) {
    return [];
  }
  if (node.localName == 'gpx') {
    var features = ol.xml.pushParseAndPop(
        /** @type {Array.<ol.Feature>} */ ([]), ol.format.GPX.GPX_PARSERS_,
        node, [this.getReadOptions(node, opt_options)]);
    if (features) {
      this.handleReadExtensions_(features);
      return features;
    } else {
      return [];
    }
  }
  return [];
};


/**
 * Read the projection from a GPX source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api stable
 */
ol.format.GPX.prototype.readProjection;


/**
 * @param {Node} node Node.
 * @param {string} value Value for the link's `href` attribute.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
ol.format.GPX.writeLink_ = function(node, value, objectStack) {
  node.setAttribute('href', value);
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var properties = context['properties'];
  var link = [
    properties['linkText'],
    properties['linkType']
  ];
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */ ({node: node}),
      ol.format.GPX.LINK_SERIALIZERS_, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      link, objectStack, ol.format.GPX.LINK_SEQUENCE_);
};


/**
 * @param {Node} node Node.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.writeWptType_ = function(node, coordinate, objectStack) {
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  var parentNode = context.node;
  goog.asserts.assert(ol.xml.isNode(parentNode),
      'parentNode should be an XML node');
  var namespaceURI = parentNode.namespaceURI;
  var properties = context['properties'];
  //FIXME Projection handling
  ol.xml.setAttributeNS(node, null, 'lat', coordinate[1]);
  ol.xml.setAttributeNS(node, null, 'lon', coordinate[0]);
  var geometryLayout = context['geometryLayout'];
  /* jshint -W086 */
  switch (geometryLayout) {
    case ol.geom.GeometryLayout.XYZM:
      if (coordinate[3] !== 0) {
        properties['time'] = coordinate[3];
      }
    case ol.geom.GeometryLayout.XYZ:
      if (coordinate[2] !== 0) {
        properties['ele'] = coordinate[2];
      }
      break;
    case ol.geom.GeometryLayout.XYM:
      if (coordinate[2] !== 0) {
        properties['time'] = coordinate[2];
      }
  }
  /* jshint +W086 */
  var orderedKeys = ol.format.GPX.WPT_TYPE_SEQUENCE_[namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      ({node: node, 'properties': properties}),
      ol.format.GPX.WPT_TYPE_SERIALIZERS_, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.writeRte_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var properties = feature.getProperties();
  var context = {node: node, 'properties': properties};
  var geometry = feature.getGeometry();
  if (geometry) {
    goog.asserts.assertInstanceof(geometry, ol.geom.LineString,
        'geometry should be an ol.geom.LineString');
    geometry = /** @type {ol.geom.LineString} */
        (ol.format.Feature.transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    properties['rtept'] = geometry.getCoordinates();
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.GPX.RTE_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */ (context),
      ol.format.GPX.RTE_SERIALIZERS_, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.writeTrk_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var properties = feature.getProperties();
  var context = {node: node, 'properties': properties};
  var geometry = feature.getGeometry();
  if (geometry) {
    goog.asserts.assertInstanceof(geometry, ol.geom.MultiLineString,
        'geometry should be an ol.geom.MultiLineString');
    geometry = /** @type {ol.geom.MultiLineString} */
        (ol.format.Feature.transformWithOptions(geometry, true, options));
    properties['trkseg'] = geometry.getLineStrings();
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.GPX.TRK_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */ (context),
      ol.format.GPX.TRK_SERIALIZERS_, ol.xml.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} lineString LineString.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.writeTrkSeg_ = function(node, lineString, objectStack) {
  var context = {node: node, 'geometryLayout': lineString.getLayout(),
    'properties': {}};
  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */ (context),
      ol.format.GPX.TRKSEG_SERIALIZERS_, ol.format.GPX.TRKSEG_NODE_FACTORY_,
      lineString.getCoordinates(), objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
ol.format.GPX.writeWpt_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var context = objectStack[objectStack.length - 1];
  goog.asserts.assert(goog.isObject(context), 'context should be an Object');
  context['properties'] = feature.getProperties();
  var geometry = feature.getGeometry();
  if (geometry) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Point,
        'geometry should be an ol.geom.Point');
    geometry = /** @type {ol.geom.Point} */
        (ol.format.Feature.transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    ol.format.GPX.writeWptType_(node, geometry.getCoordinates(), objectStack);
  }
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
      'text': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'type': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.GPX.RTE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, [
      'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'rtept'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.RTE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'cmt': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'desc': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'src': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'link': ol.xml.makeChildAppender(ol.format.GPX.writeLink_),
      'number': ol.xml.makeChildAppender(
          ol.format.XSD.writeNonNegativeIntegerTextNode),
      'type': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'rtept': ol.xml.makeArraySerializer(ol.xml.makeChildAppender(
          ol.format.GPX.writeWptType_))
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.GPX.TRK_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, [
      'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'trkseg'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.TRK_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'name': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'cmt': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'desc': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'src': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'link': ol.xml.makeChildAppender(ol.format.GPX.writeLink_),
      'number': ol.xml.makeChildAppender(
          ol.format.XSD.writeNonNegativeIntegerTextNode),
      'type': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'trkseg': ol.xml.makeArraySerializer(ol.xml.makeChildAppender(
          ol.format.GPX.writeTrkSeg_))
    });


/**
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
ol.format.GPX.TRKSEG_NODE_FACTORY_ = ol.xml.makeSimpleNodeFactory('trkpt');


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.TRKSEG_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'trkpt': ol.xml.makeChildAppender(ol.format.GPX.writeWptType_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
ol.format.GPX.WPT_TYPE_SEQUENCE_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, [
      'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
      'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
      'ageofdgpsdata', 'dgpsid'
    ]);


/**
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.WPT_TYPE_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'ele': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'time': ol.xml.makeChildAppender(ol.format.XSD.writeDateTimeTextNode),
      'magvar': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'geoidheight': ol.xml.makeChildAppender(
          ol.format.XSD.writeDecimalTextNode),
      'name': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'cmt': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'desc': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'src': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'link': ol.xml.makeChildAppender(ol.format.GPX.writeLink_),
      'sym': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'type': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'fix': ol.xml.makeChildAppender(ol.format.XSD.writeStringTextNode),
      'sat': ol.xml.makeChildAppender(
          ol.format.XSD.writeNonNegativeIntegerTextNode),
      'hdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'vdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'pdop': ol.xml.makeChildAppender(ol.format.XSD.writeDecimalTextNode),
      'ageofdgpsdata': ol.xml.makeChildAppender(
          ol.format.XSD.writeDecimalTextNode),
      'dgpsid': ol.xml.makeChildAppender(
          ol.format.XSD.writeNonNegativeIntegerTextNode)
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
 * @param {*} value Value.
 * @param {Array.<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 * @private
 */
ol.format.GPX.GPX_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  goog.asserts.assertInstanceof(value, ol.Feature,
      'value should be an ol.Feature');
  var geometry = value.getGeometry();
  if (geometry) {
    var nodeName = ol.format.GPX.GEOMETRY_TYPE_TO_NODENAME_[geometry.getType()];
    if (nodeName) {
      var parentNode = objectStack[objectStack.length - 1].node;
      goog.asserts.assert(ol.xml.isNode(parentNode),
          'parentNode should be an XML node');
      return ol.xml.createElementNS(parentNode.namespaceURI, nodeName);
    }
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.xml.Serializer>>}
 * @private
 */
ol.format.GPX.GPX_SERIALIZERS_ = ol.xml.makeStructureNS(
    ol.format.GPX.NAMESPACE_URIS_, {
      'rte': ol.xml.makeChildAppender(ol.format.GPX.writeRte_),
      'trk': ol.xml.makeChildAppender(ol.format.GPX.writeTrk_),
      'wpt': ol.xml.makeChildAppender(ol.format.GPX.writeWpt_)
    });


/**
 * Encode an array of features in the GPX format.
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 * @api stable
 */
ol.format.GPX.prototype.writeFeatures;


/**
 * Encode an array of features in the GPX format as an XML node.
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @api
 */
ol.format.GPX.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  //FIXME Serialize metadata
  var gpx = ol.xml.createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');

  ol.xml.pushSerializeAndPop(/** @type {ol.xml.NodeStackItem} */
      ({node: gpx}), ol.format.GPX.GPX_SERIALIZERS_,
      ol.format.GPX.GPX_NODE_FACTORY_, features, [opt_options]);
  return gpx;
};
