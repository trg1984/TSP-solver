function TSPLibFile(content, config) {
    this.type = null;
    this.name = null;
    this.comments = [];
    this.dimension = null;
	this.firstIndex = 1;
	
	// Copy the configuration over the default setup.
    if (typeof(config) !== 'undefined') for (var item in config) this[item] = config[item];
	
    this.processContent(content);
}

TSPLibFile.prototype.edgeWeight = {
    "EUC_2D" : function (p1, p2) {
		// For the life of me, I cannot understand the rounding to integers here. --Rolf
		return Math.round(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	},
	"ATT" : function (p1, p2) {
		var dx = p1.x - p2.x;
		var dy = p1.y - p2.y;
		var r = Math.sqrt((Math.pow(dx, 2) + Math.pow(dy, 2)) / 10.0);
		var t = Math.round(r);

		if (t < r) return t + 1.0;
		/* else */ return t;
	},
	"GEO" : function (p1, p2) {
	
	    var deg = Math.floor( p1.x );
	    var min = p1.x - deg;
	    var latitudeI = Math.PI * ( deg + 5.0 * min / 3.0 ) / 180.0;
	    
	    deg = Math.floor( p1.y );
	    min = p1.y - deg;
	    var longitudeI = Math.PI * ( deg + 5.0 * min / 3.0 ) / 180.0;

	    deg = Math.floor( p2.x );
	    min = p2.x - deg;
	    var latitudeJ = Math.PI * ( deg + 5.0 * min / 3.0 ) / 180.0;

	    deg = Math.floor( p2.y );
	    min = p2.y - deg;
	    var longitudeJ = Math.PI * ( deg + 5.0 * min / 3.0 ) / 180.0;

	    var RRR = 6378.388;
	    var q1 = Math.cos( longitudeI - longitudeJ );
	    var q2 = Math.cos( latitudeI - latitudeJ );
	    var q3 = Math.cos( latitudeI + latitudeJ );
	    return Math.floor( (RRR * Math.acos(0.5 * ((1.0 + q1) * q2 - (1.0 - q1) * q3)) + 1.0) );
	}
}

TSPLibFile.prototype.processContent = function(content) {
    
    var lines = content.split(/\r?\n+/);
    var inMetadata = true;
    var i = 0;
	var count = 0;
    while ( i < lines.length ) {
        if (inMetadata) {
            if ( (lines[i] === 'NODE_COORD_SECTION') || (lines[i] === 'TOUR_SECTION') ) inMetadata = false;
			else {
                var elements = lines[i].split(/\s*:\s+/);
                switch(elements[0].toUpperCase()) {
                    case 'NAME':
					// Set name.
					this.name = elements[1];
					break;
					case 'COMMENT':
					// Add a comment.
					this.comments.push(elements[1]);
					break;
					case 'TYPE':
					// Set type.
					this.type = elements[1];
					break;
					case 'DIMENSION':
					// Set array length.
					
					// The indexing does not (at least always) start from zero (but from 1) and this causes issues when using Arrays.
					this.dimension = elements[1] | 0;
					if (this.type === 'TSP') this.nodeCoords = new Array(this.dimension);
					else if (this.type === 'TOUR') this.tour = new Array(this.dimension);
					break;
					case 'EDGE_WEIGHT_TYPE':
					// Set edge weight type.
					this.edgeWeightType = elements[1];
					break;
                }
            }
        }
		else { // Add nodes to the graph.
			if (lines[i].trim() !== '') {
				if (lines[i].trim().toUpperCase() === 'EOF') break; // We're done.

				if (this.type === 'TSP') {
					
					// Node coordinate entity needs to be an object.
					if (typeof(this.nodeCoords) !== 'object') this.nodeCoords = {};
					
					var elements = lines[i].trim().split(/\s+/); // Remove preceding and trailing spaces and split the string to words.
					if (elements.length === 3) { // The split went according to plan.
						var index = elements[0] | 0;
						var x = parseFloat(elements[1]);
						var y = parseFloat(elements[2]);
						
						if ((typeof(this.edgeWeightType) === 'string') && (this.edgeWeightType === "EUC_2D")) { // Otherwise countries are displayed sideways. The metric doesn't mind about the turning.
							var temp = x;
							x = y;
							y = temp;
						}
						
						this.nodeCoords[index - this.firstIndex] = {
							x: x,
							y: y,
							id: index
						};
					}
					else throw('Error while processing node line ' + i + ': Wrong amount of elements in "' + lines[i] + '".');
				}
				else if (this.type === 'TOUR') {
					var index = lines[i].trim() | 0;
					
					if (index >= 0) {
						this.tour[count] = index - this.firstIndex;
						++count;
					}
					else this.tourIsACycle = true;
				}
			}
		}
        ++i;
    }
}

function addTSPLibLoader(place, callback) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        
        function onSelectedFile(event) {
            
            // Get list of files
            var files = event.target.files;
            var resultArray = [];
	    var pendingFileCount = files.length;
	    var __moveOn = function() {
		--pendingFileCount;
		if (pendingFileCount === 0) callback.call(window, resultArray);
	    } 
	    
            // Loop through the FileList.
            for (var i = 0, f; f = files[i]; i++) {
                
                // Initialize a reader for the current file.
                var reader = new FileReader();
                
                // Load handler.
                reader.onload = function(e) {
                    resultArray.push( new TSPLibFile(e.target.result) );
		    __moveOn();
                }

                // Initialize loading.
                reader.readAsText(f);
            }
        }

        // Add a select listener on all of the file dialogs.
        place.on('change', onSelectedFile);
    } else {
	throw('The File API is not supported. Update your browser');
    }
}
