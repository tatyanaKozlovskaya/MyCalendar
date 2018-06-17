//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

/**
 * @license text 2.0.15 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/text/LICENSE
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    function useDefault(value, defaultValue) {
        return value === undefined || value === '' ? defaultValue : value;
    }

    //Allow for default ports for http and https.
    function isSamePort(protocol1, port1, protocol2, port2) {
        if (port1 === port2) {
            return true;
        } else if (protocol1 === protocol2) {
            if (protocol1 === 'http') {
                return useDefault(port1, '80') === useDefault(port2, '80');
            } else if (protocol1 === 'https') {
                return useDefault(port1, '443') === useDefault(port2, '443');
            }
        }
        return false;
    }

    text = {
        version: '2.0.15',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || isSamePort(uProtocol, uPort, protocol, port));
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});


define('text!templates/CalendarTemplate.html',[],function () { return '<div class="clear"></div>\r\n\r\n<div class="autorisation-notification">\r\n    <% if(user){ %>\r\n\r\n    <% } else { %>\r\n    <div class="notification is-danger need-sign-in">\r\n        <button class="delete"></button>\r\n        <%= youNeedAutorisation %>\r\n    </div>\r\n    <div class="popup"></div>\r\n    <% } %>\r\n</div>\r\n\r\n<nav>\r\n    <button class="button is-primary prev">&lt;</button>\r\n    <button class="button is-primary next">&gt;</button>\r\n\r\n</nav>\r\n<h2 class="title year-month"><%= dateInHead %></h2>\r\n<table id="<%= idTable %>" class="table is-bordered">\r\n    <tr>\r\n        <%\r\n        for (var i = 0; i < 7; i++) {\r\n        %>\r\n        <th><%= dayNames[i] %></th>\r\n        <% } %>\r\n    </tr>\r\n    <%\r\n    for (var e = 0; e < Math.ceil((sumDayOfMonth+dayOfWeek)/7); e++) {\r\n    %>\r\n    <tr>\r\n        <%\r\n        if (e < 1) {\r\n        for (var a = 0; a < dayOfWeek; a++) {\r\n        %>\r\n        <td class="td-empty"></td>\r\n        <% count++;\r\n        }\r\n        for (var c = count; c < 7; c++) { %>\r\n        <td id="<%= countOfDays+date %>"><%= countOfDays %></td>\r\n        <% countOfDays++;\r\n        count++;\r\n        }\r\n        } else {\r\n        for (var b = countOfDays; b < 42; b++) {\r\n\r\n        if (countOfDays <= sumDayOfMonth) { %>\r\n        <td id="<%= countOfDays+date %>"><%= countOfDays %></td>\r\n        <% countOfDays++;\r\n        count++;\r\n        } else { %>\r\n        <td class="td-empty"></td>\r\n        <% count++;\r\n        countOfDays++;\r\n        }\r\n        if (count % 7 === 0) { %>\r\n    </tr>\r\n    <% break;\r\n    }\r\n    }\r\n    }\r\n    }%>\r\n\r\n</table>\r\n';});

define('radio',[],function () {
    /**
     * Radio
     * @constructor
     */
    var Radio = function () {
        this.topics = {}
    };

    /**
     * Radio methods
     * @type {{on: Radio.on, trigger: Radio.trigger}}
     */
    Radio.prototype = {
        on: function (topic, listener) {
            // create the topic if not yet created
            if (!this.topics[topic]) {
                this.topics[topic] = [];
            }

            // add the listener
            this.topics[topic].push(listener);
        },

        trigger: function (topic, data1, data2, data3) {
            // return if the topic doesn't exist, or there are no listeners
            if (!this.topics[topic] || this.topics[topic].length < 1) {
                return;
            }

            // send the event to all listeners
            this.topics[topic].map(function (listener) {
                listener(data1, data2, data3);
            });
        },

        off: function (topic, listener) {

            // delete the listener

            var a = this.topics[topic].indexOf(listener);
            this.topics[topic].splice(a, 1);

            // delete the topic if there are not listeners
            if (!this.topics[topic].length < 1) {
                delete this.topics.topic
            }
        },

        once: function (topic, listener) {

            var func = function () {

                listener();
                this.off(topic, func)

            }.bind(this);

            this.on(topic, func);


        }
    };

    var radio = new Radio();
    return radio

});
define('lang',['radio'],
    function (radio) {
        'use strict';
        var Content = function Content() {

            this.el = document.querySelector('#content');
            this.lang = 'lang-ru';
            this.handlers()
                .enable()
                .changeLang();

        };
        Content.prototype = {

            handlers: function () {
                this.changeLangHandler = this.changeLang.bind(this);

                return this
            },
            enable: function () {

                radio.on('changeLangContent', this.changeLangHandler);

                return this;
            },
            changeLang: function (ev) {

                var xhr = new XMLHttpRequest();
                if (ev && ev.target.id === 'lang-en') {
                    xhr.open('GET', 'data/lang_en.json', true);
                } else {
                    xhr.open('GET', 'data/lang_ru.json', true);
                }
                xhr.send();

                xhr.onreadystatechange = function () {

                    if (xhr.readyState !== 4) return;

                    if (xhr.status !== 200) {
                        alert(xhr.status + ': ' + xhr.statusText);
                    } else {
                        var json = JSON.parse(xhr.responseText);
                        this.monthNames = json.monthNames.split(',');
                        this.monthNamesPart = json.monthNamesPart.split(',');
                        this.dayNames = json.dayNames.split(',');
                        this.modalTitle = json.modalTitle;
                        this.save = json.save;
                        this.cancel = json.cancel;
                        this.buttonShowText = json.buttonShow;
                        this.buttonCleanText = json.buttonClean;
                        this.lang = json.lang;
                        this.today = json.today;
                        this.show3days = json.show3days;
                        this.show1day = json.show1day;
                        this.timeText = json.timeText;
                        this.signInText = json.signInText;
                        this.signInWithGoogleText = json.signInWithGoogleText;
                        this.youNeedAutorisation = json.youNeedAutorisation;
                        this.signOut = json.signOut;
                        this.nowYouCan = json.nowYouCan;
                        this.signUpText = json.signUpText;
                        this.cancelText = json.cancelText,
                            this.yourNameText = json.yourNameText,
                            this.yourEmailText = json.yourEmailText,
                            this.yourPasswordText = json.yourPasswordText

                        radio.trigger('changeLang');
                    }
                }.bind(this)

            }

        };

        var lang = new Content;
        return lang;

    });
define('Error',[],function () {

    return error = {
        create: function (type, value) {

            switch (type) {
                case 'danger':
                    var divD = document.createElement('div');
                    divD.classList.add('notification', 'is-danger', 'errorNot');
                    divD.innerHTML = value;
                    var cont = document.querySelector('#menu');
                    cont.appendChild(divD);
                    setTimeout(this.delete, 1500, divD);

                    break;
                case 'ok':
                    console.log(value);
                    var divO = document.createElement('div');
                    divO.classList.add('notification', 'is-primary', 'errorNot');
                    divO.innerHTML = value;
                    var contO = document.querySelector('#menu');
                    contO.appendChild(divO);
                    setTimeout(this.delete, 1500, divO);
                    break;
            }
        },
        delete: function (el) {
            el.parentNode.removeChild(el);
        }

    }

});
define('fb',['firebase', 'module', 'radio', 'Error'], function (firebase, module, radio, myError) {
    var fairBase = {


        init: function () {
            firebase.initializeApp(module.config());
            this.user = false || firebase.auth().currentUser;
            this.userData;
            this.data = false;
            this.setupEvents();

        },
        setupEvents: function () {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    this.user = user;
                    this.dataBase(this.data, user.uid);

                } else if (user !== null) {
                    this.user = false;

                    radio.trigger('signInOrOut', this.user);
                } else {
                    radio.trigger('signInOrOut', this.user);
                }

            }.bind(this));

        },
        setupReferensUserPhotos: function () {
            var ref = firebase.database().ref('users/' + this.user.uid + '/images/photos');
            ref.on('value', function (snapshot) {

                radio.trigger('newUserPhotos', snapshot.val(), 'photos');
            });
        },
        setupReferensBackground: function () {
            var refBackground = firebase.database().ref('users/' + this.user.uid + '/images/backgrounds');
            refBackground.on('value', function (snapshot) {

                radio.trigger('newUserPhotos', snapshot.val(), 'backgrounds');
            });
        },
        signInWithGoogle: function () {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function (result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;
                this.user = user;
                this.data = {
                    name: user.displayName,
                    email: user.email
                }
            }.bind(this)).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            })
        },
        signOut: function (user) {
            var func = function () {
                firebase.auth().signOut().then(function () {

                }).catch(function (error) {

                });
                this.user = false;
                this.userData = false;
                console.log('user sign out', this.user);
            }.bind(this);

            setTimeout(func, 1000);
        },
        registerNewUser: function (email, password, data) {
            firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode == 'auth/weak-password') {
                    alert('The password is too weak.');
                } else {
                    alert(errorMessage);
                }
                console.log(error);
            });
            this.data = data;

        },
        signInWithEmail: function (email, password) {

            firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode === 'auth/wrong-password') {
                    alert('Wrong password.');
                } else {
                    alert(errorMessage);
                }

            });

        },
        dataBase: function (data, userId) {

            return firebase.database().ref('users/' + userId).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    console.log('user exist');
                } else {
                    console.log('new user');
                    firebase.database().ref('users/' + userId + '/').set(data);
                }
                this.getInfo(userId);

            }.bind(this));


        },
        returnName: function (userId) {

            return firebase.database().ref('users/' + userId).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    this.user.name = snapshot.val().name;
                }


            }.bind(this));


        },
        saveTasks: function (tasks) {
            if (this.user) {
                console.log(this.user);
                firebase.database().ref('users/' + this.user.uid + '/tasks').set(tasks);
            }

        },
        saveInfo: function (info, puth) {

            firebase.database().ref('users/' + this.user.uid + puth).set(info);

        },
        getTasks: function () {
            if (firebase.auth().currentUser !== null) {

                return firebase.database().ref('users/' + this.user.uid + '/tasks').once('value').then(function (snapshot) {
                    if (snapshot.val()) {
                        this.tasks = snapshot.val();

                    } else {
                        this.tasks = {};
                    }

                    radio.trigger('tasksGot', this.tasks);

                })
            }

        },
        getInfo: function (uid) {

            return firebase.database().ref('users/' + this.user.uid).once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    this.userData = snapshot.val();

                } else {
                    return
                }

                radio.trigger('signInOrOut', this.user);
            }.bind(this))

        },
        deleteInfo: function (puth, id) {
            var storage = firebase.storage();
            var storageRef = storage.ref();
            var desertRef = storageRef.child(puth);
            // Delete the file
            desertRef.delete().then(function () {
                // File deleted successfully
            }).catch(function (error) {
                // Uh-oh, an error occurred!
            });
            var puthForBase = puth.split('.');
            puthForBase = puthForBase[0];
            var id = puthForBase[0].split('/');
            id = id[id.length];
            firebase.database().ref('users/' + this.user.uid + '/' + puthForBase).remove(id)


        },
        deleteInfoSettings: function (puth) {
            firebase.database().ref('users/' + this.user.uid + puth).remove();

        },
        generateId: function () {
            return 'id' + (new Date()).getTime();
        },
        saveInStorage: function (id, file, folder) {
            var fileType = file.name.split('.');
            fileType = fileType[1];
            console.log(fileType);
            if (fileType != 'jpg' && fileType != 'png' && fileType != 'jpeg') {
                myError.create('danger', 'Можно загружать только изображения в формате jpg, jpeg, png!');
                return
            }
            var puth = 'images/' + folder + id + '.' + fileType;
            var storage = firebase.storage();
            var storageRef = storage.ref();
            var uploadTask = storageRef.child(puth).put(file);
            uploadTask.on('state_changed', function (snapshot) {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                    case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        break;
                }
            }, function (er) {
                // Handle unsuccessful uploads
                error.create('danger', er);
            }, function () {
                // Handle successful uploads on complete
                // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                var downloadURL = uploadTask.snapshot.downloadURL;
                var dataUrl = {
                    puth: puth,
                    downloadURL: downloadURL
                }
                firebase.database().ref('users/' + this.user.uid + '/images/' + folder + id).set(dataUrl);
                myError.create('ok', 'Фотография загружена успешно!');


            }.bind(this));

        }


    };

    return fairBase
})
;
define('views/CalendarView',['underscore', 'text!templates/CalendarTemplate.html', 'radio', 'lang', 'fb'],
    function (_, CalendarTemplateString, radio, lang, fb) {

        var CalendarView = function (model) {
            this.model = model;
            this.el = document.querySelector('#container');
            this.monthNamesPart = lang.monthNamesPart;
            this.dayNames = lang.dayNames;
            this.template = _.template(CalendarTemplateString);

            this.init();

        };

        CalendarView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el.addEventListener('click', this.clickHandler.bind(this));
                this.el.addEventListener('mouseover', this.mouseOverHandler.bind(this));
                this.el.addEventListener('changeLang', this.cahangeLang);
                return this
            },
            clickHandler: function (ev) {

                var target = ev.target;
                while (target !== this.el) {
                    if (target.tagName === "TD") {
                        if (target.childNodes && target.childNodes[0] && target.childNodes[0].data) {
                            var day = target.childNodes[0].data;
                            var date = [day, this.model.month, this.model.year];
                            radio.trigger('clickTd', date);
                        }
                        return;
                    }
                    if (target.tagName === 'SPAN') {

                        var dayForKey = ev.target.parentElement.parentElement.parentElement.childNodes[0].data;
                        var key = dayForKey + '-' + this.model.month + '-' + this.model.year;
                        radio.trigger('deleteTask', ev, key);
                        return;

                    }
                    if (target.tagName === 'BUTTON') {
                        var targetClasses = ev.target.className.split(' ');
                        if (targetClasses.length) {
                            if (targetClasses.indexOf('next') !== -1) {
                                radio.trigger('nextMonth');
                            }
                            if (targetClasses.indexOf('prev') !== -1) {
                                radio.trigger('prevMonth');
                            }
                        }
                        return;
                    }
                    target = target.parentNode;
                }
            },
            calendar: function () {

                var dateInHead = this.model.year + " | " + lang.monthNames[this.model.month - 1];
                var idTable = this.model.year + "-" + this.model.month;
                this.el.innerHTML = this.template({
                    dateInHead: dateInHead,
                    idTable: idTable,
                    dayNames: this.dayNames,
                    sumDayOfMonth: this.model.sumDayOfMonth(),
                    dayOfWeek: this.model.dayOfWeek() - 1,
                    count: 0,
                    countOfDays: 1,
                    date: '-' + this.model.month + '-' + this.model.year,
                    youNeedAutorisation: lang.youNeedAutorisation,
                    nowYouCan: lang.nowYouCan,
                    user: fb.user
                });
                this.light();
                radio.trigger('newTable');

                return this
            },
            changeLang: function () {

                this.monthNames = lang.monthNames;
                this.monthNamesPart = lang.monthNamesPart;
                this.dayNames = lang.dayNames;
                this.calendar();
            },
            light: function () {

                var todayMonth = document.getElementsByTagName('td'); //подсвечиваем сегодняшнее число
                for (var a = 0; a < todayMonth.length; a++) {
                    if (todayMonth[a].childNodes[0]) {
                        if (this.model.month === this.model.realMonth && todayMonth[a].childNodes[0].data === this.model.todayDay + '') {
                            todayMonth[a].classList.add("td-today");
                        }
                    }
                }
            },
            mouseOverHandler: function (ev) { //при наведении на ячейку она подсвечивается

                if (ev.target.tagName === 'TD') {
                    ev.target.classList.add("td-illumination");
                }
                ev.target.addEventListener('mouseleave', function (ev) {//при покидании ячейки она становится обычной
                    if (ev.target.tagName === 'TD') {
                        ev.target.classList.remove("td-illumination");
                    }
                })
            },
            cleanCalendar: function () {

                radio.trigger('cleanTasksFromMonth', this.model.month, this.model.year);
                this.calendar();

            }
        };
        return CalendarView;
    }
);
define('models/CalendarModel',['radio'],
    function (radio) {

        var CalendarModel = function () {
            var todayDate = new Date();
            this.realMonth = todayDate.getMonth() + 1;// получаем месяц;
            this.year = todayDate.getFullYear();//получаем год;
            this.month = todayDate.getMonth() + 1;// получаем месяц;
            this.todayDay = todayDate.getDate(); //получаем число;
            this.dayOfWeek = function () { //получаем день недели
                var here = new Date(this.year, this.month - 1);
                return here.getDay();
            }.bind(this);
            this.sumDayOfMonth = function () { //считаем сколько дней в месяце
                var here = new Date(this.year, this.month - 1);
                here.setDate(32);
                return 32 - here.getDate();
            }.bind(this);

        };
        CalendarModel.prototype = {

            updateData: function (year, month) {
                var isthisMonth = 0;
                if (year && month) {
                    if (this.year === year && this.month === month) {
                        isthisMonth = 1;
                    }
                    this.year = year;
                    this.month = month;
                    radio.trigger('render');
                    if (isthisMonth === 1) {
                        radio.trigger('thisMonth');
                    }
                }
            },
            renderNext: function () {
                if (this.month < 12) {
                    ++this.month;
                    radio.trigger('render');
                } else {
                    ++this.year;
                    this.month = 1;
                    radio.trigger('render');
                }
            },
            renderPrev: function () {
                if (this.month > 1) {
                    --this.month;
                    radio.trigger('render');

                } else {
                    --this.year;
                    this.month = 12;
                    radio.trigger('render');

                }
            }
        };

        return CalendarModel;
    }
);
define('models/TaskModel',['fb'], function (fb) {


    var TaskModel = function () {

        this.tasks = {};
    };

    TaskModel.prototype = {

        saveTask: function (value, key, time) {

            if (this.tasks[key]) {
                this.tasks[key].push({value: value, time: time});
            } else {
                this.tasks[key] = [{value: value, time: time}];
            }
        },
        deleteTask: function (ev, key) {

            var li = ev.target.parentNode.innerText;
            var index = this.tasks[key].indexOf(li);
            this.tasks[key].splice([index], 1);

        },
        getTasksfromLocalStorage: function () {

            fb.getTasks();
        },
        tasksGot: function (tasks) {

            this.tasks = tasks;
        },
        saveTasksInLocalStorage: function () {

            fb.saveTasks(this.tasks);
        },
        cleanTasks: function () {

            this.tasks = {};
        },
        cleanCalendar: function (month, year) {
            for (var d = 0; d < 32; d++) {
                var key = d + '-' + month + '-' + year;
                if (this.tasks[key]) {
                    delete this.tasks[key]
                }
            }
        }
    };

    return TaskModel
});
define('views/TaskView',[],function () {

    var TaskView = function (model) {
        this.model = model;

    };

    TaskView.prototype = {

        deleteTask: function (ev) {

            var ul = ev.target.parentNode.parentNode;
            var ulChild = ul.children;
            ul.removeChild(ev.target.parentNode);
            if (ulChild.length < 1) {
                ul.parentNode.removeChild(ul);
            }
        },
        renderTasks: function () {

            var days = document.getElementsByTagName('td');
            for (var i = 0; i < days.length; i++) {

                var key = days[i].id;

                if (this.model.tasks[key]) {

                    var td = document.getElementById(key);
                    var ul = td.children;
                    if (ul.length < 1) {
                        ul = document.createElement('ul');
                        td.appendChild(ul);
                    } else {
                        ul = td.children[0];
                    }
                    function compareTime(taskA, taskB) {
                        return (+taskA.time.split(':')[0]) - (+taskB.time.split(':')[0]);
                    }

                    var sortTasks = this.model.tasks[key].sort(compareTime);
                    for (var a = 0; a < this.model.tasks[key].length; a++) {


                        var li = document.createElement('li');
                        li.classList.add('notification', 'is-primary');
                        var close = document.createElement('span');
                        var taskTime = document.createElement('span');
                        taskTime.classList.add('timeSpan');
                        taskTime.innerHTML = this.model.tasks[key][a].time + '';

                        li.appendChild(taskTime);
                        li.innerHTML += this.model.tasks[key][a].value + '';
                        li.appendChild(close);
                        close.classList.add('delete');
                        ul.appendChild(li);
                    }

                }
            }
        }
    };

    return TaskView;
});
define('controllers/TaskController',['models/TaskModel', 'views/TaskView', 'radio'],
    function (TaskModel, TaskView, radio) {

        var TaskController = function () {

            this.model = new TaskModel();
            this.view = new TaskView(this.model);

            this.init();
        };

        TaskController.prototype = {

            init: function () {

                this.handlers().enable().getTasks();

            },
            handlers: function () {
                this.saveTaskHandler = this.saveTask.bind(this);
                this.deleteTaskHandler = this.deleteTask.bind(this);
                this.getTasksHandler = this.getTasks.bind(this);
                this.saveTasksLocalHandler = this.saveTasksLocal.bind(this);
                this.saveTasksAndCleanHandler = this.saveTasksAndClean.bind(this);
                this.newTableHandler = this.newTable.bind(this);
                this.cleanCalendarHandler = this.cleanTasksFromMonth.bind(this);
                this.tasksGotHandler = this.tasksGot.bind(this);

                return this
            },
            enable: function () {

                radio.on('saveTask', this.saveTaskHandler);
                radio.on('deleteTask', this.deleteTaskHandler);
                radio.on('signInOrOut', this.getTasksHandler);
                radio.on('pageHide', this.saveTasksLocalHandler);
                radio.on('sign-out', this.saveTasksAndCleanHandler);
                radio.on('newTable', this.newTableHandler);
                radio.on('cleanTasksFromMonth', this.cleanCalendarHandler);
                radio.on('tasksGot', this.tasksGotHandler);

                return this;
            },
            saveTask: function (value, key, time) {

                this.model.saveTask(value, key, time);
            },
            deleteTask: function (ev, key) {

                this.model.deleteTask(ev, key);
                this.view.deleteTask(ev);
            },
            getTasks: function () {

                this.model.getTasksfromLocalStorage();

            },
            saveTasksLocal: function () {

                this.model.saveTasksInLocalStorage();
            },
            saveTasksAndClean: function () {

                this.model.saveTasksInLocalStorage();
                this.model.cleanTasks();
            },
            newTable: function () {

                this.view.renderTasks();
            },
            cleanTasksFromMonth: function (month, year) {

                this.model.cleanCalendar(month, year);
            },
            tasksGot: function (tasks) {

                this.model.tasksGot(tasks);
                this.view.renderTasks();
            }
        };

        return TaskController;
    });
define('models/ModalModel',[],function () {

    var ModalModel = function () {

    };

    ModalModel.prototype = {

        updateData: function (date) {

            if (date.length === 3) {
                this.day = date[0];
                this.month = date[1];
                this.year = date[2];
            }
        }

    };

    return ModalModel;
});

define('text!templates/ModalTemplate.html',[],function () { return '<div class="modal-card is-primary">\r\n    <div class="modal-card-head">\r\n        <p class="modal-card-title"><%= date %></p>\r\n\r\n    </div>\r\n    <section class="modal-card-body">\r\n        <input class="input" name="" id="eventTask">\r\n        <div class="field">\r\n            <label class="label"><%= timeText %></label>\r\n            <p class="control">\r\n                <span class="select"> \r\n                  <select id="time">\r\n                   <%  for (var m = 0; m <= 24; m++) { %>\r\n                   <option value="<%= m %>">\r\n                   <% if(m < 10){print(\'0\'+ m + \':00\')} else {print(m + \':00\')} m + \':00\' %>\r\n                   </option>           \r\n                   <% } %>\r\n                  </select>\r\n                </span>\r\n            </p>\r\n        </div>\r\n    </section>\r\n    <div class="modal-card-foot">\r\n        <a class="button is-success" id="saveModal"><%= saveText %></a>\r\n        <a class="button cancel" id="cancelModal"><%= cancelText %></a>\r\n    </div>\r\n\r\n</div>';});

define('views/ModalView',['underscore', 'text!templates/ModalTemplate.html', 'radio', 'lang'],
    function (_, ModalTemplateString, radio, lang) {

        var ModalView = function (model) {
            this.model = model;
            this.el = document.querySelector('#modal');
            this.template = _.template(ModalTemplateString);
            this.init();

        };

        ModalView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el.addEventListener('click', this.clickHandler.bind(this));

                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.length) {
                    if (targetClasses.indexOf('cancel') !== -1) {
                        this.hide();
                    }
                    if (targetClasses.indexOf('is-success') !== -1) {
                        this.saveTask();
                        this.hide();
                    }
                }
            },
            show: function () {

                this.el.classList.add('is-active');
                this.el.innerHTML = this.template({
                    date: lang.modalTitle + this.model.day + ' ' + lang.monthNamesPart[this.model.month - 1] + ' ' + this.model.year,
                    timeText: lang.timeText,
                    saveText: lang.save,
                    cancelText: lang.cancel,
                });
            },
            hide: function () {

                this.el.classList.remove('is-active');

            },
            saveTask: function () {

                this.input = this.el.querySelector('#eventTask');
                this.time = this.el.querySelector('#time');
                if (this.input.value) {
                    var value = this.input.value;
                    var timeIndex = this.time.options.selectedIndex;
                    var time = this.time.options[timeIndex].label;
                    var key = this.model.day + '-' + this.model.month + '-' + this.model.year;
                    radio.trigger('saveTask', value, key, time);
                    radio.trigger('render');
                    this.input.value = '';

                }
            }
        };

        return ModalView;
    });
define('controllers/ModalController',['models/ModalModel', 'views/ModalView', 'radio'],
    function (ModalModel, ModalView, radio) {

        var ModalController = function () {

            this.model = new ModalModel();
            this.view = new ModalView(this.model);

            this.init();
        };

        ModalController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.showHandler = this.show.bind(this);

                return this
            },
            enable: function () {


                radio.on('clickTd', this.showHandler);

                return this;
            },
            show: function (date) {

                this.model.updateData(date);
                this.view.show()
            }
        };

        return ModalController
    });
define('controllers/CalendarController',['views/CalendarView', 'models/CalendarModel', 'controllers/TaskController', 'controllers/ModalController', 'radio'],
    function (CalendarView, CalendarModel, TaskController, ModalController, radio) {

        var CalendarController = function () {

            this.model = new CalendarModel();
            this.view = new CalendarView(this.model);
            this.taskHelper = new TaskController();
            this.modalWindow = new ModalController();
            this.init();
        };

        CalendarController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.newDataHandler = this.newData.bind(this);
                this.renderHandler = this.render.bind(this);
                this.thisMonthHandler = this.thisMonth.bind(this);
                this.nextMonthHandler = this.nextMonth.bind(this);
                this.prevMonthHandler = this.prevMonth.bind(this);
                this.changeLangHandler = this.changeLang.bind(this);
                this.cleanCalendarHandler = this.cleanCalendar.bind(this);
                this.signInOrOutHandler = this.signInOrOut.bind(this);

                return this
            },
            enable: function () {

                radio.on('newData', this.newDataHandler);
                radio.on('render', this.renderHandler);
                radio.on('thisMonth', this.thisMonthHandler);
                radio.on('nextMonth', this.nextMonthHandler);
                radio.on('prevMonth', this.prevMonthHandler);
                radio.on('changeLang', this.changeLangHandler);
                radio.on('cleanCalendar', this.cleanCalendarHandler);
                radio.on('signInOrOut', this.signInOrOutHandler);


                return this;
            },
            newData: function (year, month) {

                this.model.updateData(year, month);
            },
            render: function () {

                this.view.calendar();
            },
            thisMonth: function () {

                this.view.light();
            },
            nextMonth: function () {

                this.model.renderNext();
            },
            prevMonth: function () {

                this.model.renderPrev();
            },
            changeLang: function () {

                this.view.changeLang();
            },
            cleanCalendar: function (ev) {

                this.view.cleanCalendar(ev);
            },
            signInOrOut: function () {

                this.view.calendar();
            }
        };
        return CalendarController;
    }
);
define('models/MenuModel',[],function () {


    var MenuModel = function () {
        this.month = 1;
        this.year = 1990;

    };

    MenuModel.prototype = {

        updateMonth: function (month) {
            this.month = month;
        },
        updateYear: function (year) {
            this.year = year;
        }

    };
    return MenuModel;
});


define('text!templates/MenuTemplate.html',[],function () { return '<div class="weather">\r\n</div>\r\n<section class="buttons-all  <% if(user){ print(\'buttons-all-user\')} %> ">\r\n\r\n    <div class="autorisation">\r\n        <div class="settings-button">\r\n            <img src="img/menu-image.png" class="settings-button-img">\r\n        </div>\r\n\r\n        <% if(user){\r\n        if(user.backgrouns){\r\n        document.body.style.backgroundImage = \'url(\'+user.backgrounds+\')\';\r\n        } else {\r\n        document.body.style.backgroundImage = \'url(img/Light-Abstract-Wallpapers.jpg)\';}%>\r\n        <div class="user-header-img">\r\n            <img class="user-img user-img-button" <%\r\n            if(user.avatar){ %> src="<%= user.avatar.src %>" <% } else if(user.photoURL){ %> src="<%= user.photoURL %>"\r\n            <% } else { %>\r\n            src="img/user_pic.jpg" <% } %> >\r\n        </div>\r\n        <div class="user-header-name"><% if( user.name){print(user.name)} %></div>\r\n        <div class="hashes">\r\n            <a class="button is-primary hash" href="#ToDoList">\r\n                <span>ToDoList</span>\r\n            </a>\r\n            <a class="button is-primary hash" href="#Calendar">\r\n                <span>Calendar</span>\r\n            </a>\r\n        </div>\r\n\r\n        <%} else { document.body.style.backgroundImage = \'url(img/Light-Abstract-Wallpapers.jpg)\';%>\r\n\r\n        <button class="button is-primary sign-google-in">\r\n            <%= signInWithGoogleText %><i class="fa fa-google" aria-hidden="true"></i>\r\n        </button>\r\n        <section class="autentification">\r\n            <input class="input email" name="" id="eventTask" placeholder="Tatka@mail.ru">\r\n            <input class="input password" type="password" name="" id="eventTask" placeholder="***********">\r\n        </section>\r\n        <button class="button is-primary sign-in">\r\n            <%= signInText %><i class="fa fa-sign-in" aria-hidden="true"></i>\r\n        </button>\r\n        <button class="button is-primary sign-up">\r\n            <%= signUpText %><i class="fa fa-user-plus" aria-hidden="true"></i>\r\n        </button>\r\n        <div class="clear"></div>\r\n\r\n        <% } %>\r\n\r\n    </div>\r\n\r\n    <section class="form-sign-up modal">\r\n\r\n\r\n    </section>\r\n\r\n\r\n    <% if(user){ %>\r\n    <div class="dateButton">\r\n        <img src="img/Create-new-calendar.png" class="dateButtonImg">\r\n    </div>\r\n    <div class="dateSettings noneDisplay">\r\n\r\n        <select id="selectYear">\r\n            <%for (var y = 2017; y >= 1990; y--) { %>\r\n            <option><%= y %></option>\r\n            <% } %>\r\n        </select>\r\n        <select id="selectMonth">\r\n            <% for (var m = 0; m < 12; m++) { %>\r\n            <option value="<%= m %>"><%= monthNames[m] %></option>\r\n            <% } %>\r\n        </select>\r\n\r\n        <button id="showNewCalendar" class="button is-primary"><%= showText %></button>\r\n        <button id="cleanCalendar" class="button is-danger"><%= cleanText %></button>\r\n        <span class="delete delete-date-settings"></span>\r\n        <% } %>\r\n    </div>\r\n</section>\r\n<div class="user-class user-settings noneDisplay">\r\n    <div class="return">\r\n        <img src="img/return-img.png" class="return-user-settings">\r\n    </div>\r\n    <div class="buttons-lang">\r\n        <button id="lang-ru" class="button is-primary is-inverted lang">Ru</button>\r\n        <button id="lang-en" class="button is-primary is-inverted lang">En</button>\r\n    </div>\r\n    <% if(user){ %>\r\n    <button class="button background-button is-primary">\r\n        Фон\r\n    </button>\r\n    <% } %>\r\n</div>\r\n<% if(user){ %>\r\n<div class="user-class user-profile noneDisplay">\r\n    <div class="return">\r\n        <img src="img/return-img.png" class="return-user-profile">\r\n    </div>\r\n    <div class="user-img-container">\r\n        <img class="user-img" <% if(user.avatar){%> src="<%= user.avatar.src %>" <% } else if(user.photoURL){ %>\r\n        src="<%= user.photoURL %>" <% } else { %>\r\n        src="img/user_pic.jpg" <% } %> >\r\n        <span class="caption-user-photo">Изменить</span>\r\n    </div>\r\n    <span class="user-name"><% if( user.name){print(user.name)} %></span>\r\n    <button class="button is-primary sign-out">\r\n        <%= signOutText %><i class="fa fa-sign-out" aria-hidden="true"></i></i>\r\n    </button>\r\n\r\n</div>\r\n\r\n<div class="user-class user-profile-fotos noneDisplay">\r\n    <div class="return">\r\n        <img src="img/return-img.png" class="return-user-profile-fotos">\r\n    </div>\r\n    <span>Мои фото:</span>\r\n    <div class="my-photos"></div>\r\n\r\n    <input type="file" class="photos-download">\r\n</div>\r\n<div class="user-class user-backgrounds noneDisplay">\r\n    <div class="return">\r\n        <img src="img/return-img.png" class="return-user-backgrounds">\r\n    </div>\r\n    <span>Мои фоны:</span>\r\n    <div class="my-backgrounds"></div>\r\n\r\n    <input type="file" class="background-download">\r\n</div>\r\n<% } %>\r\n\r\n<div class="clear"></div>\r\n';});

define('models/RegistrationModel',[],function () {

    var RegistrationModel = function () {


    };

    RegistrationModel.prototype = {

        userData: function (email, password, name) {

            this.userEmail = email;
            this.userPassword = password;
            this.userName = name;

        }

    };

    return RegistrationModel;
});

define('text!templates/RegistrationTemplate.html',[],function () { return '<div class="popup"></div>\r\n<div class="form">\r\n    <div class="field">\r\n        <label class="label"><%= yourNameText %></label>\r\n        <p class="control">\r\n            <input class="input registr-name" type="text" placeholder="Your name">\r\n        </p>\r\n    </div>\r\n\r\n    <div class="field">\r\n        <label class="label"><%= yourEmailText %></label>\r\n        <p class="control has-icons-left has-icons-right">\r\n            <input class="input registr-email" type="text" placeholder="Email input" value="hello@">\r\n        </p>\r\n    </div>\r\n\r\n    <div class="field">\r\n        <label class="label"><%= yourPasswordText %></label>\r\n        <p class="control has-icons-left has-icons-right">\r\n            <input class="input registr-password" placeholder="Password input" value="****************" type="password">\r\n        </p>\r\n    </div>\r\n\r\n    <div class="field is-grouped">\r\n        <p class="control">\r\n            <button class="button is-primary register"><%= signUpText %></button>\r\n        </p>\r\n        <p class="control">\r\n            <button class="button  is-danger cancelRegister"><%= cancelText %></button>\r\n        </p>\r\n    </div>\r\n</div>';});

define('views/RegistrationView',['underscore', 'text!templates/RegistrationTemplate.html', 'radio', 'lang'],
    function (_, RegistrationTemplateString, radio, lang) {

        var RegistrationView = function (model) {
            this.model = model;
            this.template = _.template(RegistrationTemplateString);
            this.init();

        };

        RegistrationView.prototype = {

            init: function () {

                this.enable();

            },
            enable: function () {

                this.el = document.querySelector('.form-sign-up');
                this.el.addEventListener('click', this.clickHandler.bind(this));
                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.length) {

                    if (targetClasses.indexOf('cancelRegister') !== -1) {

                        this.hide();
                    }
                    if (targetClasses.indexOf('register') !== -1) {
                        this.registerUser();
                        this.hide();
                    }

                }
            },
            show: function () {

                this.el.classList.add('is-active');
                this.el.innerHTML = this.template({
                    signUpText: lang.signUpText,
                    cancelText: lang.cancelText,
                    yourNameText: lang.yourNameText,
                    yourEmailText: lang.yourEmailText,
                    yourPasswordText: lang.yourPasswordText
                });
            },
            hide: function () {

                this.el.classList.remove('is-active');

            },
            registerUser: function () {

                this.name = this.el.querySelector('.registr-name');
                this.email = this.el.querySelector('.registr-email');
                this.password = this.el.querySelector('.registr-password');
                var data = {};
                if (this.name.value) {
                    data['name'] = this.name.value;
                } else {
                    alert('Введите имя!')
                }
                if (this.email.value) {
                    data['email'] = this.email.value;
                } else {
                    alert('Введите email!')
                }
                if (this.password.value) {
                    data['password'] = this.password.value;
                } else {
                    alert('Введите пароль!')
                }
                radio.trigger('registerNewUser', data.email, data.password, data);
                radio.trigger('signInWithEmail', data.email, data.password);
                this.name.value = '';
                this.email.value = '';
                this.password.value = '';
            }
        };
        return RegistrationView
    });
define('controllers/RegistrationController',['models/RegistrationModel', 'views/RegistrationView', 'radio', 'fb'],
    function (RegistrationModel, RegistrationView, radio, fb) {

        var RegistrationController = function () {

            this.model = new RegistrationModel();
            this.view = new RegistrationView(this.model);

            this.init();
        };

        RegistrationController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.signUpNowHandler = this.signUpNow.bind(this);
                this.registerNewUserHandler = this.registerNewUser.bind(this);

                return this
            },
            enable: function () {


                radio.on('sign-up-now', this.signUpNowHandler);
                radio.on('registerNewUser', this.registerNewUserHandler);


                return this;
            },
            signUpNow: function () {

                this.view.show()
            },
            registerNewUser: function (email, password, data) {

                fb.registerNewUser(email, password, data);
            }
        };

        return RegistrationController
    });
define('views/MenuView',['underscore','text!templates/MenuTemplate.html','radio','lang','fb','controllers/RegistrationController'],
    function(_,MenuTemplateString,radio,lang,fb,RegistrationController){

        var MenuView = function (model) {
            this.model = model;
            this.el = document.querySelector('#menu');
            this.lang = lang.lang;
            this.template =  _.template(MenuTemplateString);
            this.init();

        };

        MenuView.prototype = {
            
            init: function(){
              this.enable();
            },
            enable: function(){
                this.el.addEventListener('click', this.clickHandler.bind(this));
                this.el.addEventListener('change', this.menuChangeHandler.bind(this));
                return this
            },
            render: function(){
               this.el.classList.add('header-with-user');
               this.el.innerHTML = this.template({
                      cleanText: lang.buttonCleanText,
                      showText: lang.buttonShowText,
                      monthNames: lang.monthNames,
                      signInText: lang.signInText,
                      signInWithGoogleText: lang.signInWithGoogleText,
                      signUpText:lang.signUpText,
                      signOutText: lang.signOut,
                      user: fb.userData
                    
               });
               if(fb.userData && fb.userData.avatar)
               {
                 this.avatar = fb.userData.avatar.id;
               }
                if(fb.userData &&  fb.userData.backgrounds)
               {
                 this.background = fb.userData.backgrounds;
               }
               
                this.dataSettings = this.el.querySelector('.dateSettings');
                this.dataSettingsButton = this.el.querySelector('.dateButton');
                this.userSettings = this.el.querySelector('.user-settings');
                this.userProfile = this.el.querySelector('.user-profile');
                this.userProfilePhotos = this.el.querySelector('.user-profile-fotos');
                this.userBackgroundPhotos = this.el.querySelector('.user-backgrounds');
                this.avatarEl = this.el.querySelector('.user-img-button');
                radio.trigger('initWeather');
                radio.trigger('getNewWeather');

                return this
            },
            clickHandler: function(ev){
               var targetClasses = ev.target.className.split(' ');
               if (ev.target.id === 'showNewCalendar') {
                
                    radio.trigger('newData',this.model.year,this.model.month);
                    radio.trigger('render');
                }

                if (ev.target.id === 'cleanCalendar') {

                   radio.trigger('cleanCalendar',ev);
                }

                if (ev.target.id === 'lang-en' && ev.target.id !== this.lang || ev.target.id === 'lang-ru' && ev.target.id !== this.lang ) {
                    radio.trigger('changeLangContent',ev); 
                }

                if (targetClasses.length) {
                    if (targetClasses.indexOf('sign-in') !== -1) {
                          radio.trigger('sign-in');
                          this.signInwithEmail();
                    }
                    if (targetClasses.indexOf('sign-google-in') !== -1) {
                          radio.trigger('sign-google-in');
                    }
                    if (targetClasses.indexOf('sign-out') !== -1) {
                          radio.trigger('sign-out');
                    }
                    if (targetClasses.indexOf('sign-up') !== -1) {
                         this.registerHelper = new RegistrationController;
                          radio.trigger('sign-up-now');
                    }
                    if (targetClasses.indexOf('dateButtonImg') !== -1) {
                        this.showDateSettings();
                    }
                    if (targetClasses.indexOf('delete-date-settings') !== -1) {
                        this.hideDateSettings();
                    }
                    if (targetClasses.indexOf('settings-button-img') !== -1) {
                        this.hideAndShow(this.userSettings);
                    }
                    if (targetClasses.indexOf('return-user-settings') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('user-img-button') !== -1) {
                        this.hideAndShow(this.userProfile);
                    }
                    if (targetClasses.indexOf('return-user-profile') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('caption-user-photo') !== -1) {
                        this.hideAndShow(this.userProfilePhotos);
                        fb.setupReferensUserPhotos();
                    }
                    if (targetClasses.indexOf('return-user-profile-fotos') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('background-button') !== -1) {
                        this.hideAndShow(this.userBackgroundPhotos);
                        fb.setupReferensBackground();
                    }
                    if (targetClasses.indexOf('return-user-backgrounds') !== -1) {
                        this.hideSettings();
                    }
                    if (targetClasses.indexOf('mini-img-photos') !== -1) {
                        this.setNewUserPhoto(ev,ev.target.src);
                    }
                    if (targetClasses.indexOf('mini-img-backgrounds') !== -1) {
                        this.setNewBackground(ev,ev.target.src);
                    }
                    if (targetClasses.indexOf('delete-user-picture') !== -1) {
                      var dataSrc = ev.target.previousSibling.attributes[1].nodeValue;
                      var dataId = ev.target.previousSibling.attributes[2].nodeValue;
                      this.chekPicture(dataId);
                      this.deletePicture(ev,ev.target.src,dataSrc);
                    }
                    

                }
                
            	
            },
            menuChangeHandler: function (ev) {

                event.stopPropagation();
                var targetClasses = ev.target.className.split(' ');
                if (ev.target.id === 'selectMonth') {
                    var selind = document.getElementById('selectMonth').options.selectedIndex;
                    var month = document.getElementById('selectMonth').options[selind].value;
                    month = parseInt(month) + 1;
                    radio.trigger('updateMonth',month);

                }

                if (ev.target.id === 'selectYear') {

                    var sel = document.getElementById('selectYear').options.selectedIndex;
                    var year = document.getElementById('selectYear').options[sel].value;
                    year = parseInt(year);
                    radio.trigger('updateYear',year);
                }
                if (targetClasses.length) {
                    if (targetClasses.indexOf('photos-download') !== -1) {
                            var folder = 'photos/';
                            this.imgDownload(ev,folder);
                    }
                }
                if (targetClasses.length) {
                    if (targetClasses.indexOf('background-download') !== -1) {
                            var folder = 'backgrounds/';
                            this.imgDownload(ev,folder);
                    }
                }
            },
            changeLang: function(){
                
                this.lang = lang.lang;
                this.render();

               return this
            },
            signInwithEmail: function(){
                
               this.email = this.el.querySelector('.email');
               this.password = this.el.querySelector('.password');

                 if(this.email.value ){
                     var email = this.email.value;
                 } else {
                    alert('Введите email!')
                 }
                 if(this.password.value ){
                     var password = this.password.value;
                 } else {
                    alert('Введите пароль!')
                 }
                     radio.trigger('signInWithEmail',email,password);
                     console.log(email,password);
  

            },
            showDateSettings: function () {
             
              this.dataSettings.classList.remove('noneDisplay');
              this.dataSettingsButton.classList.add('noneDisplay');
            },
            hideDateSettings: function () {
             
              this.dataSettings.classList.add('noneDisplay');
              this.dataSettingsButton.classList.remove('noneDisplay');
            },
            
            hideSettings: function () {
              
              var allSettings = document.getElementsByClassName('user-class');
              for(var i=0;i<allSettings.length;i++){
                  allSettings[i].classList.add('noneDisplay');

                }
            },
            
            hideAndShow: function (showEl) {
             
             this.hideSettings();
             showEl.classList.remove('noneDisplay');
              
            },
            imgDownload: function (ev,folder) {
             
                    var fileList = ev.target.files;
                    var file = fileList[0];
                    var id = fb.generateId();
                    fb.saveInStorage(id,file,folder);
                    console.log(id,file); 
            },
            newUserPhotos: function (snapshot,type) {
             if(type === 'photos'){
                var container = this.el.querySelector('.my-photos');
             } else if (type === 'backgrounds'){
                var container = this.el.querySelector('.my-backgrounds');
             }
                 
                  if(container){
                    container.innerHTML='';
                    for(var prop in snapshot){
                    var img = document.createElement('img');
                    var imgContainer = document.createElement('div');
                    var spanDelete = document.createElement('span');
                    spanDelete.classList.add('delete','delete-user-picture');

                    img.setAttribute('src', snapshot[prop].downloadURL);
                    img.setAttribute('data-src',snapshot[prop].puth);
                    img.setAttribute('data-id', prop);
                    img.classList.add('mini-img-'+type);
                    imgContainer.classList.add('mini-img');
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(spanDelete);
                    container.appendChild(imgContainer);
                  }
                  
                }
            },
            setNewUserPhoto: function (ev,src) {
                var puth = '/avatar';
                ev.target.classList.add('now-user-photo');
                var id = ev.target.attributes[2].nodeValue;
                var info ={
                  src : src,
                  id: id
                }
                fb.saveInfo(info,puth);

                this.avatar = id;
                var userPhoto = document.getElementsByClassName('user-img');
                if(userPhoto.length){
                  for(var i=0;i<userPhoto.length;i++){
                  userPhoto[i].setAttribute('src', src);
                }
                } else {
                  userPhoto.setAttribute('src', src);
                }

            },
            setNewBackground: function (ev,src) {
                var puth = '/backgrounds';
                this.background = ev.target.attributes[2].nodeValue;
                document.body.style.backgroundImage = 'url('+src+')';
                document.body.style.backgroundSize = 'cover';
                fb.saveInfo(src,puth);

            },
            chekPicture: function (id) {
               
                 if(id == this.avatar){
                  var puth = '/avatar'
                  fb.deleteInfoSettings(puth);
                  this.avatarEl.setAttribute('src','img/user_pic.jpg');
                 }else if(id == this.background){
                  var puth = '/backgrounds'
                  fb.deleteInfoSettings(puth);
                  document.body.style.backgroundImage = 'url("img/Light-Abstract-Wallpapers.jpg")';
                 }
            },
            deletePicture: function (ev,src,dataSrc) {
                var img = ev.target.parentElement;
                img.parentNode.removeChild(img);
                var puth = dataSrc;
                fb.deleteInfo(puth);
            }
          
        };

        return MenuView;
});
define('models/WeatherModel',['radio', 'lang'],
    function (radio, lang) {


        var WeatherModel = function () {

            this.data = [];
            var date = new Date();
            this.day = date.getDate();
            this.month = date.getMonth();


        };

        WeatherModel.prototype = {

            getInfo: function () {

                var xhr = new XMLHttpRequest();
                if (lang.lang === 'lang-ru') {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=Minsk,by&units=metric&appid=8ddab454f07b89fb6e00c80bb8801f12&lang=ru', true);
                } else {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=Minsk,by&units=metric&appid=8ddab454f07b89fb6e00c80bb8801f12', true);
                }
                xhr.send();
                this.onReady(xhr);

            },
            onReady: function (xhr) {

                xhr.onreadystatechange = function () {

                    if (xhr.readyState !== 4) return;
                    if (xhr.status !== 200) {
                        alert(xhr.status + ': ' + xhr.statusText);
                    } else {
                        this.onReadyState4.bind(this)(xhr);
                    }

                }.bind(this);
            },
            onReadyState4: function (xhr) {

                var json = JSON.parse(xhr.responseText);
                console.log(json);
                if (json.list) {
                    var myData = [];

                    for (var i = 0; i < json.list.length; i++) {

                        if (json.list[i].dt_txt) {
                            var regexp = (/12:00:00/g);
                            if (json.list[i].dt_txt.search(regexp) >= 8) {
                                myData.push(json.list[i])
                            }

                        }
                    }
                    for (var a = 0; a < myData.length; a++) {
                        this.data.push({});
                        if (myData[a].dt_txt) {
                            var cutDate = myData[a].dt_txt.split(' ', 1);
                            cutDate = cutDate[0].split('-');
                            this.data[a].date = cutDate[2] + '.' + cutDate[1];
                        }
                        if (myData[a].main.temp) {
                            if (myData[a].main.temp > 0) {
                                this.data[a].temp = '+' + Math.round(myData[a].main.temp) + ' C';
                            } else if (myData[a].main.temp < 0) {
                                this.data[a].temp = Math.round(myData[a].main.temp) + ' C';
                            }

                        }
                        if (myData[a].weather[0].description) {
                            this.data[a].desc = myData[a].weather[0].description;
                        }
                        if (myData[a].weather[0].icon) {
                            this.data[a].icon = myData[a].weather[0].icon;
                        }
                    }
                } else {
                    if (json.name) {
                        if (json.name === 'Minsk' && lang.lang === 'lang-ru') {
                            this.city = 'Минск';
                        } else {
                            this.city = json.name;
                        }
                        this.data.length = 0;
                        this.data.push({});
                        this.data[0].date = lang.today + ': ' + this.day + ' ' + lang.monthNamesPart[this.month];
                    }
                    if (json.weather[0].icon) {

                        this.data[0].icon = json.weather[0].icon;
                    }
                    if (json.main.temp) {

                        if (json.main.temp > 0) {
                            this.data[0].temp = '+' + (Math.round(json.main.temp)) + ' C';
                        } else if (json.main.temp < 0) {
                            this.data[0].temp = (Math.round(json.main.temp)) + ' C';
                        }
                    }
                    if (json.weather[0].description) {

                        this.data[0].desc = json.weather[0].description;
                    }
                }
                radio.trigger('getWeather');


            },

            getWeatherThreeDays: function () {

                var xhr = new XMLHttpRequest();
                if (lang.lang === 'lang-ru') {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/forecast?q=Minsk&appid=8ddab454f07b89fb6e00c80bb8801f12&units=metric&lang=ru', true);
                } else {
                    xhr.open('GET', 'http://api.openweathermap.org/data/2.5/forecast?q=Minsk&appid=8ddab454f07b89fb6e00c80bb8801f12&units=metric', true);
                }
                xhr.send();
                this.onReady(xhr);
            }
        };

        return WeatherModel
    });

define('text!templates/WeatherTemplate.html',[],function () { return '<div class="title is-4"><%= cityName %>\r\n    <div>\r\n        <button class="button is-small is-primary threeDaysButton"><%= show3DaysText %></button>\r\n        <button class="button is-small is-primary oneDayButton"><%= showTodayText %></button>\r\n    </div>\r\n</div>\r\n<table>\r\n    <tr class="date">\r\n        <% for(var i = 0; i < dataWeather.length;i++ ){\r\n        if (i === 3){\r\n        return\r\n        } %>\r\n        <td><%= dataWeather[i].date %></td>\r\n        <% } %>\r\n    </tr>\r\n    <tr class="temperature">\r\n        <% for(var e = 0; e < dataWeather.length;e++ ){\r\n        if (e === 3){\r\n        return\r\n        } %>\r\n        <td><%= dataWeather[e].temp %></td>\r\n        <% } %>\r\n    </tr>\r\n    <tr class="iconWeather">\r\n        <% for(var c = 0; c < dataWeather.length;c++ ){\r\n        if (c === 3){\r\n        return\r\n        } %>\r\n        <td>\r\n            <img src="<%= \'http://openweathermap.org/img/w/\' + dataWeather[c].icon + \'.png\' %>">\r\n        </td>\r\n        <% } %>\r\n    </tr>\r\n    <tr class="desc">\r\n        <% for(var b = 0; b < dataWeather.length;b++ ){\r\n        if (b === 3){\r\n        return\r\n        } %>\r\n        <td><%= dataWeather[b].desc %></td>\r\n        <% } %>\r\n    </tr>\r\n</table>\r\n';});

define('views/WeatherView',['underscore', 'text!templates/WeatherTemplate.html', 'radio', 'lang'],
    function (_, WeatherTemplateString, radio, lang) {

        var WeatherView = function (model) {
            this.model = model;
            this.el = document.querySelector('.weather');
            this.template = _.template(WeatherTemplateString);
            this.days = 1;
            this.init();

        };

        WeatherView.prototype = {

            init: function () {
                this.enable()
            },
            enable: function () {
                this.el.addEventListener('click', this.clickHandler.bind(this));

                return this
            },
            clickHandler: function (ev) {

                var targetClasses = ev.target.className.split(' ');
                if (targetClasses.indexOf('oneDayButton') !== -1) {
                    event.stopImmediatePropagation()
                    this.days = 1;
                    radio.trigger('getNewWeather');

                }
                if (targetClasses.indexOf('threeDaysButton') !== -1) {
                    event.stopImmediatePropagation()
                    this.days = 3;
                    radio.trigger('weatherThreeDays');

                }
            },
            getWeather: function () {
                this.el = document.querySelector('.weather');
                this.init();
                if (this.model.data.length <= 1) {
                    var data = [this.model.data[0]]
                } else {
                    var data = [this.model.data[0], this.model.data[1], this.model.data[2]]
                }
                this.el.innerHTML = this.template({
                    cityName: this.model.city,
                    show3DaysText: lang.show3days,
                    showTodayText: lang.show1day,
                    dataWeather: data

                });
                this.buttons();

            },

            buttons: function () {

                this.button3 = this.el.querySelector('.threeDaysButton');
                this.button1 = this.el.querySelector('.oneDayButton');
                if (this.days === 1) {
                    this.button3.classList.remove('noneDisplay');
                    this.button1.classList.add('noneDisplay');
                    this.el.classList.remove('threeDays');
                    this.el.classList.add('oneDay');
                }
                if (this.days === 3) {
                    this.button1.classList.remove('noneDisplay');
                    this.button3.classList.add('noneDisplay');
                    this.el.classList.add('threeDays');
                    this.el.classList.remove('oneDay');
                }

            },
            changeLang: function () {
                this.days = 1;
            }

        };

        return WeatherView;
    });
define('controllers/WeatherController',['models/WeatherModel','views/WeatherView','radio'],
  function(WeatherModel,WeatherView,radio){
    var WeatherController = function () {
        
        this.model = new WeatherModel();
       
        
        this.init();
    };

    WeatherController.prototype = {

    	init: function () {

          this.handlers().enable();

    	},
    	handlers:function () {
          this.getWeatherfirstHandler = this.getWeatherfirst.bind(this);
          this.getWeatherHandler = this.getWeather.bind(this);
          this.weatherThreeDaysHandler = this.weatherThreeDays.bind(this);
          this.getWeatherInfoHandler = this.getWeatherInfo.bind(this);
          this.changeLangHandler = this.changeLang.bind(this);
          
          return this
    	},
    	enable: function () {
          radio.once('initWeather', this.getWeatherfirstHandler);
          radio.on('getNewWeather', this.getWeatherInfoHandler);
          radio.on('weatherThreeDays', this.weatherThreeDaysHandler);
          radio.on('getWeather', this.getWeatherHandler);
          radio.on('changeLang', this.changeLangHandler);
         
          return this;
        },
       getWeatherfirst: function (){
           this.view = new WeatherView(this.model);
         
      },
      getWeatherInfo: function (){
         
          this.model.getInfo();
         
      },
      getWeather: function (){
          
          this.view.getWeather();
         
      },
      weatherThreeDays: function (){

          this.model.getWeatherThreeDays();
         
      },
      changeLang: function (){
           if(this.view){
            this.view.changeLang();
           }
          
         
      }
    };

    return WeatherController;
});
define('controllers/MenuController',['models/MenuModel', 'views/MenuView', 'controllers/WeatherController', 'radio', 'fb'],
    function (MenuModel, MenuView, WeatherController, radio, fb) {

        var MenuController = function () {

            this.model = new MenuModel();
            this.view = new MenuView(this.model);
            // this.weather = new WeatherController();
            this.init();
        };

        MenuController.prototype = {

            init: function () {

                this.handlers().enable();

            },
            handlers: function () {
                this.changeLangHandler = this.changeLang.bind(this);
                this.updateMonthHandler = this.updateMonth.bind(this);
                this.updateYearHandler = this.updateYear.bind(this);
                this.signInWithGoogleHandler = this.signInWithGoogle.bind(this);
                this.signInOrOutHandler = this.signInOrOut.bind(this);
                this.signOutHandler = this.signOut.bind(this);
                this.signInWithEmailHandler = this.signInWithEmail.bind(this);
                this.newUserPhotosHandler = this.newUserPhotos.bind(this);


                return this
            },
            enable: function () {

                radio.on('changeLang', this.changeLangHandler);
                radio.on('updateMonth', this.updateMonthHandler);
                radio.on('updateYear', this.updateYearHandler);
                radio.on('sign-google-in', this.signInWithGoogleHandler);
                radio.on('signInOrOut', this.signInOrOutHandler);
                radio.on('sign-out', this.signOutHandler);
                radio.on('signInWithEmail', this.signInWithEmailHandler);
                radio.on('newUserPhotos', this.newUserPhotosHandler);

                return this;
            },
            changeLang: function () {

                this.view.changeLang();
            },
            updateMonth: function (month) {

                this.model.updateMonth(month);
            },
            updateYear: function (year) {

                this.model.updateYear(year);
            },
            signInWithGoogle: function () {

                fb.signInWithGoogle();
            },
            signInOrOut: function () {

                this.view.render();
            },
            signOut: function () {
                fb.signOut();
            },
            signInWithEmail: function (email, password) {
                fb.signInWithEmail(email, password);
            },
            newUserPhotos: function (snapshot, type) {
                this.view.newUserPhotos(snapshot, type);
                console.log('new fotos');
            }

        };

        return MenuController;
    });
define('router',[],function () {
    var Router = function (config) {
        this.routs = config;
        this.init();

    };

    Router.prototype = {
        init: function () {
            window.addEventListener('hashchange', this.hashHandler.bind(this));
        },
        hashHandler: function (ev) {
            var nameOld = ev.oldURL.split('#');
            if (nameOld.length === 1) {
                nameOld = "";
            } else {
                nameOld = nameOld[nameOld.length - 1];
            }
            var nameNew = ev.newURL.split('#');
            nameNew = nameNew[nameNew.length - 1];
            var newRoute = this.routs.find(function (route) {
                return (route.name === window.location.hash)

            });
            var oldRoute = this.routs.find(function (route) {
                return (route.name === '#' + nameOld)

            });

            Promise.resolve()
                .then(oldRoute.onLeave)
                .then(newRoute.onEnter)
        }

    };

    return Router

});


define('app',['controllers/CalendarController', 'controllers/MenuController', 'controllers/TaskController', 'radio', 'fb', 'lang', 'router'],
    function (CalendarController, MenuController, TaskController, radio, fb, lang, Router) {
        'use strict';

        return {
            handlers: function () {

                this.initOtherHandler = this.initOther.bind(this);

            },
            enable: function () {

                radio.once('signInOrOut', this.initOtherHandler);
            },

            init: function () {
                this.handlers();
                this.enable();

                fb.init();

                radio.trigger('onload');

                this.pagehide();
            },
            pagehide: function () {

                window.addEventListener('pagehide', this.windowHandler);
            },
            initOther: function () {
                this.menu = new MenuController();
                this.calendar = new CalendarController();
                this.routerConfig();
                lang.handlers().enable().changeLang();

            },
            windowHandler: function () {

                radio.trigger('pageHide');
            },
            routerConfig: function () {
                var config = [{
                    name: '#',
                    onLeave: function () {
                        var cal = document.querySelector('#container');
                        cal.classList.add('noneDisplay');
                    },
                    onEnter: function () {
                        var cal = document.querySelector('#container');
                        cal.classList.remove('noneDisplay');
                    }
                },
                    {
                        name: '#ToDoList',
                        onLeave: function () {
                            var toDo = document.querySelector('#to-do-list');
                            toDo.classList.add('noneDisplay');
                        },
                        onEnter: function () {
                            var toDo = document.querySelector('#to-do-list');
                            toDo.classList.remove('noneDisplay');
                        }
                    },
                    {
                        name: '#Calendar',
                        onLeave: function () {
                            var cal = document.querySelector('#container');
                            cal.classList.add('noneDisplay');
                        },
                        onEnter: function () {
                            var cal = document.querySelector('#container');
                            cal.classList.remove('noneDisplay');
                        }
                    }];
                var router = new Router(config);
            }
        }
    }
);
requirejs.config({
	baseUrl: 'js/app',
	paths: {
       underscore: '../lib/underscore',
        app: 'app',
       text: '../lib/text',
       firebase: 'https://www.gstatic.com/firebasejs/4.1.2/firebase'
	},
	config: {
        'fb': {
            apiKey: "AIzaSyANcKsMAXn5Y23R8oLu1BC1Bq1G9rp2M0U",
            authDomain: "my-calendar-f0730.firebaseapp.com",
            databaseURL: "https://my-calendar-f0730.firebaseio.com",
            projectId: "my-calendar-f0730",
            storageBucket: "my-calendar-f0730.appspot.com",
            messagingSenderId: "178079106285"
        }
    },
    shim: {
        firebase: {
            exports: 'firebase'
        }        
    }
});
requirejs(['app'], function (app) {
	app.init();
});
define("../init", function(){});

