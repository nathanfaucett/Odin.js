if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset",
        "odin/core/game/log"
    ],
    function(Asset, Log) {
        "use strict";


        var VERTEX = /(#VERTEX)([\s\S]*)(?=#VERTEX_END)/,
            FRAGMENT = /(#FRAGMENT)([\s\S]*)(?=#FRAGMENT_END)/;


        function Shader(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.vertex = opts.vertex || "void main(void) {}";
            this.fragment = opts.fragment || "void main(void) {}";
        }

        Asset.extend(Shader);


        Shader.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);
            var vertex = raw.match(VERTEX),
                fragment = raw.match(FRAGMENT);

            if (!vertex || !fragment) {
                Log.error("Shader.parse: failed to parse shader");
                return this;
            }

            this.vertex = vertex[2].trim();
            this.fragment = fragment[2].trim();

            return this;
        };


        Shader.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            this.vertex = "";
            this.fragment = "";

            return this;
        };


        Shader.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            json.vertex = this.vertex;
            json.fragment = this.fragment;

            return json;
        };


        Shader.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            this.vertex = json.vertex;
            this.fragment = json.fragment;

            return this;
        };


        return Shader;
    }
);
