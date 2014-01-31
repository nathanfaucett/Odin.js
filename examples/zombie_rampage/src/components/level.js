define([
        "odin/odin",
        "player",
        "zombie",
        "zombie_red",
        "zombie_big"
    ],
    function(Odin, player, zombie, zombieRed, zombieBig) {


        var Time = Odin.Time,
            random = Math.random,

            Mathf = Odin.Mathf,
            randArg = Mathf.randArg;


        function Level(opts) {

            Odin.Component.call(this, "Level", opts);

            this.name = name;

            this.gameOver = false;
            this.points = 0;

            this.playerLives = 3;

            this.wave = 1;
            this.out = 10;
            this.enemies = 10;

            this._spawnTime = 0;
            this.spawnTime = 2.5 * (1 / this.wave) + (random() * 5 * (1 / this.wave));

            var self = this;
            this.onRemoveEnemy = function() {
                self.enemies -= 1;
            };
            this.onRemovePlayer = function() {

                self.playerLives -= 1;
                if (self.playerLives <= 0) {
                    self.gameOver = true;
                    return;
                }
                var instance = player.create();

                instance.on("remove", self.onRemovePlayer, this);
                this.playerAlive = true;

                self.gameObject.scene.addGameObject(instance);
            };
        }

        Odin.Component.extend(Level);


        Level.prototype.init = function() {
            var instance = player.create();

            instance.on("remove", this.onRemovePlayer, this);
            this.playerAlive = true;

            this.gameObject.scene.addGameObject(instance);
        };


        Level.prototype.clear = function() {
            Odin.Component.prototype.clear.call(this);

        };


        Level.prototype.update = function() {
            var dt = Time.delta,
                wave = this.wave;

            this._spawnTime += dt;

            if (this.out > 0 && (this._spawnTime > this.spawnTime)) {
                var enemy,
                    num = random();

                if (num <= 0.5) {
                    enemy = zombie.create();
                } else if (num > 0.5 && num < 0.95) {
                    enemy = zombieRed.create();
                } else {
                    enemy = zombieBig.create();
                }

                randomDoor(enemy.transform2d.position);
                enemy.character.setLevel(wave);
                enemy.on("remove", this.onRemoveEnemy);

                this.gameObject.scene.addGameObject(enemy);
                this.out -= 1;

                this.spawnTime = 2.5 * (1 / wave) + (random() * 5 * (1 / wave));
                this._spawnTime = 0;
            }

            if (this.enemies <= 0) {
                this.wave += 1;
                this.out = 10 + (this.wave * this.wave);
                this.enemies = this.out;
            }
        };


        function randomDoor(v) {
            switch (randArg(0, 1, 2)) {
                case 0:
                    v.x = -8;
                    v.y = 7.5;
                    break;
                case 1:
                    v.x = 0;
                    v.y = 7.5;
                    break;
                case 2:
                    v.x = 8;
                    v.y = 7.5;
                    break;
            }
        }


        return Level;
    }
);
