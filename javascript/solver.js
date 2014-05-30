TSPSolver = function(tspFile, config, callback) {
	
	// Initialize.
	this.config = {
		method: '2-opt',
		bestKnownSolution: [],
		bestSolutionCost: Number.MAX_VALUE
	};
	
	this.initialize(tspFile, config, callback);
}

TSPSolver.prototype.initialize = function(tspFile, config, callback) {
	
	// Copy the configuration to the main object.
    if (typeof(config) !== 'undefined') for (var item in config) this.config[item] = config[item];
	
	// TODO Handle cases where tspFile is a string (= file content) or a File object (from file dialog). Now needs to be preloaded using loader.js.
	if (typeof(tspFile) !== 'undefined') this.importFile(tspFile);
	
	console.log('TSPSolver initialized with ', tspFile, config);
	if (typeof(callback) === 'function') callback.call(window);
}

TSPSolver.prototype.importFile = function(tspFile) {
	if (tspFile instanceof TSPLibFile) {
		if (tspFile.type === 'TSP') {
			this.tspFile = tspFile;
			
			if (
				(typeof(this.config['bestKnownSolution']) !== 'object') ||
				(!Array.isArray(this.config['bestKnownSolution'])) ||
				(this.config.bestKnownSolution.length !== this.tspFile.nodeCoords.length)
			) {
				this.config.bestKnownSolution = this.randomPermutation(this.tspFile.nodeCoords.length);
				this.config.bestSolutionCost = this.getPermutationCost(this.config.bestKnownSolution, true);
			}
		}
		else if (tspFile.type === 'TOUR') {
			var candidateCost = this.getPermutationCost(tspFile.tour, tspFile.tourIsACycle);
			if (candidateCost < this.config.bestSolutionCost) {
				this.config.bestKnownSolution = tspFile.tour;
				this.config.bestSolutionCost = candidateCost;
			}
			
			if (this.config.visualizer instanceof Visualizer) {
				this.config.visualizer.setLines(this.linesFromPermutation(undefined, true));
				this.config.visualizer.draw();
			}
		}
	} else throw('TSPSolver.importFile(): Given file is not a preloaded TSPFile.');
}

TSPSolver.prototype.getPermutationCost = function(permutation, cycle) {
	var perm = typeof(permutation) === 'undefined' ? this.config.bestKnownSolution : permutation;
	
	var totalCost = 0;
	var distf = this.tspFile.edgeWeight[this.tspFile.edgeWeightType];
	
	for (var i = 1; i < perm.length + ((typeof(cycle) === 'boolean') && cycle); ++i) {
		
		var p1 = this.tspFile.nodeCoords[perm[i - 1]];
		var p2 = this.tspFile.nodeCoords[perm[i >= perm.length ? 0 : i]];
		
		var cost = distf(p1, p2);
		totalCost += cost;
	}
	
	return totalCost;
}

TSPSolver.prototype.getBestPermutation = function(applyIndexCorrection) {
	var result = new Array(this.config.bestKnownSolution.length);
	for (var i = 0; i < this.config.bestKnownSolution.length; ++i) result[i] = (applyIndexCorrection === true ? this.tspFile.firstIndex : 0) + this.bestKnownSolution[i];
	
	return result;
}

TSPSolver.prototype.randomPermutation = function(n) {
	// Create a random solution.
	var result = new Array(n);

	// Create a sorted permutation of indices of same size n.
	var temp = [];
	for (var i = 0; i < result.length; ++i) temp[i] = i;
	
	// Pick at random from the sorted permutation to create a random permutation.
	for (var i = 0; i < result.length; ++i) {
		result[i] = temp.splice(Math.floor(Math.random() * temp.length), 1)[0];
	}
	
	return result;
}

TSPSolver.prototype.__2OptStep = function(original, i, j) {
	if (i === j) return original;
	
	var result = [];
	for (var index = 0; index < original.length; ++index) {
		if ((index < i) || (index > j)) result[index] = original[index];
		else result[index] = original[j - index + i];
	}
	return result
}

TSPSolver.prototype.minimalSpanningTree = function() {
	//var edgeWeights = new Array(this.tspFile.nodeCoords.length * this.tspFile.nodeCoords.length); // This might be rather big (think hundreds of millions..).
	
	if (typeof(this.config.minimalSpanningTree) !== 'undefined') return this.config.minimalSpanningTree;
	
	var nodes = this.tspFile.nodeCoords;
	
	var inside = [];
	var lines = new Array(nodes.length - 1);
	var dists = new Array(nodes.length - 1);
	var distf = this.tspFile.edgeWeight[this.tspFile.edgeWeightType];
	var distSort = function(a, b) { return a.dist - b.dist }
	
	for (var i = 0; i < nodes.length; ++i) {
		dists[i] = {
			dist: undefined,
			inIndex: undefined,
			outIndex: i
		};
	}
	
	do {
		if (inside.length === 0) {
				
			var index = Math.round(Math.random() * (dists.length - 1));
			inside.push( dists.splice(index, 1)[0].outIndex );
			var inIndex = inside[inside.length - 1];
			
			for (var i = 0; i < dists.length; ++i) {
				var d = distf(nodes[inIndex], nodes[dists[i].outIndex]);
				
				dists[i] = {
					dist: d,
					inIndex: inIndex,
					outIndex: dists[i].outIndex
				};
			}
		} else {
			dists.sort(distSort);
			var popped = dists.splice(0, 1)[0];
			//console.log('popped = ', popped);
			inside.push( popped.outIndex );
			
			lines[inside.length - 2] =
				{
					begin: this.tspFile.nodeCoords[popped.inIndex],
					end: this.tspFile.nodeCoords[popped.outIndex]
				};
			
			var inIndex = inside[inside.length - 1];
			
			for (var i = 0; i < dists.length; ++i) {
				var d = distf(nodes[inIndex], nodes[dists[i].outIndex]);
				
				if (d < dists[i].dist)
					dists[i] = {
						dist: d,
						inIndex: inIndex,
						outIndex: dists[i].outIndex
					};
			}
		}
	} while (dists.length > 0);
	
	this.config.minimalSpanningTree = lines;
	return lines;
}

TSPSolver.prototype.linesFromPermutation = function(permutation, cycle) {
	var perm = typeof(perm) === 'undefined' ? this.config.bestKnownSolution : permutation;
	
	var lines = new Array(perm.length - 1 + ((typeof(cycle) === 'boolean') && cycle));
	
	for (var i = 0; i < lines.length; ++i) {
		lines[i] = {
			begin: this.tspFile.nodeCoords[perm[i]],
			end: this.tspFile.nodeCoords[perm[i >= perm.length - 1 ? 0 : i + 1]],
		}
		if (typeof(lines[i].begin) === 'undefined') console.log(i, 'begin undefined, target length = ', perm.length, perm[i]);
		if (typeof(lines[i].end) === 'undefined') console.log(i, 'end undefined, target length = ', perm.length, perm[i >= perm.length ? 0 : i + 1], i >= perm.length ? 0 : i + 1);
	}
	return lines;
}

TSPSolver.prototype.localSearch = function(method, options) {
	var met = (typeof(method) === 'string' ? method : this.config.method).toLowerCase();
	var options = typeof(options) === 'object' ? options : {};
	var iteration = 0;
	
	console.log(met, options);
	
	switch (met) {
		case '2-opt': { // Solve using 2-opt.
			var failCounter = 0;
			if (typeof(options.maxFails) === 'undefined') options.maxFails = 100;
			if (typeof(options.maxIterations) === 'undefined') options.maxIterations = 100;
			
			iteration = 0;
			while ((iteration < options.maxIterations) && (failCounter < options.maxFails)) {
				var n = Math.floor(Math.random() * (this.config.bestKnownSolution.length - 2));
				var m = Math.floor(Math.random() * (this.config.bestKnownSolution.length - n - 1)) + n;
				var candidate = this.__2OptStep(this.config.bestKnownSolution, n, m);
				var candidateCost = this.getPermutationCost(candidate, true);
				if (candidateCost < this.config.bestSolutionCost) {
					failCounter = 0;
					this.config.bestKnownSolution = candidate;
					this.config.bestSolutionCost = candidateCost;
				} else ++failCounter;
				++iteration;
			}
		} break;
		/* Incomplete.
		case 'k-opt': { // Solve using k-opt.
			var failCounter = 0;
			var k = typeof(options.k) !== 'undefined' ? options.k : 3;
			if (typeof(options.maxFails) === 'undefined') options.maxFails = 100;
			if (typeof(options.maxIterations) === 'undefined') options.maxIterations = 100;
			
			iteration = 0;
			while ((iteration < options.maxIterations) && (failCounter < options.maxFails)) {
				
				// Generate k random indices of the permutation to be changed.
				var n = 0;
				var indices = new Array(k);
				for (var i = 0; i < k; ++i) {
					n = Math.floor(Math.random() * (this.config.bestKnownSolution.length - n - k + i));
					indices[i] = n;
				}
				
				function __createPermutations(items) {
					console.log(items);
						
					var final = new Array(items.length);
					
					for (var i in items) {
						if (items.length === 1) return items.slice(0);
						
						var rest = items.slice(0);
						var picked = rest.splice(i, 1);
						
						var result = __createPermutations(rest);
						for (var j in result) {
							result[j] = picked.concat.(result[j]);
						}
						final[i] = result;
					}
					
					return final;
				}
				
				var permutations = __createPermutations(indices);
				
				var candidate = this.__2OptStep(this.config.bestKnownSolution, n, m);
				var candidateCost = this.getPermutationCost(candidate, true);
				if (candidateCost < this.config.bestSolutionCost) {
					failCounter = 0;
					this.config.bestKnownSolution = candidate;
					this.config.bestSolutionCost = candidateCost;
				} else ++failCounter;
				++iteration;
			}
		} break;*/
		case 'nn': { // Solve using nearest neighbour.
			console.log('Nearest neighbour');
			var distf = this.tspFile.edgeWeight[this.tspFile.edgeWeightType];
			var nodeCoords = this.tspFile.nodeCoords;
			var nodes = new Array(this.tspFile.nodeCoords.length);
			var result = new Array(nodes.length);
			
			// Initialize nodes.
			for (var i = 0; i < nodes.length; ++i) nodes[i] = i;
			
			// Generate the solution.
			for (var i = 0; i < nodeCoords.length; ++i) {
				var index;
				if (i === 0) index = Math.round(Math.random() * (nodes.length - 1)); // Start from a random node.
				else {
					var current = nodeCoords[result[i - 1]];
					var check = Number.MAX_VALUE;
					for (var j = 0; j < nodes.length; ++j) {
						var d = distf(current, nodeCoords[nodes[j]]);
						if (d < check) {
							index = j;
							check = d;
						}
					}
				}
				
				result[i] = nodes.splice(index, 1)[0];
			}
			
			var candidateCost = this.getPermutationCost(result, true);
			if (candidateCost < this.config.bestSolutionCost) {
				this.config.bestKnownSolution = result;
				this.config.bestSolutionCost = candidateCost;
			}
			iteration = 1;
		} break;
		case 'doubletree': { // Solve using double tree algorithm

			// Calculate the minimal spanning tree.
			var lines = this.minimalSpanningTree();
			
			/*
			// Duplicate the lines.
			var originalLineCount = lines.length;
			for (var i = 0; i < originalLineCount; ++i) {
				var temp = {
					begin: lines[i].end,
					end: lines[i].begin
				}
				lines.push(temp);
			}
			*/
			
			// Create arrays for directed graph generation.
			var nodes = new Array(this.tspFile.nodeCoords.length);
			for (var i = 0; i < nodes.length; ++i) nodes[i] = [];
			
			// Fill the nodes with edges.
			for (var i = 0; i < lines.length; ++i) {
				
				var i1 = lines[i].begin.id - this.tspFile.firstIndex;
				var i2 = lines[i].end.id - this.tspFile.firstIndex;
				nodes[i1].push(i2);
				nodes[i2].push(i1);
			}
			
			// Select a random start node and start walking until there is nowhere to go.
			var result = [];
			
			var i = 0;
			var index = Math.round(Math.random() * (nodes.length - 1)); // Start from a random node.
			do {
				var temp = [];
				do {
					if (nodes[index].length > 0) index = nodes[index].splice( Math.round(Math.random() * (nodes[index].length - 1)) , 1)[0]; // Choose node from previous node's neighbours, remove it and choose it as the new node.
					temp.push(index); // Push this to the queue.
					
				} while (nodes[index].length > 0);
				
				result.splice.apply(result, [i + 1, 0].concat(temp));
				
				i = 0;
				while ( (i < result.length) && (nodes[ result[i] ].length === 0) ) {
					++i;
				}
				index = result[i];
			} while (i < result.length);
			
			// Remove duplicates from the result.
			var visited = new Array(nodes.length);
			for (var item = 0; item < visited.length; ++item) visited[item] = false;
			
			i = 0;
			while ((i < 1000) && (result.length > nodes.length)) {
				
				if (visited[result[i]]) result.splice(i, 1);
				else {
					visited[result[i]] = true;
					++i;
				}
			}
			
			var candidateCost = this.getPermutationCost(result, true);
			if (candidateCost < this.config.bestSolutionCost) {
				this.config.bestKnownSolution = result;
				this.config.bestSolutionCost = candidateCost;
			}
			iteration = 1;
		} break;
		// TODO solve using 3-opt.
		// TODO solve using K-opt.
		// TODO solve using Christofedes' algorithm.
		// TODO solve using Tabu search.
		// TODO solve using Linn-Kernighan.
		// TODO solve using GA.
		default: {
			throw('Unknown local search method: ' + met);
		}
	}
	
	console.log('Best known cost: ', this.config.bestSolutionCost);
	if (this.config.visualizer instanceof Visualizer) {
		this.config.visualizer.setLines(this.linesFromPermutation(undefined, true));
		this.config.visualizer.draw();
	}
	
	return {
		method: met,
		iterations: iteration,
		bestCost: this.config.bestSolutionCost
	};
}