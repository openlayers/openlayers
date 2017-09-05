import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_array_ from '../array';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_XMLFeature_ from '../format/xmlfeature';
import _ol_format_XSD_ from '../format/xsd';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_geom_MultiLineString_ from '../geom/multilinestring';
import _ol_geom_Point_ from '../geom/point';
import _ol_proj_ from '../proj';
import _ol_xml_ from '../xml';

/**
 * @classdesc
 * Feature format for reading and writing data in the GPX format.
 *
 * @constructor
 * @extends {ol.format.XMLFeature}
 * @param {olx.format.GPXOptions=} opt_options Options.
 * @api
 */
var _ol_format_GPX_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_XMLFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get('EPSG:4326');

  /**
   * @type {function(ol.Feature, Node)|undefined}
   * @private
   */
  this.readExtensions_ = options.readExtensions;
};

_ol_.inherits(_ol_format_GPX_, _ol_format_XMLFeature_);


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_format_GPX_.NAMESPACE_URIS_ = [
  null,
  'http://www.topografix.com/GPX/1/0',
  'http://www.topografix.com/GPX/1/1'
];


/**
 * @const
 * @type {string}
 * @private
 */
_ol_format_GPX_.SCHEMA_LOCATION_ = 'http://www.topografix.com/GPX/1/1 ' +
    'http://www.topografix.com/GPX/1/1/gpx.xsd';


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {ol.LayoutOptions} layoutOptions Layout options.
 * @param {Node} node Node.
 * @param {Object} values Values.
 * @private
 * @return {Array.<number>} Flat coordinates.
 */
_ol_format_GPX_.appendCoordinate_ = function(flatCoordinates, layoutOptions, node, values) {
  flatCoordinates.push(
      parseFloat(node.getAttribute('lon')),
      parseFloat(node.getAttribute('lat')));
  if ('ele' in values) {
    flatCoordinates.push(/** @type {number} */ (values['ele']));
    delete values['ele'];
    layoutOptions.hasZ = true;
  } else {
    flatCoordinates.push(0);
  }
  if ('time' in values) {
    flatCoordinates.push(/** @type {number} */ (values['time']));
    delete values['time'];
    layoutOptions.hasM = true;
  } else {
    flatCoordinates.push(0);
  }
  return flatCoordinates;
};


/**
 * Choose GeometryLayout based on flags in layoutOptions and adjust flatCoordinates
 * and ends arrays by shrinking them accordingly (removing unused zero entries).
 *
 * @param {ol.LayoutOptions} layoutOptions Layout options.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<number>=} ends Ends.
 * @return {ol.geom.GeometryLayout} Layout.
 */
_ol_format_GPX_.applyLayoutOptions_ = function(layoutOptions, flatCoordinates, ends) {
  var layout = _ol_geom_GeometryLayout_.XY;
  var stride = 2;
  if (layoutOptions.hasZ && layoutOptions.hasM) {
    layout = _ol_geom_GeometryLayout_.XYZM;
    stride = 4;
  } else if (layoutOptions.hasZ) {
    layout = _ol_geom_GeometryLayout_.XYZ;
    stride = 3;
  } else if (layoutOptions.hasM) {
    layout = _ol_geom_GeometryLayout_.XYM;
    stride = 3;
  }
  if (stride !== 4) {
    var i, ii;
    for (i = 0, ii = flatCoordinates.length / 4; i < ii; i++) {
      flatCoordinates[i * stride] = flatCoordinates[i * 4];
      flatCoordinates[i * stride + 1] = flatCoordinates[i * 4 + 1];
      if (layoutOptions.hasZ) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 2];
      }
      if (layoutOptions.hasM) {
        flatCoordinates[i * stride + 2] = flatCoordinates[i * 4 + 3];
      }
    }
    flatCoordinates.length = flatCoordinates.length / 4 * stride;
    if (ends) {
      for (i = 0, ii = ends.length; i < ii; i++) {
        ends[i] = ends[i] / 4 * stride;
      }
    }
  }
  return layout;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.parseLink_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var href = node.getAttribute('href');
  if (href !== null) {
    values['link'] = href;
  }
  _ol_xml_.parseNode(_ol_format_GPX_.LINK_PARSERS_, node, objectStack);
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.parseExtensions_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  values['extensionsNode_'] = node;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.parseRtePt_ = function(node, objectStack) {
  var values = _ol_xml_.pushParseAndPop(
      {}, _ol_format_GPX_.RTEPT_PARSERS_, node, objectStack);
  if (values) {
    var rteValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (rteValues['flatCoordinates']);
    var layoutOptions = /** @type {ol.LayoutOptions} */
        (rteValues['layoutOptions']);
    _ol_format_GPX_.appendCoordinate_(flatCoordinates, layoutOptions, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.parseTrkPt_ = function(node, objectStack) {
  var values = _ol_xml_.pushParseAndPop(
      {}, _ol_format_GPX_.TRKPT_PARSERS_, node, objectStack);
  if (values) {
    var trkValues = /** @type {Object} */ (objectStack[objectStack.length - 1]);
    var flatCoordinates = /** @type {Array.<number>} */
        (trkValues['flatCoordinates']);
    var layoutOptions = /** @type {ol.LayoutOptions} */
        (trkValues['layoutOptions']);
    _ol_format_GPX_.appendCoordinate_(flatCoordinates, layoutOptions, node, values);
  }
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.parseTrkSeg_ = function(node, objectStack) {
  var values = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  _ol_xml_.parseNode(_ol_format_GPX_.TRKSEG_PARSERS_, node, objectStack);
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
_ol_format_GPX_.readRte_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = _ol_xml_.pushParseAndPop({
    'flatCoordinates': [],
    'layoutOptions': {}
  }, _ol_format_GPX_.RTE_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  var layoutOptions = /** @type {ol.LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  var layout = _ol_format_GPX_.applyLayoutOptions_(layoutOptions, flatCoordinates);
  var geometry = new _ol_geom_LineString_(null);
  geometry.setFlatCoordinates(layout, flatCoordinates);
  _ol_format_Feature_.transformWithOptions(geometry, false, options);
  var feature = new _ol_Feature_(geometry);
  feature.setProperties(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Track.
 */
_ol_format_GPX_.readTrk_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = _ol_xml_.pushParseAndPop({
    'flatCoordinates': [],
    'ends': [],
    'layoutOptions': {}
  }, _ol_format_GPX_.TRK_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var flatCoordinates = /** @type {Array.<number>} */
      (values['flatCoordinates']);
  delete values['flatCoordinates'];
  var ends = /** @type {Array.<number>} */ (values['ends']);
  delete values['ends'];
  var layoutOptions = /** @type {ol.LayoutOptions} */ (values['layoutOptions']);
  delete values['layoutOptions'];
  var layout = _ol_format_GPX_.applyLayoutOptions_(layoutOptions, flatCoordinates, ends);
  var geometry = new _ol_geom_MultiLineString_(null);
  geometry.setFlatCoordinates(layout, flatCoordinates, ends);
  _ol_format_Feature_.transformWithOptions(geometry, false, options);
  var feature = new _ol_Feature_(geometry);
  feature.setProperties(values);
  return feature;
};


/**
 * @param {Node} node Node.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 * @return {ol.Feature|undefined} Waypoint.
 */
_ol_format_GPX_.readWpt_ = function(node, objectStack) {
  var options = /** @type {olx.format.ReadOptions} */ (objectStack[0]);
  var values = _ol_xml_.pushParseAndPop(
      {}, _ol_format_GPX_.WPT_PARSERS_, node, objectStack);
  if (!values) {
    return undefined;
  }
  var layoutOptions = /** @type {ol.LayoutOptions} */ ({});
  var coordinates = _ol_format_GPX_.appendCoordinate_([], layoutOptions, node, values);
  var layout = _ol_format_GPX_.applyLayoutOptions_(layoutOptions, coordinates);
  var geometry = new _ol_geom_Point_(coordinates, layout);
  _ol_format_Feature_.transformWithOptions(geometry, false, options);
  var feature = new _ol_Feature_(geometry);
  feature.setProperties(values);
  return feature;
};


/**
 * @const
 * @type {Object.<string, function(Node, Array.<*>): (ol.Feature|undefined)>}
 * @private
 */
_ol_format_GPX_.FEATURE_READER_ = {
  'rte': _ol_format_GPX_.readRte_,
  'trk': _ol_format_GPX_.readTrk_,
  'wpt': _ol_format_GPX_.readWpt_
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.GPX_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'rte': _ol_xml_.makeArrayPusher(_ol_format_GPX_.readRte_),
      'trk': _ol_xml_.makeArrayPusher(_ol_format_GPX_.readTrk_),
      'wpt': _ol_xml_.makeArrayPusher(_ol_format_GPX_.readWpt_)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.LINK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'text':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString, 'linkText'),
      'type':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString, 'linkType')
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.RTE_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'cmt': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'desc': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'src': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'link': _ol_format_GPX_.parseLink_,
      'number':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readNonNegativeInteger),
      'extensions': _ol_format_GPX_.parseExtensions_,
      'type': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'rtept': _ol_format_GPX_.parseRtePt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.RTEPT_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'ele': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'time': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.TRK_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'cmt': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'desc': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'src': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'link': _ol_format_GPX_.parseLink_,
      'number':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readNonNegativeInteger),
      'type': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'extensions': _ol_format_GPX_.parseExtensions_,
      'trkseg': _ol_format_GPX_.parseTrkSeg_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.TRKSEG_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'trkpt': _ol_format_GPX_.parseTrkPt_
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.TRKPT_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'ele': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'time': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDateTime)
    });


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlParser>>}
 * @private
 */
_ol_format_GPX_.WPT_PARSERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'ele': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'time': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDateTime),
      'magvar': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'geoidheight': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'name': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'cmt': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'desc': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'src': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'link': _ol_format_GPX_.parseLink_,
      'sym': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'type': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'fix': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readString),
      'sat': _ol_xml_.makeObjectPropertySetter(
          _ol_format_XSD_.readNonNegativeInteger),
      'hdop': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'vdop': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'pdop': _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'ageofdgpsdata':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readDecimal),
      'dgpsid':
          _ol_xml_.makeObjectPropertySetter(_ol_format_XSD_.readNonNegativeInteger),
      'extensions': _ol_format_GPX_.parseExtensions_
    });


/**
 * @param {Array.<ol.Feature>} features List of features.
 * @private
 */
_ol_format_GPX_.prototype.handleReadExtensions_ = function(features) {
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
 * Routes (`<rte>`) are converted into LineString geometries, and tracks (`<trk>`)
 * into MultiLineString. Any properties on route and track waypoints are ignored.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
_ol_format_GPX_.prototype.readFeature;


/**
 * @inheritDoc
 */
_ol_format_GPX_.prototype.readFeatureFromNode = function(node, opt_options) {
  if (!_ol_array_.includes(_ol_format_GPX_.NAMESPACE_URIS_, node.namespaceURI)) {
    return null;
  }
  var featureReader = _ol_format_GPX_.FEATURE_READER_[node.localName];
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
 * Routes (`<rte>`) are converted into LineString geometries, and tracks (`<trk>`)
 * into MultiLineString. Any properties on route and track waypoints are ignored.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_format_GPX_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_GPX_.prototype.readFeaturesFromNode = function(node, opt_options) {
  if (!_ol_array_.includes(_ol_format_GPX_.NAMESPACE_URIS_, node.namespaceURI)) {
    return [];
  }
  if (node.localName == 'gpx') {
    /** @type {Array.<ol.Feature>} */
    var features = _ol_xml_.pushParseAndPop([], _ol_format_GPX_.GPX_PARSERS_,
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
 * @api
 */
_ol_format_GPX_.prototype.readProjection;


/**
 * @param {Node} node Node.
 * @param {string} value Value for the link's `href` attribute.
 * @param {Array.<*>} objectStack Node stack.
 * @private
 */
_ol_format_GPX_.writeLink_ = function(node, value, objectStack) {
  node.setAttribute('href', value);
  var context = objectStack[objectStack.length - 1];
  var properties = context['properties'];
  var link = [
    properties['linkText'],
    properties['linkType']
  ];
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */ ({node: node}),
      _ol_format_GPX_.LINK_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      link, objectStack, _ol_format_GPX_.LINK_SEQUENCE_);
};


/**
 * @param {Node} node Node.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.writeWptType_ = function(node, coordinate, objectStack) {
  var context = objectStack[objectStack.length - 1];
  var parentNode = context.node;
  var namespaceURI = parentNode.namespaceURI;
  var properties = context['properties'];
  //FIXME Projection handling
  _ol_xml_.setAttributeNS(node, null, 'lat', coordinate[1]);
  _ol_xml_.setAttributeNS(node, null, 'lon', coordinate[0]);
  var geometryLayout = context['geometryLayout'];
  switch (geometryLayout) {
    case _ol_geom_GeometryLayout_.XYZM:
      if (coordinate[3] !== 0) {
        properties['time'] = coordinate[3];
      }
      // fall through
    case _ol_geom_GeometryLayout_.XYZ:
      if (coordinate[2] !== 0) {
        properties['ele'] = coordinate[2];
      }
      break;
    case _ol_geom_GeometryLayout_.XYM:
      if (coordinate[2] !== 0) {
        properties['time'] = coordinate[2];
      }
      break;
    default:
      // pass
  }
  var orderedKeys = (node.nodeName == 'rtept') ?
    _ol_format_GPX_.RTEPT_TYPE_SEQUENCE_[namespaceURI] :
    _ol_format_GPX_.WPT_TYPE_SEQUENCE_[namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      ({node: node, 'properties': properties}),
      _ol_format_GPX_.WPT_TYPE_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.writeRte_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var properties = feature.getProperties();
  var context = {node: node, 'properties': properties};
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.LineString} */
      (_ol_format_Feature_.transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    properties['rtept'] = geometry.getCoordinates();
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = _ol_format_GPX_.RTE_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_GPX_.RTE_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.writeTrk_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var properties = feature.getProperties();
  /** @type {ol.XmlNodeStackItem} */
  var context = {node: node, 'properties': properties};
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.MultiLineString} */
      (_ol_format_Feature_.transformWithOptions(geometry, true, options));
    properties['trkseg'] = geometry.getLineStrings();
  }
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = _ol_format_GPX_.TRK_SEQUENCE_[parentNode.namespaceURI];
  var values = _ol_xml_.makeSequence(properties, orderedKeys);
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_GPX_.TRK_SERIALIZERS_, _ol_xml_.OBJECT_PROPERTY_NODE_FACTORY,
      values, objectStack, orderedKeys);
};


/**
 * @param {Node} node Node.
 * @param {ol.geom.LineString} lineString LineString.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.writeTrkSeg_ = function(node, lineString, objectStack) {
  /** @type {ol.XmlNodeStackItem} */
  var context = {node: node, 'geometryLayout': lineString.getLayout(),
    'properties': {}};
  _ol_xml_.pushSerializeAndPop(context,
      _ol_format_GPX_.TRKSEG_SERIALIZERS_, _ol_format_GPX_.TRKSEG_NODE_FACTORY_,
      lineString.getCoordinates(), objectStack);
};


/**
 * @param {Node} node Node.
 * @param {ol.Feature} feature Feature.
 * @param {Array.<*>} objectStack Object stack.
 * @private
 */
_ol_format_GPX_.writeWpt_ = function(node, feature, objectStack) {
  var options = /** @type {olx.format.WriteOptions} */ (objectStack[0]);
  var context = objectStack[objectStack.length - 1];
  context['properties'] = feature.getProperties();
  var geometry = feature.getGeometry();
  if (geometry) {
    geometry = /** @type {ol.geom.Point} */
      (_ol_format_Feature_.transformWithOptions(geometry, true, options));
    context['geometryLayout'] = geometry.getLayout();
    _ol_format_GPX_.writeWptType_(node, geometry.getCoordinates(), objectStack);
  }
};


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
_ol_format_GPX_.LINK_SEQUENCE_ = ['text', 'type'];


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.LINK_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'text': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'type': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_GPX_.RTE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, [
      'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'rtept'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.RTE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'name': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'cmt': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'desc': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'src': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'link': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeLink_),
      'number': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeNonNegativeIntegerTextNode),
      'type': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'rtept': _ol_xml_.makeArraySerializer(_ol_xml_.makeChildAppender(
          _ol_format_GPX_.writeWptType_))
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_GPX_.RTEPT_TYPE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, [
      'ele', 'time'
    ]);


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_GPX_.TRK_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, [
      'name', 'cmt', 'desc', 'src', 'link', 'number', 'type', 'trkseg'
    ]);


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.TRK_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'name': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'cmt': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'desc': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'src': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'link': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeLink_),
      'number': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeNonNegativeIntegerTextNode),
      'type': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'trkseg': _ol_xml_.makeArraySerializer(_ol_xml_.makeChildAppender(
          _ol_format_GPX_.writeTrkSeg_))
    });


/**
 * @const
 * @type {function(*, Array.<*>, string=): (Node|undefined)}
 * @private
 */
_ol_format_GPX_.TRKSEG_NODE_FACTORY_ = _ol_xml_.makeSimpleNodeFactory('trkpt');


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.TRKSEG_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'trkpt': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeWptType_)
    });


/**
 * @const
 * @type {Object.<string, Array.<string>>}
 * @private
 */
_ol_format_GPX_.WPT_TYPE_SEQUENCE_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, [
      'ele', 'time', 'magvar', 'geoidheight', 'name', 'cmt', 'desc', 'src',
      'link', 'sym', 'type', 'fix', 'sat', 'hdop', 'vdop', 'pdop',
      'ageofdgpsdata', 'dgpsid'
    ]);


/**
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.WPT_TYPE_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'ele': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'time': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDateTimeTextNode),
      'magvar': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'geoidheight': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeDecimalTextNode),
      'name': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'cmt': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'desc': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'src': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'link': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeLink_),
      'sym': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'type': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'fix': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeStringTextNode),
      'sat': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeNonNegativeIntegerTextNode),
      'hdop': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'vdop': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'pdop': _ol_xml_.makeChildAppender(_ol_format_XSD_.writeDecimalTextNode),
      'ageofdgpsdata': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeDecimalTextNode),
      'dgpsid': _ol_xml_.makeChildAppender(
          _ol_format_XSD_.writeNonNegativeIntegerTextNode)
    });


/**
 * @const
 * @type {Object.<string, string>}
 * @private
 */
_ol_format_GPX_.GEOMETRY_TYPE_TO_NODENAME_ = {
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
_ol_format_GPX_.GPX_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var geometry = /** @type {ol.Feature} */ (value).getGeometry();
  if (geometry) {
    var nodeName = _ol_format_GPX_.GEOMETRY_TYPE_TO_NODENAME_[geometry.getType()];
    if (nodeName) {
      var parentNode = objectStack[objectStack.length - 1].node;
      return _ol_xml_.createElementNS(parentNode.namespaceURI, nodeName);
    }
  }
};


/**
 * @const
 * @type {Object.<string, Object.<string, ol.XmlSerializer>>}
 * @private
 */
_ol_format_GPX_.GPX_SERIALIZERS_ = _ol_xml_.makeStructureNS(
    _ol_format_GPX_.NAMESPACE_URIS_, {
      'rte': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeRte_),
      'trk': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeTrk_),
      'wpt': _ol_xml_.makeChildAppender(_ol_format_GPX_.writeWpt_)
    });


/**
 * Encode an array of features in the GPX format.
 * LineString geometries are output as routes (`<rte>`), and MultiLineString
 * as tracks (`<trk>`).
 *
 * @function
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Write options.
 * @return {string} Result.
 * @api
 */
_ol_format_GPX_.prototype.writeFeatures;


/**
 * Encode an array of features in the GPX format as an XML node.
 * LineString geometries are output as routes (`<rte>`), and MultiLineString
 * as tracks (`<trk>`).
 *
 * @param {Array.<ol.Feature>} features Features.
 * @param {olx.format.WriteOptions=} opt_options Options.
 * @return {Node} Node.
 * @override
 * @api
 */
_ol_format_GPX_.prototype.writeFeaturesNode = function(features, opt_options) {
  opt_options = this.adaptOptions(opt_options);
  //FIXME Serialize metadata
  var gpx = _ol_xml_.createElementNS('http://www.topografix.com/GPX/1/1', 'gpx');
  var xmlnsUri = 'http://www.w3.org/2000/xmlns/';
  var xmlSchemaInstanceUri = 'http://www.w3.org/2001/XMLSchema-instance';
  _ol_xml_.setAttributeNS(gpx, xmlnsUri, 'xmlns:xsi', xmlSchemaInstanceUri);
  _ol_xml_.setAttributeNS(gpx, xmlSchemaInstanceUri, 'xsi:schemaLocation',
      _ol_format_GPX_.SCHEMA_LOCATION_);
  gpx.setAttribute('version', '1.1');
  gpx.setAttribute('creator', 'OpenLayers');

  _ol_xml_.pushSerializeAndPop(/** @type {ol.XmlNodeStackItem} */
      ({node: gpx}), _ol_format_GPX_.GPX_SERIALIZERS_,
      _ol_format_GPX_.GPX_NODE_FACTORY_, features, [opt_options]);
  return gpx;
};
export default _ol_format_GPX_;
