var chai = require("chai");
var expect = chai.expect;
var persistence = require("../persistence");

// Player, track, record

var initialDataQueries = [
	"INSERT INTO game(name) VALUES ('Forza');",
	"INSERT INTO car(name) VALUES ('BMW M3 2015');",
	"INSERT INTO player(name) VALUES('Ralli-Pekka');",
	"INSERT INTO track(name, game) VALUES('pohjois-silmukka', 1);",
	"INSERT INTO record(time, player, track, car) VALUES(9999, 1, 1, 1);" // One-based indices
];


describe("db", function() {
	beforeEach(function(done) {
		persistence.openWith(initialDataQueries, done);
	});

	afterEach(function() {
		persistence.close();
	});

	it("should initialize database", function(done) {
		persistence.rawGet("SELECT name FROM sqlite_master WHERE type='table' AND name='record'", function(error, row) {
			expect(row).to.be.ok;
			done();
		});
	});

	it("should initialize with given data", function(done) {
		// Ugly as hell :(
		persistence.rawGet("SELECT name FROM player", function(error, row) {
			expect(row.name).to.equal("Ralli-Pekka");
			persistence.rawGet("SELECT name FROM game", function(error, row) {
				expect(row.name).to.equal("Forza");
				persistence.rawGet("SELECT name FROM car", function(error, row) {
					expect(row.name).to.equal("BMW M3 2015");
					persistence.rawGet("SELECT name FROM track", function(error, row) {
						expect(row.name).to.equal("pohjois-silmukka");
						persistence.rawGet("SELECT time FROM record", function(error, row) {
							expect(row.time).to.equal(9999);
							done();
						});
					});
				});
			});
		});
	});
	
})