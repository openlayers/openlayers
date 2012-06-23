describe("ol.geom.MultiLineString", function() {

    var mls,
        formatPoint = function(p){
            return p.getX() + ',' + p.getY();
        },
        linestringNPointN = function(mls, i, j) {
            return formatPoint(mls.getLineStrings()[i].getVertices()[j]);
        };

    beforeEach(function(){
        mls = new ol.geom.MultiLineString([
            new ol.geom.LineString([
                new ol.geom.Point(10,10),
                new ol.geom.Point(10,0),
                new ol.geom.Point(20,20)
            ]),
            new ol.geom.LineString([
                new ol.geom.Point(30,10),
                new ol.geom.Point(30,0),
                new ol.geom.Point(40,20)
            ])
        ]);
    });

    afterEach(function(){
        mls = null;
    });

    it("constructs instances", function() {
        expect( mls ).toBeA( ol.geom.MultiLineString );
    });

    it("can construct instances without any linestrings", function() {
        // empty array
        mls = new ol.geom.MultiLineString([]);
        expect( mls ).toBeA( ol.geom.MultiLineString );

        // no argument at all
        mls = new ol.geom.MultiLineString();
        expect( mls ).toBeA( ol.geom.MultiLineString );
    });

    it("cannot be constructed with component-types other than 'ol.geom.Point'", function() {
        expect(function(){
            mls = new ol.geom.MultiLineString([
                new ol.geom.Point()
            ]);
        }).toThrow();

        expect(function(){
            mls = new ol.geom.MultiLineString([
                new ol.geom.MultiPoint([
                    new ol.geom.Point()
                ])
            ]);
        }).toThrow();
    });

    it("inherits from ol.geom.Geometry", function() {
        expect( mls ).toBeA( ol.geom.Geometry );
    });

    it("has a working getter for linestrings", function() {

        var linestrings = mls.getLineStrings();

        expect( linestrings ).toBeA( Array );
        expect( linestrings.length ).toBe( 2 );
        expect( linestrings[0] ).toBeA( ol.geom.LineString );

        expect( linestringNPointN(mls, 0, 0) ).toBe( '10,10' );

    });

    it("has a working setter for linestrings", function() {

        mls.setLineStrings([
            new ol.geom.LineString([
                new ol.geom.Point(-10,10),
                new ol.geom.Point(-10,0),
                new ol.geom.Point(-20,20)
            ])
        ]);

        var linestrings = mls.getLineStrings();

        expect( linestrings.length ).toBe( 1 );
        expect( linestrings[0] ).toBeA( ol.geom.LineString );

        expect( linestringNPointN(mls, 0, 0) ).toBe( '-10,10' );

    });

    it("has a method to add linestrings", function() {

        mls.addLineString(
            new ol.geom.LineString([
                new ol.geom.Point(11,11),
                new ol.geom.Point(11,1),
                new ol.geom.Point(21,21)
            ]),
            1
        );
        mls.addLineString(
            new ol.geom.LineString([
                new ol.geom.Point(9,9),
                new ol.geom.Point(9,-1),
                new ol.geom.Point(19,19)
            ]),
            0
        );
        mls.addLineString(
            new ol.geom.LineString([
                new ol.geom.Point(31,11),
                new ol.geom.Point(31,1),
                new ol.geom.Point(41,21)
            ]),
            4
        );

        var linestrings = mls.getLineStrings();

        expect( linestrings.length ).toBe( 5 );
        expect( linestringNPointN(mls, 0, 0) ).toBe( '9,9' );
        expect( linestringNPointN(mls, 1, 0) ).toBe( '10,10' );
        expect( linestringNPointN(mls, 2, 0) ).toBe( '11,11' );
        expect( linestringNPointN(mls, 3, 0) ).toBe( '30,10' );
        expect( linestringNPointN(mls, 4, 0) ).toBe( '31,11' );
    });

    it("has a method to remove linestrings", function() {
        mls.setLineStrings([
            new ol.geom.LineString([
                new ol.geom.Point(9,9),
                new ol.geom.Point(9,-1),
                new ol.geom.Point(19,19)
            ]),
            new ol.geom.LineString([
                new ol.geom.Point(10,10),
                new ol.geom.Point(10,0),
                new ol.geom.Point(20,20)
            ]),
            new ol.geom.LineString([
                new ol.geom.Point(11,11),
                new ol.geom.Point(11,1),
                new ol.geom.Point(21,21)
            ])
        ]);

        var ls = mls.getLineStrings()[1]; // p1: 10,10;

        mls.removeLineString( ls );

        var linestrings = mls.getLineStrings();

        expect( linestrings.length ).toBe( 2 );

        expect( linestringNPointN(mls, 0, 0) ).toBe( '9,9' );
        expect( linestringNPointN(mls, 1, 0) ).toBe( '11,11' );

    });

    describe('The setters ensure only linestrings can be added', function(){

        it('addLineString cannot be tricked', function(){
            expect(function(){
                mls.addLineString(
                    new ol.geom.Point(30,40)
                );
            }).toThrow();

            expect(function(){
                mls.addLineString(
                    new ol.geom.MultiPoint()
                );
            }).toThrow();

            expect(function(){
                mls.addLineString(
                    new ol.geom.Collection()
                );
            }).toThrow();

        });

        it('addComponent cannot be tricked', function(){
            expect(function(){
                mls.addComponent(
                    new ol.geom.Point(30,40)
                );
            }).toThrow();

            expect(function(){
                mls.addComponent(
                    new ol.geom.MultiPoint()
                );
            }).toThrow();

            expect(function(){
                mls.addComponent(
                    new ol.geom.Collection()
                );
            }).toThrow();
        });

    });

    describe("the getCentroid method is functional", function(){
        it("returns an instance of ol.geom.Point", function(){
            expect(mls.getCentroid()).toBeA(ol.geom.Point);
        });

        it("has the expected coordinates", function(){
            mls.setLineStrings([
                new ol.geom.LineString([
                    new ol.geom.Point(0,40),
                    new ol.geom.Point(40,40)
                ]),
                new ol.geom.LineString([
                    new ol.geom.Point(0,0),
                    new ol.geom.Point(40,40)
                ])
            ]);
            var c = mls.getCentroid();
            expect( formatPoint(c) ).toBe('20,20');
        });
    });
});
