goog.provide('ol.parser.ogc.Filter_v1');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
goog.require('ol.filter.FeatureId');
goog.require('ol.filter.Function');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.filter.Spatial');
goog.require('ol.filter.SpatialType');
goog.require('ol.parser.XML');



/**
 * @constructor
 * @extends {ol.parser.XML}
 */
ol.parser.ogc.Filter_v1 = function() {
  this.defaultNamespaceURI = 'http://www.opengis.net/ogc';
  this.errorProperty = 'filter';
  this.readers = {
    'http://www.opengis.net/ogc': {
      '_expression': function(node) {
        // only the simplest of ogc:expression handled
        // "some text and an <PropertyName>attribute</PropertyName>"
        var obj, value = '';
        for (var child = node.firstChild; child; child = child.nextSibling) {
          switch (child.nodeType) {
            case 1:
              obj = this.readNode(child);
              if (obj['property']) {
                value += obj['property'];
              } else if (goog.isDef(obj['value'])) {
                value += obj['value'];
              }
              break;
            case 3: // text node
            case 4: // cdata section
              value += child.nodeValue;
              break;
            default:
              break;
          }
        }
        return value;
      },
      'Filter': function(node, obj) {
        var container = {
          'filters': []
        };
        this.readChildNodes(node, container);
        if (goog.isDef(container['fids'])) {
          obj['filter'] = new ol.filter.FeatureId(container['fids']);
        } else if (container['filters'].length > 0) {
          obj['filter'] = container['filters'][0];
        }
      },
      'FeatureId': function(node, obj) {
        var fid = node.getAttribute('fid');
        if (fid) {
          if (!goog.isDef(obj['fids'])) {
            obj['fids'] = {};
          }
          obj['fids'][fid] = true;
        }
      },
      'And': function(node, obj) {
        var container = {'filters': []};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Logical(container['filters'],
            ol.filter.LogicalOperator.AND));
      },
      'Or': function(node, obj) {
        var container = {'filters': []};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Logical(container['filters'],
            ol.filter.LogicalOperator.OR));
      },
      'Not': function(node, obj) {
        var container = {'filters': []};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Logical(container['filters'],
            ol.filter.LogicalOperator.NOT));
      },
      'PropertyIsNull': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.IS_NULL,
          property: container['property']
        }));
      },
      'PropertyIsLessThan': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.LESS_THAN,
          property: container['property'],
          value: container['value']
        }));
      },
      'PropertyIsGreaterThan': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.GREATER_THAN,
          property: container['property'],
          value: container['value']
        }));
      },
      'PropertyIsLessThanOrEqualTo': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.LESS_THAN_OR_EQUAL_TO,
          property: container['property'],
          value: container['value']
        }));
      },
      'PropertyIsGreaterThanOrEqualTo': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.GREATER_THAN_OR_EQUAL_TO,
          property: container['property'],
          value: container['value']
        }));
      },
      'PropertyIsBetween': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj['filters'].push(new ol.filter.Comparison({
          type: ol.filter.ComparisonType.BETWEEN,
          property: container['property'],
          lowerBoundary: container['lowerBoundary'],
          upperBoundary: container['upperBoundary']
        }));
      },
      'Literal': function(node, obj) {
        var nodeValue = this.getChildValue(node);
        var value = goog.string.toNumber(nodeValue);
        obj['value'] = isNaN(value) ? nodeValue : value;
      },
      'PropertyName': function(node, obj) {
        obj['property'] = this.getChildValue(node);
      },
      'LowerBoundary': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        obj['lowerBoundary'] = goog.string.toNumber(
            readers['_expression'].call(this, node));
      },
      'UpperBoundary': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        obj['upperBoundary'] = goog.string.toNumber(
            readers['_expression'].call(this, node));
      },
      '_spatial': function(node, obj, type) {
        var container = {};
        this.readChildNodes(node, container);
        var geom = goog.isDef(container.geometry) ?
            this.gml_.createGeometry(container) : container.bounds;
        container.value = geom;
        container.type = type;
        delete container.geometry;
        obj['filters'].push(new ol.filter.Spatial(
            /** {ol.filter.SpatialOptions} */(container)));
      },
      'BBOX': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['_spatial'].call(this, node, obj,
            ol.filter.SpatialType.BBOX);
      },
      'Intersects': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['_spatial'].call(this, node, obj,
            ol.filter.SpatialType.INTERSECTS);
      },
      'Within': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['_spatial'].call(this, node, obj,
            ol.filter.SpatialType.WITHIN);
      },
      'Contains': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['_spatial'].call(this, node, obj,
            ol.filter.SpatialType.CONTAINS);
      },
      'DWithin': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers['_spatial'].call(this, node, obj,
            ol.filter.SpatialType.DWITHIN);
      },
      'Distance': function(node, obj) {
        obj['distance'] = parseInt(this.getChildValue(node), 10);
        obj['distanceUnits'] = node.getAttribute('units');
      }
    }
  };
  this.writers = {
    'http://www.opengis.net/ogc': {
      'Filter': function(filter) {
        var node = this.createElementNS('ogc:Filter');
        this.writeNode(this.getFilterType_(filter), filter, null, node);
        return node;
      },
      '_featureIds': function(filter) {
        var node = this.createDocumentFragment();
        var fids = filter.getFids();
        for (var key in fids) {
          this.writeNode('FeatureId', key, null, node);
        }
        return node;
      },
      'FeatureId': function(fid) {
        var node = this.createElementNS('ogc:FeatureId');
        node.setAttribute('fid', fid);
        return node;
      },
      'And': function(filter) {
        var node = this.createElementNS('ogc:And');
        var childFilter;
        for (var i = 0, ii = filter.getFilters().length; i < ii; ++i) {
          childFilter = filter.getFilters()[i];
          this.writeNode(this.getFilterType_(childFilter), childFilter, null,
              node);
        }
        return node;
      },
      'Or': function(filter) {
        var node = this.createElementNS('ogc:Or');
        var childFilter;
        for (var i = 0, ii = filter.getFilters().length; i < ii; ++i) {
          childFilter = filter.getFilters()[i];
          this.writeNode(this.getFilterType_(childFilter), childFilter, null,
              node);
        }
        return node;
      },
      'Not': function(filter) {
        var node = this.createElementNS('ogc:Not');
        var childFilter = filter.getFilters()[0];
        this.writeNode(this.getFilterType_(childFilter), childFilter, null,
            node);
        return node;
      },
      'PropertyIsLessThan': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsLessThan');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        this.writeOgcExpression(filter.getValue(), node);
        return node;
      },
      'PropertyIsGreaterThan': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsGreaterThan');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        this.writeOgcExpression(filter.getValue(), node);
        return node;
      },
      'PropertyIsLessThanOrEqualTo': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsLessThanOrEqualTo');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        this.writeOgcExpression(filter.getValue(), node);
        return node;
      },
      'PropertyIsGreaterThanOrEqualTo': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsGreaterThanOrEqualTo');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        this.writeOgcExpression(filter.getValue(), node);
        return node;
      },
      'PropertyIsBetween': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsBetween');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        this.writeNode('LowerBoundary', filter, null, node);
        this.writeNode('UpperBoundary', filter, null, node);
        return node;
      },
      'PropertyName': function(name) {
        var node = this.createElementNS('ogc:PropertyName');
        node.appendChild(this.createTextNode(name));
        return node;
      },
      'Literal': function(value) {
        if (value instanceof Date) {
          value = value.toISOString();
        }
        var node = this.createElementNS('ogc:Literal');
        node.appendChild(this.createTextNode(value));
        return node;
      },
      'LowerBoundary': function(filter) {
        var node = this.createElementNS('ogc:LowerBoundary');
        this.writeOgcExpression(filter.getLowerBoundary(), node);
        return node;
      },
      'UpperBoundary': function(filter) {
        var node = this.createElementNS('ogc:UpperBoundary');
        this.writeOgcExpression(filter.getUpperBoundary(), node);
        return node;
      },
      'INTERSECTS': function(filter) {
        return this.writeSpatial_(filter, 'Intersects');
      },
      'WITHIN': function(filter) {
        return this.writeSpatial_(filter, 'Within');
      },
      'CONTAINS': function(filter) {
        return this.writeSpatial_(filter, 'Contains');
      },
      'DWITHIN': function(filter) {
        var node = this.writeSpatial_(filter, 'DWithin');
        this.writeNode('Distance', filter, null, node);
        return node;
      },
      'Distance': function(filter) {
        var node = this.createElementNS('ogc:Distance');
        node.setAttribute('units', filter.getDistanceUnits());
        node.appendChild(this.createTextNode(filter.getDistance()));
        return node;
      },
      'Function': function(filter) {
        var node = this.createElementNS('ogc:Function');
        node.setAttribute('name', filter.getName());
        var params = filter.getParams();
        for (var i = 0, len = params.length; i < len; i++) {
          this.writeOgcExpression(params[i], node);
        }
        return node;
      },
      'PropertyIsNull': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsNull');
        this.writeNode('PropertyName', filter.getProperty(), null, node);
        return node;
      }
    }
  };
  this.filterMap_ = {
    '&&': 'And',
    '||': 'Or',
    '!': 'Not',
    '==': 'PropertyIsEqualTo',
    '!=': 'PropertyIsNotEqualTo',
    '<': 'PropertyIsLessThan',
    '>': 'PropertyIsGreaterThan',
    '<=': 'PropertyIsLessThanOrEqualTo',
    '>=': 'PropertyIsGreaterThanOrEqualTo',
    '..': 'PropertyIsBetween',
    '~': 'PropertyIsLike',
    'NULL': 'PropertyIsNull',
    'BBOX': 'BBOX',
    'DWITHIN': 'DWITHIN',
    'WITHIN': 'WITHIN',
    'CONTAINS': 'CONTAINS',
    'INTERSECTS': 'INTERSECTS',
    'FID': '_featureIds'
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.Filter_v1, ol.parser.XML);


/**
 * @param {ol.filter.Filter} filter The filter to determine the type of.
 * @return {string} The type of filter.
 * @private
 */
ol.parser.ogc.Filter_v1.prototype.getFilterType_ = function(filter) {
  var type;
  if (filter instanceof ol.filter.Logical) {
    type = filter.operator;
  } else if (filter instanceof ol.filter.FeatureId) {
    type = 'FID';
  } else if (filter instanceof ol.filter.Spatial ||
      filter instanceof ol.filter.Comparison) {
    type = filter.getType();
  }
  var filterType = this.filterMap_[type];
  if (!filterType) {
    throw new Error('Filter writing not supported for rule type: ' + type);
  }
  return filterType;
};


/**
 * @param {string|Document|Element} data Data to read.
 * @return {Object} An object representing the document.
 */
ol.parser.ogc.Filter_v1.prototype.read = function(data) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = {};
  this.readNode(data, obj);
  return obj['filter'];
};


/**
 * @param {ol.filter.Filter} filter The filter to write out.
 * @return {string} The serialized filter.
 */
ol.parser.ogc.Filter_v1.prototype.write = function(filter) {
  var root = this.writeNode('Filter', filter);
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};


/**
 * @param {ol.filter.Function|string|number} value The value write out.
 * @param {Element} node The node to append to.
 * @return {Element} The node to which was appended.
 * @protected
 */
ol.parser.ogc.Filter_v1.prototype.writeOgcExpression = function(value, node) {
  if (value instanceof ol.filter.Function) {
    this.writeNode('Function', value, null, node);
  } else {
    this.writeNode('Literal', value, null, node);
  }
  return node;
};


/**
 * @param {ol.parser.ogc.GML_v2|ol.parser.ogc.GML_v3} gml The GML parser to
 *     use.
 * @protected
 */
ol.parser.ogc.Filter_v1.prototype.setGmlParser = function(gml) {
  this.gml_ = gml;
  for (var uri in this.gml_.readers) {
    for (var key in this.gml_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      this.readers[uri][key] = goog.bind(this.gml_.readers[uri][key],
          this.gml_);
    }
  }
  for (uri in this.gml_.writers) {
    for (key in this.gml_.writers[uri]) {
      if (!goog.isDef(this.writers[uri])) {
        this.writers[uri] = {};
      }
      this.writers[uri][key] = goog.bind(this.gml_.writers[uri][key],
          this.gml_);
    }
  }
};
