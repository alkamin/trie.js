var Trie = Trie || {};
var Node = function () {};


//The Node is the building block for a full trie
//A new trie is created by making a new trie node and expanding
//values from it.  It was constructed with the intent of being
//used for an auto-suggest feature

// Example Use
// 	 var theTrie = Object.create(Trie.Node.prototype).initialize();
//   theTrie.expand("Testing");
//   theResults = theTrie.search("Test").collect();
//   >> theResults = ["Testing"]
Trie.Node.prototype.initialize = function () {
	this._actualValue = undefined;
	this._node = undefined;
	this._parent = undefined;
	this._children = [];
	return this;
};

//Node.nodeValue(nodeValue*)
//Function to act as getter and setter for the node's character
Trie.Node.prototype.nodeValue = function () {
	//check for arguments
	if (arguments && arguments.length) {
		//functioning as setter
		//set the node value (character) to the first argument
		this._node = arguments[0];
		//return the node
		return this;
	} else {
		//No arguments provided
		//functioning as getter
		//return the node value of the node
		return (this._node || false);
	}
}

//Node.actualValue(actualValue*)
//Function to act as getter and setter for the node's complete non-sanitized value, if applicable
Trie.Node.prototype.actualValue = function () {
	//Check for arguments
	if (arguments && arguments.length) {
		//functioning as setter
		//set the value of the node to the first argument
		this._actualValue = arguments[0];
		//return the node
		return this;
	} else {
		//No arguments provided
		//function as getter
		//return value of the node
		return this._actualValue;
	}
};

//Node.parent
//gets or sets node's parent
Trie.Node.prototype.parent = function () {
	if (arguments && arguments.length) {
		//arguments provided, functioning as setter
		this.parentNode = arguments[0];
		return this;
	} else {
		//No arguments provided, functioning as getter
		return this.parentNode;
	}
};

//Node.children([children to add]*)
//with no arguments, returns array of child nodes
//with array as first argument, adds nodes to the current list of children
Trie.Node.prototype.children = function () {
	if (arguments && arguments.length) {
		//arguments provided, functioning as setter
		this._children = this._children.concat(arguments[0]);
		return this;
	} else {
		//No arguments provided, functioning as getter
		return this._children;
	}
};

//Node.hasChildren()
//returns true if node has children
Trie.Node.prototype.hasChildren = function () {
	//using the built-in children method, get the array of children
	//and check length of array, returning true if greater than zero
	return (this.children().length > 0);
};

//Node.expand(value)
//creates sanitized branch from the node that represents the value

//NOTE: nodes can currently only refer to a single true value
//so an expansion of two different strings that could result in the
//same sanitized value cause only the most recently expanded value to
//be present.
Trie.Node.prototype.expand = function (value) {
	var actualValue = value,
	//sanitize the input value
		sanitizedValue = value.replace(/[^A-Za-z]+/g, '').toLowerCase();

	//internal function used for recursion so that each recursive execution still has
	//access to the outer function's variable
	_expand = function (node, _nextValue) {
		var newNode,
			matchingChild,
			tempValue;
		//check for existance of _nextValue argument to halt recursion at end of branch
		if (_nextValue && _nextValue.length) {
			//get first character of next value
			tempValue = _nextValue[0];
			//if the current node has children, check for a matching child
			if(node.hasChildren()) {
				matchingChild = _.find(node.children(), function (child) {
					return (child.nodeValue() == tempValue);
				});
			}
			if (matchingChild) {
				//if a matching child was found and it will be the end of a branch
				//set the value of the node to the top level actualValie
				if (_nextValue.length === 1) {
					matchingChild.actualValue(actualValue);
				}
				//In all cases, remove the first character from the _nextValue Array and run
				//the _expand function on the child
				//In the case that the matching child will be the end of a branch, the recursion halts
				//at the check for the existence of the _nextValue argument
				//In the case that the matching child is not the end of a branch, the recursion continues
				_expand(matchingChild, _nextValue.slice(1));
			} else {
				//If no matching child is found, a new node will be added to the current node's list of children
				newNode = Object.create(Trie.Node.prototype);
				newNode.initialize();
				newNode.nodeValue(tempValue);
				newNode.parent(node);
				//If the new node will be the end of the branch, set the value appropriately
				if(_nextValue.length === 1) {
					newNode.actualValue(actualValue);
				}
				//Add the new node to the current node's list of children
				node.children([newNode]);

				//Expand the rest of the _nextValue on the current node
				_expand(newNode, _nextValue.slice(1));
			}
		}
	};
	//First call to recursive expand function
	_expand(this, sanitizedValue);
	//Return the node
	return this;
};

//Node.search(value)
//Takes input, sanitizes it, and returns any matching nodes
//NOTE: does not check the base node for a match, but checks all children
//of the base node for matches
Trie.Node.prototype.search = function (value) {
	var matched = false,
		matchingNode,
		//Sanitize input value
		sanitizedValue = value.replace(/[^A-Za-z]+/g, '').toLowerCase();
	//internal search function used for recursion which will have access to
	//outer function's variables
	_search = function (_node, _actualValue) {
		var i;

		if (_actualValue.length === 1) {
			
			if (_node.nodeValue() == _actualValue[0]) {
			//if the search is on the last character of the query
			//and the node's character matches the query's character
			//set the matched flag appropriately 	
				matched = true;
				matchingNode = _node;
			} else {
			//if the search is on the last character of the query
			//but the node is not a match, set the matched flag to false
			//unless a previous match had already set it to true
			//this is necessary because of the use of the _.each function
			//to search the trie
				matched = matched || false;
			}
		} else if (_actualValue.length > 1) {
			if (_node.nodeValue() == _actualValue[0] && _node.hasChildren()) {
				//if the search is not on the last character but the node matches
				//the first character of the query, trim the query and search the node's
				//children for a deeper match
				_.each(_node.children(), function (child) {
					_search(child, _actualValue.slice(1));
				});
			} else {
				//no match, set matched flag to false unless previously set to true
				matched = matched || false;
			}
		}
	};

	//check for passed in value, if not present, returns false
	if (value) {
		//if the base node has children, search them for matches
		if (this.hasChildren()) {
			_.each(this.children(), function (child) {
				_search(child, sanitizedValue);
			});
		}
		//the the recursive search returns a match, return the matching node
		//otherwised return false
		if (matchingNode) return matchingNode;
		else return false;
	} else return false;
};

//Node.toArray()
//Returns an array representation of the trie
//Allows for faster depth based searching and retrieving relative to another node
Trie.Node.prototype.toArray = function () {
	var resultsArray = [];

	//internal toArray function used for recursion
	_toArray = function (_node, _level) {
		//if level of results array hasn't been initialized yet, do so
		if (typeof resultsArray[_level] === "undefined") {
			resultsArray[_level] = [];
		}
		//for the current node, collapse it to get the relevent prefix and
		//add it to the current level's array
		resultsArray[_level].push(_node.collapse());
		//if the node has children, recursively convert them to arrays
		if (_node.hasChildren()) {
			_.each(_node.children(), function (child) {
				_toArray(child, _level + 1);
			});
		}
	}
	//start recursion at the base node with a level of zero
	_toArray(this, 0);
	//return arrayified trie
	return resultsArray;
};

//Node.collapse()
//collapse is used to get the prefix the node represents by walking up the tree
//and concatenating each of the parent node's values
Trie.Node.prototype.collapse = function () {
	var collapsedNodes = [],
		theParent = this.parent();
	//Add the current node's node value to the array to start the collapse
	collapsedNodes.push(this.nodeValue());
	//While each node has a parent, add the parent's node value to the array
	while (theParent && theParent.nodeValue()) {
		collapsedNodes.unshift(theParent.nodeValue());
		theParent = theParent.parent();
	}
	//concatenate all of the array values
	return collapsedNodes.join("");
};

//Node.collect()
//Returns an array of all actual values expanded onto the trie that contain the
//current nodes prefix
Trie.Node.prototype.collect = function () {
	var collection = [];
	//If the current node has an actual value, add it to the array
	if (this.actualValue()) {
		collection.push(this.actualValue());
	}
	if(this.hasChildren()) {
		//Collect recursively on the current node's children
		_.each(this.children(), function (child) {
			collection.push(child.collect());
		});
	}
	//Flatten the collection so that it is not an array of arrays
	return _.flatten(collection);
};