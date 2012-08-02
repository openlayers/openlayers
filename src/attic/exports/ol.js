goog.require('ol.base');
goog.require('ol.bounds');
goog.require('ol.control.Attribution');
goog.require('ol.control.Navigation');
goog.require('ol.control.Zoom');
goog.require('ol.event.Events');
goog.require('ol.event.Scroll');
goog.require('ol.handler.Drag');
goog.require("ol.map");
goog.require("ol.loc");
goog.require("ol.feature");
goog.require("ol.projection");
goog.require("ol.layer.xyz");
goog.require("ol.layer.osm");
goog.require("ol.layer.wms");
goog.require("ol.popup");
goog.require("ol.Tile");
goog.require("ol.TileSet");
goog.require("ol.TileCache");
goog.require("ol.geom.geometry");
goog.require("ol.geom.point");
goog.require("ol.geom.multipoint");
goog.require("ol.geom.linestring");
goog.require("ol.geom.multilinestring");
goog.require("ol.geom.collection");
goog.require('ol.layer.XYZ');
goog.require('ol.layer.OSM');
goog.require('ol.layer.WMS');
goog.require('ol.renderer.Composite');
goog.require('ol.renderer.TileLayerRenderer');
goog.require('ol.renderer.WebGL');

// ol.map
goog.exportSymbol('ol.map', ol.map );
goog.exportSymbol('ol.Map', ol.Map );
goog.exportProperty( ol.Map.prototype, 'renderTo', ol.Map.prototype.renderTo );
goog.exportProperty( ol.Map.prototype, 'center', ol.Map.prototype.center );
goog.exportProperty( ol.Map.prototype, 'projection', ol.Map.prototype.projection );
goog.exportProperty( ol.Map.prototype, 'userProjection', ol.Map.prototype.userProjection );
goog.exportProperty( ol.Map.prototype, 'zoom', ol.Map.prototype.zoom );
goog.exportProperty( ol.Map.prototype, 'numZoomLevels', ol.Map.prototype.numZoomLevels );
goog.exportProperty( ol.Map.prototype, 'resolutions', ol.Map.prototype.resolutions );
goog.exportProperty( ol.Map.prototype, 'layers', ol.Map.prototype.layers );
goog.exportProperty( ol.Map.prototype, 'controls', ol.Map.prototype.controls );
goog.exportProperty( ol.Map.prototype, 'maxExtent', ol.Map.prototype.maxExtent );
goog.exportProperty( ol.Map.prototype, 'destroy', ol.Map.prototype.destroy );

// ol.loc
goog.exportSymbol('ol.loc', ol.loc );
goog.exportSymbol('ol.Loc', ol.Loc ); // This is not required only for the tests with isInstanceOf
goog.exportProperty( ol.Loc.prototype, 'projection', ol.Loc.prototype.projection );
goog.exportProperty( ol.Loc.prototype, 'x', ol.Loc.prototype.x );
goog.exportProperty( ol.Loc.prototype, 'y', ol.Loc.prototype.y );
goog.exportProperty( ol.Loc.prototype, 'z', ol.Loc.prototype.z );
goog.exportProperty( ol.Loc.prototype, 'transform', ol.Loc.prototype.transform );
goog.exportProperty( ol.Loc.prototype, 'destroy', ol.Loc.prototype.destroy );

// ol.projection
goog.exportSymbol('ol.projection', ol.projection );
goog.exportSymbol('ol.Projection', ol.Projection );
goog.exportProperty( ol.Projection.prototype, 'code', ol.Projection.prototype.code );
goog.exportProperty( ol.Projection.prototype, 'units', ol.Projection.prototype.units );

// ol.bounds
goog.exportSymbol('ol.bounds', ol.bounds );
goog.exportSymbol('ol.Bounds', ol.Bounds );
goog.exportProperty( ol.Bounds.prototype, 'projection', ol.Bounds.prototype.projection );
goog.exportProperty( ol.Bounds.prototype, 'minX', ol.Bounds.prototype.minX );
goog.exportProperty( ol.Bounds.prototype, 'minY', ol.Bounds.prototype.minY );
goog.exportProperty( ol.Bounds.prototype, 'maxX', ol.Bounds.prototype.maxX );
goog.exportProperty( ol.Bounds.prototype, 'maxY', ol.Bounds.prototype.maxY );

// ol.layer.xyz
goog.exportSymbol('ol.layer.xyz', ol.layer.xyz);
goog.exportSymbol('ol.layer.XYZ', ol.layer.XYZ);

// ol.layer.osm
goog.exportSymbol('ol.layer.osm', ol.layer.osm);
goog.exportSymbol('ol.layer.OSM', ol.layer.OSM);

// ol.layer.wms
goog.exportSymbol('ol.layer.wms', ol.layer.wms);
goog.exportSymbol('ol.layer.WMS', ol.layer.WMS);

// ol.feature
goog.exportSymbol('ol.feature', ol.feature);
goog.exportSymbol('ol.Feature', ol.Feature);
goog.exportProperty(ol.Feature.prototype, 'set', ol.Feature.prototype.set);
goog.exportProperty(ol.Feature.prototype, 'get', ol.Feature.prototype.get);
goog.exportProperty(ol.Feature.prototype, 'geometry', ol.Feature.prototype.geometry);

// ol.geometry
goog.exportSymbol('ol.geom.geometry', ol.geom.geometry);
goog.exportSymbol('ol.geom.Geometry', ol.geom.Geometry);
goog.exportProperty(ol.geom.Geometry.prototype, 'bounds', ol.geom.Geometry.prototype.bounds);
goog.exportProperty(ol.geom.Geometry.prototype, 'centroid', ol.geom.Geometry.prototype.centroid);

// ol.geom.collection
goog.exportSymbol('ol.geom.collection', ol.geom.collection);
goog.exportSymbol('ol.geom.Collection', ol.geom.Collection);
goog.exportProperty(ol.geom.Collection.prototype, 'components', ol.geom.Collection.prototype.components);
goog.exportProperty(ol.geom.Collection.prototype, 'add', ol.geom.Collection.prototype.add);
goog.exportProperty(ol.geom.Collection.prototype, 'addAll', ol.geom.Collection.prototype.addAll);
goog.exportProperty(ol.geom.Collection.prototype, 'remove', ol.geom.Collection.prototype.remove);
goog.exportProperty(ol.geom.Collection.prototype, 'centroid', ol.geom.Collection.prototype.centroid);

// ol.geom.point
goog.exportSymbol('ol.geom.point', ol.geom.point);
goog.exportSymbol('ol.geom.Point', ol.geom.Point);
goog.exportProperty(ol.geom.Point.prototype, 'x', ol.geom.Point.prototype.x);
goog.exportProperty(ol.geom.Point.prototype, 'y', ol.geom.Point.prototype.y);
goog.exportProperty(ol.geom.Point.prototype, 'z', ol.geom.Point.prototype.z);
goog.exportProperty(ol.geom.Point.prototype, 'projection', ol.geom.Point.prototype.projection);
goog.exportProperty(ol.geom.Point.prototype, 'centroid', ol.geom.Point.prototype.centroid);

// ol.geom.linestring
goog.exportSymbol('ol.geom.linestring', ol.geom.linestring);
goog.exportSymbol('ol.geom.LineString', ol.geom.LineString);
goog.exportProperty(ol.geom.LineString.prototype, 'vertices', ol.geom.LineString.prototype.vertices);
goog.exportProperty(ol.geom.LineString.prototype, 'add', ol.geom.LineString.prototype.add);
goog.exportProperty(ol.geom.LineString.prototype, 'addAll', ol.geom.LineString.prototype.addAll);
goog.exportProperty(ol.geom.LineString.prototype, 'remove', ol.geom.LineString.prototype.remove);
goog.exportProperty(ol.geom.LineString.prototype, 'centroid', ol.geom.LineString.prototype.centroid);

// ol.geom.multipoint
goog.exportSymbol('ol.geom.multipoint', ol.geom.multipoint);
goog.exportSymbol('ol.geom.MultiPoint', ol.geom.MultiPoint);
goog.exportProperty(ol.geom.MultiPoint.prototype, 'points', ol.geom.MultiPoint.prototype.points);
goog.exportProperty(ol.geom.MultiPoint.prototype, 'add', ol.geom.MultiPoint.prototype.add);
goog.exportProperty(ol.geom.MultiPoint.prototype, 'addAll', ol.geom.MultiPoint.prototype.addAll);
goog.exportProperty(ol.geom.MultiPoint.prototype, 'remove', ol.geom.MultiPoint.prototype.remove);
goog.exportProperty(ol.geom.MultiPoint.prototype, 'centroid', ol.geom.MultiPoint.prototype.centroid);

// ol.geom.multilinestring
goog.exportSymbol('ol.geom.multilinestring', ol.geom.multilinestring);
goog.exportSymbol('ol.geom.MultiLineString', ol.geom.MultiLineString);
goog.exportProperty(ol.geom.MultiLineString.prototype, 'linestrings', ol.geom.MultiLineString.prototype.linestrings);
goog.exportProperty(ol.geom.MultiLineString.prototype, 'add', ol.geom.MultiLineString.prototype.add);
goog.exportProperty(ol.geom.MultiLineString.prototype, 'addAll', ol.geom.MultiLineString.prototype.addAll);
goog.exportProperty(ol.geom.MultiLineString.prototype, 'remove', ol.geom.MultiLineString.prototype.remove);
goog.exportProperty(ol.geom.MultiLineString.prototype, 'centroid', ol.geom.MultiLineString.prototype.centroid);


// ol.popup
goog.exportSymbol('ol.popup', ol.popup);
goog.exportSymbol('ol.Popup', ol.Popup);
goog.exportProperty(ol.Popup.prototype, 'anchor', ol.Popup.prototype.anchor);
goog.exportProperty(ol.Popup.prototype, 'map', ol.Popup.prototype.map);
goog.exportProperty(ol.Popup.prototype, 'content', ol.Popup.prototype.content);
goog.exportProperty(ol.Popup.prototype, 'template', ol.Popup.prototype.template);
goog.exportProperty(ol.Popup.prototype, 'open', ol.Popup.prototype.open);

/**
 * Lookup for dynamically registered controls and renderers does not work in
 * advanced compiled mode.  For now, we duplicate the registration calls here.
 *
 * TODO: determine a good way for plugins to register
 */
goog.exportProperty(ol.renderer.Composite, 'isSupported', ol.renderer.Composite.isSupported);
goog.exportProperty(ol.renderer.TileLayerRenderer, 'isSupported', ol.renderer.TileLayerRenderer.isSupported);
goog.exportProperty(ol.renderer.TileLayerRenderer, 'canRender', ol.renderer.TileLayerRenderer.canRender);
goog.exportProperty(ol.renderer.TileLayerRenderer, 'getType', ol.renderer.TileLayerRenderer.getType);
ol.control.addControl('navigation', ol.control.Navigation);
