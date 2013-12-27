if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "base/object_pool",
        "base/time",
        "math/mathf",
        "math/vec2",
        "math/color",
        "core/components/component"
    ],
    function(Class, ObjectPool, Time, Mathf, Vec2, Color, Component) {
        "use strict";


        var OBJECT = {},
            PI = Math.PI,
            TWO_PI = PI * 2,

            sqrt = Math.sqrt,
            random = Math.random,
            randInt = Mathf.randInt,
            randFloat = Mathf.randFloat,
            clampTop = Mathf.clampTop,

            PARTICLE_POOL = Emitter2D.PARTICLE_POOL = new ObjectPool(Particle2D);

        /**
         * @class Emitter2D
         * @extends Component
         * @brief 2d particle emitter
         * @param Object options
         */
        function Emitter2D(opts) {
            opts || (opts = OBJECT);

            Component.call(this, "Emitter2D", opts.sync != undefined ? !! opts.sync : false, opts.json);

            /**
             * @property Boolean worldSpace
             * @memberof Emitter2D
             */
            this.worldSpace = opts.worldSpace != undefined ? opts.worldSpace : true;

            /**
             * @property Vec2 offset
             * @memberof Emitter2D
             */
            this.offset = opts.offset != undefined ? opts.offset : new Vec2;

            /**
             * @property Number minEmission
             * @memberof Emitter2D
             */
            this.minEmission = opts.minEmission != undefined ? opts.minEmission : 1;

            /**
             * @property Number maxEmission
             * @memberof Emitter2D
             */
            this.maxEmission = opts.maxEmission != undefined ? opts.maxEmission : 2;

            /**
             * @property Number minLife
             * @memberof Emitter2D
             */
            this.minLife = opts.minLife != undefined ? opts.minLife : 1;

            /**
             * @property Number maxLife
             * @memberof Emitter2D
             */
            this.maxLife = opts.maxLife != undefined ? opts.maxLife : 2;

            /**
             * @property Number minSize
             * @memberof Emitter2D
             */
            this.minSize = opts.minSize != undefined ? opts.minSize : 0.1;

            /**
             * @property Number maxSize
             * @memberof Emitter2D
             */
            this.maxSize = opts.maxSize != undefined ? opts.maxSize : 0.5;

            /**
             * @property Vec2 angularVelocity
             * @memberof Emitter2D
             */
            this.velocity = opts.velocity != undefined ? opts.velocity : new Vec2(0, 0, 0);

            /**
             * @property Vec2 randVelocity
             * @memberof Emitter2D
             */
            this.randVelocity = opts.randVelocity != undefined ? opts.randVelocity : new Vec2(1, 1, 1);

            /**
             * @property Number angularVelocity
             * @memberof Emitter2D
             */
            this.angularVelocity = opts.angularVelocity != undefined ? opts.angularVelocity : 0;

            /**
             * @property Number randAngularVelocity
             * @memberof Emitter2D
             */
            this.randAngularVelocity = opts.randAngularVelocity != undefined ? opts.randAngularVelocity : PI;

            /**
             * @property Boolean randRotation
             * @memberof Emitter2D
             */
            this.randRotation = opts.randRotation != undefined ? opts.randRotation : true;

            /**
             * @property Number emissionRate
             * @memberof Emitter2D
             */
            this.emissionRate = opts.emissionRate != undefined ? opts.emissionRate : 1 / 60;

            /**
             * @property Color color
             * @memberof Emitter2D
             */
            this.color = opts.color != undefined ? opts.color : new Color;

            /**
             * @property Color randColor
             * @memberof Emitter2D
             */
            this.randColor = opts.randColor != undefined ? opts.randColor : new Color;

            /**
             * @property Number alphaStart
             * @memberof Emitter2D
             */
            this.alphaStart = opts.alphaStart != undefined ? opts.alphaStart : 0;

            /**
             * @property Number time
             * @memberof Emitter2D
             */
            this.time = opts.time != undefined ? opts.time : 0;
            this._time = 0;

            /**
             * @property Number duration
             * @memberof Emitter2D
             */
            this.duration = opts.duration != undefined ? opts.duration : 0;

            /**
             * @property Boolean loop
             * @memberof Emitter2D
             */
            this.loop = opts.loop != undefined ? opts.loop : true;

            /**
             * @property Boolean playing
             * @memberof Emitter2D
             */
            this.playing = opts.playing != undefined ? opts.playing : true;

            /**
             * @property Array particles
             * @memberof Emitter2D
             */
            this.particles = [];

            this._OBJ = [];
        }

        Emitter2D.type = "Emitter2D";
        Class.extend(Emitter2D, Component);


        Emitter2D.prototype.copy = function(other) {

            this.worldSpace = other.worldSpace;

            this.minEmission = other.minEmission;
            this.maxEmission = other.maxEmission;

            this.minLife = other.minLife;
            this.maxLife = other.maxLife;

            this.minSize = other.minSize;
            this.maxSize = other.maxSize;

            this.velocity.copy(other.velocity);
            this.randVelocity.copy(other.randVelocity);

            this.angularVelocity = other.angularVelocity;
            this.randAngularVelocity = other.randAngularVelocity;
            this.randRotation = other.randRotation;

            this.emissionRate = other.emissionRate;

            this.color.copy(other.color);
            this.randColor.copy(other.randColor);

            this.time = other.time;
            this._time = other._time;

            this.duration = other.duration;
            this.loop = other.loop;
            this.playing = other.playing;

            return this;
        };

        /**
         * @method play
         * @memberof Emitter2D
         */
        Emitter2D.prototype.play = function() {
            if (this.playing) return;

            this.time = 0;
            this.playing = true;
        };

        var VEC = new Vec2;
        /**
         * @method spawn
         * @memberof Emitter2D
         * @brief spawns number of particles based on properties
         * @param Number count
         */
        Emitter2D.prototype.spawn = function(count) {
            var transform = this.gameObject.transform2d || this.gameObject.transform,
                position = transform.toWorld(VEC.set(0, 0)),
                offset = this.offset,
                particles = this.particles,
                numParticle2Ds = particles.length,
                particle,
                worldSpace = this.worldSpace,
                randRotation = this.randRotation,
                color = this.color,
                randColor = this.randColor,
                useRandColor = randColor.lengthSq() > 0,
                velocity = this.velocity,
                randVelocity = this.randVelocity,
                angularVelocity = this.angularVelocity,
                randAngularVelocity = this.randAngularVelocity,
                minLife = this.minLife,
                maxLife = this.maxLife,
                minSize = this.minSize,
                maxSize = this.maxSize,
                alphaStart = this.alphaStart,
                limit = clampTop(numParticle2Ds + count, Emitter2D.MAX_PARTICLES) - numParticle2Ds,
                vel, pos, col,
                i;

            for (i = limit; i--;) {
                particle = PARTICLE_POOL.create();
                pos = particle.position;
                vel = particle.velocity;
                col = particle.color;

                col.r = color.r;
                col.g = color.g;
                col.b = color.b;

                if (useRandColor) {
                    col.r += randColor.r * random();
                    col.g += randColor.g * random();
                    col.b += randColor.b * random();
                    col.check();
                }

                if (worldSpace) {
                    pos.x = offset.x + position.x;
                    pos.y = offset.y + position.y;
                } else {
                    pos.x = offset.x;
                    pos.y = offset.y;
                }

                particle.rotation = randRotation ? random() * TWO_PI : 0;

                particle.lifeTime = 0;
                particle.life = randFloat(minLife, maxLife);
                particle.size = randFloat(minSize, maxSize);

                vel.x = velocity.x + randFloat(-randVelocity.x, randVelocity.x);
                vel.y = velocity.y + randFloat(-randVelocity.y, randVelocity.y);
                particle.angularVelocity = angularVelocity + randFloat(-randAngularVelocity, randAngularVelocity)

                particle.alpha = alphaStart;

                particles.push(particle);
            }

            this.playing = true;
        };


        Emitter2D.prototype.update = function() {
            if (this.time > this.duration && !this.loop) this.playing = false;
            if (!this.playing && this.particles.length === 0) return;

            var dt = Time.delta,
                forces = this.forces,
                particles = this.particles,
                particle,
                ppos, pvel, alpha, alphaStart = this.alphaStart,
                t, d, p,
                i;

            this.time += dt;
            this._time += dt;

            if (this.playing && this._time > this.emissionRate) {
                this._time = 0;
                this.spawn(randInt(this.minEmission, this.maxEmission));
            }

            for (i = particles.length; i--;) {
                particle = particles[i];

                t = particle.lifeTime;
                d = particle.life;
                p = t / d;

                if (p > 1) {
                    PARTICLE_POOL.removeObject(particle);
                    particles.splice(i, 1);
                    continue;
                }

                ppos = particle.position;
                pvel = particle.velocity;

                ppos.x += pvel.x * dt;
                ppos.y += pvel.y * dt;
                particle.rotation += particle.angularVelocity * dt;

                particle.lifeTime += dt;
                particle.alpha = 1 - p;
            }
        };


        Emitter2D.prototype.toJSON = function(json) {
            json || (json = {});
            Component.prototype.toJSON.call(this, json);

            json.worldSpace = this.worldSpace;

            json.offset = this.offset.toJSON(json.offset);

            json.minEmission = this.minEmission;
            json.maxEmission = this.maxEmission;

            json.minLife = this.minLife;
            json.maxLife = this.maxLife;

            json.minSize = this.minSize;
            json.maxSize = this.maxSize;

            json.velocity = this.velocity.toJSON(json.velocity);
            json.randVelocity = this.randVelocity.toJSON(json.randVelocity);

            json.angularVelocity = this.angularVelocity;
            json.randAngularVelocity = this.randAngularVelocity;
            json.randRotation = this.randRotation;

            json.emissionRate = this.emissionRate;

            json.color = this.color.toJSON(json.color);
            json.randColor = this.randColor.toJSON(json.randColor);

            json.time = this.time;
            json._time = this._time;

            json.duration = this.duration;
            json.loop = this.loop;
            json.playing = this.playing;

            return json;
        };


        Emitter2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.worldSpace = json.worldSpace;

            this.offset.fromJSON(json.offset);

            this.minEmission = json.minEmission;
            this.maxEmission = json.maxEmission;

            this.minLife = json.minLife;
            this.maxLife = json.maxLife;

            this.minSize = json.minSize;
            this.maxSize = json.maxSize;

            this.velocity.fromJSON(json.velocity);
            this.randVelocity.fromJSON(json.randVelocity);

            this.angularVelocity = json.angularVelocity;
            this.randAngularVelocity = json.randAngularVelocity;
            this.randRotation = json.randRotation;

            this.emissionRate = json.emissionRate;

            this.color.fromJSON(json.color);
            this.randColor.fromJSON(json.randColor);

            this.time = json.time;
            this._time = json._time;

            this.duration = json.duration;
            this.loop = json.loop;
            this.playing = json.playing;

            return this;
        };


        /**
         * @class Emitter2D.Particle2D
         * @brief 2d particle
         */
        function Particle2D() {

            /**
             * @property Number alpha
             * @memberof Emitter2D.Particle2D
             */
            this.alpha = 0;

            /**
             * @property Number lifeTime
             * @memberof Emitter2D.Particle2D
             */
            this.lifeTime = 0;

            /**
             * @property Number life
             * @memberof Emitter2D.Particle2D
             */
            this.life = 1;

            /**
             * @property Number size
             * @memberof Emitter2D.Particle2D
             */
            this.size = 1;

            /**
             * @property Color color
             * @memberof Emitter2D.Particle2D
             */
            this.color = new Color;

            /**
             * @property Vec2 position
             * @memberof Emitter2D.Particle2D
             */
            this.position = new Vec2;

            /**
             * @property Vec2 velocity
             * @memberof Emitter2D.Particle2D
             */
            this.velocity = new Vec2;

            /**
             * @property Number rotation
             * @memberof Emitter2D.Particle2D
             */
            this.rotation = 0;

            /**
             * @property Number angularVelocity
             * @memberof Emitter2D.Particle2D
             */
            this.angularVelocity = 0;


            this._OBJ = {};
        }


        Emitter2D.Particle2D = Particle2D;
        Emitter2D.MAX_PARTICLES = 1024;


        return Emitter2D;
    }
);
