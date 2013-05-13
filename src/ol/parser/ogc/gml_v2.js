goog.provide('ol.parser.ogc.GML_v2');

goog.require('goog.dom.xml');
goog.require('goog.object');
goog.require('ol.parser.ogc.GML');



/**
 * @constructor
 * @param {ol.parser.GML2Options=} opt_options Optional configuration object.
 * @extends {ol.parser.ogc.GML}
 */
ol.parser.ogc.GML_v2 = function(opt_options) {
  this.schemaLocation = 'http://www.opengis.net/gml ' +
      'http://schemas.opengis.net/gml/2.1.2/feature.xsd';
  goog.base(this, opt_options);
  goog.object.extend(this.readers['http://www.opengis.net/gml'], {
    'outerBoundaryIs': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container['outer'] = coordinates[0][0];
    },
    'innerBoundaryIs': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container.inner.push(coordinates[0][0]);
    },
    'Box': function(node, container) {
      var coordinates = [];
      this.readChildNodes(node, coordinates);
      container.bounds = [coordinates[0][0][0], coordinates[0][1][0],
        coordinates[0][0][1], coordinates[0][1][1]];
    }
  });
  goog.object.extend(this.writers['http://www.opengis.net/gml'], {
    'Point': function(geometry) {
      var node = this.createElementNS('gml:Point');
      this.writeNode('coordinates', [geometry.getCoordinates()], null, node);
      return node;
    },
    'coordinates': function(coordinates) {
      var numCoordinates = coordinates.length;
      var parts = new Array(numCoordinates);
      for (var i = 0; i < numCoordinates; ++i) {
        var coord = coordinates[i];
        var str = '';
        if (this.xy) {
          str += coord[0] + ',' + coord[1];
        } else {
          str += coord[1] + ',' + coord[0];
        }
        if (coord.length === 3) {
          str += ',' + coord[2];
        }
        parts[i] = str;
      }
      var value = (numCoordinates === 1) ? parts[0] : parts.join(' ');
      var node = this.createElementNS('gml:coordinates');
      this.setAttributeNS(node, null, 'decimal', '.');
      this.setAttributeNS(node, null, 'cs', ',');
      this.setAttributeNS(node, null, 'ts', ' ');
      node.appendChild(this.createTextNode(value));
      return node;
    },
    'LineString': function(geometry) {
      var node = this.createElementNS('gml:LineString');
      this.writeNode('coordinates', geometry.getCoordinates(), null, node);
      return node;
    },
    'Polygon': function(geometry) {
      var node = this.createElementNS('gml:Polygon');
      var coordinates = geometry.getCoordinates();
      this.writeNode('outerBoundaryIs', coordinates[0], null, node);
      for (var i = 1; i < coordinates.length; ++i) {
        this.writeNode('innerBoundaryIs', coordinates[i], null, node);
      }
      return node;
    },
    'outerBoundaryIs': function(ring) {
      var node = this.createElementNS('gml:outerBoundaryIs');
      this.writeNode('LinearRing', ring, null, node);
      return node;
    },
    'innerBoundaryIs': function(ring) {
      var node = this.createElementNS('gml:innerBoundaryIs');
      this.writeNode('LinearRing', ring, null, node);
      return node;
    },
    'LinearRing': function(ring) {
      var node = this.createElementNS('gml:LinearRing');
      this.writeNode('coordinates', ring, null, node);
      return node;
    },
    'Box': function(extent) {
      var node = this.createElementNS('gml:Box');
      this.writeNode('coordinates', [[extent.minX, extent.minY],
            [extent.maxX, extent.maxY]], null, node);
      // srsName attribute is optional for gml:Box
      if (goog.isDef(this.srsName)) {
        // TODO setAttribute or this.setAttributeNS
        node.setAttribute('srsName', this.srsName);
      }
      return node;
    }
  });
};
goog.inherits(ol.parser.ogc.GML_v2, ol.parser.ogc.GML);


/**
 * @param {Object} obj Object structure to write out as XML.
 * @return {string} An string representing the XML document.
 */
ol.parser.ogc.GML_v2.prototype.write = function(obj) {
  var root = this.writeNode('FeatureCollection', obj.features,
      'http://www.opengis.net/wfs');
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};
