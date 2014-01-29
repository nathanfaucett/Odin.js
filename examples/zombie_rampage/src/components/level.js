define([
        "odin/odin",
        "player",
        "zombie"
    ],
    function(Odin, player, zombie) {


        var Time = Odin.Time,
            random = Math.random,

            Mathf = Odin.Mathf,
            randArg = Mathf.randArg;


        function Level(opts) {

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
            var z = zombie.clone();

            z.transform2d.position.set(0, 8);
            this.gameObject.scene.addGameObject(z);
            z.clone();
            z.clone();

            this.gameObject.scene.addGameObject(player.clone());
        };


        Level.prototype.clear = function() {

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
                            enemy = zombie.clone();
                            break;
                    }
                    randomDoor(enemy.transform2d.position);
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


        function randomDoor(v) {
            switch (randArg(0, 1, 2)) {
                case 0:
                    v.x = -8;
                    v.y = 8;
                    break;
                case 1:
                    v.x = 0;
                    v.y = 8;
                    break;
                case 2:
                    v.x = 8;
                    v.y = 8;
                    break;
            }
        }


        return Level;
    }
);
