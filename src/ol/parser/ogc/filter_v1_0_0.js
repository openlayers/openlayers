goog.provide('ol.parser.ogc.Filter_v1_0_0');

goog.require('goog.object');
goog.require('ol.filter.Comparison');
goog.require('ol.filter.ComparisonType');
goog.require('ol.filter.Function');
goog.require('ol.geom.Geometry');
goog.require('ol.parser.ogc.Filter_v1');
goog.require('ol.parser.ogc.GML_v2');



/**
 * @constructor
 * @extends {ol.parser.ogc.Filter_v1}
 */
ol.parser.ogc.Filter_v1_0_0 = function() {
  goog.base(this);
  this.version = '1.0.0';
  this.schemaLocation = 'http://www.opengis.net/ogc ' +
      'http://schemas.opengis.net/filter/1.0.0/filter.xsd';
  goog.object.extend(this.readers['http://www.opengis.net/ogc'], {
    'PropertyIsEqualTo': function(node, obj) {
      var container = {};
      this.readChildNodes(node, container);
      obj['filters'].push(new ol.filter.Comparison({
        type: ol.filter.ComparisonType.EQUAL_TO,
        property: container['property'],
        value: container['value']
      }));
    },
    'PropertyIsNotEqualTo': function(node, obj) {
      var container = {};
      this.readChildNodes(node, container);
      obj['filters'].push(new ol.filter.Comparison({
        type: ol.filter.ComparisonType.NOT_EQUAL_TO,
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
      var esc = node.getAttribute('escape');
      filter.value2regex(wildCard, singleChar, esc);
      obj['filters'].push(filter);
    }
  });
  goog.object.extend(this.writers['http://www.opengis.net/ogc'], {
    'PropertyIsEqualTo': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsEqualTo');
      var property = filter.getProperty();
      if (goog.isDef(property)) {
        this.writeNode('PropertyName', property, null, node);
      }
      this.writeOgcExpression(filter.getValue(), node);
      return node;
    },
    'PropertyIsNotEqualTo': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsNotEqualTo');
      var property = filter.getProperty();
      if (goog.isDef(property)) {
        this.writeNode('PropertyName', property, null, node);
      }
      this.writeOgcExpression(filter.getValue(), node);
      return node;
    },
    'PropertyIsLike': function(filter) {
      var node = this.createElementNS('ogc:PropertyIsLike');
      node.setAttribute('wildCard', '*');
      node.setAttribute('singleChar', '.');
      node.setAttribute('escape', '!');
      var property = filter.getProperty();
      if (goog.isDef(property)) {
        this.writeNode('PropertyName', property, null, node);
      }
      // convert regex string to ogc string
      this.writeNode('Literal', filter.regex2value(), null, node);
      return node;
    },
    'BBOX': function(filter) {
      var node = this.createElementNS('ogc:BBOX');
      // PropertyName is mandatory in 1.0.0, but e.g. GeoServer also
      // accepts filters without it.
      var property = filter.getProperty();
      if (goog.isDef(property)) {
        this.writeNode('PropertyName', property, null, node);
      }
      var box = this.writeNode('Box', filter.getValue(),
          'http://www.opengis.net/gml', node);
      var projection = filter.getProjection();
      if (goog.isDef(projection)) {
        box.setAttribute('srsName', projection);
      }
      return node;
    }
  });
  this.setGmlParser(new ol.parser.ogc.GML_v2({featureNS: 'http://foo'}));
};
goog.inherits(ol.parser.ogc.Filter_v1_0_0,
    ol.parser.ogc.Filter_v1);


/**
 * @param {ol.filter.Spatial} filter The filter to write out.
 * @param {string} name The name of the spatial operator.
 * @return {Element} The node created.
 * @private
 */
ol.parser.ogc.Filter_v1_0_0.prototype.writeSpatial_ = function(filter, name) {
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
      child = this.writeNode('Box', filter.getValue(),
          'http://www.opengis.net/gml');
    }
    // TODO handle projection / srsName
    node.appendChild(child);
  }
  return node;
};
