require({
        baseUrl: "src"
    }, [
        "odin/odin",
        "assets",
        "scene_level"
    ],
    function(Odin, assets, sceneLevel) {
        window.Odin = Odin;


        var game = window.game = new Odin.Game({
            debug: true,
            forceCanvas: false,
            width: 960,
            height: 640,
            canvasRenderer2DOptions: {
                imageSmoothingEnabled: false
            }
        });


        game.add(sceneLevel);


        function startLevel() {
            game.setScene("Level");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            var level = game.scene.findByTagFirst("Level").sprite;

            game.on("update", function() {
                var sprites = game.scene.components.Sprite;

                sprites.sort(function(a, b) {

                    return a.transform2d.position.y - b.transform2d.position.y;
                });

                sprites.splice(sprites.indexOf(level), 1);
                sprites.push(level);
            });
        }


        Odin.AssetLoader.load(function() {

            game.init();
            startLevel();
        });
    }
);
