goog.provide('ol.mixins.coordinate');
goog.require('goog.object');

goog.object.extend(ol.mixins.coordinate, {
    
    getX : function() {
        return this.x_;
    },
    
    getY : function() {
        return this.y_;
    },
    
    getZ : function() {
        return this.z_;
    },
    
    setX : function(x) {
        this.x_ = x;
        return this;
    },
    
    setY : function(y) {
        this.y_ = y;
        return this;
    },
    setZ: function(z) {
        this.z_ = z;
        return this;
    }
});
