goog.provide('ol.geom.collection');

goog.require('ol.geom.Collection');
goog.require('ol.geom.point');
goog.require('ol.projection');

/**
 * @export
 * @param {Array.<ol.geom.Geometry>} opt_arg Components.
 * @return {ol.geom.Collection} Collection.
 */
ol.geom.collection = function(opt_arg){

    if (opt_arg instanceof ol.geom.Collection) {
        return opt_arg;
    }

    var components = [];
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        if (goog.isArray(opt_arg)) {
            var allValid = goog.array.every(opt_arg, function(geom){
                if (geom instanceof ol.geom.Geometry) {
                    components.push(geom);
                    return true;
                } else {
                    return false;
                }
            });
            if (!allValid) {
                var msg = 'ol.geom.collection: at least one component '
                    + 'definition was no geometry.';
                throw new Error(msg);
            }
        } else {
            throw new Error('ol.geom.collection');
        }
    }

    var c = new ol.geom.Collection(components);
    return c;
};
goog.inherits(ol.geom.collection, ol.geom.geometry);

/**
 * @export
 * @param {Array.<ol.geom.Geometry>=} opt_arg An array of point specifications.
 * @return {Array.<ol.geom.Geometry>|ol.geom.Collection|undefined} Result.
 */
ol.geom.Collection.prototype.components = function(opt_arg){
    if (arguments.length == 1 && goog.isDef(opt_arg)) {
        var components = [],
            allValid = false;

        allValid = goog.array.every(opt_arg, function(geom){
            if (geom instanceof ol.geom.Geometry) {
                components.push(geom);
                return true;
            } else {
                return false;
            }
        });
        if (!allValid) {
            components = [];
        }
        this.setComponents(components);
        return this;
    }
    else {
        return this.getComponents();
    }
};

/**
 * @export
 * @param {ol.geom.Geometry} geom A geometry.
 * @param {number=} opt_index An optional index to add the point(s) at. If not
 *     provided, the point(s) will be added to the end of the list of components.
 * @return {ol.geom.Collection} The Collection instance.
 */
ol.geom.Collection.prototype.add = function(geom, opt_index){
    var index = this.components_.length;
    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }
    this.addComponent(geom, index);
    return this;
};

/**
 * @export
 * @param {Array.<ol.geom.Geometry>} components Some point specifications.
 * @param {number=} opt_index An optional index to add the components at. If not
 *     provided, the components will be added to the end of the list of
 *     components.
 * @return {ol.geom.Collection} The Collection instance.
 */
ol.geom.Collection.prototype.addAll = function(components, opt_index){
    var index = this.components_.length;

    if (arguments.length == 2 && goog.isDef(opt_index)) {
        index = opt_index;
    }

    goog.array.every(components, function(c){
        this.addComponent(c, index);
        index++;
        return true;
    }, this);

    return this;
};

/**
 * @export
 * @param {(ol.geom.Geometry|Array.<ol.geom.Geometry>)} components A point specification or
 *     an array of point specifications.
 * @return {ol.geom.Collection} The Collection instance.
 */
ol.geom.Collection.prototype.remove = function(components){
    var compArr = [];
    if (!goog.isArray(components)) {
        compArr.push(components);
    } else {
        compArr = components;
    }

    goog.array.every(compArr, function(c){
        this.removeComponent(c);
        return true;
    }, this);
    
    return this;
};
