if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/time",
        "core/input/button",
        "core/game/log"
    ],
    function(Time, Button, Log) {
        "use strict";


        function Buttons() {

            Array.call(this);

            this.hash = {};
            this._SYNC = {};

            this.add("mouse0");
            this.add("mouse1");
            this.add("mouse2");
        }

        Buttons.prototype = Object.create(Array.prototype);
        Buttons.prototype.constructor = Buttons;


        Buttons.prototype.add = function(name) {
            if (this.hash[name]) {
                Log.warn("Buttons.add: Buttons already have Button name " + name);
                return undefined;
            }
            var button = new Button(name);

            this.push(button);
            this.hash[name] = button;

            return button;
        };


        Buttons.prototype.get = function(name) {

            return this.hash[name];
        };


        Buttons.prototype.on = function(name) {
            var button = this.hash[name] || this.add(name);

            if (button._first) {
                button.frameDown = Time.frameCount + 1;
                button.timeDown = Time.stamp();
                button._first = false;
            }
            button.value = true;
        };


        Buttons.prototype.off = function(name) {
            var button = this.hash[name] || this.add(name);

            button.frameUp = Time.frameCount + 1;
            button.timeUp = Time.stamp();
            button.value = false;
            button._first = true;
        };


        Buttons.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var jsonButtons = json.buttons || (json.buttons = []),
                i;

            for (i = this.length; i--;) jsonButtons[i] = this[i].toSYNC(jsonButtons[i]);
            return json;
        };


        Buttons.prototype.fromSYNC = function(json) {
            var buttonHash = this.hash,
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
            var jsonButtons = json.buttons || (json.buttons = []),
                i;

            for (i = this.length; i--;) jsonButtons[i] = this[i].toJSON(jsonButtons[key]);
            return json;
        };


        Buttons.prototype.fromJSON = function(json) {
            var buttonHash = this.hash,
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
