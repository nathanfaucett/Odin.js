require({
        baseUrl: "./src/"
    }, [
        "odin/odin"
    ],
    function(Odin) {
		
		Odin.globalize();
		
		game = new ClientGame({
			debug: true,
			forceCanvas: false
		});
		
		game.on("init", function(){
			
			game.connect(function(socket) {
				
				socket.on("player", function(player_id) {
					var player = window.player = game.scene.findByServerId(player_id);
					
					player.on("update", function() {
						var transform2d = this.transform2d,
							dt = 2 * Time.delta,
							x = dt * Input.axis("horizontal"),
							y = dt * Input.axis("vertical");
						
						transform2d.position.x += x;
						transform2d.position.y += y;
					});
				});
			});
		});
		
		game.init();
    }
);