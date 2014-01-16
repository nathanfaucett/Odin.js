if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        function Axis(opts) {
            opts || (opts = {});

            this.name = opts.name != undefined ? opts.name : "unknown";

            this.negButton = opts.negButton != undefined ? opts.negButton : "";
            this.posButton = opts.posButton != undefined ? opts.posButton : "";

            this.altNegButton = opts.altNegButton != undefined ? opts.altNegButton : "";
            this.altPosButton = opts.altPosButton != undefined ? opts.altPosButton : "";

            this.gravity = opts.gravity != undefined ? opts.gravity : 3;
            this.sensitivity = opts.sensitivity != undefined ? opts.sensitivity : 3;

            this.dead = opts.dead != undefined ? opts.dead : 0.001;

            this.type = opts.type != undefined ? opts.type : Axis.BUTTON;
            this.axis = opts.axis != undefined ? opts.axis : "x";
            this.index = opts.index != undefined ? opts.index : 0;

            this.joyNum = opts.joyNum != undefined ? opts.joyNum : 0;

            this.value = 0;

            this._SYNC = {};
        };


        Axis.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.name = this.name;
            json.value = this.value;

            return json;
        };


        Axis.prototype.fromSYNC = function(json) {

            this.name = json.name;
            this.value = json.value;

            return this;
        };


        Axis.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;

            json.negButton = this.negButton;
            json.posButton = this.posButton;

            json.altNegButton = this.altNegButton;
            json.altPosButton = this.altPosButton;

            json.gravity = this.gravity;
            json.sensitivity = this.sensitivity;

            json.dead = this.dead;

            json.type = this.type;
            json.axis = this.axis;
            json.index = this.index;

            json.joyNum = this.joyNum;

            json.value = this.value;

            return json;
        };


        Axis.prototype.fromJSON = function(json) {

            this.name = json.name;

            this.negButton = json.negButton;
            this.posButton = json.posButton;

            this.altNegButton = json.altNegButton;
            this.altPosButton = json.altPosButton;

            this.gravity = json.gravity;
            this.sensitivity = json.sensitivity;

            this.dead = json.dead;

            this.type = json.type;
            this.axis = json.axis;
            this.index = json.index;

            this.joyNum = json.joyNum;

            this.value = json.value;

            return this;
        };


        Axis.BUTTON = 1;
        Axis.MOUSE = 2;
        Axis.TOUCH = 3;
        Axis.MOUSE_WHEEL = 4;
        Axis.JOYSTICK = 5;


        return Axis;
    }
);
