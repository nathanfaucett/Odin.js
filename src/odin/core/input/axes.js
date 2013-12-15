define([
        "odin/core/input/axis",
    ],
    function(Axis) {
        "use strict";
        
		
		var BUTTON = Axis.BUTTON,
			MOUSE = Axis.MOUSE,
			MOUSE_WHEEL = Axis.MOUSE_WHEEL,
			JOYSTICK = Axis.JOYSTICK;
		

        function Axes() {
            
            this.axes = [];
            this._axisHash = {};
			
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
				name: "mouseWheel",
				type: MOUSE_WHEEL
			});
        }


        Axes.prototype.add = function(name, opts) {
			if (typeof(name) === "object") {
				opts = name;
				name = opts.name;
			}
            if (this._axisHash[name]) {
				console.warn("Axes.add: Axes already have Axis name "+ name);
				return undefined;
			}
			opts || (opts = {});
			opts.name = name;
			var axis = new Axis(opts);
			
			this.axes.push(axis);
			this._axisHash[name] = axis;
			
			return axis;
        };


        Axes.prototype.get = function(name) {
			
			return this._axisHash[name];
        };

		
		Axes.prototype.toSYNC = function(json) {
			json || (json = this._SYNC);
			var axes = this.axes,
				jsonAxes = json.axes || (json.axes = []),
				i;
			
			for (i = axes.length; i--;) jsonAxes[i] = axes[i].toSYNC(jsonAxes[i]);
			return json;
		};


		Axes.prototype.fromSYNC = function(json) {
			var axisHash = this._axisHash,
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
			var axes = this.axes,
				jsonAxes = json.axes || (json.axes = []),
				i;
			
			for (i = axes.length; i--;) jsonAxes[i] = axes[i].toJSON(jsonAxes[i]);
			return json;
		};


		Axes.prototype.fromJSON = function(json) {
			var axisHash = this._axisHash,
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
