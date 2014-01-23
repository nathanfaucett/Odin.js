if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/time",
        "odin/core/components/component",
        "odin/core/components/particle_system/emitter",
        "odin/core/components/particle_system/emitter_2d",
        "odin/core/components/particle_system/tween"
    ],
    function(Class, Time, Component, Emitter, Emitter2D, Tween) {
        "use strict";


        /**
         * @class ParticleSystem
         * @extends Component
         * @brief 2d particle emitter
         * @param Object options
         */
        function ParticleSystem(opts) {
            opts || (opts = {});

            Component.call(this, "ParticleSystem", opts);

            /**
             * @property Boolean playing
             * @memberof ParticleSystem
             */
            this.playing = opts.playing != undefined ? opts.playing : true;

            /**
             * @property Array emitters
             * @memberof ParticleSystem
             */
            this.emitters = [];
            this._emitterHash = {};
            this._emitterServerHash = {};

            if (opts.emitter) this.addEmitter(opts.emitter);
            if (opts.emitters) this.add.apply(this, opts.emitters);
        }

        ParticleSystem.type = "ParticleSystem";
        Component.extend(ParticleSystem);


        ParticleSystem.Emitter = Emitter;
        ParticleSystem.Emitter2D = Emitter2D;
        ParticleSystem.Tween = Tween;


        ParticleSystem.prototype.copy = function(other) {
            var otherEmitters = other.emitters,
                i = 0,
                il = otherEmitters.length;;

            this.clear();

            for (; i < il; i++) this.addEmitter(otherEmitters[i].clone());
            this.playing = other.playing;

            return this;
        };


        ParticleSystem.prototype.clear = function() {
            var emitters = this.emitters,
                i = emitters.length;;

            for (; i--;) this.removeEmitter(emitters[i]);
            return this;
        };


        ParticleSystem.prototype.addEmitter = function(emitter) {
            var emitters = this.emitters,
                index = emitters.indexOf(emitter);

            if (index === -1) {
                if (emitter.particleSystem) emitter = emitter.clone();

                emitter.particleSystem = this;
                emitters.push(emitter);
                this._emitterHash[emitter._id] = emitter;
                if (emitter._serverId !== -1) this._emitterHash[emitter._serverId] = emitter;
            } else {
                Log.error("ParticleSystem.addEmitter: ParticleSystem already has passed Emitter");
            }

            return this;
        };


        ParticleSystem.prototype.add = function() {

            for (var i = arguments.length; i--;) this.addEmitter(arguments[i]);
            return this;
        };


        ParticleSystem.prototype.removeEmitter = function(emitter) {
            var emitters = this.emitters,
                index = emitters.indexOf(emitter);

            if (index !== -1) {
                emitters.splice(index, 1);
                this._emitterHash[emitter._id] = undefined;
                if (emitter._serverId !== -1) this._emitterHash[emitter._serverId] = undefined;

                emitter.clear();
                emitter.particleSystem = undefined;
                emitter.transform = undefined;
            } else {
                Log.error("ParticleSystem.removeEmitter: ParticleSystem does not have passed Emitter");
            }

            return this;
        };


        ParticleSystem.prototype.remove = function() {

            for (var i = arguments.length; i--;) this.removeEmitter(arguments[i]);
            return this;
        };


        ParticleSystem.prototype.findEmitterById = function(id) {

            return this._emitterHash[id];
        };


        ParticleSystem.prototype.findEmitterByServerId = function(id) {

            return this._emitterServerHash[id];
        };


        /**
         * @method play
         * @memberof ParticleSystem
         */
        ParticleSystem.prototype.play = function() {
            var emitters = this.emitters,
                i;

            for (i = emitters.length; i--;) emitters[i].play();
            this.playing = true;

            return this;
        };


        ParticleSystem.prototype.update = function() {
            if (this.isServer || !this.playing) return;

            var dt = Time.delta,
                emitters = this.emitters,
                emitter, playing = false,
                i;

            for (i = emitters.length; i--;) {
                emitter = emitters[i];
                emitter.update(dt);
                if (emitter.playing) playing = true;
            }

            this.playing = playing;
        };


        ParticleSystem.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);
            var emitters = this.emitters,
                jsonEmitters = json.emitters || (json.emitters = []),
                i = 0,
                il = emitters.length;

            for (; i < il; i++) {
                jsonEmitters[i] = emitters[i].toJSON(jsonEmitters[i]);
            }
            json.playing = this.playing;

            return json;
        };


        ParticleSystem.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);
            var jsonEmitters = json.emitters,
                emitter, jsonEmitter,
                i = 0,
                il = jsonEmitters.length;

            for (; i < il; i++) {
                jsonEmitter = jsonEmitters[i];

                if ((emitter = this.findEmitterByServerId(jsonEmitter._id))) {
                    emitter.fromServerJSON(jsonEmitter);
                } else {
                    this.addEmitter(Class.fromServerJSON(jsonEmitter));
                }
            }
            this.playing = json.playing;

            return this;
        };


        ParticleSystem.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);
            var jsonEmitters = json.emitters,
                emitter, jsonEmitter,
                i = 0,
                il = jsonEmitters.length;

            for (; i < il; i++) {
                jsonEmitter = jsonEmitters[i];

                if ((emitter = this.findEmitterById(jsonEmitter._id))) {
                    emitter.fromJSON(jsonEmitter);
                } else {
                    this.addEmitter(Class.fromJSON(jsonEmitter));
                }
            }
            this.playing = json.playing;

            return this;
        };


        return ParticleSystem;
    }
);
