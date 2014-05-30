Industrial Algorithms Exercise Project
======================================

This project is part of my participation on a course called 
Industrial Algorithms in University of Turku. It loads TSPLib's
TSP and TOUR files, visualizes the data, and searches for an optimal
solution for traveling salesman problem within the loaded data set.
Contains implementations for some of the basic local search methods:

* 2-opt
* Nearest neighbour
* Double tree algorithm

As a byproduct of implementing these methods, the solver calculates
the minimal spanning tree (MST) for the given complete graph.

Usage
-----

Load one of the TSPLib TSP files to your local hard drive. The exercise
project was required to work only with pcb442.tsp and fi10639.tsp, but
any TSPLib file that uses EUC_2D, ATT or GEO metric should work (a big
bunch of these were tested while development).

Open index.html with your browser, and load the TSP file by clicking
the "Browse.." button at the top of the page. Once the file is loaded
a visualizer appears at the bottom of the page. Select the method used
by the solver on the topmost box. Possible choices are '2-opt', 'nn'
and 'doubletree'.

Performance of different local search algorithms
------------------------------------------------

All of the search algorithms are randomized where possible.

TODO
----

* The UI is not done. Finalize the look and feel of the program.
* Add more local search methods.
* WebWorker and Node support to allow parallel setups and to avoid UI hangs.
* TSPLib export for both data sets and tours.
* In-app point set creation.
* MATRIX and CEIL_2D metrics.