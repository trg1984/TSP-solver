function Visualizer(place, config, callback) {
    
    // Initialize internal arrays.
    this.config = {
		points: [],
		lines: [],
		/* in pixels: */
		pointSize: 4,
		width: 400,
		height: 300,
		showInstructions: true
    };
    
    this.context = null;
    
    this.initialize(place, config, callback);
}

Visualizer.prototype.initialize = function(place, config, callback) {
	
	// Copy the configuration to the main object.
    for (var item in config) this.config[item] = config[item];
	
    var self = this;
    this.place = place;
    
	if (typeof(config['boundingBox']) === 'undefined') this.autoFitBoundingBox();
	
	$(document).keydown( function(e) { self.keyHandler(e) } )
	
	var isDragging = false;
	var mx, my;
	var self = this;
	this.place
		.empty()
		.mousedown(function(e) {
			mx = e.clientX;
			my = e.clientY;
			self.place.on('mousemove.drag',
				function(e1) {
					isDragging = true;
					
					var dx = (mx - e1.clientX) / self.place.width();
					var dy = (e1.clientY - my) / self.place.height();
					mx = e1.clientX;
					my = e1.clientY;
					
					self.moveBoundingBox(dx, dy, 0);
					self.draw();
				}
			);
		})
		.mouseup(function(e) {
			var wasDragging = isDragging;
			isDragging = false;
			self.place.unbind("mousemove.drag");
			if (wasDragging) {
				var dx = (mx - e.clientX) / self.place.width();
				var dy = (e.clientY - my) / self.place.height();
				self.moveBoundingBox(dx, dy, 0);
				self.draw();
			}
		})
		.on('mousewheel DOMMouseScroll',
			function(e) {
				e.preventDefault();
				//e.stopPropagation();
				var delta = typeof(e.originalEvent.wheelDelta) === 'undefined' ? e.originalEvent.detail / 3 : -e.originalEvent.wheelDelta / 120;
				
				var dz = Math.pow(5 / 4, delta) - 1;
				self.moveBoundingBox(0, 0, dz);
				self.draw();
			}
		)
		.addClass('visualizer')
		.append('<canvas width="' + this.config.width + '" height="' + this.config.height + '">this is my canvas</canvas>');
	
	if (this.config.showInstructions === true)
		this.place.after('<p>Alter the view either using keyboard or mouse. Arrow keys, as well as J,I,L and K, move the board left, up, right and down.</br>A and Z zoom in and out respectively.</p>');
    
    this.context = this.place.find('canvas')[0].getContext('2d');
	
	if (typeof(callback) === 'function') callback.call(window);
}

Visualizer.prototype.setLines = function(newLines) {
	this.config.lines = newLines;
}

Visualizer.prototype.moveBoundingBox = function(dx, dy, dz) {
	var bb = this.config.boundingBox;
	var cx = (bb.right - bb.left) / 2 + bb.left;
	var cy = (bb.top - bb.bottom) / 2 + bb.bottom;
	var moveX = (bb.right - bb.left) * dx;
	var moveY = (bb.top - bb.bottom) * dy;
	var zoomX = (1 + dz) * (bb.right - cx);
	var zoomY = (1 + dz) * (bb.top - cy);
	
	bb.left = cx + moveX - zoomX;
	bb.right = cx + moveX + zoomX;
	bb.top = cy + moveY + zoomY;
	bb.bottom = cy + moveY - zoomY;
}

Visualizer.prototype.keyHandler = function(e) {
	//TODO check that focus is not in a textarea or text input before applying key events.
	switch (e.keyCode) {
		case 74: case 37: this.moveBoundingBox(-0.1,    0,    0); break;
		case 73: case 38: this.moveBoundingBox(   0,  0.1,    0); break;
		case 76: case 39: this.moveBoundingBox( 0.1,    0,    0); break;
		case 75: case 40: this.moveBoundingBox(   0, -0.1,    0); break;
		case 90: case 173: this.moveBoundingBox(   0,    0, 0.25); break;
		case 65: case 171: this.moveBoundingBox(   0,    0, -0.2); break;
		default: /*console.log('unused key: ', e.keyCode);*/ break;
	}
	
	this.draw();
}

Visualizer.prototype.setBoundingBox = function(top, left, bottom, right) {
    this.config.boundingBox = {
		top: top,
		left: left,
		bottom: bottom,
		right: right
    }
}

Visualizer.prototype.autoFitBoundingBox = function() {
	// TODO version that keeps aspect ratio.
	
	var top = Number.MIN_VALUE;
	var left = Number.MAX_VALUE;
	var bottom = Number.MAX_VALUE;
	var right = Number.MIN_VALUE;
		
	if (this.config.points.length >= 2) { // At least two points.
	
		for (var item in this.config.points) {
			var p = this.config.points[item];
			if (p.x < left) left = p.x;
			if (p.x > right) right = p.x;
			if (p.y > top) top = p.y;
			if (p.y < bottom) bottom = p.y;
		} 
		
		var maxFrame = Math.max(this.config.width, this.config.height);
		xFrameRatio = this.config.width / maxFrame;
		yFrameRatio = this.config.height / maxFrame;
		
		var maxData = Math.max(right - left, top - bottom);
		xDataRatio = (right - left) / maxData;
		yDataRatio = (top - bottom) / maxData;
		
		var uppX = (right - left) / this.config.width; // units per pixel
		var uppY = (top - bottom) / this.config.height; // units per pixel
		var upp = Math.max(uppX, uppY);
		
		var cx = (right + left) / 2;
		var cy = (top + bottom) / 2;
		var xSize = upp * this.config.width / 2;
		var ySize = upp * this.config.height / 2;
		left = cx - xSize;
		right = cx + xSize;
		top = cy + ySize;
		bottom = cy - ySize;
		
		//console.log(top, left, bottom, right);
		
	} else if (this.config.points.length == 1) { // Only one point.
		top = this.config.points[0].y + 1;
		left = this.config.points[0].x - 1;
		bottom = this.config.points[0].y - 1;
		right = this.config.points[0].x + 1;
	} else { // No content.
		top =  1;
		left = 0;
		bottom = 0;
		right = 1;
	}
	
	this.setBoundingBox(top, left, bottom, right);
	this.moveBoundingBox(0, 0, 0.25); // Zoom out once to keep points from hitting borders.
}

Visualizer.prototype.fitToBoundingBox = function(p) {
    
    var bb = this.config.boundingBox;
    var dx = (p.x - bb.left) / (bb.right - bb.left);
    var dy = (p.y - bb.top) / (bb.bottom - bb.top);
    var inside = (dx >= 0) && (dy >= 0) && (dx < 1) && (dy < 1);
    //console.log(bb, dx, dy, inside, this.config.width, this.config.height);
	
    return {
		x: dx * this.config.width,
		y: dy * this.config.height,
		inside: inside
    }
}

Visualizer.prototype.getClosestPoint = function(mx, my, resultAsIndex) {
    
    // TODO replace with an efficient search structure such as M-Tree.
    // TODO handle multidimensional case with a general query point.
    var check = Number.MAX_VALUE;
    var result = null;
    var points = this.config.points;
    
    for (var item in points) {
		var p = this.fitToBoundingBox(points[item]);
		var dist = Math.pow(p.x - mx, 2) + Math.pow(p.y - my, 2);
		
		if (dist < check) {
			check = dist;
			result = resultAsIndex ? item : points[item];
		}
    }
    
    return result;
}

Visualizer.prototype.drawLine = function(line, noStroke) {
	
	var b = this.fitToBoundingBox(line.begin);
    var e = this.fitToBoundingBox(line.end);
    
	if (!noStroke) this.context.beginPath();
    this.context.moveTo(b.x, b.y);
    this.context.lineTo(e.x, e.y);
	if (!noStroke) this.context.stroke();
}

Visualizer.prototype.drawPoint = function(p0, noStroke) {
    
    var p = this.fitToBoundingBox(p0);
    var pointSize = this.config.pointSize / 2;
    
    if (p.inside === true) {
		if (!noStroke) this.context.beginPath();
		this.context.moveTo(p.x - pointSize, p.y - pointSize);
		this.context.lineTo(p.x + pointSize, p.y - pointSize);
		this.context.lineTo(p.x + pointSize, p.y + pointSize);
		this.context.lineTo(p.x - pointSize, p.y + pointSize);
		this.context.lineTo(p.x - pointSize, p.y - pointSize);
		if (!noStroke) this.context.stroke();
    }
}

Visualizer.prototype.draw = function(withOneStroke) {
    // TODO add ability to turn points and lines on and off.
	this.context.clearRect(0, 0, this.config.width, this.config.height);
	
    if (this.context !== null) {
		var lines = this.config.lines;
		var points = this.config.points;
		
		// Begin path.
		if (!!withOneStroke) this.context.beginPath();
		
		var counter = 0;
		for (var item in lines) {
			// Change color here, possibly sort lines by their color before loop and change only if needed.
			this.drawLine(lines[item], !!withOneStroke);
		}
		
		for (var item in points) {
			// Change color here, possibly sort points by their color before loop and change only if needed.
			this.drawPoint(points[item], !!withOneStroke);
		}
		
		if (!!withOneStroke) this.context.stroke();
    }
}
