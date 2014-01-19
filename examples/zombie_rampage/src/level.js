define([
        "odin/odin"
    ],
    function(Odin) {


        function Level(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Level", opts);

            this.level = 1;
        }

        Odin.Component.extend(Level);


        return Level;
    }
);
