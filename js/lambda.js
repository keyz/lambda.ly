// Utils
// ConsCell data structure (actually a linked list).
// http://en.wikipedia.org/wiki/Cons
// here it uses a doubly-linked list to increase the traversal efficiency
/**
 * @constructor
 * @param {} x
 */
function ConsCell(x) {
  this._car = x; // a value, undefined, or another ConsCell
  this._cdr = null;
  this._prev = null;
};

/**
 * 
 * @param {} n - a value, or another ConsCell (nested list)
 */
ConsCell.prototype.setCar = function(n) {
  this._car = n;
};


/**
 * 
 * @param {} n - a ConsCell, or a value (dotted pair: `(1 . 2)`)
 */
ConsCell.prototype.setCdr = function(n) {
  this._cdr = n;
  
  if (n instanceof ConsCell) {
    n._prev = this;
  }
};

var __null__ = "__null__";

/**
 * 
 * @returns {} - a value or a ConsCell
 */
ConsCell.prototype.getCar = function() {
  return this._car;
};

/**
 * 
 * @returns {} - a ConsCell or a value
 */
ConsCell.prototype.getCdr = function() {
  return this._cdr;
};

// and a bunch of shortcuts...
ConsCell.prototype.getCaar = function() {
  return this.getCar().getCar();
};

ConsCell.prototype.getCadr = function() {
  return this.getCdr().getCar();
};

ConsCell.prototype.getCdar = function() {
  return this.getCar().getCdr();
};

ConsCell.prototype.getCddr = function() {
  return this.getCdr().getCdr();
};

ConsCell.prototype.getCaaar = function() {
  return this.getCar().getCar().getCar();
};

ConsCell.prototype.getCaadr = function() {
  return this.getCdr().getCar().getCar();
};

ConsCell.prototype.getCadar = function() {
  return this.getCar().getCdr().getCar();
};

ConsCell.prototype.getCaddr = function() {
  return this.getCdr().getCdr().getCar();
};

ConsCell.prototype.getCdaar = function() {
  return this.getCar().getCar().getCdr();
};

ConsCell.prototype.getCdadr = function() {
  return this.getCdr().getCar().getCdr();
};

ConsCell.prototype.getCddar = function() {
  return this.getCar().getCdr().getCdr();
};

ConsCell.prototype.getCdddr = function() {
  return this.getCdr().getCdr().getCdr();
};


/**
 * 
 * @returns {[]} - an array of Scheme exps
 */
ConsCell.prototype.toArray = function() {
  var result = [];
  var current = this;

  while (current && current !== __null__) {
    result.push(current.getCar());
    current = current.getCdr();
  }

  return result;
};

/**
 * `_.map`'s ConsCell version.
 * @param {ConsCell} x
 * @param {} f
 */
function mapConsCell(x, f) {
  if (x === __null__) {
    return __null__;
  }

  var result = new ConsCell();

  result.setCar(f(x.getCar()));
  result.setCdr(mapConsCell(x.getCdr(), f));

  return result;
}


/**
 * Contract Violation Exception (a.k.a. type error): e.g. (+ 3 'f)
 * @param {} f
 * @param {} expected
 * @param {} given
 * @returns {} 
 */
function ContractViolationException(f, expected, given) {
  this.f = f;
  this.expected = expected;
  this.given = given;
  this.toString = function() {
    return this.f + ": Contract Violation\n"
      + "\texpected: " + this.expected + "\n"
      + "\tgiven: " + this.given + "\n";
  };
}

/**
 * unbound identifier
 * @param {string} v - a Scheme variable name
 * @returns {string} - error message
 */
function UnboundedException(v) {
  this.v = v;
  this.toString = function() {
    return this.v + ": undefined;\n"
      + "  cannot reference an identifier before its definition\n";
  };
}


/**
 * 
 * @param {} inp - a ConsCell or a value
 * @returns {string} - the expression as a string
 */
function writer(inp) {
  // TODO: convert quotes back to "'", ",", and "`"
  var n = inp;
  var result = "";

  var quoteDict = {
    "quasiquote": "`",
    "unquote": ",",
    "quote": "'"
  };

  if (!(n instanceof ConsCell)) {
    if (n === __null__) {
      result += "()";
    }
    else {
      if (n === true) {
        result += "#t";
      }
      else if (n === false) {
        result += "#f";
      }
      else {
        result += n;        
      }
    }

    return result;
  }

  result += "(";

  while (n) {
    result += writer(n._car);

    if (n._cdr === __null__) {
      break;
    }
    else if (!(n._cdr instanceof ConsCell)) {
      result += " . " + writer(n._cdr);
      break;
    }
    else {
      result += " ";
      n = n._cdr;
    }
  }

  result += ")";

  return result;
}

// Scheme Implementation

/**
 * A linear tokenizer.
 * @param {string} rawExp - e.g. "(lambda (x) x)"
 * @returns {[string]} - e.g. ["(", "lambda", "(", "x", ")", "x", ")"]
 */
function tokenize(rawExp) {
  var topDelimiters = ["\""];
  var delimiters = ["(", ")", "[", "]", ",", "'", "`"];

  var tokenResult = [];

  var tempString = "";
  var inStream = false;
  var inStringStream = false;
  var inCommentStream = false;

  for (var i = 0; i < rawExp.length; i++) {
    var currentChar = rawExp[i];

    if (!inStringStream && currentChar === ";") { 
      // special case: inStringStream
      inCommentStream = true;
    }
    else if (inCommentStream) {
      if (currentChar === "\n") {
        inCommentStream = false;
      }
      // else: do nothing -- throw them away
    }
    else if (_.contains(topDelimiters, currentChar) && (rawExp[i-1] !== '\\')) { 
      // found a `"`, and not an escaped one
      tempString += currentChar;
      inStringStream = !inStringStream;

      if (!inStringStream && tempString.length !== 0) {
        // not the first one: time to push the string
        tokenResult.push(tempString);
        tempString = "";
      }
    }
    else if (inStringStream) {
      // append currentChar to tempString
      tempString += currentChar;
    }
    else {
      if (currentChar === " " || currentChar === "\n") {
        // finds a divider
        if (inStream && tempString.length !== 0) {
          tokenResult.push(tempString);
          tempString = "";

          inStream = false;
        }
        // else: ignore it
      }
      else if (_.contains(delimiters, currentChar)) {
        // finds a delimiter
        if (inStream && tempString.length !== 0) {
          tokenResult.push(tempString);
          tempString = "";

          inStream = false;
        }

        tokenResult.push(currentChar); // pushes the delimiter
      }
      else {
        // just a normal character
        tempString += currentChar;
        inStream = true;

        if (i === rawExp.length - 1) {
          tokenResult.push(tempString);
          tempString = "";

          inStream = false;
        }
      }
    }
  }
  return tokenResult;
}

/**
 * 
 * @param {[string]} tokens
 * @returns {} 
 */
function parse(tokens) {

  function tryTypeconversion(rawToken) {
    // #t, #f, numbers
    if (rawToken === "#t") {
      return true;
    }
    else if (rawToken === "#f") {
      return false;
    }
    else {
      var maybeNum = parseFloat(rawToken);
      if (!isNaN(maybeNum)) {
        return maybeNum;
      }
    }

    return rawToken;
  }

  function fixDotPair(n) {
    if (!(n instanceof ConsCell)) {
      return;
    }

    while (n) {
      if (n._car instanceof ConsCell) {
        fixDotPair(n._car);
      }
      else if (n._car === ".") {
        n._prev._cdr = n._cdr._car;
      }

      if (n._cdr === __null__) {
        break;
      }
      else {
        n = n._cdr;
      }
    }
  }

  function fixQuotes(n) {
    var quoteDict = {
      "`": "quasiquote",
      ",": "unquote",
      "'": "quote"
    };

    if (!(n instanceof ConsCell)) {
      return;
    }

    while (n) {
      if (n._car instanceof ConsCell) {
        fixQuotes(n._car);
      }

      if (n._car in quoteDict) {
        var q = n._car;

        // fix the most inner stuff first
        fixQuotes(n._cdr);

        n.setCar(new ConsCell());
        n._car.setCar(quoteDict[q]);
        n._car.setCdr(new ConsCell());
        n._car._cdr.setCar(n._cdr._car);
        // anything else? nope.
        n._car._cdr.setCdr(__null__);
        n.setCdr(n._cdr._cdr);

      }

      if (n._cdr === __null__) {
        break;
      }
      else {
        n = n._cdr;
      }
    }
  }

  var result = new ConsCell();
  var processing = result;
  var stack = [];

  for (var i = 0; i < tokens.length; i++) {
    var currentToken = tokens[i];

    if ((currentToken === '(' && tokens[i+1] === ')')
        || (currentToken === '[' && tokens[i+1] === ']')) {
      // case: ()
      // car := null
      processing.setCar(__null__);
      processing.setCdr(new ConsCell());
      processing = processing._cdr;
      i++;
    }
    else if (currentToken === '(' || currentToken === '[') {
      // case: start of a new list
      processing.setCar(new ConsCell());
      processing.setCdr(new ConsCell());
      stack.push(processing._cdr); // pushes the cdr to the stack
      processing = processing._car;
    }
    else if (currentToken === ')' || currentToken === ']') {
      // one step back
      processing._prev.setCdr(__null__);
      processing = stack.pop(); // jumps back yo
    }
    else {
      processing.setCar(tryTypeconversion(currentToken));
      processing.setCdr(new ConsCell());
      processing = processing._cdr;
    }

  }
  
  fixQuotes(result);
  fixDotPair(result);

  return result._car;
}

/**
 * an environment for current variable bindings
 * @constructor
 * @param {[string]} keysList - a list of Scheme variable names (symbols in Scheme)
 * @param {[]} valuesList - a list of corresponding values
 * @param {Env} outerEnv - lexical scope yo
 */
function Env(keysList, valuesList, outerEnv) {
  this._outer = outerEnv;
  this._data = {}; // mapping
  this._order = []; // keeps the order

  // init
  if (keysList !== undefined && valuesList !== undefined) {
    this.updateAll(keysList, valuesList);
  }
}

/**
 * 
 * @param {string} key - a single Scheme variable name
 * @param {} value - a single value
 */
Env.prototype.update = function(key, value) {
  this._data[key] = {}; // a dict
  this._data[key]._val = value; // changes, or adds a value

  if (_.contains(this._order, key)) {
    this._order = _.without(this._order, key);
  }

  this._order.push(key); // keep recently updated values at the top
};

/**
 * 
 * @param {[string]} keys - a list of Scheme variable names
 * @param {} values - a list of values
 */
Env.prototype.updateAll = function(keys, values) {
  for (var i = 0; i < keys.length; i++) {
    this.update(keys[i], values[i]);
  }
};

/**
 * 
 * @param {string} key - a Scheme variable name
 * @returns {} - the corresponding value
 * @throws {UnboundedException} - variable not bound
 */
Env.prototype.lookupVal = function(key) {
  if (this._data[key] !== undefined) {
    return this._data[key]._val;
  }
  else if (!(this._outer)) {
    throw new UnboundedException(key);
  }
  else {
    return this._outer.lookupVal(key);
  }
};

/**
 * 
 * @returns {[string]} - a list of Scheme variable names
 */
Env.prototype.listVars = function() {
  return this._order;
};

/**
 * add primitives to an Env.
 * @param {Env} targetEnv
 */
function addGlobals(targetEnv) {
  this.globalFuncList = {
    // TODO: human-readable error messages, especially on type checking, and argument numbers
    // TODO: better (original) eqv? and eq? -- do env lookup?
    // http://stackoverflow.com/questions/16299246/what-is-the-difference-between-eq-eqv-equal-and-in-scheme
    "+": function (args) {
      return _.foldl(args.toArray(), function (x, y) {
        return x + y;
      });
    },
    "-": function (args) {
      return _.foldl(args.toArray(), function (x, y) {
        return x - y;
      });
    },
    "*": function (args) {
      return _.foldl(args.toArray(), function (x, y) {
        return x * y;
      });
    },
    "/": function (args) {
      return _.foldl(args.toArray(), function (x, y) {
        return x / y;
      });
    },
    "sub1": function (args) {
      return args.getCar() - 1;
    },
    "add1": function (args) {
      return args.getCar() + 1;
    },
    "zero?": function (args) {
      return args.getCar() === 0;
    },
    "=": function (args) {
      return _.every(args.toArray(), function(x) {
        return x === args.toArray()[0];
      });
    },
    ">": function (args) {
      var args = args.toArray();
      for (var i = 0; i < args.length - 1; i++) {
        if (args[i] <= args[i+1]) {
          return false;
        }
      }
      return true;
    },
    "<": function (args) {
      var args = args.toArray();
      for (var i = 0; i < args.length - 1; i++) {
        if (args[i] >= args[i+1]) {
          return false;
        }
      }
      return true;
    },
    ">=": function (args) {
      var args = args.toArray();
      for (var i = 0; i < args.length - 1; i++) {
        if (args[i] < args[i+1]) {
          return false;
        }
      }
      return true;
    },
    "<=": function (args) {
      var args = args.toArray();
      for (var i = 0; i < args.length - 1; i++) {
        if (args[i] > args[i+1]) {
          return false;
        }
      }
      return true;
    },
    "not": function (args) {
      return !args.getCar();
    },
    "car": function (args) {
      return args.getCaar();
    },
    "cdr": function (args) {
      return args.getCdar();
    },
    "cons": function (args) {
      var a = new ConsCell(args.getCar());
      a.setCdr(args.getCadr());

      return a;
    },
    "length": function (args) {
      var result = 0;

      var current = args.getCar();

      while (current && current !== __null__) {
        result++;
        current = current.getCdr();
      }

      return result;
    },
    "append": function (args) {
      // TODO: foldl version to handle > 2 arguments
      var a = args.getCar();

      if (a === __null__) {
        return args.getCadr();

      }
      else {
        a.setCdr(args.getCadr());
        return a;
      }
    },
    "list": function (args) {
      return args;
    },
    "equal?": function (args) {
      var x = args.getCar();
      var y = args.getCadr();

      function deepEqual(x, y) {
        if (!(x instanceof ConsCell) && !(y instanceof ConsCell)) {
          return x == y;
        }
        else if ((x instanceof ConsCell) && (y instanceof ConsCell)){
          return deepEqual(x.getCar(), y.getCar()) && deepEqual(x.getCdr(), y.getCdr());
        }
        else {
          return false;
        }
      };

      return deepEqual(x, y);
    },
    "eqv?": function (args) {
      var x = args.getCar();
      var y = args.getCadr();

      function deepEqual(x, y) {
        if (!(x instanceof ConsCell) && !(y instanceof ConsCell)) {
          return x == y;
        }
        else if ((x instanceof ConsCell) && (y instanceof ConsCell)){
          return deepEqual(x.getCar(), y.getCar()) && deepEqual(x.getCdr(), y.getCdr());
        }
        else {
          return false;
        }
      };

      return deepEqual(x, y);
    },
    "eq?": function (args) {
      var x = args.getCar();
      var y = args.getCadr();

      function deepEqual(x, y) {
        if (!(x instanceof ConsCell) && !(y instanceof ConsCell)) {
          return x == y;
        }
        else if ((x instanceof ConsCell) && (y instanceof ConsCell)){
          return deepEqual(x.getCar(), y.getCar()) && deepEqual(x.getCdr(), y.getCdr());
        }
        else {
          return false;
        }
      };

      return deepEqual(x, y);
    },
    "pair?": function (args) {
      return args instanceof ConsCell;
    },
    "list?": function (args) {
      var current = args.getCar();

      while (current && current !== __null__) {
        if (!(current.getCdr() instanceof ConsCell) && !(current.getCdr() === __null__)) {
          return false;
        }

        current = current.getCdr();
      }

      return true;
    },
    "null?": function (args) {
      return args.getCar() === __null__ && args.getCdr() === __null__;
    },
    "symbol?": function (args) {
      return (typeof args.getCar()) === "string" && args.getCar()[0] !== "\"";
    },
    "boolean?": function (args) {
      return (typeof args.getCar()) === "boolean";
    }
  };

  for (var key in this.globalFuncList) {
    targetEnv.update(key, this.globalFuncList[key]);
  }
}

var initialEnv = new Env();
addGlobals(initialEnv);

/**
 * the Scheme `eval` function.
 * @param {} exp
 * @param {} env
 * @returns {} 
 */
function evaly(exp, env) {
  if (env === undefined) {
    env = initialEnv;
  }

  var newExps, proc, current;

  while (true) {
    if ((typeof exp) === "number") { // number
      return exp;
    }
    else if ((typeof exp) === "boolean") { // bool
      return exp;
    }
    else if ((typeof exp) === "string" && exp[0] === "\"") { // string, really a string
      return exp;
    }
    else if ((typeof exp) === "string") { // a var
      return env.lookupVal(exp);
    }
    else if (exp.getCar() === "quote") { // '(something)
      return exp.getCadr(); // something
    }
    else if (exp.getCar() === "if") {
      // var testExp = exp.getCadr();
      // var thenExp = exp.getCaddr();
      // var elseExp = exp.getCdr().getCdr().getCdr().getCar(); // cadddr...
      
      if (evaly(exp.getCadr(), env)) {
        exp = exp.getCaddr();
      }
      else {
        exp = exp.getCdr().getCdr().getCdr().getCar(); // cadddr...
      }
    }
    else if (exp.getCar() === "define") {
      // var targetVar = exp.getCadr();
      // var valueExp = exp.getCaddr();
      
      env.update(exp.getCadr(), evaly(exp.getCaddr(), env));
      return null;
    }
    else if (exp.getCar() === "set!") {
      // TODO: check whether the variable exists first.
      // var targetVar = exp.getCadr();
      // var valueExp = exp.getCaddr();
      
      env.update(exp.getCadr(), evaly(exp.getCaddr(), env));
      return null;
      
    }
    else if (exp.getCar() === "lambda") {
      // var xs = exp.getCadr();
      // var body = exp.getCaddr();
      
      return function(args) {
        return evaly(exp.getCaddr(),
                     new Env(exp.getCadr().toArray(), args.toArray(), env));
      };
    }
    else if (exp.getCar() === "begin") {
      current = exp.getCdr();
      if (current === __null__) { // `(begin)` case
        return null;
      }
      while (current.getCdr() !== __null__) {
        evaly(current.getCar());
        current = current.getCdr();
      }

      exp = current.getCar();
      
    }
    else { // (rator rand), a.k.a. apply
      newExps = mapConsCell(exp, function(e) {
        return evaly(e, env);
      });

      proc = newExps.getCar();

      return proc(newExps.getCdr());
    }
  }
}

document.addEventListener("DOMContentLoaded", function(event) { 
  editor.setValue("(define Y\n  ((lambda (y) (lambda (f) (f (lambda (x) (((y y) f) x)))))\n   (lambda (y) (lambda (f) (f (lambda (x) (((y y) f) x)))))))\n\n(define fact\n  (lambda (imp)\n    (lambda (n)\n      (if (< n 2)\n          n\n          (* n (imp (sub1 n)))))))\n\n((Y fact) 5)");
});


function runNow() {
  var originalInput = "(begin " + editor.getValue() + " )";
  function parseAndEval(inp) {
    return evaly(parse(tokenize(inp)));
  }

  var outputDiv = document.getElementById("output");
  var resultP = document.createElement("p");

  var evalResult = writer(parseAndEval(originalInput));

  // TODO: should filter it in the writer function. however, the reason that it's still here is for easier debugging/development.
  if (evalResult !== "null" && evalResult.indexOf("function (args) {") !== 0) {
    resultP.innerHTML = "λ&gt; " + evalResult;
    outputDiv.appendChild(resultP);
  }
  
}

function resetAll() {
  editor.setValue("");
  initialEnv = new Env();
  addGlobals(initialEnv);
  
  var outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";
}
