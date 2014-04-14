require({
        baseUrl: "src"
    }, [
        "odin/odin",
        "assets",
        "scene_level"
    ],
    function(Odin, assets, sceneLevel) {
        var game = new Odin.Game({
            debug: true,
            canvas: {
                width: 960,
                height: 640
            },
            renderer: {
                autoClear: false,
                disableDepth: true
            }
        });

        game.addScene(sceneLevel);


        function startLevel() {
            game.setScene("Level");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            game.on("update", function() {

                this.scene.componentManagers.Sprite.sort();
            });
        }


        Odin.AssetLoader.on("load", function() {

            game.on("start", startLevel).start();
        }).load();
    }
);
