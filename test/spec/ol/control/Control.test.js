describe('ol.control.Control', function() {
    
    it('should be easy to create and destroy a control', function() {
        var control = new ol.control.Control();
        expect(control).toBeA(ol.control.Control);
        expect(control.autoActivate_).toBe(false);
        
        control.destroy();
        expect(control.autoActivate_).toBeUndefined();
    });
    
    it('can be activated and deactivated', function() {
        var control = new ol.control.Control();
        expect(control.active_).toBe(false);
        expect(control.activate()).toBe(true);
        expect(control.active_).toBe(true);
        expect(control.activate()).toBe(false);
        expect(control.deactivate()).toBe(true);
        expect(control.active_).toBe(false);
        expect(control.deactivate()).toBe(false);
        control.destroy();
    });
    
    it('auto-activates itself and can be added to a map', function() {
        control = new ol.control.Control();
        control.setMap('foo');
        expect(control.map_).toBe('foo');
        expect(control.active_).toBe(false);
        control.autoActivate_ = true;
        control.setMap('bar');
        expect(control.map_).toBe('bar');
        expect(control.active_).toBe(true);
    });
});