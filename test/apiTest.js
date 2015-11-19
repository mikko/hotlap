var chai            = require('chai');
var expect          = chai.expect;
var persistence     = require('../persistence');


var initialDataQueries = [
    'INSERT INTO player(name) VALUES(\'Ralli-Pekka\');',
    'INSERT INTO track(name, game, car) VALUES(\'Alastaro\', \'Forza\', \'BMW M3 2015\');',
    'INSERT INTO track(name, game, car) VALUES(\'Ouninpohja\', \'Forza\', \'Focus WRC\');',
    'INSERT INTO record(time, player, track) VALUES(700000, 0, 0);'
];

var trackList = { tracks: [
    {
        id: 0,
        name: 'Alastaro',
        gameName: 'Forza',
        carName: 'BMW M3 2015'
    },
    {
        id: 1,
        name: 'Ouninpohja',
        gameName: 'Dirt rally',
        carName: 'Focus WRC'
    }
]};

describe('api', function() {
    beforeEach(function(done) {
        persistence.openWith(initialDataQueries, done);
    });

    afterEach(function() {
        persistence.close();
    });

    it('should return a list of tracks', function() {
        var result = {};
        expect(result).to.deep.equal(trackList);
    });

    it('should return details of a single track', function() {
        expect(true).to.equal(false);
    });

    it('should add a track', function() {
        expect(true).to.equal(false);
    });
});
