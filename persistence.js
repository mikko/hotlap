var sqlite3 = require('sqlite3').verbose();
		
var sqlConst = {
    existsTest: "SELECT name FROM sqlite_master WHERE type='table' AND name='record'",
    initialize: [
        "CREATE TABLE game(gameid INTEGER PRIMARY KEY, name TEXT);",
        "CREATE TABLE player(playerid INTEGER PRIMARY KEY, name TEXT);",
        "CREATE TABLE track(trackid INTEGER PRIMARY KEY, name TEXT);",
        "CREATE TABLE car(carid INTEGER PRIMARY KEY, name TEXT);",
        ["CREATE TABLE record(recordid INTEGER PRIMARY KEY, ",
            "time INTEGER,", 
            "game INTEGER,",
            "player INTEGER,",
            "track INTEGER,",
            "car INTEGER,",
            "FOREIGN KEY(game) REFERENCES game(gameid),",
            "FOREIGN KEY(player) REFERENCES player(playerid),",
            "FOREIGN KEY(track) REFERENCES track(trackid),",
            "FOREIGN KEY(car) REFERENCES car(carid)",
            " );"
        ].join(" ")
    ],
    get: {
        games: "SELECT gameid, name FROM game",
        players: "SELECT playerid, name FROM player",
        tracks: "SELECT trackid, name FROM track",
        cars: "SELECT carid, name FROM car",
        records: "SELECT recordid, name FROM record"
    },
    testTable: "record",
    insert: {
        game: "INSERT INTO game(name) VALUES (?)",
        player: "INSERT INTO player(name) VALUES (?)",
        track: "INSERT INTO track(name) VALUES (?)",
        car: "INSERT INTO car(name) VALUES (?)",
        record: "INSERT INTO record(time, game, player, track, car) VALUES (?, ?, ?, ?, ?)"
    }
}

var Persistence = function() {
};

Persistence.prototype.open = function() {
    Persistence.db = new sqlite3.Database('database.sqlite');
    Persistence.db.get(sqlConst.existsTest, function(error, row) {
        if (row !== undefined) {
            console.log("Database already initialized");
        }
        else {
            console.log("Initializing database");
            
            sqlConst.initialize.forEach(function(clause) {
                Persistence.db.run(clause, function(error) {
                    console.log("COMPLETE:", clause);
                    if (error) {
                        console.log(error);
                    }
                });
            });
        }
    });
};

Persistence.prototype.insert = function(table, values, callback) {
    var query = sqlConst.insert[table];
    if (query !== undefined) {
        var statement = Persistence.db.prepare(query);
        statement.run(values, callback.bind(null, 200));
    }
    else {
        callback(418, "Not found " + table);
    }
};

Persistence.prototype.fetch = function(table, values, callback) {
    var query = sqlConst.get[table + "s"];
    if (query !== undefined) {
        var result = [];
        var statement = Persistence.db.each(query, function(err, row) {
            result.push(JSON.stringify(row));
        }, function() {
            callback(result);
        });
        
    } else {
        callback("Not found " + table);
    }
};

/*
console.log("Inserting initial data");
                    var stmt = Persistence.db.prepare("INSERT INTO test VALUES (?)");
                    for (var i = 0; i < 10; i++) {
                        stmt.run("Ipsum " + i);
                    }
                    stmt.finalize(function() {
                        console.log("Database initialized");
                    });

*/

Persistence.prototype.close = function() {
	Persistence.db.close();
};

Persistence.prototype.test = function(cb) {
	var results = [];
	Persistence.db.serialize(function() {
        Persistence.db.each("SELECT rowid AS id, info FROM test", function(err, row) {
            console.log("Got result row");
            results.push(row.id + ": " + row.info);
        }, function() {
            cb(results);
        });
	});
};
 
module.exports = new Persistence();