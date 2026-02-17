'use strict';
function MatchesManager() {
  this.matches = [];
}

MatchesManager.prototype.getMatches = function () {
  return this.matches;
};

MatchesManager.prototype.getMatch = function (matchId) {
  //ERROR: matchNotFound
  const foundMatch = this.matches.find(m => m.id === matchId);
  if (!foundMatch) {
    throw new Error('matchNotFound');
  }
  return foundMatch;
};

MatchesManager.prototype.addMatch = function (match) {
  this.matches.push(match);
};

MatchesManager.prototype.removeMatch = function (match) {
  const index = this.matches.indexOf(match);
  if (index > -1) {
    this.matches.splice(index, 1);
  }
};

// Singelton
const manager = (function () {
  let instance;

  function createInstance() {
    const theManager = new MatchesManager();
    return theManager;
  }
  if (!instance) {
    instance = createInstance();
  }
  return instance;
})();

exports.manager = manager;
