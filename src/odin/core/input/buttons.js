define([
		"odin/base/time",
        "odin/core/input/button"
    ],
    function(Time, Button) {
        "use strict";
		
		
		var MOUSE0 = "mouse0",
			MOUSE1 = "mouse1",
			MOUSE2 = "mouse2";
		

        function Buttons() {
			
			this.buttons = [];
			this._buttonHash = {};
			
			this.add("mouse0");
			this.add("mouse1");
			this.add("mouse2");
			
			this._SYNC = {};
        }


        Buttons.prototype.add = function(name) {
            if (this._buttonHash[name]) {
				console.warn("Buttons.add: Buttons already have Button name "+ name);
				return undefined;
			}
			var button = new Button(name);
			
			this.buttons.push(button);
			this._buttonHash[name] = button;
			
			return button;
        };
		
		
        Buttons.prototype.mouse = function(id) {
			
			switch (id) {
				case 0:
					return this._buttonHash[MOUSE0];
				case 1:
					return this._buttonHash[MOUSE1];
				case 2:
					return this._buttonHash[MOUSE2];
				default:
					break;
			}
			
			return undefined;
        };


        Buttons.prototype.get = function(name) {
			
			return this._buttonHash[name];
        };


        Buttons.prototype.on = function(name) {
            var button = this._buttonHash[name] || this.add(name);

            if (button._first) {
                button.frameDown = Time.frameCount + 1;
                button.timeDown = Time.stamp();
                button._first = false;
            }
            button.value = true;
        };


        Buttons.prototype.off = function(name) {
            var button = this._buttonHash[name] || this.add(name);

            button.frameUp = Time.frameCount + 1;
            button.timeUp = Time.stamp();
            button.value = false;
            button._first = true;
        };

		
		Buttons.prototype.toSYNC = function(json) {
			json || (json = this._SYNC);
			var buttons = this.buttons,
				jsonButtons = json.buttons || (json.buttons = []),
				i;
			
			for (i = buttons.length; i--;) jsonButtons[i] = buttons[i].toSYNC(jsonButtons[i]);
			return json;
		};

		
		Buttons.prototype.fromSYNC = function(json) {
			var buttonHash = this._buttonHash,
				jsonButtons = json.buttons || (json.buttons = []),
				button, jsonButton,
				i;
			
			for (i = jsonButtons.length; i--;) {
				jsonButton = jsonButtons[i];
				
				if ((button = buttonHash[jsonButton.name])) {
					button.fromSYNC(jsonButton);
				} else {
					this.add(jsonButton.name).fromJSON(jsonButton);
				}
			}
			
			return this;
		};

		
		Buttons.prototype.toJSON = function(json) {
			json || (json = {});
			var buttons = this.buttons,
				jsonButtons = json.buttons || (json.buttons = []),
				i;
			
			for (i = buttons.length; i--;) jsonButtons[i] = buttons[i].toJSON(jsonButtons[key]);
			return json;
		};

		
		Buttons.prototype.fromJSON = function(json) {
			var buttonHash = this._buttonHash,
				jsonButtons = json.buttons || (json.buttons = []),
				button, jsonButton,
				i;
			
			for (i = jsonButtons.length; i--;) {
				jsonButton = jsonButtons[i];
				
				if ((button = buttonHash[jsonButton.name])) {
					button.fromJSON(jsonButton);
				} else {
					this.add(jsonButton.name).fromJSON(jsonButton);
				}
			}
			
			return this;
		};


        return Buttons;
    }
);
