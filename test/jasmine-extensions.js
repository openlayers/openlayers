beforeEach(function() {
    var parent = this.getMatchersClass_();
    this.addMatchers({
        toBeA: function(type) {
            return this.actual instanceof type;
        },
        toRoughlyEqual: function(other, tol) {
            return Math.abs(this.actual - other) <= tol;
        }
    });
});
