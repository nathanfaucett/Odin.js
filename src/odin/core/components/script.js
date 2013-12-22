if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "odin/base/class",
        "odin/core/components/component"
    ],
    function(Class, Component) {
        "use strict";
		

        function Script(opts) {
            opts || (opts = {});

            Component.call(this, opts.name || "Script", opts.sync, opts.json);
        }

        Class.extend(Script, Component);


        Script.prototype.copy = function(other) {

            return this;
        };


        Script.prototype.toSYNC = function(json) {
			json = Component.prototype.toSYNC.call(this, json);

            return json;
        };


        Script.prototype.fromSYNC = function(json) {
			Component.prototype.fromSYNC.call(this, json);

            return this;
        };


        Script.prototype.toJSON = function(json) {
			json || (json = {});
			Component.prototype.toJSON.call(this, json);

            return json;
        };


        Script.prototype.fromJSON = function(json) {
			Component.prototype.fromJSON.call(this, json);
			
			return this;
        };


        Script.prototype.sort = function(a, b) {

            return a === b ? -1 : 1;
        };


        return Script;
    }
);
