goog.require("ol");

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

// ol.geom.collection
goog.exportSymbol('ol.geom.collection', ol.geom.collection);
goog.exportSymbol('ol.geom.Collection', ol.geom.Collection);
goog.exportProperty(ol.geom.Collection.prototype, 'components', ol.geom.Collection.prototype.components);
goog.exportProperty(ol.geom.Collection.prototype, 'add', ol.geom.Collection.prototype.add);
goog.exportProperty(ol.geom.Collection.prototype, 'addAll', ol.geom.Collection.prototype.addAll);
goog.exportProperty(ol.geom.Collection.prototype, 'remove', ol.geom.Collection.prototype.remove);

// ol.geom.point
goog.exportSymbol('ol.geom.point', ol.geom.point);
goog.exportSymbol('ol.geom.Point', ol.geom.Point);
goog.exportProperty(ol.geom.Point.prototype, 'x', ol.geom.Point.prototype.x);
goog.exportProperty(ol.geom.Point.prototype, 'y', ol.geom.Point.prototype.y);
goog.exportProperty(ol.geom.Point.prototype, 'z', ol.geom.Point.prototype.z);
goog.exportProperty(ol.geom.Point.prototype, 'projection', ol.geom.Point.prototype.projection);

// LOOKUP FOR DYNMICALLY REGISTERED CONTROLS DOES NOT RUN WELL NOW IN THE ADVANCED MODE
// HACK TO PUSH COMPILER TO NOT STRIP THE NAVIGATION CONTROL. TO BE FIXED.
ol.control.addControl('navigation', ol.control.Navigation);