describe("ol.geom.Collection", function() {
    var c;

    beforeEach(function(){
        c = new ol.geom.Collection([
            new ol.geom.Point(10,20),
            new ol.geom.LineString([
                new ol.geom.Point(47,11),
                new ol.geom.Point(3.14,2.8)
            ])
        ]);
    });

    afterEach(function(){
        c = null;
    });

    it("constructs instances", function() {
        expect( c ).toBeA( ol.geom.Collection );
    });

    it("can construct instances without any components", function() {
        // empty array
        c = new ol.geom.Collection([]);
        expect( c ).toBeA( ol.geom.Collection );

        // no argument at all
        c = new ol.geom.Collection();
        expect( c ).toBeA( ol.geom.Collection );
    });

    it("cannot construct instances when passed illegal components", function() {
        // collection cannot contain collections
        expect(function(){
            c = new ol.geom.Collection([
                new ol.geom.Collection()
            ]);
        }).toThrow();

    });

    it("inherits from ol.geom.Geometry", function() {
        expect( c ).toBeA( ol.geom.Geometry );
    });

    it("has a working getter for components", function() {

        var components = c.getComponents();

        expect( components ).toBeA( Array );
        expect( components.length ).toBe( 2 );
        expect( components[0] ).toBeA( ol.geom.Point );
        expect( components[1] ).toBeA( ol.geom.LineString );

        expect( components[0].getX() + ',' + components[0].getY()).toBe( '10,20' );
        expect( components[1].getVertices()[0].getX() + ',' + components[1].getVertices()[0].getY()).toBe( '47,11' );

    });

    it("has a working setter for components", function() {

        c.setComponents([
            new ol.geom.Point(30,40),
            new ol.geom.LineString([
                new ol.geom.Point(3,9),
                new ol.geom.Point(4,16)
            ])
        ]);

        var components = c.getComponents();

        expect( components.length ).toBe( 2 );
        expect( components[0] ).toBeA( ol.geom.Point );
        expect( components[1] ).toBeA( ol.geom.LineString );

        expect( components[0].getX() + ',' + components[0].getY()).toBe( '30,40' );
        expect( components[1].getVertices()[0].getX() + ',' + components[1].getVertices()[0].getY()).toBe( '3,9' );

    });

    it("has a method to add components", function() {

        c.addComponent(
            new ol.geom.Point(30,40),
            1
        );
        c.addComponent(
            new ol.geom.LineString([
                new ol.geom.Point(5,25),
                new ol.geom.Point(6,36)
            ]),
            0
        );

        var components = c.getComponents();

        expect( components.length ).toBe( 4 );
        expect( components[0].getVertices()[0].getX() + ',' + components[0].getVertices()[0].getY()).toBe( '5,25' );
        expect( components[1].getX() + ',' + components[1].getY()).toBe( '10,20' );
        expect( components[2].getX() + ',' + components[2].getY()).toBe( '30,40' );
        expect( components[3].getVertices()[0].getX() + ',' + components[3].getVertices()[0].getY()).toBe( '47,11' );

    });

    it("cannot add instances of 'ol.geom.Collection'", function(){
        expect(function(){
            c.addComponent(
                new ol.geom.Collection([
                    new ol.geom.Point(5,25),
                    new ol.geom.Point(6,36)
                ])
            );
        }).toThrow();
    });

    it("allows instances of 'ol.geom.Multi*' (even though these are subclasses of ol.geom.Collection)", function(){
        expect(function(){
            c.addComponent(
                new ol.geom.MultiPoint([
                    new ol.geom.Point(5,25),
                    new ol.geom.Point(6,36)
                ])
            );
        }).not.toThrow();
    });

    it("has a method to remove components", function() {
        c.setComponents([
            new ol.geom.Point(0,10),
            new ol.geom.Point(10,20),
            new ol.geom.Point(20,30),
            new ol.geom.Point(30,40)
        ]);

        var p = c.getComponents()[2]; // 20,30;

        c.removeComponent( p );

        var components = c.getComponents();

        expect( components.length ).toBe( 3 );
        expect( components[0].getX() + ',' + components[0].getY()).toBe( '0,10' );
        expect( components[1].getX() + ',' + components[1].getY()).toBe( '10,20' );
        expect( components[2].getX() + ',' + components[2].getY()).toBe( '30,40' );
    });

    describe("the getCentroid method is functional", function(){
        it("returns an instance of ol.geom.Point", function(){
            expect(c.getCentroid()).toBeA(ol.geom.Point);
        });

        it("does not choke when components returns a null centroid", function(){
            var centroid;
            expect(
                function(){
                    c.addComponent(new ol.geom.LineString([]));
                    centroid = c.getCentroid();
                }
            ).not.toThrow();

            expect(centroid).toBeA(ol.geom.Point);
        });

        it("has the expected coordinates", function(){
            c = new ol.geom.Collection([
                new ol.geom.Point(10,10),
                new ol.geom.Point(30,30),
                new ol.geom.LineString([
                    new ol.geom.Point(10,10),
                    new ol.geom.Point(10,30),
                    new ol.geom.Point(30,30),
                    new ol.geom.Point(30,10)
                ])
            ]);
            var centroid = c.getCentroid();
            expect(centroid.getX() + ',' + centroid.getY()).toBe('20,20');
        });
    });
});
