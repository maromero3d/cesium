/*global define*/
define(['../Core/createGuid',
        '../Core/Cartographic',
        '../Core/ClockRange',
        '../Core/ClockStep',
        '../Core/DeveloperError',
        '../Core/RuntimeError',
        '../Core/Ellipsoid',
        '../Core/Event',
        '../Core/Iso8601',
        '../Core/loadXML',
        './DynamicClock',
        './DynamicObjectCollection'
        ], function(
                createGuid,
                Cartographic,
                ClockRange,
                ClockStep,
                DeveloperError,
                RuntimeError,
                Ellipsoid,
                Event,
                Iso8601,
                loadXML,
                DynamicClock,
                DynamicObjectCollection) {
    "use strict";

    //Copied from GeoJsonDataSource
    var ConstantPositionProperty = function(value) {
        this._value = value;
    };

    ConstantPositionProperty.prototype.getValueCartesian = function(time, result) {
        var value = this._value;
        if (typeof value.clone === 'function') {
            return value.clone(result);
        }
        return value;
    };

    ConstantPositionProperty.prototype.setValue = function(value) {
        this._value = value;
    };

    function createObject(kml, dynamicObjectCollection) {
        var id = kml.id;
        if (typeof id === 'undefined') {
            id = createGuid();
        } else {
            var i = 2;
            var finalId = id;
            while (typeof dynamicObjectCollection.getObject(finalId) !== 'undefined') {
                finalId = id + "_" + i;
                i++;
            }
            id = finalId;
        }
        var dynamicObject = dynamicObjectCollection.getOrCreateObject(id);
        dynamicObject.kml = kml;
        return dynamicObject;
    }

    function readCoords(el) {
        var text = "", coords = [], i;
        for (i = 0; i < el.childNodes.length; i++) {
            text = text + el.childNodes[i].nodeValue;
        }
        text = text.split(/[\s\n]+/);
        for (i = 0; i < text.length; i++) {
            var ll = text[i].split(',');
            if (ll.length < 2) {
                continue;
            }
            coords.push(ll[0]);
            coords.push(ll[1]);

            if(ll[2] === "0"){
                coords.push(0);
            }
        }
        return coords;
    }

    // KML processing functions
    function processPlacemark(dataSource, placemark, dynamicObjectCollection) {
        var objectId = placemark.id;
        if (typeof objectId === 'undefined') {
            objectId = createGuid();
        }
        dynamicObjectCollection.getOrCreateObject(objectId);

        // I want to iterate over every placemark
        for(var i = 0, len = placemark.childNodes.length; i < len; i++){
            var node = placemark.childNodes.item(i);
            //Does the node hold a supported Geometry type?
            if(geometryTypes.hasOwnProperty(node.nodeName)){
                placemark.geometry = node.nodeName;
                var geometryType = placemark.geometry;
                var geometryHandler = geometryTypes[geometryType];
                if (typeof geometryHandler === 'undefined') {
                    throw new RuntimeError('Unknown geometry type: ' + geometryType);
                }
                geometryHandler(dataSource, placemark, node);
            }
        }
    }

    function processPoint(dataSource, kml, node) {
        var el = node.getElementsByTagName('coordinates');
        var coords = [];
        for (var j = 0; j < el.length; j++) {
        // text might span many childnodes
        coords = coords.concat(readCoords(el[j]));
        }

        var cartographic = Cartographic.fromDegrees(coords[0], coords[1], coords[2]);
        var cartesian3 = Ellipsoid.WGS84.cartographicToCartesian(cartographic);

    }

    function processLineString(dataSource, kml, node){

    }

    function processLinearRing(dataSource, kml, node){

    }

    function processPolygon(dataSource, kml, node){

    }

    function processMultiGeometry(dataSource, kml, node){

    }

    function processModel(dataSource, kml, node){

    }

    function processGxTrack(dataSource, kml, node){

    }

    function processGxMultiTrack(dataSource, kml, node){

    }
    //Object that holds all supported Geometry
    var geometryTypes = {
            Point : processPoint,
            LineString : processLineString,
            LinearRing : processLinearRing,
            Polygon : processPolygon,
            MultiGeometry : processMultiGeometry,
            Model : processModel,
            gxTrack : processGxTrack,
            gxMultitrack : processGxMultiTrack
        };

    //First, create a function that takes a styleNode and creates equivalent dynamic object properties.
    function processStyle(styleNode, dynamicObject) {
//
//        if(style has IconStyle)   {
//
//          dynamicObject.billboard = new DynamicBillboard();
//
//         //Map style to billboard properties
//
//       }
//
//        if(style has LabelStyle)   {
//
//          dynamicObject.label = new DynamicLabel();
//
//         //Map style to label properties
//
//       }
//
//        if(style has LineStyle)   {
//
//          dynamicObject.polyline = new DynamicPolyline();
//
//         //Map style to line properties
//
//       }
//
//        if(style has PolyStyle)   {
//
//          dynamicObject.polygon = new DynamicPolygon();
//
//         //Map style to polygon properties
//
//       }
//
//    }
//
//
//
//    //On load, iterate over all styles
//
//    //Keep a special collection just for styles.
//
//    var  styleCollection = new DynamicObjectCollection();
//
//
//
//    For each (style in list of stylesNodes) {
//
//       var styleObject = styleCollection.getOrCreateObject(style.id);
//
//      processStyle(style, styleObject);
//
//    }
//
//
//
//    //Then, when iterating placemarks you do something like this
//
//    If(placemark node has embedded style) {
//
//       //process the style directly
//
//      processStyle(styleNode, placemarkDynamicObject);
//
//    } else {
//
//      //Shared style uri, so get the already processed style and merge it with this object.
//
//      var styleObject = styleCollection.getObject(style Uri);
//
//       placemarkDynamicObject.merge(styleObject);

    }

    function processFolder(){

    }

    function loadKML(dataSource, kml, sourceUri) {
        var dynamicObjectCollection = dataSource._dynamicObjectCollection;

        if (typeof kml === 'undefined') {
            throw new DeveloperError('kml is required.');
        }
        if (typeof dynamicObjectCollection === 'undefined') {
            throw new DeveloperError('dynamicObjectCollection is required.');
        }

        var array = kml.getElementsByTagName('Folder');
        for ( var i = 0, len = array.length; i < len; i++){
            processFolder(dataSource, array[i], dynamicObjectCollection);
        }

        array = kml.getElementsByTagName('Placemark');
        for (i = 0, len = array.length; i < len; i++){
            processPlacemark(dataSource, array[i], dynamicObjectCollection);
        }

        /*
        var availability = dynamicObjectCollection.computeAvailability();

        var clock;
        var documentObject = dynamicObjectCollection.getObject('document');
        if (typeof documentObject !== 'undefined' && typeof documentObject.clock !== 'undefined') {
            clock = new DynamicClock();
            clock.startTime = documentObject.clock.startTime;
            clock.stopTime = documentObject.clock.stopTime;
            clock.clockRange = documentObject.clock.clockRange;
            clock.clockStep = documentObject.clock.clockStep;
            clock.multiplier = documentObject.clock.multiplier;
            clock.currentTime = documentObject.clock.currentTime;
        } else if (!availability.start.equals(Iso8601.MINIMUM_VALUE)) {
            clock = new DynamicClock();
            clock.startTime = availability.start;
            clock.stopTime = availability.stop;
            clock.clockRange = ClockRange.LOOP_STOP;
            var totalSeconds = clock.startTime.getSecondsDifference(clock.stopTime);
            var multiplier = Math.round(totalSeconds / 120.0);
            clock.multiplier = multiplier;
            clock.currentTime = clock.startTime;
            clock.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
        }
        return clock;*/
    }



    /**
     * A {@link DataSource} which processes KML.
     * @alias KmlDataSource
     * @constructor
     */
    var KmlDataSource = function(){
        this._changed = new Event();
        this._error = new Event();
        this._clock = undefined;
        this._dynamicObjectCollection = new DynamicObjectCollection();
        this._timeVarying = true;
    };

    /* The following functions were copied from CzmlDataSource.js, just replaced CZML with KML */
    /**
     * Gets an event that will be raised when non-time-varying data changes
     * or if the return value of getIsTimeVarying changes.
     * @memberof DataSource
     *
     * @returns {Event} The event.
     */
    KmlDataSource.prototype.getChangedEvent = function() {
        return this._changed;
    };

    /**
     * Gets an event that will be raised if an error is encountered during processing.
     * @memberof KmlDataSource
     *
     * @returns {Event} The event.
     */
    KmlDataSource.prototype.getErrorEvent = function() {
        return this._error;
    };

    /**
     * Gets the top level clock defined in KML or the availability of the
     * underlying data if no clock is defined.  If the KML document only contains
     * infinite data, undefined will be returned.
     * @memberof KmlDataSource
     *
     * @returns {DynamicClock} The clock associated with the current KML data, or undefined if none exists.
     */
    KmlDataSource.prototype.getClock = function() {
        return undefined;
    };

    /**
     * Gets the DynamicObjectCollection generated by this data source.
     * @memberof DataSource
     *
     * @returns {DynamicObjectCollection} The collection of objects generated by this data source.
     */
    KmlDataSource.prototype.getDynamicObjectCollection = function() {
        return this._dynamicObjectCollection;
    };

    /**
     * Gets a value indicating if the data varies with simulation time.  If the return value of
     * this function changes, the changed event will be raised.
     * @memberof DataSource
     *
     * @returns {Boolean} True if the data is varies with simulation time, false otherwise.
     */
    KmlDataSource.prototype.getIsTimeVarying = function() {
        return false;
    };

    /**
     * Replaces any existing data with the provided KML.
     *
     * @param {Object} KML The KML to be processed.
     * @param {String} source The source of the KML.
     *
     * @exception {DeveloperError} KML is required.
     */
    KmlDataSource.prototype.load = function(kml, source) {
        if (typeof kml === 'undefined') {
            throw new DeveloperError('kml is required.');
        }

        this._dynamicObjectCollection.clear();
        loadKML(this, kml, source);
    };


    /**
     * Asynchronously loads the KML at the provided url, replacing any existing data.
     *
     * @param {Object} url The url to be processed.
     *
     * @returns {Promise} a promise that will resolve when the KML is processed.
     *
     * @exception {DeveloperError} url is required.
     */
    KmlDataSource.prototype.loadUrl = function(url) {
        if (typeof url === 'undefined') {
            throw new DeveloperError('url is required.');
        }

        var dataSource = this;
        return loadXML(url).then(function(kml) {
            dataSource.load(kml, url);
        }, function(error) {
            this._error.raiseEvent(this, error);
        });
    };


    return KmlDataSource;
});