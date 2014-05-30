Industrial Algorithms Exercise Project
======================================

This project is part of my participation on a course called 
Industrial Algorithms in University of Turku. It loads TSPLib's
TSP and TOUR files, visualizes the data, and searches for an optimal
solution for traveling salesman problem within the loaded data set.
Contains implementations for some of the basic local search methods:

* 2-opt ('2-opt')
* Nearest neighbour ('nn')
* Double tree algorithm ('doubletree')

As a byproduct of implementing these methods, the solver calculates
the minimal spanning tree (MST) for the given complete graph.

Usage
-----

Load one of the TSPLib TSP files to your local hard drive. The exercise
project was required to work only with [pcb442.tsp](http://islab.soe.uoguelph.ca/sareibi/TEACHING_dr/ENG6140_html_dr/outline_W2003/docs/ASSIGN_dr/pcb442.tsp) and [fi10639.tsp](http://biit.cs.ut.ee/~vilo/Algorithmics/TSP/fi10639.tsp), but
[any TSPLib file](http://www.iwr.uni-heidelberg.de/groups/comopt/software/TSPLIB95/tsp/) that uses EUC_2D, ATT or GEO metric should work (a big
bunch of these were tested while development).

Open index.html with your browser, and load the TSP file by clicking
the "Browse.." button at the top of the page. Once the file is loaded
a visualizer appears at the bottom of the page. Select the method used
by the solver on the topmost box. Possible choices are '2-opt', 'nn'
and 'doubletree'.

For 2-opt, there are are two additional boxes that allow the user to set
the maximum amount of iterations as well as the maximum number of iterations
that the search continues without improvement.

In order to visually check that the MST builder works as intended,
the "Solve MST" button will solve and display the MST for the loaded
data set. This takes may take a while, though. My old laptop ran
the fi10639.tsp's MST for a little over four minutes. Smaller data sets
(< 1000) are done in a blink of an eye.

If needed, a precreated tour can be loaded in TSPLib's TOUR format either
to provide a starting point or a comparison / optimum for the data set,
using the same "Browse.." dialog.

Performance of different local search algorithms
------------------------------------------------

All of the search algorithms are randomized where possible.

Licence
-------

Released under MIT licence. Do what you want with it. I did this for
the ects and fun of it :)

TODO
----

* The UI is not done. Finalize the look and feel of the program.
* Add more local search methods.
* WebWorker and Node support to allow parallel setups and to avoid UI hangs.
* TSPLib export for both data sets and tours.
* In-app point set creation.
* MATRIX and CEIL_2D metrics.