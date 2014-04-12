require({
        baseUrl: "src"
    }, [
        "odin/odin",
        "assets",
        "scene_level"
    ],
    function(Odin, assets, sceneLevel) {

        Odin.globalize();

        var game = new Odin.Game({
            debug: true,
            width: 960,
            height: 640,
            renderer: {
                autoClear: false,
                disableDepth: true
            }
        });
        window.game = game;

        game.addScene(sceneLevel);


        function startLevel() {
            game.setScene("Level");
            game.setCamera(game.scene.findByTagFirst("Camera"));
        }


        Odin.AssetLoader.on("load", function() {

            game.on("start", startLevel).start();
        }).load();
    }
);
