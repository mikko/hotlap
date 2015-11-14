var _ = require("lodash");
var pg = require("pg");
var fs = require("fs");
var Promise = require("bluebird");

var connectionString = require("./dbConfig");

var sqlConst = {
    existsTest: "SELECT 1 FROM information_schema.tables WHERE table_name = 'record'",
    initialize: [
        "CREATE TABLE IF NOT EXISTS player(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE)",
        "CREATE TABLE IF NOT EXISTS game(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE)",
        ["CREATE TABLE IF NOT EXISTS car(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE,",
            "game INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(id))"
        ].join(" "),        
        ["CREATE TABLE IF NOT EXISTS track(id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE,",
            "game INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(id))"
        ].join(" "),
        ["CREATE TABLE IF NOT EXISTS leaderboard(id SERIAL PRIMARY KEY, ",
            "game INTEGER NOT NULL,",
            "car INTEGER NOT NULL,",
            "track INTEGER NOT NULL,",
            "FOREIGN KEY(game) REFERENCES game(id),",
            "FOREIGN KEY(car) REFERENCES car(id),",
            "FOREIGN KEY(track) REFERENCES track(id),",
            "CONSTRAINT unique_const UNIQUE (game, car, track))"
        ].join(" "),
        ["CREATE TABLE IF NOT EXISTS record(id SERIAL PRIMARY KEY, ",
            "time INTEGER NOT NULL,", 
            "player INTEGER NOT NULL,",
            "leaderboard INTEGER NOT NULL,",
            "date INTEGER NOT NULL,",
            "FOREIGN KEY(player) REFERENCES player(id),",
            "FOREIGN KEY(leaderboard) REFERENCES leaderboard(id))",
            
        ].join(" ")
    ],
    get: {
        // All
        players: "SELECT * FROM player",
        games: "SELECT * FROM game",
        cars: "SELECT * FROM car",
        tracks: "SELECT * FROM track",
        records: "SELECT * FROM record",
        leaderboards: "SELECT * FROM leaderboard",
        // By id
        player: "SELECT * FROM player WHERE id = $1",
        game: "SELECT * FROM game WHERE id = $1",
        car: "SELECT * FROM car WHERE id = $1",
        track: "SELECT * FROM track WHERE id = $1",
        record: "SELECT * FROM record WHERE id = $1",
        leaderboard: "SELECT * FROM leaderboard WHERE id = $1",
        // By id in list
        playersIn: "SELECT * FROM player WHERE id IN ",
        gamesIn: "SELECT * FROM game WHERE id IN ",
        carsIn: "SELECT * FROM car WHERE id IN ",
        tracksIn: "SELECT * FROM track WHERE id IN ",
        recordsIn: "SELECT * FROM record WHERE id IN ",
        leaderboardsIn: "SELECT * FROM leaderboard WHERE id IN ",
        
        // Full data
        leaderboardFull: [
            "SELECT time, name FROM record, player",
            "WHERE id = $1 AND record.player=player.id"
        ].join(" ")
    },
    testTable: "record",
    insert: {
        player: "INSERT INTO player(name) VALUES ($1)",
        game: "INSERT INTO game(name) VALUES ($1)",
        car: "INSERT INTO car(name, game) VALUES ($1, $2)",
        track: "INSERT INTO track(name, game) VALUES ($1, $2)",
        record: "INSERT INTO record(time, player, leaderboard, date) VALUES ($1, $2, $3, $4)",
        leaderboard: "INSERT INTO leaderboard(game, car, track) VALUES ($1, $2, $3)"
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
    leaderboards: [
        [1,1,1],
        [1,2,2]
    ],
    records: []
}

var Persistence = function() {
};

/*
Persistence.prototype.openWith = function(initialData) {
    return new Promise(function(resolve, reject) {
        Persistence.db = new pg.Database(':memory:');
        
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
*/

Persistence.prototype.connect = function() {
    return new Promise(function(resolve, reject) {
        Persistence.db.connect(function(err, client, done) {
            if (err) {
                console.log(err);
                reject();
            }
            resolve(client);
        });
    });
};

Persistence.prototype.init = function() {
    console.log("Creating database handle ", connectionString);
    Persistence.db = new pg.Client(connectionString);
    Persistence.db.connect();
    new Promise(function(resolve, reject) {
        Persistence.db.query(sqlConst.existsTest,
            function(err, result) { 
                resolve(result); 
            });
        })
        .then(function(result) {
            var databaseInitialized = result.rows.length > 0;
            console.log("Database initialized", databaseInitialized);
            if (databaseInitialized) {
                return;
            }
            else {
                console.log("Initializing database");
                sqlConst.initialize.forEach(function(clause) {
                    Persistence.db.query(clause);
                });
                    
                initialData.players.forEach(function(values) {
                    Persistence.prototype.insert("player", values)
                        .then(function(result) { 
                            console.log("Inserted player", result); 
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
                initialData.leaderboards.forEach(function(values) {
                    Persistence.prototype.insert("leaderboard", values)
                        .then(function() { 
                            console.log("Inserted leaderboard", values); 
                        });
                });
                initialData.records.forEach(function(values) {
                    Persistence.prototype.insert("record", values)
                        .then(function() { 
                            console.log("Inserted record", values); 
                        });
                });
            }
        });
};

Persistence.prototype.rawGet = function(query, values) {
    return new Promise(function(resolve, reject) {
        values = _.isArray(values) ? values : [values];
        var resolveWithValue = function(err, values) { 
            if (err) {
                console.log(query, values, err);
            }
            resolve(values.rows); 
        }
        Persistence.db.query(query, values, resolveWithValue);
    });
}

Persistence.prototype.insert = function(table, values) {
    return new Promise(function(resolve, reject) {
        var query = sqlConst.insert[table];
        values = _.isArray(values) ? values : [values];
        console.log("Should now insert", query, values);
        Persistence.db.query(query, values,
            function(err, result) { 
                if (err) {
                    console.log("ERROR", err);
                }
                resolve(result); 
            });
    });
};

Persistence.prototype.fetchAll = function(table) {
    return new Promise(function(resolve, reject) {
        var query = sqlConst.get[table + "s"];
        console.log("Fetch all", table, query);
        if (query !== undefined) {
            var result = [];
            Persistence.db.query(query, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                var response = {};
                response[table + "s"] = result.rows;
                resolve(response);
            });
        } else {
            reject("Query not found " + table);
        }
    });
};

Persistence.prototype.fetch = function(table, values) {
    return new Promise(function(resolve,reject) {
        values = _.isArray(values) ? values : [values];
        var query = sqlConst.get[table];
        if (query !== undefined) {
            Persistence.db.query(query, values, function(err, result) {
                var response = result.rows.length === 1 ? result.rows[0] : result.rows;
                resolve(response);
            });
        } else {
            reject("Query not found " + table);
        }
    });
};

Persistence.prototype.fetchIn = function(table, values) {
    return new Promise(function(resolve,reject) {
        values = _.isArray(values) ? values : [values];
        var query = sqlConst.get[table + "sIn"];
        query += "(" + values.map((x, i) => "$" + (i + 1)) + ")";
        if (query !== undefined) {
            Persistence.db.query(query, values, function(err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result.rows);
            });
        } else {
            reject("Query not found " + table);
        }
    });
};
/*
Persistence.prototype.close = function() {
	Persistence.db.close();
};
*/
module.exports = new Persistence();