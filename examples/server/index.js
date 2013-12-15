require({
        baseUrl: "./src/"
    }, [
        "odin/odin"
    ],
    function(Odin) {
		
		Odin.globalize();
		
		game = new ClientGame({
			debug: true,
			host: "192.168.1.232",
			port: 3000
		});
		
		game.on("init", function(){
			
			game.connect();
			
			game.on("connect", function(socket) {
				
				socket.on("player_id", function(id) {
					var player = game.scene.findByServerId(id),
						transform2d = player.transform2d;
					
					player.on("update", function() {
						var dt = 2 * Time.delta,
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