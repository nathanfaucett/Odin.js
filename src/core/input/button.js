if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define(
    function() {
        "use strict";


        function Button(name) {
            this.name = name;

            this.timeDown = -1;
            this.timeUp = -1;

            this.frameDown = -1;
            this.frameUp = -1;

            this.value = false;
            this._first = true;

            this._SYNC = {};
        };


        Button.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.name = this.name;
            json.timeDown = this.timeDown;
            json.timeUp = this.timeUp;
            json.frameDown = this.frameDown;
            json.frameUp = this.frameUp;
            json.value = this.value;

            return json;
        };


        Button.prototype.fromSYNC = function(json) {

            this.name = json.name;
            this.timeDown = json.timeDown;
            this.timeUp = json.timeUp;
            this.frameDown = json.frameDown;
            this.frameUp = json.frameUp;
            this.value = json.value;

            return this;
        };


        Button.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;
            json.timeDown = this.timeDown;
            json.timeUp = this.timeUp;
            json.frameDown = this.frameDown;
            json.frameUp = this.frameUp;
            json.value = this.value;

            return json;
        };


        Button.prototype.fromJSON = function(json) {

            this.name = json.name;
            this.timeDown = json.timeDown;
            this.timeUp = json.timeUp;
            this.frameDown = json.frameDown;
            this.frameUp = json.frameUp;
            this.value = json.value;

            return this;
        };


        return Button;
    }
);
