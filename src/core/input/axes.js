if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "core/enums",
        "core/input/axis",
        "core/game/log"
    ],
    function(Enums, Axis, Log) {
        "use strict";


        var AxisType = Enums.AxisType;


        function Axes() {

            Array.call(this);

            this.hash = {};
            this._SYNC = {};

            this.add({
                name: "horizontal",
                posButton: "right",
                negButton: "left",
                altPosButton: "d",
                altNegButton: "a",
                type: AxisType.Button
            });

            this.add({
                name: "vertical",
                posButton: "up",
                negButton: "down",
                altPosButton: "w",
                altNegButton: "s",
                type: AxisType.Button
            });

            this.add({
                name: "fire",
                posButton: "ctrl",
                negButton: "",
                altPosButton: "mouse0",
                altNegButton: "",
                type: AxisType.Button
            });

            this.add({
                name: "jump",
                posButton: "space",
                negButton: "",
                altPosButton: "mouse2",
                altNegButton: "",
                type: AxisType.Button
            });

            this.add({
                name: "mouseX",
                type: AxisType.Mouse,
                axis: "x"
            });

            this.add({
                name: "mouseY",
                type: AxisType.Mouse,
                axis: "y"
            });

            this.add({
                name: "touchX",
                type: AxisType.Touch,
                axis: "x"
            });

            this.add({
                name: "touchY",
                type: AxisType.Touch,
                axis: "y"
            });

            this.add({
                name: "mouseWheel",
                type: AxisType.MouseWheel
            });
        }

        Axes.prototype = Object.create(Array.prototype);
        Axes.prototype.constructor = Axes;


        Axes.prototype.add = function(name, opts) {
            if (typeof(name) === "object") {
                opts = name;
                name = opts.name;
            }
            if (this.hash[name]) {
                Log.warn("Axes.add: Axes already have Axis named " + name);
                return undefined;
            }
            opts || (opts = {});
            opts.name = name;
            var axis = new Axis(opts);

            this.push(axis);
            this.hash[name] = axis;

            return axis;
        };


        Axes.prototype.get = function(name) {

            return this.hash[name];
        };


        Axes.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var jsonAxes = json.axes || (json.axes = []),
                i;

            for (i = this.length; i--;) jsonAxes[i] = this[i].toSYNC(jsonAxes[i]);
            return json;
        };


        Axes.prototype.fromSYNC = function(json) {
            var axisHash = this.hash,
                jsonAxes = json.axes || (json.axes = []),
                axis, jsonAxis,
                i;

            for (i = jsonAxes.length; i--;) {
                jsonAxis = jsonAxes[i];

                if ((axis = axisHash[jsonAxis.name])) {
                    axis.fromSYNC(jsonAxis);
                } else {
                    this.add(jsonAxis.name).fromJSON(jsonAxis);
                }
            }

            return this;
        };


        Axes.prototype.toJSON = function(json) {
            json || (json = {});
            var jsonAxes = json.axes || (json.axes = []),
                i;

            for (i = this.length; i--;) jsonAxes[i] = this[i].toJSON(jsonAxes[i]);
            return json;
        };


        Axes.prototype.fromJSON = function(json) {
            var axisHash = this.hash,
                jsonAxes = json.axes || (json.axes = []),
                axis, jsonAxis,
                i;

            for (i = jsonAxes.length; i--;) {
                jsonAxis = jsonAxes[i];

                if ((axis = axisHash[jsonAxis.name])) {
                    axis.fromJSON(jsonAxis);
                } else {
                    this.add(jsonAxis.name).fromJSON(jsonAxis);
                }
            }

            return this;
        };


        return Axes;
    }
);
