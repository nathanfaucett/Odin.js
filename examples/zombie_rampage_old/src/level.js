define([
        "odin/odin",
        "blood",
        "player",
        "zombie",
        "collision_object"
    ],
    function(Odin, Blood, Player, Zombie, CollisionObject) {


        var Assets = Odin.Assets,
            Time = Odin.Time,

            Mathf = Odin.Mathf,
            random = Math.random,
            PI = Math.PI,
            randArg = Mathf.randArg;


        Assets.add(
            new Odin.Texture({
                name: "img_player",
                src: "content/player.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.Texture({
                name: "img_zombie",
                src: "content/zombie.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.Texture({
                name: "img_zombie_red",
                src: "content/zombie_red.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.SpriteSheet({
                name: "ss_small",
                src: "content/32x32.json"
            })
        );


        var player = new Odin.GameObject({
            components: [
                Blood.clone(),
                new Player,
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Assets.hash["img_player"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64
                }),
                new Odin.SpriteAnimation({
                    sheet: Assets.hash["ss_small"],
                    rate: 0
                }),
                new CollisionObject
            ],
            tag: "Player"
        }),
            zombie = new Odin.GameObject({
                components: [
                    Blood.clone(),
                    new Zombie({
                        spd: 1,
                        atk: 3,
                        def: 2
                    }),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        texture: Assets.hash["img_zombie"],
                        x: 0,
                        y: 0,
                        w: 64,
                        h: 64
                    }),
                    new Odin.SpriteAnimation({
                        sheet: Assets.hash["ss_small"],
                        rate: 0.2
                    }),
                    new CollisionObject
                ],
                tags: ["Zombie", "Enemy"]
            }),
            zombie_red = new Odin.GameObject({
                components: [
                    Blood.clone(),
                    new Zombie({
                        spd: 3,
                        atk: 1,
                        def: 1
                    }),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        texture: Assets.hash["img_zombie_red"],
                        x: 0,
                        y: 0,
                        w: 64,
                        h: 64
                    }),
                    new Odin.SpriteAnimation({
                        sheet: Assets.hash["ss_small"],
                        rate: 0.2
                    }),
                    new CollisionObject
                ],
                tags: ["ZombieRed", "Enemy"]
            });


        function Level(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Level", opts);

            this.name = name;

            this.gameOver = false;
            this.points = 0;

            this.playerAlive = false;
            this.playerLives = 3;

            this.wave = 1;
            this.out = 0;
            this.enemies = 0;

            this._spawnTime = 0;
            this.spawnTime = 2.5 * (1 / this.wave) + (random() * 5 * (1 / this.wave));
            this._waveTime = 0;
            this.waveTime = 0;

            var self = this;
            this.onDestroyEnemy = function() {
                self.enemies -= 1;
            };
        }

        Odin.Component.extend(Level);


        Level.prototype.init = function() {

            this.gameObject.scene.addGameObject(player.clone());
        };


        Level.prototype.update = function() {
            var dt = Time.delta,
                wave = this.wave;

            this._waveTime += dt;
            this._spawnTime += dt;

            if (this._waveTime >= this.waveTime) {

                if (this.out > 0 && (this._spawnTime > this.spawnTime)) {
                    var enemy;

                    switch (randArg(0, 1)) {
                        case 0:
                            enemy = zombie.clone();
                            break;

                        case 1:
                            enemy = zombie_red.clone();
                            break;
                    }
                    switch (randArg(0, 1, 2)) {
                        case 0:
                            enemy.transform2d.position.set(-8, 8);
                            break;
                        case 1:
                            enemy.transform2d.position.set(0, 8);
                            break;
                        case 2:
                            enemy.transform2d.position.set(8, 8);
                            break;
                    }
                    enemy.character.setLevel(wave);
                    enemy.on("destroy", this.onDestroyEnemy);

                    this.gameObject.scene.addGameObject(enemy);
                    this.out -= 1;

                    this.spawnTime = 2.5 * (1 / wave) + (random() * 5 * (1 / wave));
                    this._spawnTime = 0;
                }

                if (this.enemies <= 0) {
                    this.wave += 1;
                    this.out = 15 + this.wave;
                    this.enemies = this.out;
                    this._waveTime = 0;
                }
            }
        };


        return Level;
    }
);
