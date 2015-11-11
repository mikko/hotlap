var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var Promise = require("bluebird");

var sqlConst = {
    existsTest: "SELECT name FROM sqlite_master WHERE type='table' AND name='record'",
    initialize: [
        "CREATE TABLE player(playerid INTEGER PRIMARY KEY, name TEXT NOT NULL)",
        "CREATE TABLE game(gameid INTEGER PRIMARY KEY, name TEXT NOT NULL)",
        ["CREATE TABLE car(carid INTEGER PRIMARY KEY, name TEXT NOT NULL,",
            "game INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(gameid))"
        ].join(" "),        
        ["CREATE TABLE track(trackid INTEGER PRIMARY KEY, name TEXT NOT NULL,",
            "game INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(gameid))"
        ].join(" "),
        ["CREATE TABLE contest(contestid INTEGER PRIMARY KEY, ",
            "game INTEGER NOT NULL,",
            "car INTEGER NOT NULL,",
            "track INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(gameid),",
            "FOREIGN KEY(car) REFERENCES car(carid),",
            "FOREIGN KEY(track) REFERENCES track(trackid) )"
        ].join(" "),
        ["CREATE TABLE record(recordid INTEGER PRIMARY KEY, ",
            "time INTEGER NOT NULL,", 
            "player INTEGER NOT NULL,",
            "contest INTEGER NOT NULL,",
            "date INTEGER NOT NULL,",
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
        // By id in list
        playersIn: "SELECT * FROM player WHERE playerid IN ",
        gamesIn: "SELECT * FROM game WHERE gameid IN ",
        carsIn: "SELECT * FROM car WHERE carid IN ",
        tracksIn: "SELECT * FROM track WHERE trackid IN ",
        recordsIn: "SELECT * FROM record WHERE recordid IN ",
        contestsIn: "SELECT * FROM contest WHERE contestid IN ",
        
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
        record: "INSERT INTO record(time, player, contest, date) VALUES (?, ?, ?, ?)",
        contest: "INSERT INTO contest(game, car, track) VALUES (?, ?, ?)"
    }
}

var games = JSON.parse(fs.readFileSync("./data/games.json"));
var forzaCars = JSON.parse(fs.readFileSync("./data/forzaCars.json")).map(car => [car, 1]);
var forzaTracks = JSON.parse(fs.readFileSync("./data/forzaTracks.json")).map(car => [car, 1]);
var dirt3Cars = JSON.parse(fs.readFileSync("./data/dirt3Cars.json")).map(car => [car, 2]);

var initialData = {
    players: ["Ralli-Pekka", "Matti Anttila"],
    games: games,
    cars: forzaCars.concat(dirt3Cars),
    tracks: forzaTracks,
    contests: [
        [1,1,1],
        [1,2,2]
    ],
    records: []
}

var Persistence = function() {
};

Persistence.prototype.openWith = function(initialData) {
    return new Promise(function(resolve, reject) {
        Persistence.db = new sqlite3.Database(':memory:');
        
        var queries = sqlConst.initialize.concat(initialData);

        // A bit of a hack
        var queriesReady = 0;
        var ifReady = function() {
            ++queriesReady;
            if (queriesReady === queries.length) {
                resolve();
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
    })
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
                    Persistence.prototype.insert("player", values)
                        .then(function() { 
                            console.log("Inserted player", values); 
                        });
                });
                initialData.games.forEach(function(values) {
                    Persistence.prototype.insert("game", values)
                        .then(function() { 
                            console.log("Inserted game", values); 
                        });
                });
                initialData.cars.forEach(function(values) {
                    Persistence.prototype.insert("car", values)
                        .then(function() { 
                            console.log("Inserted car", values); 
                        });
                });
                initialData.tracks.forEach(function(values) {
                    Persistence.prototype.insert("track", values)
                        .then(function() { 
                            console.log("Inserted track", values); 
                        });
                });
                initialData.contests.forEach(function(values) {
                    Persistence.prototype.insert("contest", values)
                        .then(function() { 
                            console.log("Inserted contest", values); 
                        });
                });
                initialData.records.forEach(function(values) {
                    Persistence.prototype.insert("record", values)
                        .then(function() { 
                            console.log("Inserted record", values); 
                        });
                });
            });
        }
    });
};

Persistence.prototype.close = function() {
    Persistence.db.close();
    Persistence.db = null;
};

Persistence.prototype.rawGet = function(query, values) {
    return new Promise(function(resolve, reject) {
        var statement = Persistence.db.prepare(query);
        var resolveWithValue = function(err, values) { 
            if (err) {
                console.log(query, values, err);
            }
            resolve(values); 
        }
        statement.all(values, resolveWithValue);
    });
}

Persistence.prototype.insert = function(table, values) {
    return new Promise(function(resolve, reject) {
        var query = sqlConst.insert[table];
        if (query !== undefined) {
            var statement = Persistence.db.prepare(query);
            statement.run(values, resolve);
        }
        else {
            reject();
        }
    });
};

Persistence.prototype.fetchAll = function(table) {
    return new Promise(function(resolve, reject) {
        var query = sqlConst.get[table + "s"];
        if (query !== undefined) {
            var result = [];
            Persistence.db.each(query, function(err, row) {
                result.push(row);
            }, function() {
                var response = {};
                response[table + "s"] = result;
                resolve(response);
            });
        } else {
            reject();
        }
    });
};

Persistence.prototype.fetch = function(table, values) {
    return new Promise(function(resolve,reject) {
        var query = sqlConst.get[table];
        if (query !== undefined) {
            var result = [];
            var statement = Persistence.db.prepare(query);
            
            statement.each(values, function(err, row) {
                result.push(row);
            }, function() {
                var response = result.length === 1 ? result[0] : result;
                resolve(response);
            });
            
        } else {
            reject("Not found " + table);
        }
    });
};

Persistence.prototype.fetchIn = function(table, values) {
    return new Promise(function(resolve,reject) {
        var query = sqlConst.get[table + "sIn"];
        query += "(" + values.map(x => "?") + ")";
        if (query !== undefined) {
            var result = [];
            var statement = Persistence.db.prepare(query);
            
            statement.each(values, function(err, row) {
                result.push(row);
            }, function() {
                var response = result;
                resolve(response);
            });
            
        } else {
            reject("Not found " + table);
        }
    });
};

Persistence.prototype.close = function() {
	Persistence.db.close();
};

module.exports = new Persistence();