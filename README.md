trie.js
=======

Experimental implementation of a trie.  Used as the mechanism under an auto-suggest feature.

Notes
=======
The file currently has a hard dependency on underscore.js or an equivalent library.
This dependency should be removed within the next few releases.

Use
======
To make a new trie, create the first node.

    var theTrie = Object.create(Trie.Node.prototype).initialize();
    
Any string value can then be expanded from the first node.
    
    theTrie.expand("Testing");
    
The trie can then be searched for a certain value and the results can be collected

    theResults = theTrie.search("Test").collect();
    //   >> theResults = ["Testing"]
