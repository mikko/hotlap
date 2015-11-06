var sqlite3 = require('sqlite3').verbose();
		
var sqlConst = {
    existsTest: "SELECT name FROM sqlite_master WHERE type='table' AND name='record'",
    initialize: [
        "CREATE TABLE player(playerid INTEGER PRIMARY KEY, name TEXT)",
        "CREATE TABLE game(gameid INTEGER PRIMARY KEY, name TEXT)",
        ["CREATE TABLE car(carid INTEGER PRIMARY KEY, name TEXT,",
            "game INTEGER,",
            "FOREIGN KEY(game) REFERENCES game(gameid))"
        ].join(" "),        
        ["CREATE TABLE track(trackid INTEGER PRIMARY KEY, name TEXT,",
            "game INTEGER,",
            "FOREIGN KEY(game) REFERENCES game(gameid))"
        ].join(" "),
        ["CREATE TABLE contest(contestid INTEGER PRIMARY KEY, ",
            "game INTEGER,",
            "car INTEGER,",
            "track INTEGER,",
            "FOREIGN KEY(game) REFERENCES game(gameid),",
            "FOREIGN KEY(car) REFERENCES car(carid),",
            "FOREIGN KEY(track) REFERENCES track(trackid) )"
        ].join(" "),
        ["CREATE TABLE record(recordid INTEGER PRIMARY KEY, ",
            "time INTEGER,", 
            "player INTEGER,",
            "contest INTEGER,",
            "FOREIGN KEY(player) REFERENCES player(playerid),",
            "FOREIGN KEY(contest) REFERENCES contest(contestid))",
            
        ].join(" ")
    ],
    get: {
        // All
        players: "SELECT * FROM player",
        games: "SELECT * FROM game",
        cars: "SELECT * FROM car",
        tracks: "SELECT * FROM track",
        records: "SELECT * FROM record",
        contests: "SELECT * FROM contest",
        // By id
        player: "SELECT * FROM player WHERE playerid = ?",
        game: "SELECT * FROM game WHERE gameid = ?",
        car: "SELECT * FROM car WHERE carid = ?",
        track: "SELECT * FROM track WHERE trackid = ?",
        record: "SELECT * FROM record WHERE recordid = ?",
        contest: "SELECT * FROM contest WHERE contestid = ?",
        // Full data
        contestFull: [
            "SELECT time, name FROM record, player",
            "WHERE recordid = ? AND record.player=player.playerid"
        ].join(" ")
    },
    testTable: "record",
    insert: {
        player: "INSERT INTO player(name) VALUES (?)",
        game: "INSERT INTO game(name) VALUES (?)",
        car: "INSERT INTO car(name, game) VALUES (?, ?)",
        track: "INSERT INTO track(name, game) VALUES (?, ?)",
        record: "INSERT INTO record(time, player, contest) VALUES (?, ?, ?)",
        contest: "INSERT INTO contest(game, car, track) VALUES (?, ?, ?)"
    }
}

var initialData = {
    players: ["Ralli-Pekka", "Matti Anttila"],
    games: ["Forza 4", "WRC"],
    cars: [
        ["Radical SR8", 1], 
        ["Focus WRC", 2]
    ],
    tracks: [
        ["Norschleife", 1], 
        ["Ouninpohja", 2]
    ],
    contests: [
        [1, 1, 1]
    ],
    records: [
        [9999, 1, 1], 
        [9912, 2, 1],
        [12942, 2, 1]
    ]
}

var Persistence = function() {
};

Persistence.prototype.openWith = function(initialData, onReady) {
    Persistence.db = new sqlite3.Database(':memory:');
    
    var queries = sqlConst.initialize.concat(initialData);

    // A bit of a hack
    var queriesReady = 0;
    var ifReady = function() {
        ++queriesReady;
        if (queriesReady === queries.length) {
            onReady();
        }
    }

    Persistence.db.serialize(function() {
        queries.forEach(function(query) {
            Persistence.db.run(query, function(error) {
                if (error) {
                    console.log("Error running query", error);
                }
                else {
                    ifReady();
                }
            });            
        });
    });
};

Persistence.prototype.open = function() {
    Persistence.db = new sqlite3.Database('database.sqlite');
    Persistence.db.get(sqlConst.existsTest, function(error, row) {
        if (row !== undefined) {
            console.log("Database already initialized");
        }
        else {
            console.log("Initializing database");
            Persistence.db.serialize(function() {
                   
                sqlConst.initialize.forEach(function(clause) {
                    Persistence.db.run(clause, function(error) {
                        console.log("COMPLETE:", clause);
                        if (error) {
                            console.log(error);
                        }
                    });
                });
                initialData.players.forEach(function(values) {
                    Persistence.prototype.insert("player", values, function() { console.log("Inserted player", values); });
                });
                initialData.games.forEach(function(values) {
                    Persistence.prototype.insert("game", values, function() { console.log("Inserted game", values); });
                });
                initialData.cars.forEach(function(values) {
                    Persistence.prototype.insert("car", values, function() { console.log("Inserted car", values); });
                });
                initialData.tracks.forEach(function(values) {
                    Persistence.prototype.insert("track", values, function() { console.log("Inserted track", values); });
                });
                initialData.contests.forEach(function(values) {
                    Persistence.prototype.insert("contest", values, function() { console.log("Inserted contest", values); });
                });
                initialData.records.forEach(function(values) {
                    Persistence.prototype.insert("record", values, function() { console.log("Inserted record", values); });
                });
            });
        }
    });
};

Persistence.prototype.close = function() {
    Persistence.db.close();
    Persistence.db = null;
};

Persistence.prototype.rawGet = function(query, callback) {
    Persistence.db.get(query, callback);
}

Persistence.prototype.insert = function(table, values, callback) {
    var query = sqlConst.insert[table];
    if (query !== undefined) {
        var statement = Persistence.db.prepare(query);
        statement.run(values, callback.bind(null, true));
    }
    else {
        callback(false, "Not found " + table);
    }
};

Persistence.prototype.fetchAll = function(table, callback) {
    var query = sqlConst.get[table + "s"];
    if (query !== undefined) {
        var result = [];
        console.log("Fetching", table);
        Persistence.db.each(query, function(err, row) {
            console.log("Fetched row", JSON.stringify(row));
            result.push(JSON.stringify(row));
        }, function() {
            var response = {};
            response[table + "s"] = result;
            callback(response);
        });
        
    } else {
        callback("Not found " + table);
    }
};

Persistence.prototype.fetch = function(table, values, callback) {
    var query = sqlConst.get[table];
    if (query !== undefined) {
        var result = [];
        console.log("Fetching", table);
        var statement = Persistence.db.prepare(query);
        
        statement.each(values, function(err, row) {
            console.log("Fetched row", JSON.stringify(row));
            result.push(row);
        }, function() {
            var response = result;
            callback(response);
        });
        
    } else {
        callback("Not found " + table);
    }
};

Persistence.prototype.fetchFull = function(table, values, callback) {
    var query = sqlConst.get[table + "Full"];
    if (query !== undefined) {
        var result = [];
        console.log("Fetching full info", table);
        var statement = Persistence.db.prepare(query);
        
        statement.each(values, function(err, row) {
            console.log("Fetched row", JSON.stringify(row));
            result.push(row);
        }, function() {
            var response = result;
            callback(response);
        });
        
    } else {
        callback("Not found " + table);
    }
};

Persistence.prototype.close = function() {
	Persistence.db.close();
};

module.exports = new Persistence();