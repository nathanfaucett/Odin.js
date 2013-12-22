require(
	{
        baseUrl: "../../src"
    },
	[
        "odin"
    ],
    function(Odin) {
		
		Odin.globalize();
		
		
		game = new ClientGame({
			debug: true
		});
		
		function init(){
			scene = new Scene;
			camera = new GameObject({
				components: [
					new Transform2D,
					new Camera2D
				]
			});
			
			scene.addGameObject(camera);
			
			this.addScene(scene);
			this.setScene(scene);
			this.setCamera(camera);
		}
		game.once("init", init);
		
		
		game.init();
    }
);
