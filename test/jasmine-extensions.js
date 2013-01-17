beforeEach(function() {
    var parent = this.getMatchersClass_();
    this.addMatchers({
        toBeA: function(type) {
            return this.actual instanceof type;
        },
        toBeGreaterThanOrEqualTo: function(other) {
            return this.actual >= other;
        },
        toBeLessThanOrEqualTo: function(other) {
            return this.actual <= other;
        },
        toRoughlyEqual: function(other, tol) {
            return Math.abs(this.actual - other) <= tol;
        }
    });
});
