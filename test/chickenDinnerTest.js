var expect = require('chai').expect;
var sinon = require('sinon');

// mimic requirements for chickenDinner.js
var chickenDinner = require('../lib/chickenDinner.js');
var POINTS = require('../lib/points.js');
var DB = require('../lib/database.js');
var TIMERS = require('../lib/timers.js');

describe('Chicken Dinner', () => {

  var channel, userstate, client, message, gameState, sandbox;

  beforeEach( function() {
    channel = '#testchannel';
    userstate = {
      'display-name': 'Test-User',
      'user-id': 11111
    };
    client = {
      say: function () {}
    };
    gameState = {
      '#testchannel': {
        chickenDinner: {
          activated: true,
          cooldown: false,
          state: 'available',
          pot: {
            total: 0,
            first: 0,
            second: 0,
            third: 0
          },
          participants: [],
          timer: function(func, time) {
            setTimeout( func, time);
          }
        }
      }
    };
    message = ['chickendinner', '100'];
    sandbox = sinon.sandbox.create();
    sandbox.stub(DB, 'db').returns(null);
    sandbox.stub(TIMERS, 'showTimers').returns(gameState);
  });

  afterEach( function() {
    sandbox.restore();
  });

  describe('Player Sorting', () => {

    
    it('should return false if not enough points', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);
      
      var served = await chickenDinner.serve(channel, userstate, client, message);
      
      expect(served).to.be.false;
      
    });

    it('should not send player to lobby if not enough points', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);
      gameState[channel].chickenDinner.state = 'lobby';
      var spy = sandbox.spy(chickenDinner, 'lobby');
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(spy.called).to.be.false;
    });

    it('should not send player to prepare if not enough points', async () => {

      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);
      var spy = sandbox.spy(chickenDinner, 'prepare');

      await chickenDinner.serve(channel, userstate, client, message);

      expect(spy.called).to.be.false;

    });
    
    it('return false if game state is in-progress', 
      async () => {
        
        sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
        gameState[channel].chickenDinner.state = 'in-progress';
        
        var served = await chickenDinner.serve(channel, userstate, client, message);
        
        expect(served).to.be.false;
      });
    
    
    it('should prepare the game if state is available and user has enough points',
      async () => {
        
        var spy = sandbox.spy(chickenDinner, 'prepare');
        sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
        
        await chickenDinner.serve(channel, userstate, client, message);
        
        expect(spy.called).to.be.true;
      });
    
    it('should alert the chat if the game is on cooldown', async () => {
      
      gameState[channel].chickenDinner.cooldown = true;
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var spy = sandbox.spy(client, 'say');
      var expected = 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!';
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(spy.calledWith(channel, expected)).to.be.true;
      
    });
    
    it('should send player to lobby if gameState is lobby', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      gameState[channel].chickenDinner.state = 'lobby';
      var spy = sandbox.spy(chickenDinner, 'lobby');
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(spy.called).to.be.true;
    });

  });
});