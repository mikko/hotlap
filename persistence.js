var sqlite3 = require('sqlite3').verbose();
		
var sqlConst = {
    existsTest: "SELECT name FROM sqlite_master WHERE type='table' AND name='record'",
    initialize: [
        "CREATE TABLE player(playerid INTEGER PRIMARY KEY, name TEXT)",
        "CREATE TABLE game(gameid INTEGER PRIMARY KEY, name TEXT)",
        "CREATE TABLE car(carid INTEGER PRIMARY KEY, name TEXT)",        
        ["CREATE TABLE track(trackid INTEGER PRIMARY KEY, name TEXT, game INTEGER,",
            "FOREIGN KEY(game) REFERENCES game(gameid))"
        ].join(" "),
        ["CREATE TABLE record(recordid INTEGER PRIMARY KEY, ",
            "time INTEGER,", 
            "player INTEGER,",
            "car INTEGER,",
            "track INTEGER,",
            "FOREIGN KEY(player) REFERENCES player(playerid),",
            "FOREIGN KEY(car) REFERENCES car(carid),",
            "FOREIGN KEY(track) REFERENCES track(trackid) )"
        ].join(" ")
    ],
    get: {
        players: "SELECT playerid, name FROM player",
        tracks: "SELECT trackid, name FROM track",
        records: "SELECT * FROM record",
        player: "SELECT * FROM player WHERE playerid = ?",
        track: "SELECT * FROM track WHERE trackid = ?",
        record: "SELECT * FROM record WHERE recordid = ?"
    },
    testTable: "record",
    insert: {
        player: "INSERT INTO player(name) VALUES (?)",
        track: "INSERT INTO track(name, game, car) VALUES (?, ?, ?)",
        record: "INSERT INTO record(time, player, track) VALUES (?, ?, ?)"
    }
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
        statement.run(values, callback.bind(null, 200));
    }
    else {
        callback(418, "Not found " + table);
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

Persistence.prototype.close = function() {
	Persistence.db.close();
};

module.exports = new Persistence();