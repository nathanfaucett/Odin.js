if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/object_pool",
        "odin/base/class",
        "odin/math/mathf",
        "odin/math/vec3",
        "odin/math/color",
        "odin/core/enums",
        "odin/core/assets/assets",
        "odin/core/components/particle_system/tween",
        "odin/core/components/particle_system/particle_2d"
    ],
    function(ObjectPool, Class, Mathf, Vec3, Color, Enums, Assets, Tween, Particle2D) {
        "use strict";


        var EmitterType = Enums.EmitterType,

            PI = Math.PI,
            TWO_PI = PI * 2,

            random = Math.random,
            floor = Math.floor,
            randInt = Mathf.randInt,
            randFloat = Mathf.randFloat,
            clampTop = Mathf.clampTop,
            sqrt = Math.sqrt,

            PARTICLE_POOL = Emitter.PARTICLE_POOL = new ObjectPool(Particle2D);


        function Emitter(opts) {
            opts || (opts = {});

            Class.call(this);

            this.positionType = opts.positionType != undefined ? opts.positionType : EmitterType.Box;
            this.velocityType = opts.velocityType != undefined ? opts.velocityType : EmitterType.Box;

            this.blending = opts.blending != undefined ? opts.blending : Enums.Blending.Default;
            this.texture = opts.texture != undefined ? opts.texture : undefined;

            this.positionSpread = opts.positionSpread != undefined ? opts.positionSpread : new Vec3(0.5, 0.5);
            this.positionRadius = opts.positionRadius != undefined ? opts.positionRadius : 0.5;

            this.speed = opts.speed != undefined ? opts.speed : 0;
            this.speedSpread = opts.speedSpread != undefined ? opts.speedSpread : 0;

            this.particleSystem = undefined;
            this.transform = undefined;

            this.worldSpace = opts.worldSpace != undefined ? opts.worldSpace : true;

            this.position = opts.position != undefined ? opts.position : new Vec3;

            this.minEmission = opts.minEmission != undefined ? opts.minEmission : 1;
            this.maxEmission = opts.maxEmission != undefined ? opts.maxEmission : 2;

            this.minLife = opts.minLife != undefined ? opts.minLife : 1;
            this.maxLife = opts.maxLife != undefined ? opts.maxLife : 2;

            this.minSize = opts.minSize != undefined ? opts.minSize : 0.1;
            this.maxSize = opts.maxSize != undefined ? opts.maxSize : 0.5;

            this.sizeTween = new Tween(opts.sizeTween);
            this.alphaTween = new Tween(opts.alphaTween);
            this.colorTween = new Tween(opts.colorTween);

            this.velocity = opts.velocity != undefined ? opts.velocity : new Vec3;
            this.velocitySpread = opts.velocitySpread != undefined ? opts.velocitySpread : new Vec3;

            this.acceleration = opts.acceleration != undefined ? opts.acceleration : new Vec3;
            this.accelerationSpread = opts.accelerationSpread != undefined ? opts.accelerationSpread : new Vec3;

            this.angularVelocity = opts.angularVelocity != undefined ? opts.angularVelocity : 0;
            this.angularVelocitySpread = opts.angularVelocitySpread != undefined ? opts.angularVelocitySpread : 0;

            this.angularAcceleration = opts.angularAcceleration != undefined ? opts.angularAcceleration : 0;
            this.angularAccelerationSpread = opts.angularAccelerationSpread != undefined ? opts.angularAccelerationSpread : 0;

            this.randomAngle = opts.randomAngle != undefined ? opts.randomAngle : true;

            this.emissionRate = opts.emissionRate != undefined ? opts.emissionRate : 1 / 60;

            this.color = opts.color != undefined ? opts.color : new Color;
            this.colorSpread = opts.colorSpread != undefined ? opts.colorSpread : new Color;

            this.time = opts.time != undefined ? opts.time : 0;
            this._time = 0;

            this.duration = opts.duration != undefined ? opts.duration : 0;

            this.loop = opts.loop != undefined ? opts.loop : true;

            this.playing = opts.playing != undefined ? opts.playing : true;
            this.emitting = opts.emitting != undefined ? opts.emitting : true;

            this.particles = [];
        }

        Class.extend(Emitter);


        Emitter.prototype.copy = function(other) {

            this.positionType = other.positionType;
            this.velocityType = other.velocityType;

            this.blending = other.blending;
            this.texture = other.texture;

            this.position.copy(other.position);
            this.positionSpread.copy(other.positionSpread);
            this.positionRadius = other.positionRadius;

            this.speed = other.speed;
            this.speedSpread = other.speedSpread;

            this.worldSpace = other.worldSpace;

            this.minEmission = other.minEmission;
            this.maxEmission = other.maxEmission;

            this.minLife = other.minLife;
            this.maxLife = other.maxLife;

            this.minSize = other.minSize;
            this.maxSize = other.maxSize;

            this.sizeTween.copy(other.sizeTween);
            this.alphaTween.copy(other.alphaTween);
            this.colorTween.copy(other.colorTween);

            this.velocity.copy(other.velocity);
            this.velocitySpread.copy(other.velocitySpread);

            this.acceleration.copy(other.acceleration);
            this.accelerationSpread.copy(other.accelerationSpread);

            this.angularVelocity = other.angularVelocity;
            this.angularVelocitySpread = other.angularVelocitySpread;

            this.angularAcceleration = other.angularAcceleration;
            this.angularAccelerationSpread = other.angularAccelerationSpread;

            this.randomAngle = other.randomAngle;

            this.emissionRate = other.emissionRate;

            this.color.copy(other.color);
            this.colorSpread.copy(other.colorSpread);

            this.time = other.time;
            this._time = other._time;

            this.duration = other.duration;
            this.loop = other.loop;
            this.playing = other.playing;
            this.emitting = other.emitting;

            return this;
        };


        Emitter.prototype.play = function() {

            this.time = 0;
            this.playing = true;
            this.emitting = true;

            return this;
        };


        Emitter.prototype.clear = function() {
            var particles = this.particles,
                i = particles.length;

            this.transform = undefined;

            this.time = 0;
            this._time = 0;
            this.playing = false;
            this.emitting = false;

            for (; i--;) PARTICLE_POOL.removeObject(particles[i]);
            particles.length = 0;

            return this;
        };


        var VEC = new Vec3;
        Emitter.prototype.spawn = function(count) {
            var transform = this.transform || (this.transform = this.particleSystem.gameObject.transform || this.particleSystem.gameObject.transform2d),
                transformPosition = transform.toWorld(VEC.set(0, 0, 0)),

                position = this.position,
                positionSpread = this.positionSpread,
                positionRadius = this.positionRadius,

                speed = this.speed,
                speedSpread = this.speedSpread,

                particles = this.particles,
                numParticle2Ds = particles.length,

                worldSpace = this.worldSpace,
                randomAngle = this.randomAngle,

                color = this.color,
                colorSpread = this.colorSpread,
                useRandColor = colorSpread.lengthSq() > 0,

                velocity = this.velocity,
                velocitySpread = this.velocitySpread,

                acceleration = this.acceleration,
                accelerationSpread = this.accelerationSpread,

                angularVelocity = this.angularVelocity,
                angularVelocitySpread = this.angularVelocitySpread,

                angularAcceleration = this.angularAcceleration,
                angularAccelerationSpread = this.angularAccelerationSpread,

                minLife = this.minLife,
                maxLife = this.maxLife,

                minSize = this.minSize,
                maxSize = this.maxSize,

                positionType = this.positionType,
                velocityType = this.velocityType,

                limit = clampTop(numParticle2Ds + count, Emitter.MAX_PARTICLES) - numParticle2Ds,
                posx, posy, posz, vel, acc, pos, col, x, y, z, len, r, dx, dy, dz, spd, particle;

            if (positionType === EmitterType.Circle) {
                posx = randFloat(-positionSpread.x, positionSpread.x);
                posy = randFloat(-positionSpread.y, positionSpread.y);
                posz = randFloat(-positionSpread.z, positionSpread.z);
            }

            for (; limit--;) {
                particle = PARTICLE_POOL.create();
                pos = particle.position;
                vel = particle.velocity;
                acc = particle.acceleration;
                col = particle.color;

                col.r = color.r;
                col.g = color.g;
                col.b = color.b;

                if (useRandColor) {
                    col.r += colorSpread.r * random();
                    col.g += colorSpread.g * random();
                    col.b += colorSpread.b * random();
                    col.check();
                }

                if (worldSpace) {
                    pos.x = position.x + transformPosition.x;
                    pos.y = position.y + transformPosition.y;
                    pos.z = position.z + transformPosition.z;
                } else {
                    pos.x = position.x;
                    pos.y = position.y;
                    pos.z = position.z;
                }

                switch (positionType) {
                    case EmitterType.Box:
                        pos.x += randFloat(-positionSpread.x, positionSpread.x);
                        pos.y += randFloat(-positionSpread.y, positionSpread.y);
                        pos.z += randFloat(-positionSpread.z, positionSpread.z);
                        break;

                    case EmitterType.Sphere:
                    default:
                        x = randFloat(-1, 1);
                        y = randFloat(-1, 1);
                        z = randFloat(-1, 1);

                        len = x * x + y * y + z * z;
                        len = len !== 0 ? 1 / sqrt(len) : len;

                        pos.x += posx + x * len * positionRadius;
                        pos.y += posy + y * len * positionRadius;
                        pos.z += posz + z * len * positionRadius;
                        break;
                }

                switch (velocityType) {
                    case EmitterType.Box:
                        vel.x = velocity.x + randFloat(-velocitySpread.x, velocitySpread.x);
                        vel.y = velocity.y + randFloat(-velocitySpread.y, velocitySpread.y);
                        vel.z = velocity.z + randFloat(-velocitySpread.z, velocitySpread.z);
                        break;

                    case EmitterType.Sphere:
                    default:
                        if (worldSpace) {
                            dx = pos.x - (position.x + transformPosition.x);
                            dy = pos.y - (position.y + transformPosition.y);
                            dz = pos.z - (position.z + transformPosition.z);
                        } else {
                            dx = pos.x - position.x;
                            dy = pos.y - position.y;
                            dz = pos.z - position.z;
                        }
                        spd = speed + randFloat(-speedSpread, speedSpread);

                        r = dx * dx + dy * dy + dz * dz;
                        r = r !== 0 ? 1 / sqrt(r) : r;

                        vel.x = dx * r * spd;
                        vel.y = dy * r * spd;
                        vel.z = dz * r * spd;
                        break;
                }

                acc.x = acceleration.x + randFloat(-accelerationSpread.x, accelerationSpread.x);
                acc.y = acceleration.y + randFloat(-accelerationSpread.y, accelerationSpread.y);
                acc.z = acceleration.z + randFloat(-accelerationSpread.z, accelerationSpread.z);

                particle.angularVelocity = angularVelocity + randFloat(-angularVelocitySpread, angularVelocitySpread);
                particle.angularAcceleration = angularAcceleration + randFloat(-angularAccelerationSpread, angularAccelerationSpread);

                particle.alpha = 1;
                particle.angle = randomAngle ? random() * TWO_PI : 0;
                particle.lifeTime = 0;
                particle.life = randFloat(minLife, maxLife);
                particle.size = randFloat(minSize, maxSize);

                particles.push(particle);
            }
        };


        Emitter.prototype.update = function(dt) {
            if (!this.playing) return;
            var particles = this.particles,
                sizeTween = this.sizeTween,
                alphaTween = this.alphaTween,
                colorTween = this.colorTween,
                sizeTweenUpdate = sizeTween.times.length > 0,
                alphaTweenUpdate = alphaTween.times.length > 0,
                colorTweenUpdate = colorTween.times.length > 0,
                particle, life, count,
                i;

            this.time += dt;
            this._time += dt;
            count = this._time / this.emissionRate;

            if (this.emitting && count >= 1) {
                this._time = 0;
                this.spawn(randInt(this.minEmission, this.maxEmission) * floor(count));

                if (!this.loop && this.time > this.duration) this.emitting = false;
            }

            for (i = particles.length; i--;) {
                particle = particles[i];
                particle.update(dt);
                life = particle.lifeTime / particle.life;

                if (sizeTweenUpdate) particle.size = sizeTween.update(life);
                if (alphaTweenUpdate) particle.alpha = alphaTween.update(life);
                if (colorTweenUpdate) colorTween.update(life, particle.color);

                if (life > 1) {
                    PARTICLE_POOL.removeObject(particle);
                    particles.splice(i, 1);
                    continue;
                }
            }

            if (!this.emitting && particles.length === 0) this.playing = false;
        };


        Emitter.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.type = 1;

            json.positionType = this.positionType;
            json.velocityType = this.velocityType;

            json.blending = this.blending;
            json.texture = this.texture ? this.texture.name : undefined;

            json.position = this.position.toJSON(json.position);
            json.positionSpread = this.positionSpread.toJSON(json.positionSpread);
            json.positionRadius = this.positionRadius;

            json.speed = this.speed;
            json.speedSpread = this.speedSpread;

            json.worldSpace = this.worldSpace;

            json.minEmission = this.minEmission;
            json.maxEmission = this.maxEmission;

            json.minLife = this.minLife;
            json.maxLife = this.maxLife;

            json.minSize = this.minSize;
            json.maxSize = this.maxSize;

            json.sizeTween = this.sizeTween.toJSON(json.sizeTween);
            json.alphaTween = this.alphaTween.toJSON(json.alphaTween);
            json.colorTween = this.colorTween.toJSON(json.colorTween);

            json.velocity = this.velocity.toJSON(json.velocity);
            json.velocitySpread = this.velocitySpread.toJSON(json.velocitySpread);

            json.acceleration = this.acceleration.toJSON(json.acceleration);
            json.accelerationSpread = this.accelerationSpread.toJSON(json.accelerationSpread);

            json.angularVelocity = this.angularVelocity;
            json.angularAcceleration = this.angularAcceleration;

            json.angularVelocitySpread = this.angularVelocitySpread;
            json.randomAngle = this.randomAngle;

            json.emissionRate = this.emissionRate;

            json.color = this.color.toJSON(json.color);
            json.colorSpread = this.colorSpread.toJSON(json.colorSpread);

            json.time = this.time;
            json._time = this._time;

            json.duration = this.duration;
            json.loop = this.loop;
            json.playing = this.playing;
            json.emitting = this.emitting;

            return json;
        };


        Emitter.prototype.fromServerJSON = function(json) {
            Class.prototype.fromServerJSON.call(this, json);

            this.positionType = json.positionType;
            this.velocityType = json.velocityType;

            this.blending = json.blending;
            this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.position.fromJSON(json.position);
            this.positionSpread.fromJSON(json.positionSpread);
            this.positionRadius = json.positionRadius;

            this.speed = json.speed;
            this.speedSpread = json.speedSpread;

            this.worldSpace = json.worldSpace;

            this.minEmission = json.minEmission;
            this.maxEmission = json.maxEmission;

            this.minLife = json.minLife;
            this.maxLife = json.maxLife;

            this.minSize = json.minSize;
            this.maxSize = json.maxSize;

            this.sizeTween.fromJSON(json.sizeTween);
            this.alphaTween.fromJSON(json.alphaTween);
            this.colorTween.fromJSON(json.colorTween);

            this.velocity.fromJSON(json.velocity);
            this.velocitySpread.fromJSON(json.velocitySpread);

            this.acceleration.fromJSON(json.acceleration);
            this.accelerationSpread.fromJSON(json.accelerationSpread);

            this.angularVelocity = json.angularVelocity;
            this.angularAcceleration = json.angularAcceleration;

            this.angularVelocitySpread = json.angularVelocitySpread;
            this.randomAngle = json.randomAngle;

            this.emissionRate = json.emissionRate;

            this.color.fromJSON(json.color);
            this.colorSpread.fromJSON(json.colorSpread);

            this.time = json.time;
            this._time = json._time;

            this.duration = json.duration;
            this.loop = json.loop;
            this.playing = json.playing;
            this.emitting = json.emitting;

            return this;
        };


        Emitter.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.positionType = json.positionType;
            this.velocityType = json.velocityType;

            this.blending = json.blending;
            this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.position.fromJSON(json.position);
            this.positionSpread.fromJSON(json.positionSpread);
            this.positionRadius = json.positionRadius;

            this.speed = json.speed;
            this.speedSpread = json.speedSpread;

            this.worldSpace = json.worldSpace;

            this.minEmission = json.minEmission;
            this.maxEmission = json.maxEmission;

            this.minLife = json.minLife;
            this.maxLife = json.maxLife;

            this.minSize = json.minSize;
            this.maxSize = json.maxSize;

            this.sizeTween.fromJSON(json.sizeTween);
            this.alphaTween.fromJSON(json.alphaTween);
            this.colorTween.fromJSON(json.colorTween);

            this.velocity.fromJSON(json.velocity);
            this.velocitySpread.fromJSON(json.velocitySpread);

            this.acceleration.fromJSON(json.acceleration);
            this.accelerationSpread.fromJSON(json.accelerationSpread);

            this.angularVelocity = json.angularVelocity;
            this.angularAcceleration = json.angularAcceleration;

            this.angularVelocitySpread = json.angularVelocitySpread;
            this.randomAngle = json.randomAngle;

            this.emissionRate = json.emissionRate;

            this.color.fromJSON(json.color);
            this.colorSpread.fromJSON(json.colorSpread);

            this.time = json.time;
            this._time = json._time;

            this.duration = json.duration;
            this.loop = json.loop;
            this.playing = json.playing;
            this.emitting = json.emitting;

            return this;
        };


        Emitter.MAX_PARTICLES = 1024;


        return Emitter;
    }
);
