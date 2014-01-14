goog.provide('ol.parser.ogc.Filter_v1');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.expr');
goog.require('ol.expr.Call');
goog.require('ol.expr.Comparison');
goog.require('ol.expr.ComparisonOp');
goog.require('ol.expr.Identifier');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.expr.Not');
goog.require('ol.expr.functions');
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
      _expression: function(node) {
        var expressions = [];
        var obj, value, numValue, expr;
        for (var child = node.firstChild; child; child = child.nextSibling) {
          switch (child.nodeType) {
            case 1:
              obj = this.readNode(child);
              if (obj.property) {
                expressions.push(obj.property);
              } else if (goog.isDef(obj.value)) {
                expressions.push(obj.value);
              }
              break;
            case 3: // text node
            case 4: // cdata section
              value = goog.string.trim(child.nodeValue);
              // no need to concatenate empty strings
              if (value) {
                // check for numeric values
                numValue = goog.string.toNumber(value);
                if (!isNaN(numValue)) {
                  value = numValue;
                }
                expressions.push(new ol.expr.Literal(value));
              }
              break;
            default:
              break;
          }
        }
        // if we have more than one property or literal, we concatenate them
        var num = expressions.length;
        if (num === 1) {
          expr = expressions[0];
        } else {
          expr = new ol.expr.Call(
              new ol.expr.Identifier(ol.expr.functions.CONCAT),
              expressions);
        }
        return expr;
      },
      'Filter': function(node, obj) {
        var container = {
          filters: []
        };
        this.readChildNodes(node, container);
        if (goog.isDef(container.fids)) {
          obj.filter = new ol.expr.Call(
              new ol.expr.Identifier(ol.expr.functions.FID),
              goog.object.getValues(container.fids));
        } else if (container.filters.length > 0) {
          obj.filter = container.filters[0];
        }
      },
      'FeatureId': function(node, obj) {
        var fid = node.getAttribute('fid');
        if (fid) {
          if (!goog.isDef(obj.fids)) {
            obj.fids = {};
          }
          if (!obj.fids.hasOwnProperty(fid)) {
            obj.fids[fid] = new ol.expr.Literal(fid);
          }
        }
      },
      'And': function(node, obj) {
        var container = {filters: []};
        this.readChildNodes(node, container);
        var filter = this.aggregateLogical_(container.filters,
            ol.expr.LogicalOp.AND);
        obj.filters.push(filter);
      },
      'Or': function(node, obj) {
        var container = {filters: []};
        this.readChildNodes(node, container);
        var filter = this.aggregateLogical_(container.filters,
            ol.expr.LogicalOp.OR);
        obj.filters.push(filter);
      },
      'Not': function(node, obj) {
        var container = {filters: []};
        this.readChildNodes(node, container);
        // Not is unary so can only contain 1 child filter
        obj.filters.push(new ol.expr.Not(
            container.filters[0]));
      },
      'PropertyIsNull': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Comparison(
            ol.expr.ComparisonOp.EQ,
            container.property,
            new ol.expr.Literal(null)));
      },
      'PropertyIsLessThan': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Comparison(
            ol.expr.ComparisonOp.LT,
            container.property,
            container.value));
      },
      'PropertyIsGreaterThan': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Comparison(
            ol.expr.ComparisonOp.GT,
            container.property,
            container.value));
      },
      'PropertyIsLessThanOrEqualTo': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Comparison(
            ol.expr.ComparisonOp.LTE,
            container.property,
            container.value));
      },
      'PropertyIsGreaterThanOrEqualTo': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Comparison(
            ol.expr.ComparisonOp.GTE,
            container.property,
            container.value));
      },
      'PropertyIsBetween': function(node, obj) {
        var container = {};
        this.readChildNodes(node, container);
        obj.filters.push(new ol.expr.Logical(ol.expr.LogicalOp.AND,
            new ol.expr.Comparison(ol.expr.ComparisonOp.GTE,
            container.property, container.lowerBoundary),
            new ol.expr.Comparison(ol.expr.ComparisonOp.LTE,
            container.property, container.upperBoundary)));
      },
      'Literal': function(node, obj) {
        var nodeValue = this.getChildValue(node);
        var value = goog.string.toNumber(nodeValue);
        obj.value = new ol.expr.Literal(isNaN(value) ? nodeValue : value);
      },
      'PropertyName': function(node, obj) {
        obj.property = new ol.expr.Identifier(this.getChildValue(node));
      },
      'LowerBoundary': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        obj.lowerBoundary = readers._expression.call(this, node);
      },
      'UpperBoundary': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        obj.upperBoundary = readers._expression.call(this, node);
      },
      _spatial: function(node, obj, identifier) {
        var args = [], container = {};
        this.readChildNodes(node, container);
        if (goog.isDef(container.geometry)) {
          args.push(new ol.expr.Literal(this.gmlParser_.createGeometry(
              container)));
        } else {
          args = [new ol.expr.Literal(container.bounds[0]),
                new ol.expr.Literal(container.bounds[1]),
                new ol.expr.Literal(container.bounds[2]),
                new ol.expr.Literal(container.bounds[3])];
        }
        if (goog.isDef(container.distance)) {
          args.push(container.distance);
        }
        if (goog.isDef(container.distanceUnits)) {
          args.push(container.distanceUnits);
        }
        args.push(new ol.expr.Literal(container.projection));
        if (goog.isDef(container.property)) {
          args.push(container.property);
        }
        obj.filters.push(new ol.expr.Call(new ol.expr.Identifier(
            identifier), args));
      },
      'BBOX': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers._spatial.call(this, node, obj,
            ol.expr.functions.EXTENT);
      },
      'Intersects': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers._spatial.call(this, node, obj,
            ol.expr.functions.INTERSECTS);
      },
      'Within': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers._spatial.call(this, node, obj,
            ol.expr.functions.WITHIN);
      },
      'Contains': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers._spatial.call(this, node, obj,
            ol.expr.functions.CONTAINS);
      },
      'DWithin': function(node, obj) {
        var readers = this.readers[this.defaultNamespaceURI];
        readers._spatial.call(this, node, obj,
            ol.expr.functions.DWITHIN);
      },
      'Distance': function(node, obj) {
        var value = goog.string.toNumber(this.getChildValue(node));
        obj.distance = new ol.expr.Literal(value);
        obj.distanceUnits = new ol.expr.Literal(node.getAttribute('units'));
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
        var args = filter.getArgs();
        for (var i = 0, ii = args.length; i < ii; i++) {
          goog.asserts.assert(args[i] instanceof ol.expr.Literal);
          this.writeNode('FeatureId', args[i].getValue(), null, node);
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
        var subFilters = [];
        this.getSubfiltersForLogical_(filter, subFilters);
        for (var i = 0, ii = subFilters.length; i < ii; ++i) {
          var subFilter = subFilters[i];
          if (goog.isDefAndNotNull(subFilter)) {
            this.writeNode(this.getFilterType_(subFilter), subFilter,
                null, node);
          }
        }
        return node;
      },
      'Or': function(filter) {
        var node = this.createElementNS('ogc:Or');
        var subFilters = [];
        this.getSubfiltersForLogical_(filter, subFilters);
        for (var i = 0, ii = subFilters.length; i < ii; ++i) {
          var subFilter = subFilters[i];
          if (goog.isDefAndNotNull(subFilter)) {
            this.writeNode(this.getFilterType_(subFilter), subFilter,
                null, node);
          }
        }
        return node;
      },
      'Not': function(filter) {
        var node = this.createElementNS('ogc:Not');
        var childFilter = filter.getArgument();
        this.writeNode(this.getFilterType_(childFilter), childFilter, null,
            node);
        return node;
      },
      'PropertyIsLessThan': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsLessThan');
        this.writeNode('PropertyName', filter.getLeft(), null, node);
        this.writeOgcExpression(filter.getRight(), node);
        return node;
      },
      'PropertyIsGreaterThan': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsGreaterThan');
        this.writeNode('PropertyName', filter.getLeft(), null, node);
        this.writeOgcExpression(filter.getRight(), node);
        return node;
      },
      'PropertyIsLessThanOrEqualTo': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsLessThanOrEqualTo');
        this.writeNode('PropertyName', filter.getLeft(), null, node);
        this.writeOgcExpression(filter.getRight(), node);
        return node;
      },
      'PropertyIsGreaterThanOrEqualTo': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsGreaterThanOrEqualTo');
        this.writeNode('PropertyName', filter.getLeft(), null, node);
        this.writeOgcExpression(filter.getRight(), node);
        return node;
      },
      'PropertyIsBetween': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsBetween');
        var property = filter.getLeft().getLeft();
        this.writeNode('PropertyName', property, null, node);
        var lower, upper;
        var filters = new Array(2);
        filters[0] = filter.getLeft();
        filters[1] = filter.getRight();
        for (var i = 0; i < 2; ++i) {
          var expr = filters[i].getRight();
          if (filters[i].getOperator() === ol.expr.ComparisonOp.GTE) {
            lower = expr;
          } else if (filters[i].getOperator() === ol.expr.ComparisonOp.LTE) {
            upper = expr;
          }
        }
        this.writeNode('LowerBoundary', lower, null, node);
        this.writeNode('UpperBoundary', upper, null, node);
        return node;
      },
      'PropertyName': function(expr) {
        goog.asserts.assert(expr instanceof ol.expr.Identifier);
        var node = this.createElementNS('ogc:PropertyName');
        node.appendChild(this.createTextNode(expr.getName()));
        return node;
      },
      'Literal': function(expr) {
        goog.asserts.assert(expr instanceof ol.expr.Literal);
        var node = this.createElementNS('ogc:Literal');
        node.appendChild(this.createTextNode(expr.getValue()));
        return node;
      },
      'LowerBoundary': function(expr) {
        var node = this.createElementNS('ogc:LowerBoundary');
        this.writeOgcExpression(expr, node);
        return node;
      },
      'UpperBoundary': function(expr) {
        var node = this.createElementNS('ogc:UpperBoundary');
        this.writeOgcExpression(expr, node);
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
        var args = filter.getArgs();
        goog.asserts.assert(args[2] instanceof ol.expr.Literal);
        node.setAttribute('units', args[2].getValue());
        goog.asserts.assert(args[1] instanceof ol.expr.Literal);
        node.appendChild(this.createTextNode(args[1].getValue()));
        return node;
      },
      'Function': function(filter) {
        var node = this.createElementNS('ogc:Function');
        node.setAttribute('name', filter.getCallee().getName());
        var params = filter.getArgs();
        for (var i = 0, len = params.length; i < len; i++) {
          this.writeOgcExpression(params[i], node);
        }
        return node;
      },
      'PropertyIsNull': function(filter) {
        var node = this.createElementNS('ogc:PropertyIsNull');
        this.writeNode('PropertyName', filter.getLeft(), null, node);
        return node;
      }
    }
  };
  goog.base(this);
};
goog.inherits(ol.parser.ogc.Filter_v1, ol.parser.XML);


/**
 * @private
 */
ol.parser.ogc.Filter_v1.filterMap_ = {
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
  'like': 'PropertyIsLike',
  'null': 'PropertyIsNull',
  'extent': 'BBOX',
  'dwithin': 'DWITHIN',
  'within': 'WITHIN',
  'contains': 'CONTAINS',
  'intersects': 'INTERSECTS',
  'fid': '_featureIds',
  'ieq': 'PropertyIsEqualTo',
  'ineq': 'PropertyIsNotEqualTo'
};


/**
 * @param {ol.expr.Expression} filter The filter to determine the type of.
 * @return {string} The type of filter.
 * @private
 */
ol.parser.ogc.Filter_v1.prototype.getFilterType_ = function(filter) {
  var type;
  if (filter instanceof ol.expr.Logical ||
      filter instanceof ol.expr.Comparison) {
    type = filter.getOperator();
    var left = filter.getLeft();
    var right = filter.getRight();
    var isNull = (type === ol.expr.ComparisonOp.EQ &&
        right instanceof ol.expr.Literal && right.getValue() === null);
    if (isNull) {
      type = 'null';
    }
    var isBetween = (type === ol.expr.LogicalOp.AND &&
        left instanceof ol.expr.Comparison &&
        right instanceof ol.expr.Comparison &&
        left.getLeft() instanceof ol.expr.Identifier &&
        right.getLeft() instanceof ol.expr.Identifier &&
        left.getLeft().getName() === right.getLeft().getName() &&
        (left.getOperator() === ol.expr.ComparisonOp.LTE ||
            left.getOperator() === ol.expr.ComparisonOp.GTE) &&
        (right.getOperator() === ol.expr.ComparisonOp.LTE ||
            right.getOperator() === ol.expr.ComparisonOp.GTE));
    if (isBetween) {
      type = '..';
    }
  } else if (filter instanceof ol.expr.Call) {
    var callee = filter.getCallee();
    goog.asserts.assert(callee instanceof ol.expr.Identifier);
    type = callee.getName();
  } else if (filter instanceof ol.expr.Not) {
    type = '!';
  }
  var filterType = ol.parser.ogc.Filter_v1.filterMap_[type];
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
  return obj.filter;
};


/**
 * @param {ol.expr.Expression} filter The filter to write out.
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
 * @param {ol.expr.Expression} expr The value write out.
 * @param {Element} node The node to append to.
 * @return {Element} The node to which was appended.
 * @protected
 */
ol.parser.ogc.Filter_v1.prototype.writeOgcExpression = function(expr, node) {
  if (expr instanceof ol.expr.Call) {
    if (ol.expr.isLibCall(expr) === ol.expr.functions.CONCAT) {
      var args = expr.getArgs();
      for (var i = 0, ii = args.length; i < ii; ++i) {
        this.writeOgcExpression(args[i], node);
      }
    } else {
      this.writeNode('Function', expr, null, node);
    }
  } else if (expr instanceof ol.expr.Literal) {
    this.writeNode('Literal', expr, null, node);
  } else if (expr instanceof ol.expr.Identifier) {
    this.writeNode('PropertyName', expr, null, node);
  }
  return node;
};


/**
 * @param {ol.expr.Logical} filter The filter to retrieve the sub filters from.
 * @param {Array.<ol.expr.Expression>} subFilters The sub filters retrieved.
 * @private
 */
ol.parser.ogc.Filter_v1.prototype.getSubfiltersForLogical_ = function(filter,
    subFilters) {
  var operator = filter.getOperator();
  var filters = new Array(2);
  filters[0] = filter.getLeft();
  filters[1] = filter.getRight();
  for (var i = 0; i < 2; ++i) {
    if (filters[i] instanceof ol.expr.Logical && filters[i].getOperator() ===
        operator) {
      this.getSubfiltersForLogical_(filters[i], subFilters);
    } else {
      subFilters.push(filters[i]);
    }
  }
};


/**
 * Since ol.expr.Logical can only have a left and a right, we need to nest
 * sub filters coming from OGC Filter.
 * @param {Array.<ol.expr.Expression>} filters The filters to aggregate.
 * @param {ol.expr.LogicalOp} operator The logical operator to use.
 * @return {ol.expr.Logical} The logical filter created.
 * @private
 */
ol.parser.ogc.Filter_v1.prototype.aggregateLogical_ = function(filters,
    operator) {
  var subFilters = [];
  var newFilters = [];
  // we only need to do this if we have more than 2 items
  if (filters.length > 2) {
    while (filters.length) {
      subFilters.push(filters.pop());
      if (subFilters.length === 2) {
        newFilters.push(new ol.expr.Logical(operator,
            subFilters[0], subFilters[1]));
        subFilters.length = 0;
      }
    }
    // there could be a single item left now
    if (subFilters.length === 1) {
      newFilters.push(subFilters[0]);
    }
    return this.aggregateLogical_(newFilters, operator);
  } else {
    return new ol.expr.Logical(operator, filters[0], filters[1]);
  }
};


/**
 * @return {ol.parser.ogc.GML_v2|ol.parser.ogc.GML_v3}
 */
ol.parser.ogc.Filter_v1.prototype.getGmlParser = function() {
  return this.gmlParser_;
};


/**
 * @param {ol.parser.ogc.GML_v2|ol.parser.ogc.GML_v3} gml The GML parser to
 *     use.
 * @protected
 */
ol.parser.ogc.Filter_v1.prototype.setGmlParser = function(gml) {
  this.gmlParser_ = gml;
  if (this.featureNS) {
    gml.setFeatureNS(this.featureNS);
  }
  for (var uri in this.gmlParser_.readers) {
    for (var key in this.gmlParser_.readers[uri]) {
      if (!goog.isDef(this.readers[uri])) {
        this.readers[uri] = {};
      }
      this.readers[uri][key] = goog.bind(this.gmlParser_.readers[uri][key],
          this.gmlParser_);
    }
  }
  for (uri in this.gmlParser_.writers) {
    for (key in this.gmlParser_.writers[uri]) {
      if (!goog.isDef(this.writers[uri])) {
        this.writers[uri] = {};
      }
      this.writers[uri][key] = goog.bind(this.gmlParser_.writers[uri][key],
          this.gmlParser_);
    }
  }
};


/**
 * @param {string} featureNS Feature namespace.
 */
ol.parser.ogc.Filter_v1.prototype.setFeatureNS = function(featureNS) {
  this.featureNS = featureNS;
  if (goog.isDefAndNotNull(this.gmlParser_)) {
    this.setGmlParser(this.gmlParser_);
  }
};


/**
 * @param {string} featureType Feature type.
 */
ol.parser.ogc.Filter_v1.prototype.setFeatureType = function(featureType) {
  this.featureType = featureType;
  if (goog.isDefAndNotNull(this.gmlParser_)) {
    this.gmlParser_.featureType = featureType;
  }
};


/**
 * @param {string} srsName SRS name.
 */
ol.parser.ogc.Filter_v1.prototype.setSrsName = function(srsName) {
  this.srsName = srsName;
  if (goog.isDefAndNotNull(this.gmlParser_)) {
    this.gmlParser_.applyWriteOptions({},
        /** @type {olx.parser.GMLWriteOptions} */ ({srsName: srsName}));
  }
};
