/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/DragFeature.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Point.js
 */

/**
 * Class: OpenLayers.Control.TransformFeature
 * Control to transform features with a standard transformation box.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.TransformFeature = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Constant: EVENT_TYPES
     *
     * Supported event types:
     *  - *beforesetfeature* Triggered before a feature is set for
     *      tranformation. The feature will not be set if a listener returns
     *      false. Listeners receive a *feature* property, with the feature
     *      that will be set for transformation. Listeners are allowed to
     *      set the control's *scale*, *ratio* and *rotation* properties,
     *      which will set the initial scale, ratio and rotation of the
     *      feature, like the <setFeature> method's initialParams argument.
     *  - *setfeature* Triggered when a feature is set for tranformation.
     *      Listeners receive a *feature* property, with the feature that
     *      is now set for transformation.
     *  - *beforetransform* Triggered while dragging, before a feature is
     *      transformed. The feature will not be transformed if a listener
     *      returns false (but the box still will). Listeners receive one or
     *      more of *center*, *scale*, *ratio* and *rotation*. The *center*
     *      property is an <OpenLayers.Geometry.Point> object with the new
     *      center of the transformed feature, the others are Floats with the
     *      scale, ratio or rotation change since the last transformation.
     *  - *transform* Triggered while dragging, when a feature is transformed.
     *      Listeners receive an event object with one or more of *center*,
     *      *scale*, *ratio* and *rotation*. The *center* property is an
     *      <OpenLayers.Geometry.Point> object with the new center of the
     *      transformed feature, the others are Floats with the scale, ratio
     *      or rotation change of the feature since the last transformation.
     *  - *transformcomplete* Triggered after dragging. Listeners receive
     *      an event object with the transformed *feature*.
     */
    EVENT_TYPES: ["beforesetfeature", "setfeature", "beforetransform",
        "transform", "transformcomplete"],

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict transformation to a limited set of geometry
     *     types, send a list of strings corresponding to the geometry class
     *     names.
     */
    geometryTypes: null,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,
    
    /**
     * APIProperty: preserveAspectRatio
     * {Boolean} set to true to not change the feature's aspect ratio.
     */
    preserveAspectRatio: false,
    
    /**
     * APIProperty: rotate
     * {Boolean} set to false if rotation should be disabled. Default is true.
     *     To be passed with the constructor or set when the control is not
     *     active.
     */
    rotate: true,
    
    /**
     * APIProperty: feature
     * {<OpenLayers.Feature.Vector>} Feature currently available for
     *     transformation. Read-only, use <setFeature> to set it manually.
     */
    feature: null,
    
    /**
     * APIProperty: renderIntent
     * {String|Object} Render intent for the transformation box and
     *     handles. A symbolizer object can also be provided here.
     */
    renderIntent: "temporary",
    
    /**
     * APIProperty: rotationHandleSymbolizer
     * {Object|String} Optional. A custom symbolizer for the rotation handles.
     *     A render intent can also be provided here. Defaults to
     *     (code)
     *     {
     *         stroke: false,
     *         pointRadius: 10,
     *         fillOpacity: 0,
     *         cursor: "pointer"
     *     }
     *     (end)
     */
    rotationHandleSymbolizer: null,
    
    /**
     * APIProperty: box
     * {<OpenLayers.Feature.Vector>} The transformation box rectangle.
     *     Read-only.
     */
    box: null,
    
    /**
     * APIProperty: center
     * {<OpenLayers.Geometry.Point>} The center of the feature bounds.
     * Read-only.
     */
    center: null,
    
    /**
     * APIProperty: scale
     * {Float} The scale of the feature, relative to the scale the time the
     *     feature was set. Read-only, except for *beforesetfeature*
     *     listeners.
     */
    scale: 1,
    
    /**
     * APIProperty: ratio
     * {Float} The ratio of the feature relative to the ratio the time the
     *     feature was set. Read-only, except for *beforesetfeature*
     *     listeners.
     */
    ratio: 1,
    
    /**
     * Property: rotation
     * {Integer} the current rotation angle of the box. Read-only, except for
     *     *beforesetfeature* listeners.
     */
    rotation: 0,
    
    /**
     * APIProperty: handles
     * {Array(<OpenLayers.Feature.Vector>)} The 8 handles currently available
     *     for scaling/resizing. Numbered counterclockwise, starting from the
     *     southwest corner. Read-only.
     */
    handles: null,
    
    /**
     * APIProperty: rotationHandles
     * {Array(<OpenLayers.Feature.Vector>)} The 4 rotation handles currently
     *     available for rotating. Numbered counterclockwise, starting from
     *     the southwest corner. Read-only.
     */
    rotationHandles: null,
    
    /**
     * Property: dragControl
     * {<OpenLayers.Control.DragFeature>}
     */
    dragControl: null,
    
    /**
     * Constructor: OpenLayers.Control.TransformFeature
     * Create a new transform feature control.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} Layer that contains features that
     *     will be transformed.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    initialize: function(layer, options) {
        // concatenate events specific to this control with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.TransformFeature.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        this.layer = layer;

        if(!this.rotationHandleSymbolizer) {
            this.rotationHandleSymbolizer = {
                stroke: false,
                pointRadius: 10,
                fillOpacity: 0,
                cursor: "pointer"
            };
        }

        this.createBox();
        this.createControl();        
    },
    
    /**
     * APIMethod: activate
     * Activates the control.
     */
    activate: function() {
        var activated = false;
        if(OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            this.dragControl.activate();
            this.layer.addFeatures([this.box]);
            this.rotate && this.layer.addFeatures(this.rotationHandles);
            this.layer.addFeatures(this.handles);        
            activated = true;
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivates the control.
     */
    deactivate: function() {
        var deactivated = false;
        if(OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.layer.removeFeatures(this.handles);
            this.rotate && this.layer.removeFeatures(this.rotationHandles);
            this.layer.removeFeatures([this.box]);
            this.dragControl.deactivate();
            deactivated = true;
        }
        return deactivated;
    },
    
    /**
     * Method: setMap
     * 
     * Parameters:
     * map - {<OpenLayers.Map>}
     */
    setMap: function(map) {
        this.dragControl.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    /**
     * APIMethod: setFeature
     * Place the transformation box on a feature and start transforming it.
     * If the control is not active, it will be activated.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * initialParams - {Object} Initial values for rotation, scale or ratio.
     *     Setting a rotation value here will cause the transformation box to
     *     start rotated. Setting a scale or ratio will not affect the
     *     transormation box, but applications may use this to keep track of
     *     scale and ratio of a feature across multiple transforms.
     */
    setFeature: function(feature, initialParams) {
        initialParams = OpenLayers.Util.applyDefaults(initialParams, {
            rotation: 0,
            scale: 1,
            ratio: 1
        });
        var evt = {feature: feature};
        
        var oldRotation = this.rotation;
        var oldCenter = this.center;
        OpenLayers.Util.extend(this, initialParams);

        if(this.events.triggerEvent("beforesetfeature", evt) === false) {
            return;
        }

        this.feature = feature;
        this.activate();

        this._setfeature = true;

        var featureBounds = this.feature.geometry.getBounds();
        this.box.move(featureBounds.getCenterLonLat());
        this.box.geometry.rotate(-oldRotation, oldCenter);
        this._angle = 0;

        var ll;
        if(this.rotation) {
            var geom = feature.geometry.clone();
            geom.rotate(-this.rotation, this.center);
            var box = new OpenLayers.Feature.Vector(
                geom.getBounds().toGeometry());
            box.geometry.rotate(this.rotation, this.center);
            this.box.geometry.rotate(this.rotation, this.center);
            this.box.move(box.geometry.getBounds().getCenterLonLat());
            var llGeom = box.geometry.components[0].components[0];
            ll = llGeom.getBounds().getCenterLonLat();
        } else {
            ll = new OpenLayers.LonLat(featureBounds.left, featureBounds.bottom);
        }
        this.handles[0].move(ll);
        
        delete this._setfeature;

        this.events.triggerEvent("setfeature", evt);
    },
    
    /**
     * Method: createBox
     * Creates the box with all handles and transformation handles.
     */
    createBox: function() {
        var control = this;
        
        this.center = new OpenLayers.Geometry.Point(0, 0);
        var box = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.LineString([
                new OpenLayers.Geometry.Point(-1, -1),
                new OpenLayers.Geometry.Point(0, -1),
                new OpenLayers.Geometry.Point(1, -1),
                new OpenLayers.Geometry.Point(1, 0),
                new OpenLayers.Geometry.Point(1, 1),
                new OpenLayers.Geometry.Point(0, 1),
                new OpenLayers.Geometry.Point(-1, 1),
                new OpenLayers.Geometry.Point(-1, 0),
                new OpenLayers.Geometry.Point(-1, -1)
            ]), null,
            typeof this.renderIntent == "string" ? null : this.renderIntent
        );
        
        // Override for box move - make sure that the center gets updated
        box.geometry.move = function(x, y) {
            control._moving = true;
            OpenLayers.Geometry.LineString.prototype.move.apply(this, arguments);
            control.center.move(x, y);
            delete control._moving;
        };

        // Overrides for vertex move, resize and rotate - make sure that
        // handle and rotationHandle geometries are also moved, resized and
        // rotated.
        var vertexMoveFn = function(x, y) {
            OpenLayers.Geometry.Point.prototype.move.apply(this, arguments);
            this._rotationHandle && this._rotationHandle.geometry.move(x, y);
            this._handle.geometry.move(x, y);
        };
        var vertexResizeFn = function(scale, center, ratio) {
            OpenLayers.Geometry.Point.prototype.resize.apply(this, arguments);
            this._rotationHandle && this._rotationHandle.geometry.resize(
                scale, center, ratio);
            this._handle.geometry.resize(scale, center, ratio);
        };
        var vertexRotateFn = function(angle, center) {
            OpenLayers.Geometry.Point.prototype.rotate.apply(this, arguments);
            this._rotationHandle && this._rotationHandle.geometry.rotate(
                angle, center);
            this._handle.geometry.rotate(angle, center);
        };
        
        // Override for handle move - make sure that the box and other handles
        // are updated, and finally transform the feature.
        var handleMoveFn = function(x, y) {
            var oldX = this.x, oldY = this.y;
            OpenLayers.Geometry.Point.prototype.move.call(this, x, y);
            if(control._moving) {
                return;
            }
            var evt = control.dragControl.handlers.drag.evt;
            var preserveAspectRatio = !control._setfeature &&
                control.preserveAspectRatio;
            var reshape = !preserveAspectRatio && !(evt && evt.shiftKey);
            var oldGeom = new OpenLayers.Geometry.Point(oldX, oldY);
            var centerGeometry = control.center;
            this.rotate(-control.rotation, centerGeometry);
            oldGeom.rotate(-control.rotation, centerGeometry);
            var dx1 = this.x - centerGeometry.x;
            var dy1 = this.y - centerGeometry.y;
            var dx0 = dx1 - (this.x - oldGeom.x);
            var dy0 = dy1 - (this.y - oldGeom.y);
            this.x = oldX;
            this.y = oldY;
            var scale, ratio = 1;
            if (reshape) {
                scale = Math.abs(dy0) < 0.00001 ? 1 : dy1 / dy0;
                ratio = (Math.abs(dx0) < 0.00001 ? 1 : (dx1 / dx0)) / scale;
            } else {
                var l0 = Math.sqrt((dx0 * dx0) + (dy0 * dy0));
                var l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));
                scale = l1 / l0;
            }

            // rotate the box to 0 before resizing - saves us some
            // calculations and is inexpensive because we don't drawFeature.
            control._moving = true;
            control.box.geometry.rotate(-control.rotation, centerGeometry);
            delete control._moving;

            control.box.geometry.resize(scale, centerGeometry, ratio);
            control.box.geometry.rotate(control.rotation, centerGeometry);
            control.transformFeature({scale: scale, ratio: ratio});
        };
        
        // Override for rotation handle move - make sure that the box and
        // other handles are updated, and finally transform the feature.
        var rotationHandleMoveFn = function(x, y){
            var oldX = this.x, oldY = this.y;
            OpenLayers.Geometry.Point.prototype.move.call(this, x, y);
            if(control._moving) {
                return;
            }
            var evt = control.dragControl.handlers.drag.evt;
            var constrain = (evt && evt.shiftKey) ? 45 : 1;
            var centerGeometry = control.center;
            var dx1 = this.x - centerGeometry.x;
            var dy1 = this.y - centerGeometry.y;
            var dx0 = dx1 - x;
            var dy0 = dy1 - y;
            this.x = oldX;
            this.y = oldY;
            var a0 = Math.atan2(dy0, dx0);
            var a1 = Math.atan2(dy1, dx1);
            var angle = a1 - a0;
            angle *= 180 / Math.PI;
            control._angle = (control._angle + angle) % 360;
            var diff = control.rotation % constrain;
            if(Math.abs(control._angle) >= constrain || diff !== 0) {
                angle = Math.round(control._angle / constrain) * constrain -
                    diff;
                control._angle = 0;
                control.box.geometry.rotate(angle, centerGeometry);
                control.transformFeature({rotation: angle});
            } 
        };

        var handles = new Array(8);
        var rotationHandles = new Array(4);
        var geom, handle, rotationHandle;
        for(var i=0; i<8; ++i) {
            geom = box.geometry.components[i];
            handle = new OpenLayers.Feature.Vector(geom.clone(), null,
                typeof this.renderIntent == "string" ? null :
                this.renderIntent);
            if(i % 2 == 0) {
                rotationHandle = new OpenLayers.Feature.Vector(geom.clone(),
                    null, typeof this.rotationHandleSymbolizer == "string" ?
                    null : this.rotationHandleSymbolizer);
                rotationHandle.geometry.move = rotationHandleMoveFn;
                geom._rotationHandle = rotationHandle;
                rotationHandles[i/2] = rotationHandle;
            }
            geom.move = vertexMoveFn;
            geom.resize = vertexResizeFn;
            geom.rotate = vertexRotateFn;
            handle.geometry.move = handleMoveFn;
            geom._handle = handle;
            handles[i] = handle;
        }
        
        this.box = box;
        this.rotationHandles = rotationHandles;
        this.handles = handles;
    },
    
    /**
     * Method: createControl
     * Creates a DragFeature control for this control.
     */
    createControl: function() {
        var control = this;
        this.dragControl = new OpenLayers.Control.DragFeature(this.layer, {
            documentDrag: true,
            // avoid moving the feature itself - move the box instead
            moveFeature: function(pixel) {
                if(this.feature === control.feature) {
                    this.feature = control.box;
                }
                OpenLayers.Control.DragFeature.prototype.moveFeature.apply(this,
                    arguments);
            },
            // transform while dragging
            onDrag: function(feature, pixel) {
                if(feature === control.box) {
                    control.transformFeature({center: control.center});
                    control.drawHandles();
                }
            },
            // set a new feature
            onStart: function(feature, pixel) {
                var eligible = !control.geometryTypes ||
                    OpenLayers.Util.indexOf(control.geometryTypes,
                        feature.geometry.CLASS_NAME) !== -1;
                var i = OpenLayers.Util.indexOf(control.handles, feature);
                i += OpenLayers.Util.indexOf(control.rotationHandles,
                    feature);
                if(feature !== control.feature && feature !== control.box &&
                                                        i == -2 && eligible) {
                    control.setFeature(feature);
                }
            },
            onComplete: function(feature, pixel) {
                control.events.triggerEvent("transformcomplete",
                    {feature: control.feature});
            }
        });
    },
    
    /**
     * Method: drawHandles
     * Draws the handles to match the box.
     */
    drawHandles: function() {
        var layer = this.layer;
        for(var i=0; i<8; ++i) {
            if(this.rotate && i % 2 === 0) {
                layer.drawFeature(this.rotationHandles[i/2],
                    this.rotationHandleSymbolizer);
            }
            layer.drawFeature(this.handles[i], this.renderIntent);
        }
    },
    
    /**
     * Method: transformFeature
     * Transforms the feature.
     * 
     * Parameters:
     * mods - {Object} An object with optional scale, ratio, rotation and
     *     center properties.
     */
    transformFeature: function(mods) {
        if(!this._setfeature) {
            this.scale *= (mods.scale || 1);
            this.ratio *= (mods.ratio || 1);
            var oldRotation = this.rotation;
            this.rotation = (this.rotation + (mods.rotation || 0)) % 360;
            
            if(this.events.triggerEvent("beforetransform", mods) !== false) {
                var feature = this.feature;
                var geom = feature.geometry;
                var center = this.center;
                geom.rotate(-oldRotation, center);
                if(mods.scale || mods.ratio) {
                    geom.resize(mods.scale, center, mods.ratio);
                } else if(mods.center) {
                    feature.move(mods.center.getBounds().getCenterLonLat());
                }
                geom.rotate(this.rotation, center);
                this.layer.drawFeature(feature);
                feature.toState(OpenLayers.State.UPDATE);
                this.events.triggerEvent("transform", mods);
            }
        }
        this.layer.drawFeature(this.box, this.renderIntent);
        this.drawHandles();
    },
        
    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass.
     */
    destroy: function() {
        var geom;
        for(var i=0; i<8; ++i) {
            geom = this.box.geometry.components[i];
            geom._handle.destroy();
            geom._handle = null;
            geom._rotationHandle && geom._rotationHandle.destroy();
            geom._rotationHandle = null;
        }
        this.box.destroy();
        this.box = null;
        this.layer = null;
        this.dragControl.destroy();
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Control.TransformFeature"
});
