beforeEach(function() {
    var parent = this.getMatchersClass_();
    this.addMatchers({
        toBeA: function(type) {
            return this.actual instanceof type;
        }
    });
});
