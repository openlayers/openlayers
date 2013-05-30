goog.provide('ol.parser.ogc.Filter_v1_1_0');

goog.require('goog.object');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
goog.require('ol.filter.Function');
goog.require('ol.geom.Geometry');
goog.require('ol.parser.ogc.Filter_v1');
goog.require('ol.parser.ogc.GML_v3');



/**
 * @constructor
 * @extends {ol.parser.ogc.Filter_v1}
 */
ol.parser.ogc.Filter_v1_1_0 = function() {
  goog.base(this);
  this.version = '1.1.0';
  this.schemaLocation = 'http://www.opengis.net/ogc ' +
      'http://schemas.opengis.net/filter/1.1.0/filter.xsd';
  goog.object.extend(this.readers['http://www.opengis.net/ogc'], {
    'PropertyIsEqualTo': function(node, obj) {
      var matchCase = node.getAttribute('matchCase');
      var container = {};
      this.readChildNodes(node, container);
      obj['filters'].push(new ol.filter.Comparison({
        type: ol.filter.ComparisonType.EQUAL_TO,
        matchCase: !(matchCase === 'false' || matchCase === '0'),
        property: container['property'],
        value: container['value']
      }));
    },
    'PropertyIsNotEqualTo': function(node, obj) {
      var matchCase = node.getAttribute('matchCase');
      var container = {};
      this.readChildNodes(node, container);
      obj['filters'].push(new ol.filter.Comparison({
        type: ol.filter.ComparisonType.NOT_EQUAL_TO,
        matchCase: !(matchCase === 'false' || matchCase === '0'),
        property: container['property'],
        value: container['value']
      }));
    },
    'PropertyIsLike': function(node, obj) {
      var container = {};
      this.readChildNodes(node, container);
      var filter = new ol.filter.Comparison({
        type: ol.filter.ComparisonType.LIKE,
        property: container['property'],
        value: container['value']
      });
      var wildCard = node.getAttribute('wildCard');
      var singleChar = node.getAttribute('singleChar');
      var esc = node.getAttribute('escapeChar');
      filter.value2regex(wildCard, singleChar, esc);
      obj['filters'].push(filter);
    }
  });
  goog.object.extend(this.writers['http://www.opengis.net/ogc'], {
    'PropertyIsEqualTo': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsEqualTo');
      var matchCase = filter.getMatchCase();
      if (goog.isDef(matchCase)) {
        node.setAttribute('matchCase', matchCase);
      }
      this.writeNode('PropertyName', filter.getProperty(), null, node);
      this.writeOgcExpression(filter.getValue(), node);
      return node;
    },
    'PropertyIsNotEqualTo': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsNotEqualTo');
      var matchCase = filter.getMatchCase();
      if (goog.isDef(matchCase)) {
        node.setAttribute('matchCase', matchCase);
      }
      this.writeNode('PropertyName', filter.getProperty(), null, node);
      this.writeOgcExpression(filter.getValue(), node);
      return node;
    },
    'PropertyIsLike': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsLike');
      var matchCase = filter.getMatchCase();
      if (goog.isDef(matchCase)) {
        node.setAttribute('matchCase', matchCase);
      }
      node.setAttribute('wildCard', '*');
      node.setAttribute('singleChar', '.');
      node.setAttribute('escapeChar', '!');
      this.writeNode('PropertyName', filter.getProperty(), null, node);
      // convert regex string to ogc string
      this.writeNode('Literal', filter.regex2value(), null, node);
      return node;
    },
    'BBOX': function(filter) {
      var node = this.createElementNS('ogc:BBOX');
      // PropertyName is optional in 1.1.0
      if (goog.isDef(filter.getProperty())) {
        this.writeNode('PropertyName', filter.getProperty(), null, node);
      }
      var box = this.writeNode('Envelope', filter.getValue(),
          'http://www.opengis.net/gml');
      var projection = filter.getProjection();
      if (goog.isDef(projection)) {
        box.setAttribute('srsName', projection);
      }
      node.appendChild(box);
      return node;
    },
    'SortBy': function(sortProperties) {
      var node = this.createElementNS('ogc:SortBy');
      for (var i = 0, l = sortProperties.length; i < l; i++) {
        this.writeNode('SortProperty', sortProperties[i], null, node);
      }
      return node;
    },
    'SortProperty': function(sortProperty) {
      var node = this.createElementNS('ogc:SortProperty');
      this.writeNode('PropertyName', sortProperty['property'], null, node);
      this.writeNode('SortOrder',
          (sortProperty['order'] == 'DESC') ? 'DESC' : 'ASC', null, node);
      return node;
    },
    'SortOrder': function(value) {
      var node = this.createElementNS('ogc:SortOrder');
      node.appendChild(this.createTextNode(value));
      return node;
    }
  });
  this.setGmlParser(new ol.parser.ogc.GML_v3());
};
goog.inherits(ol.parser.ogc.Filter_v1_1_0,
    ol.parser.ogc.Filter_v1);


/**
 * @param {ol.filter.Spatial} filter The filter to write out.
 * @param {string} name The name of the spatial operator.
 * @return {Element} The node created.
 * @private
 */
ol.parser.ogc.Filter_v1_1_0.prototype.writeSpatial_ = function(filter, name) {
  var node = this.createElementNS('ogc:' + name);
  var property = filter.getProperty();
  if (goog.isDef(property)) {
    this.writeNode('PropertyName', property, null, node);
  }
  var value = filter.getValue();
  if (value instanceof ol.filter.Function) {
    this.writeNode('Function', value, null, node);
  } else {
    var child;
    if (filter.getValue() instanceof ol.geom.Geometry) {
      child = this.writeNode('_geometry', filter.getValue(),
          this.gml_.featureNS).firstChild;
    } else {
      child = this.writeNode('Envelope', filter.getValue(),
          'http://www.opengis.net/gml');
    }
    // TODO handle projection / srsName
    node.appendChild(child);
  }
  return node;
};
