goog.provide('ol.parser.KML');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.date');
goog.require('goog.dispose');
goog.require('goog.dom.xml');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.AsyncObjectFeatureParser');
goog.require('ol.parser.AsyncStringFeatureParser');
goog.require('ol.parser.DomFeatureParser');
goog.require('ol.parser.StringFeatureParser');
goog.require('ol.parser.XML');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');



/**
 * Read and write [KML](http://www.opengeospatial.org/standards/kml)
 * version 2.2
 *
 * @constructor
 * @implements {ol.parser.DomFeatureParser}
 * @implements {ol.parser.StringFeatureParser}
 * @implements {ol.parser.AsyncObjectFeatureParser}
 * @implements {ol.parser.AsyncStringFeatureParser}
 * @param {ol.parser.KMLOptions=} opt_options Optional configuration object.
 * @extends {ol.parser.XML}
 * @todo stability experimental
 */
ol.parser.KML = function(opt_options) {
  var options = /** @type {ol.parser.KMLOptions} */
      (goog.isDef(opt_options) ? opt_options : {});
  this.extractAttributes = goog.isDef(options.extractAttributes) ?
      options.extractAttributes : true;
  this.extractStyles = goog.isDef(options.extractStyles) ?
      options.extractStyles : false;
  this.schemaLocation = 'http://www.opengis.net/kml/2.2 ' +
      'http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd';
  this.maxDepth = goog.isDef(options.maxDepth) ? options.maxDepth : 0;
  this.trackAttributes = goog.isDef(options.trackAttributes) ?
      options.trackAttributes : null;

  this.defaultNamespaceURI = 'http://www.opengis.net/kml/2.2';
  this.readers = {
    'http://www.opengis.net/kml/2.2': {
      'kml': function(node, obj) {
        if (!goog.isDef(obj.features)) {
          obj.features = [];
        }
        if (!goog.isDef(obj.links)) {
          obj.links = [];
        }
        this.readChildNodes(node, obj);
      },
      'Document': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      '*': function(node, obj) {
        if (this.extractAttributes === true) {
          var len = node.childNodes.length;
          if ((len === 1 || len === 2) && (node.firstChild.nodeType === 3 ||
              node.firstChild.nodeType === 4)) {
            var readers = this.readers[this.defaultNamespaceURI];
            readers['_attribute'].apply(this, arguments);
          }
        }
      },
      'NetworkLink': function(node, obj) {
        var link = {};
        this.readChildNodes(node, link);
        obj.links.push(link);
      },
      'Link': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      '_attribute': function(node, obj) {
        var local = node.localName || node.nodeName.split(':').pop();
        var value = this.getChildValue(node);
        if (obj.properties) {
          obj.properties[local] = value.replace(this.regExes.trimSpace, '');
        } else {
          obj[local] = value.replace(this.regExes.trimSpace, '');
        }
      },
      'Placemark': function(node, obj) {
        var container = {properties: {}};
        var id = node.getAttribute('id');
        this.readChildNodes(node, container);
        if (goog.isDef(container.track)) {
          var track = container.track, j, jj;
          delete container.track;
          for (var i = 0, ii = track.whens.length; i < ii; ++i) {
            if (this.trackAttributes) {
              for (j = 0, jj = this.trackAttributes.length; j < jj; ++j) {
                var name = this.trackAttributes[j];
                container.properties[name] = track.attributes[name][i];
              }
            }
            container.properties['when'] = track.whens[i];
            if (goog.isDef(track.angles[i])) {
              container.properties['heading'] = parseFloat(track.angles[i][0]);
              container.properties['tilt'] = parseFloat(track.angles[i][1]);
              container.properties['roll'] = parseFloat(track.angles[i][2]);
            }
            if (track.points[i].coordinates.length === 3) {
              container.properties['altitude'] = track.points[i].coordinates[2];
            }
            var feature = new ol.Feature(container.properties);
            if (!goog.isNull(id)) {
              feature.setId(id);
            }
            var geom = track.points[i];
            if (geom) {
              var geometry = this.createGeometry_({geometry: geom});
              if (goog.isDef(geometry)) {
                feature.setGeometry(geometry);
              }
            }
            obj.features.push(feature);
          }
        } else if (goog.isDef(container.geometry)) {
          this.parseStyleUrl(obj, container.properties['styleUrl']);

          feature = new ol.Feature(container.properties);
          if (!goog.isNull(id)) {
            feature.setId(id);
          }
          if (container.geometry) {
            geometry = this.createGeometry_(container);
            if (goog.isDef(geometry)) {
              feature.setGeometry(geometry);
            }
          }
          var symbolizers = undefined;
          if (goog.isDef(container['styles'])) {
            symbolizers = container['styles'][0]['symbolizers'];

          } else if (goog.isDef(container['styleMaps'])) {
            var styleMap = container['styleMaps'][0];
            for (var i = 0, ii = styleMap['pairs'].length; i < ii; i++) {
              var pair = styleMap['pairs'][i];
              if (pair.key === 'normal') {
                if (goog.isDef(pair['styleUrl'])) {
                  this.parseStyleUrl(obj, pair['styleUrl']);
                  feature.set('styleUrl', pair['styleUrl']);
                } else if (goog.isDef(pair['styles'])) {
                  symbolizers = pair['styles'][0]['symbolizers'];
                }
              }
            }
          }

          this.applyStyle_(feature, obj['styles'], obj['styleMaps'],
              symbolizers);
          obj.features.push(feature);
        }
      },
      'MultiGeometry': function(node, container) {
        var parts = [];
        this.readChildNodes(node, parts);
        var buckets = goog.array.bucket(parts, function(val) {
          return val.type;
        });
        var obj = {};
        if (goog.object.getCount(buckets) === 1) {
          // homogeneous collection
          var type = goog.object.getAnyKey(buckets);
          switch (type) {
            case ol.geom.GeometryType.POINT:
              obj.geometry = {
                type: ol.geom.GeometryType.MULTIPOINT,
                parts: parts
              };
              break;
            case ol.geom.GeometryType.LINESTRING:
              obj.geometry = {
                type: ol.geom.GeometryType.MULTILINESTRING,
                parts: parts
              };
              break;
            case ol.geom.GeometryType.POLYGON:
              obj.geometry = {
                type: ol.geom.GeometryType.MULTIPOLYGON,
                parts: parts
              };
              break;
            default:
              break;
          }
        } else {
          // mixed collection
          obj.geometry = {
            type: ol.geom.GeometryType.GEOMETRYCOLLECTION,
            parts: parts
          };
        }
        if (goog.isArray(container)) {
          // MultiGeometry nested inside another
          container.push(obj.geometry);
        } else {
          container.geometry = obj.geometry;
        }
      },
      'Point': function(node, container) {
        var coordinates = [];
        this.readChildNodes(node, coordinates);
        var point = {
          type: ol.geom.GeometryType.POINT,
          coordinates: coordinates[0][0]
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(point);
        } else {
          container.geometry = point;
        }
      },
      'Polygon': function(node, container) {
        var coordinates = [];
        this.readChildNodes(node, coordinates);
        var polygon = {
          type: ol.geom.GeometryType.POLYGON,
          coordinates: coordinates
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(polygon);
        } else {
          container.geometry = polygon;
        }
      },
      'LineString': function(node, container) {
        var coordinates = [];
        this.readChildNodes(node, coordinates);
        var linestring = {
          type: ol.geom.GeometryType.LINESTRING,
          coordinates: coordinates[0]
        };
        // in the case of a multi geometry this is parts
        if (goog.isArray(container)) {
          container.push(linestring);
        } else {
          container.geometry = linestring;
        }
      },
      'outerBoundaryIs': function(node, coordinates) {
        this.readChildNodes(node, coordinates);
      },
      'LinearRing': function(node, coordinates) {
        this.readChildNodes(node, coordinates);
      },
      'coordinates': function(node, coordinates) {
        var coordstr = this.getChildValue(node);
        var reg = this.regExes;
        var coords = coordstr.replace(reg.trimSpace, '').split(reg.splitSpace);
        var coordArray = [];
        for (var i = 0, ii = coords.length; i < ii; i++) {
          var array = coords[i].replace(reg.removeSpace, '').split(',');
          var pair = [];
          for (var j = 0, jj = array.length; j < jj; j++) {
            pair.push(parseFloat(array[j]));
          }
          coordArray.push(pair);
        }
        coordinates.push(coordArray);
      },
      'innerBoundaryIs': function(node, coordinates) {
        this.readChildNodes(node, coordinates);
      },
      'Folder': function(node, obj) {
        this.readChildNodes(node, obj);
      },
      'ExtendedData': function(node, container) {
        this.readChildNodes(node, container.properties);
      },
      'SchemaData': function(node, attributes) {
        this.readChildNodes(node, attributes);
      },
      'SimpleData': function(node, attributes) {
        attributes[node.getAttribute('name')] = this.getChildValue(node);
      },
      'Data': function(node, attributes) {
        var data = {};
        this.readChildNodes(node, data);
        attributes[node.getAttribute('name')] = data['value'];
      },
      'when': function(node, container) {
        var value = this.getChildValue(node);
        var split1 = value.split('T');
        if (split1.length === 2) {
          var split2 = split1[1].split('-');
          if (split2.length === 2) {
            value += ':00';
          }
        }
        var date = goog.date.fromIsoString(value);
        if (!goog.isNull(date)) {
          /**
           * Older Closure Library did not provide a date property on
           * goog.date.DateTime.  When we get rid of Plovr, this can be
           * simplified to use the date property.
           */
          date = new Date(date.getTime());
        }
        container.whens.push(date);
      },
      '_trackPointAttribute': function(node, container) {
        var name = node.nodeName.split(':').pop();
        container.attributes[name].push(this.getChildValue(node));
      },
      'StyleMap': function(node, obj) {
        if (this.extractStyles === true) {
          if (!obj['styleMaps']) {
            obj['styleMaps'] = [];
          }
          var styleMap = {'pairs': []};
          var id = node.getAttribute('id');
          if (!goog.isNull(id)) {
            styleMap['id'] = id;
          }
          this.readChildNodes(node, styleMap);
          obj['styleMaps'].push(styleMap);
        }
      },
      'Pair': function(node, obj) {
        var pair = {};
        var id = node.getAttribute('id');
        if (!goog.isNull(id)) {
          pair['id'] = id;
        }
        this.readChildNodes(node, pair);
        obj['pairs'].push(pair);
      },
      'Style': function(node, obj) {
        if (this.extractStyles === true) {
          if (!obj['styles']) {
            obj['styles'] = [];
          }
          var style = {'symbolizers': [], 'ids': []};
          var id = node.getAttribute('id');
          if (!goog.isNull(id)) {
            style['id'] = id;
          }
          this.readChildNodes(node, style);
          obj['styles'].push(style);
        }
      },
      'LineStyle': function(node, obj) {
        var style = {}; // from KML
        var options = {}; // for ol.style.Stroke
        this.readChildNodes(node, style);
        if (style.color) {
          options.color = style.color.color;
          options.opacity = style.color.opacity;
        }
        if (style.width) {
          options.width = parseFloat(style.width);
        }
        obj['ids'].push(node.getAttribute('id'));
        obj['symbolizers'].push(new ol.style.Stroke(options));
      },
      'PolyStyle': function(node, obj) {
        var style = {}; // from KML
        var options = {}; // for ol.style.Fill
        this.readChildNodes(node, style);
        // check if poly has fill
        if (!(style.fill === '0' || style.fill === 'false')) {
          if (style.color) {
            options.color = style.color.color;
            options.opacity = style.color.opacity;
          } else {
            // KML defaults
            options.color = '#ffffff';
            options.opacity = 1;
          }
          obj['symbolizers'].push(new ol.style.Fill(options));
        }
        // check if poly has stroke
        if (!(style.outline === '0' || style.outline === 'false')) {
          if (style.color) {
            options.color = style.color.color;
            options.opacity = style.color.opacity;
          } else {
            // KML defaults
            options.color = '#ffffff';
            options.opacity = 1;
          }
          obj['symbolizers'].push(new ol.style.Stroke(options));
        }
        obj['ids'].push(node.getAttribute('id'));
      },
      'fill': function(node, obj) {
        obj.fill = this.getChildValue(node);
      },
      'outline': function(node, obj) {
        obj.outline = this.getChildValue(node);
      },
      'scale': function(node, obj) {
        obj.scale = parseFloat(this.getChildValue(node));
      },
      'Icon': function(node, obj) {
        obj.icon = {};
        this.readChildNodes(node, obj.icon);
      },
      'href': function(node, obj) {
        obj.href = this.getChildValue(node);
      },
      'w': function(node, obj) {
        obj.w = this.getChildValue(node);
      },
      'h': function(node, obj) {
        obj.h = this.getChildValue(node);
      },
      'x': function(node, obj) {
        obj.x = this.getChildValue(node);
      },
      'y': function(node, obj) {
        obj.y = this.getChildValue(node);
      },
      'hotSpot': function(node, obj) {
        obj.hotSpot = {
          x: parseFloat(node.getAttribute('x')),
          y: parseFloat(node.getAttribute('y')),
          xunits: node.getAttribute('xunits'),
          yunits: node.getAttribute('yunits')
        };
      },
      'IconStyle': function(node, obj) {
        var style = {}; // from KML
        var options = {}; // for ol.style.Icon
        this.readChildNodes(node, style);
        var scale = style.scale || 1;
        // set default width and height of icon
        var width = 32 * scale;
        var height = 32 * scale;
        var x, y;
        if (goog.isDef(style.icon)) {
          var href = style.icon.href;
          if (goog.isDef(href)) {
            var w = style.icon.w;
            var h = style.icon.h;
            // Settings for Google specific icons that are 64x64
            // We set the width and height to 64 and halve the
            // scale to prevent icons from being too big
            var google = 'http://maps.google.com/mapfiles/kml';
            if (goog.string.startsWith(href, google) && !goog.isDef(w) &&
                !goog.isDef(h)) {
              w = 64;
              h = 64;
              scale = scale / 2;
            }
            // if only dimension is defined, make sure the
            // other one has the same value
            w = w || h;
            h = h || w;
            if (w) {
              width = parseInt(w, 10) * scale;
            }
            if (h) {
              height = parseInt(h, 10) * scale;
            }
            // support for internal icons
            //    (/root://icons/palette-x.png)
            // x and y tell the position on the palette:
            // - in pixels
            // - starting from the left bottom
            // We translate that to a position in the list
            // and request the appropriate icon from the
            // google maps website
            var matches = href.match(this.regExes.kmlIconPalette);
            if (matches) {
              var palette = matches[1];
              var file_extension = matches[2];
              x = style.icon.x;
              y = style.icon.y;
              var posX = x ? x / 32 : 0;
              var posY = y ? (7 - y / 32) : 7;
              var pos = posY * 8 + posX;
              href = 'http://maps.google.com/mapfiles/kml/pal' +
                  palette + '/icon' + pos + file_extension;
            }
            options.opacity = 1;
            options.url = href;
          }
        }
        if (goog.isDef(style.hotSpot)) {
          x = style.hotSpot.x;
          y = style.hotSpot.y;
          var xUnits = style.hotSpot.xunits,
              yUnits = style.hotSpot.yunits;
          if (xUnits === 'pixels') {
            options.xOffset = -x * scale;
          } else if (xUnits === 'insetPixels') {
            options.xOffset = -width + (x * scale);
          } else if (xUnits === 'fraction') {
            options.xOffset = -width * x;
          }
          if (yUnits == 'pixels') {
            options.yOffset = -height + (y * scale) + 1;
          } else if (yUnits == 'insetPixels') {
            options.yOffset = -(y * scale) + 1;
          } else if (yUnits == 'fraction') {
            options.yOffset = -height * (1 - y) + 1;
          }
        }
        options.width = width;
        options.height = height;
        obj['ids'].push(node.getAttribute('id'));
        obj['symbolizers'].push(new ol.style.Icon(options));
      },
      'color': function(node, obj) {
        var kmlColor = this.getChildValue(node);
        if (kmlColor) {
          var matches = kmlColor.match(this.regExes.kmlColor);
          if (matches) {
            obj.color = {
              color: '#' + matches[4] + matches[3] + matches[2],
              opacity: parseInt(matches[1], 16) / 255
            };
          }
        }
      },
      'width': function(node, obj) {
        obj.width = this.getChildValue(node);
      }
    },
    'http://www.google.com/kml/ext/2.2': {
      'Track': function(node, container) {
        container.track = {
          whens: [],
          points: [],
          angles: []
        };
        if (this.trackAttributes) {
          var name;
          container.track.attributes = {};
          for (var i = 0, ii = this.trackAttributes.length; i < ii; ++i) {
            name = this.trackAttributes[i];
            container.track.attributes[name] = [];
            var readers = this.readers[this.defaultNamespaceURI];
            if (!(name in readers)) {
              readers[name] = readers['_trackPointAttribute'];
            }
          }
        }
        this.readChildNodes(node, container.track);
        if (container.track.whens.length !== container.track.points.length) {
          throw new Error('gx:Track with unequal number of when (' +
              container.track.whens.length + ') and gx:coord (' +
              container.track.points.length + ') elements.');
        }
        var hasAngles = container.track.angles.length > 0;
        if (hasAngles && container.track.whens.length !==
            container.track.angles.length) {
          throw new Error('gx:Track with unequal number of when (' +
              container.track.whens.length + ') and gx:angles (' +
              container.track.angles.length + ') elements.');
        }
      },
      'coord': function(node, container) {
        var str = this.getChildValue(node);
        var coords = str.replace(this.regExes.trimSpace, '').split(/\s+/);
        for (var i = 0, ii = coords.length; i < ii; ++i) {
          coords[i] = parseFloat(coords[i]);
        }
        var point = {
          type: ol.geom.GeometryType.POINT,
          coordinates: coords
        };
        container.points.push(point);
      },
      'angles': function(node, container) {
        var str = this.getChildValue(node);
        var parts = str.replace(this.regExes.trimSpace, '').split(/\s+/);
        container.angles.push(parts);
      }
    }
  };
  this.writers = {
    'http://www.opengis.net/kml/2.2': {
      'kml': function(options) {
        var node = this.createElementNS('kml');
        this.writeNode('Document', options, null, node);
        return node;
      },
      'Document': function(options) {
        var node = this.createElementNS('Document');
        for (var key in options) {
          if (options.hasOwnProperty(key) && goog.isString(options[key])) {
            var child = this.createElementNS(key);
            child.appendChild(this.createTextNode(options[key]));
            node.appendChild(child);
          }
        }
        var i, ii;
        if (goog.isDef(options.styles)) {
          for (i = 0, ii = options.styles.length; i < ii; ++i) {
            this.writeNode('_style', options.styles[i], null, node);
          }
        }
        if (goog.isDef(options.styleMaps)) {
          for (i = 0, ii = options.styleMaps.length; i < ii; ++i) {
            this.writeNode('_styleMap', options.styleMaps[i], null, node);
          }
        }
        for (i = 0, ii = options.features.length; i < ii; ++i) {
          this.writeNode('_feature', options.features[i], null, node);
        }
        return node;
      },
      '_style': function(style) {
        var node = this.createElementNS('Style');
        if (goog.isDef(style.id)) {
          this.setAttributeNS(node, null, 'id', style.id);
        }
        for (var i = 0, ii = style.symbolizers.length; i < ii; ++i) {
          this.writeNode('_symbolizer', {
            symbolizer: style.symbolizers[i],
            id: style.ids ? style.ids[i] : undefined
          }, null, node);
        }
        return node;
      },
      '_styleMap': function(styleMap) {
        var node = this.createElementNS('StyleMap');
        if (goog.isDef(styleMap.id)) {
          this.setAttributeNS(node, null, 'id', styleMap.id);
        }
        for (var i = 0, ii = styleMap.pairs.length; i < ii; ++i) {
          this.writeNode('Pair', styleMap.pairs[i], null, node);
        }
        return node;
      },
      '_symbolizer': function(obj) {
        var symbolizer = obj.symbolizer;
        if (symbolizer instanceof ol.style.Icon) {
          return this.writeNode('IconStyle', obj);
        } else if (symbolizer instanceof ol.style.Stroke) {
          return this.writeNode('LineStyle', obj);
        } else if (symbolizer instanceof ol.style.Fill) {
          return this.writeNode('PolyStyle', obj);
        }
      },
      'Pair': function(pair) {
        var node = this.createElementNS('Pair');
        if (goog.isDef(pair.id)) {
          this.setAttributeNS(node, null, 'id', pair.id);
        }
        if (goog.isDef(pair.key)) {
          this.writeNode('key', pair.key, null, node);
        }
        if (goog.isDef(pair.styleUrl)) {
          this.writeNode('styleUrl', pair.styleUrl, null, node);
        } else if (goog.isDef(pair.styles)) {
          for (var i = 0, ii = pair.styles.length; i < ii; ++i) {
            this.writeNode('_style', pair.styles[i], null, node);
          }
        }
        return node;
      },
      'key': function(key) {
        var node = this.createElementNS('key');
        node.appendChild(this.createTextNode(key));
        return node;
      },
      'PolyStyle': function(obj) {
        /**
         * In KML, if a PolyStyle has <outline>1</outline>
         * then the "current" LineStyle is used to stroke the polygon.
         */
        var node = this.createElementNS('PolyStyle');
        if (obj.id) {
          this.setAttributeNS(node, null, 'id', obj.id);
        }
        var literal = obj.symbolizer.createLiteral(
            ol.geom.GeometryType.POLYGON);
        var color, opacity;
        if (literal.fillOpacity !== 0) {
          this.writeNode('fill', '1', null, node);
          color = literal.fillColor;
          opacity = literal.fillOpacity;
        } else {
          this.writeNode('fill', '0', null, node);
        }
        if (literal.strokeOpacity) {
          this.writeNode('outline', '1', null, node);
          color = color || literal.strokeColor;
          opacity = opacity || literal.strokeOpacity;
        } else {
          this.writeNode('outline', '0', null, node);
        }
        if (color && opacity) {
          this.writeNode('color', {
            color: color.substring(1),
            opacity: opacity
          }, null, node);
        }
        return node;
      },
      'fill': function(fill) {
        var node = this.createElementNS('fill');
        node.appendChild(this.createTextNode(fill));
        return node;
      },
      'outline': function(outline) {
        var node = this.createElementNS('outline');
        node.appendChild(this.createTextNode(outline));
        return node;
      },
      'LineStyle': function(obj) {
        var node = this.createElementNS('LineStyle');
        if (obj.id) {
          this.setAttributeNS(node, null, 'id', obj.id);
        }
        var literal = obj.symbolizer.createLiteral(
            ol.geom.GeometryType.LINESTRING);
        this.writeNode('color', {
          color: literal.color.substring(1),
          opacity: literal.opacity
        }, null, node);
        this.writeNode('width', literal.width, null, node);
        return node;
      },
      'color': function(colorObj) {
        var color = colorObj.color;
        var text = (colorObj.opacity * 255).toString(16) +
            color.substring(4, 6) + color.substring(2, 4) +
            color.substring(0, 2);
        var node = this.createElementNS('color');
        node.appendChild(this.createTextNode(text));
        return node;
      },
      'width': function(width) {
        var node = this.createElementNS('width');
        node.appendChild(this.createTextNode(width));
        return node;
      },
      'IconStyle': function(obj) {
        var node = this.createElementNS('IconStyle');
        this.setAttributeNS(node, null, 'id', obj.id);
        this.writeNode('Icon',
            obj.symbolizer.createLiteral(ol.geom.GeometryType.POINT).url,
            null, node);
        return node;
      },
      'Icon': function(url) {
        var node = this.createElementNS('Icon');
        this.writeNode('href', url, null, node);
        return node;
      },
      'href': function(url) {
        var node = this.createElementNS('href');
        node.appendChild(this.createTextNode(url));
        return node;
      },
      '_feature': function(feature) {
        var node = this.createElementNS('Placemark');
        var fid = feature.getId();
        if (goog.isDef(fid)) {
          node.setAttribute('id', fid);
        }
        this.writeNode('name', feature, null, node);
        this.writeNode('description', feature, null, node);
        if (goog.isDef(feature.get('styleUrl'))) {
          this.writeNode('styleUrl', feature.get('styleUrl'), null, node);
        } else {
          // inline style
          var symbolizers = feature.getSymbolizers();
          if (!goog.isNull(symbolizers)) {
            this.writeNode('_style', {symbolizers: symbolizers}, null, node);
          }
        }
        this.writeNode('_geometry', feature.getGeometry(), null, node);
        return node;
      },
      'name': function(feature) {
        var name = feature.get('name');
        if (goog.isDef(name)) {
          var node = this.createElementNS('name');
          node.appendChild(this.createTextNode(name));
          return node;
        }
      },
      'description': function(feature) {
        var description = feature.get('description');
        if (goog.isDef(description)) {
          var node = this.createElementNS('description');
          node.appendChild(this.createTextNode(description));
          return node;
        }
      },
      'styleUrl': function(styleUrl) {
        var node = this.createElementNS('styleUrl');
        node.appendChild(this.createTextNode(styleUrl));
        return node;
      },
      '_geometry': function(geometry) {
        if (geometry instanceof ol.geom.Point) {
          return this.writeNode('Point', geometry);
        } else if (geometry instanceof ol.geom.LineString) {
          return this.writeNode('LineString', geometry);
        } else if (geometry instanceof ol.geom.Polygon) {
          return this.writeNode('Polygon', geometry);
        } else if (geometry instanceof ol.geom.AbstractCollection) {
          return this.writeNode('MultiGeometry', geometry);
        }
      },
      'MultiGeometry': function(geometry) {
        var node = this.createElementNS('MultiGeometry');
        var components = geometry.getComponents();
        for (var i = 0, ii = components.length; i < ii; ++i) {
          this.writeNode('_geometry', components[i], null, node);
        }
        return node;
      },
      'Point': function(geometry) {
        var node = this.createElementNS('Point');
        var coords = geometry.getCoordinates();
        this.writeNode('coordinates', [coords], null, node);
        return node;
      },
      'LineString': function(geometry) {
        var node = this.createElementNS('LineString');
        this.writeNode('coordinates', geometry.getCoordinates(), null, node);
        return node;
      },
      'Polygon': function(geometry) {
        /**
         * KML doesn't specify the winding order of coordinates in linear
         * rings.  So we keep them as they are in the geometries.
         */
        var node = this.createElementNS('Polygon');
        var coordinates = geometry.getCoordinates();
        this.writeNode('outerBoundaryIs', coordinates[0], null, node);
        for (var i = 1, ii = coordinates.length; i < ii; ++i) {
          this.writeNode('innerBoundaryIs', coordinates[i], null, node);
        }
        return node;
      },
      'outerBoundaryIs': function(vertexArray) {
        var node = this.createElementNS('outerBoundaryIs');
        this.writeNode('LinearRing', vertexArray, null, node);
        return node;
      },
      'innerBoundaryIs': function(vertexArray) {
        var node = this.createElementNS('innerBoundaryIs');
        this.writeNode('LinearRing', vertexArray, null, node);
        return node;
      },
      'LinearRing': function(vertexArray) {
        var node = this.createElementNS('LinearRing');
        this.writeNode('coordinates', vertexArray, null, node);
        return node;
      },
      'coordinates': function(vertexArray) {
        var node = this.createElementNS('coordinates');
        var coordstr = '';
        for (var i = 0, ii = vertexArray.length; i < ii; ++i) {
          for (var j = 0, jj = vertexArray[i].length; j < jj; ++j) {
            coordstr += vertexArray[i][j];
            if (j < jj - 1) {
              coordstr += ',';
            }
          }
          if (i < ii - 1) {
            coordstr += ' ';
          }
        }
        node.appendChild(this.createTextNode(coordstr));
        return node;
      }
    }
  };
  goog.base(this);
  goog.object.extend(this.regExes, {
    kmlColor: (/(\w{2})(\w{2})(\w{2})(\w{2})/),
    kmlIconPalette: (/root:\/\/icons\/palette-(\d+)(\.\w+)/),
    straightBracket: (/\$\[(.*?)\]/g)
  });
};
goog.inherits(ol.parser.KML, ol.parser.XML);


/**
 * @param {Object} obj Object representing features.
 * @param {function(ol.parser.ReadFeaturesResult)} callback Callback which is
 *     called after parsing.
 */
ol.parser.KML.prototype.readFeaturesFromObjectAsync = function(obj, callback) {
  this.read(obj, callback);
};


/**
 * @param {string} str String data.
 * @param {function(ol.parser.ReadFeaturesResult)}
 *     callback Callback which is called after parsing.
 */
ol.parser.KML.prototype.readFeaturesFromStringAsync = function(str, callback) {
  this.read(str, callback);
};


/**
 * Parse a KML document provided as a string.
 * @param {string} str KML document.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.KML.prototype.readFeaturesFromString = function(str) {
  return /** @type {ol.parser.ReadFeaturesResult} */ (this.read(str));
};


/**
 * Parse a KML document provided as a DOM structure.
 * @param {Element|Document} node Document or element node.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.KML.prototype.readFeaturesFromNode = function(node) {
  return /** @type {ol.parser.ReadFeaturesResult} */ (this.read(node));
};


/**
 * @param {Object} obj Object representing features.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.KML.prototype.readFeaturesFromObject = function(obj) {
  return /** @type {ol.parser.ReadFeaturesResult} */ (this.read(obj));
};


/**
 * Parse the link contained in styleUrl, if it exists.
 * @param {Object} obj The returned object from the parser.
 * @param {string} styleUrl The style url to parse.
 */
ol.parser.KML.prototype.parseStyleUrl = function(obj, styleUrl) {
  if (goog.isDef(styleUrl)) {
    if (!goog.string.startsWith(styleUrl, '#')) {
      obj.links.push({href: styleUrl});
    }
  }
};


/**
 * @param {Array} deferreds List of deferred instances.
 * @param {Object} obj The returned object from the parser.
 * @param {Function} done A callback for when all links have been retrieved.
 */
ol.parser.KML.prototype.parseLinks = function(deferreds, obj, done) {
  var unvisited;
  if (this.depth_ < this.maxDepth) {
    this.depth_++;
    for (var i = 0, ii = obj.links.length; i < ii; ++i) {
      var link = obj.links[i];
      if (link.visited !== true) {
        unvisited = true;
        var deferred = new goog.async.Deferred();
        var xhr = new goog.net.XhrIo();
        var me = this;
        goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
          if (e.target.isSuccess()) {
            var data = e.target.getResponseXml() || e.target.getResponseText();
            if (goog.isString(data)) {
              data = goog.dom.xml.loadXml(data);
            }
            goog.dispose(e.target);
            if (data) {
              if (data.nodeType == 9) {
                data = data.documentElement;
              }
              me.readNode(data, obj);
            }
            me.parseLinks(deferreds, obj, done);
            this.callback(data);
          }
        }, false, deferred);
        deferreds.push(deferred);
        xhr.send(link.href);
        link.visited = true;
      }
    }
  }
  if (unvisited !== true && this.callbackCalled_ !== true) {
    done.call(this);
  }
};


/**
 * @param {string|Document|Element|Object} data Data to read.
 * @param {function(ol.parser.ReadFeaturesResult)=} opt_callback Optional
 *     callback to call when reading is done. If provided, this method will
 *     return undefined.
 * @return {ol.parser.ReadFeaturesResult|undefined} An object representing the
 *     document if `opt_callback` was not provided.
 */
ol.parser.KML.prototype.read = function(data, opt_callback) {
  if (goog.isString(data)) {
    data = goog.dom.xml.loadXml(data);
  }
  if (data && data.nodeType == 9) {
    data = data.documentElement;
  }
  var obj = /** @type {ol.parser.ReadFeaturesResult} */
      ({metadata: {projection: 'EPSG:4326'}});
  this.readNode(data, obj);
  if (goog.isDef(opt_callback)) {
    var deferreds = [];
    this.depth_ = 0;
    this.callbackCalled_ = false;
    this.parseLinks(deferreds, obj, function() {
      this.callbackCalled_ = true;
      goog.async.DeferredList.gatherResults(deferreds).addCallbacks(
          function(datas) {
            for (var i = 0, ii = obj.features.length; i < ii; ++i) {
              var feature = obj.features[i];
              this.applyStyle_(feature, obj['styles'], obj['styleMaps']);
            }
            opt_callback.call(null, obj);
          }, function() {
            throw new Error('KML: parsing of NetworkLinks failed');
          }, this);
    });
  } else {
    return obj;
  }
};


/**
 * @private
 * @param {ol.Feature} feature The feature to apply the style to.
 * @param {Array} styles The style list to search in.
 * @param {Array} styleMaps The styleMap list to search in.
 * @param {Array.<ol.style.Symbolizer>=} opt_symbolizers Optional symbolizers.
 */
ol.parser.KML.prototype.applyStyle_ = function(feature, styles, styleMaps,
    opt_symbolizers) {
  var symbolizers = opt_symbolizers;
  var i, ii;
  if (feature.get('styleUrl') && feature.getSymbolizers() === null) {
    var styleUrl = feature.get('styleUrl');
    styleUrl = styleUrl.substring(styleUrl.indexOf('#') + 1);

    // look for the styleMap and set in the feature
    if (goog.isDef(styleMaps)) {
      for (i = 0, ii = styleMaps.length; i < ii; ++i) {
        var styleMap = styleMaps[i];
        if (styleMap['id'] === styleUrl) {
          for (var j = 0, jj = styleMap['pairs'].length; j < jj; j++) {
            var pair = styleMap['pairs'][j];
            if (pair.key === 'normal') {
              if (goog.isDef(pair['styleUrl'])) {
                styleUrl = pair['styleUrl'];
                styleUrl = styleUrl.substring(styleUrl.indexOf('#') + 1);
              } else if (goog.isDef(pair['styles'])) {
                symbolizers = pair['styles'][0]['symbolizers'];
              }
            }
          }
          break;
        }
      }
    }

    // look for the style and set in the feature
    if (!goog.isDef(symbolizers) && goog.isDef(styles)) {
      for (i = 0, ii = styles.length; i < ii; ++i) {
        if (styles[i]['id'] === styleUrl) {
          symbolizers = styles[i]['symbolizers'];
          break;
        }
      }
    }

  }
  if (goog.isDef(symbolizers)) {
    feature.setSymbolizers(symbolizers);
  }
};


/**
 * @private
 * @param {Object} container Geometry container.
 * @return {ol.geom.Geometry} The geometry created.
 */
ol.parser.KML.prototype.createGeometry_ = function(container) {
  var geometry = null, coordinates, i, ii;
  switch (container.geometry.type) {
    case ol.geom.GeometryType.POINT:
      geometry = new ol.geom.Point(container.geometry.coordinates);
      break;
    case ol.geom.GeometryType.LINESTRING:
      geometry = new ol.geom.LineString(container.geometry.coordinates);
      break;
    case ol.geom.GeometryType.POLYGON:
      geometry = new ol.geom.Polygon(container.geometry.coordinates);
      break;
    case ol.geom.GeometryType.MULTIPOINT:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiPoint(coordinates);
      break;
    case ol.geom.GeometryType.MULTILINESTRING:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiLineString(coordinates);
      break;
    case ol.geom.GeometryType.MULTIPOLYGON:
      coordinates = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        coordinates.push(container.geometry.parts[i].coordinates);
      }
      geometry = new ol.geom.MultiPolygon(coordinates);
      break;
    case ol.geom.GeometryType.GEOMETRYCOLLECTION:
      var geometries = [];
      for (i = 0, ii = container.geometry.parts.length; i < ii; i++) {
        geometries.push(this.createGeometry_({
          geometry: container.geometry.parts[i]
        }));
      }
      geometry = new ol.geom.GeometryCollection(geometries);
      break;
    default:
      break;
  }
  return geometry;
};


/**
 * @param {Object} obj Object structure to write out as XML.
 * @return {string} An string representing the XML document.
 */
ol.parser.KML.prototype.write = function(obj) {
  var root = this.writeNode('kml', obj);
  this.setAttributeNS(
      root, 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation', this.schemaLocation);
  return this.serialize(root);
};
