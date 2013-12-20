if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "odin/core/input/axis",
		"odin/core/game/log"
    ],
    function(Axis, Log) {
        "use strict";
        
		
		var BUTTON = Axis.BUTTON,
			MOUSE = Axis.MOUSE,
			TOUCH = Axis.TOUCH,
			MOUSE_WHEEL = Axis.MOUSE_WHEEL,
			JOYSTICK = Axis.JOYSTICK;
		

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
				type: BUTTON
			});
			
			this.add({
				name: "vertical",
				posButton: "up",
				negButton: "down",
				altPosButton: "w",
				altNegButton: "s",
				type: BUTTON
			});
			
			this.add({
				name: "fire",
				posButton: "ctrl",
				negButton: "",
				altPosButton: "mouse0",
				altNegButton: "",
				type: BUTTON
			});
			
			this.add({
				name: "jump",
				posButton: "space",
				negButton: "",
				altPosButton: "mouse2",
				altNegButton: "",
				type: BUTTON
			});
			
			this.add({
				name: "mouseX",
				type: MOUSE,
				axis: "x"
			});
			
			this.add({
				name: "mouseY",
				type: MOUSE,
				axis: "y"
			});
			
			this.add({
				name: "touchX",
				type: TOUCH,
				axis: "x"
			});
			
			this.add({
				name: "touchY",
				type: TOUCH,
				axis: "y"
			});
			
			this.add({
				name: "mouseWheel",
				type: MOUSE_WHEEL
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
				Log.warn("Axes.add: Axes already have Axis named "+ name);
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
