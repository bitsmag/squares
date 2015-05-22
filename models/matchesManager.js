function MatchesManager(){
  this.matches = [];
}

MatchesManager.prototype.addMatch = function(match) {
  this.matches.push(match);
};

MatchesManager.prototype.getMatch = function(matchID) {
  for(var i = 0; i < this.matches.length; i++){
    if(parseInt(this.matches[i].id) === parseInt(matchID)){
      return this.matches[i];
    }
  }
  return null;
};

/* not tested
MatchesManager.prototype.removeMatch = function(matchID) {
  for(var i = 0; i++; i<this.matches.length){
    if(this.matches[i].id === matchID){
      var index = this.matches.indexOf(this.matches[i]);
      this.matches.splice(index, 1);
    };
  };
};
*/

// Singelton to be exported
var manager = (function () {
  var instance;

  function createInstance() {
      var theManager = new MatchesManager();
      return theManager;
  }
  if (!instance) {
      instance = createInstance();
  }
  return instance;
})();


exports.manager = manager;
