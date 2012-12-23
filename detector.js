var Detector = function (imgMatrix, patternInfo) {
	this.imgMatrix = imgMatrix;
	this.patternInfo = patternInfo;
}

Detector.prototype = {

	getCodeMatrix : function(){
		var topLeft = this.patternInfo.topLeft;
		var topRight = this.patternInfo.topRight;
		var bottomLeft = this.patternInfo.bottomLeft;

		//获取topLeft和topRight的距离
		var moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);
		if (moduleSize < 1) {
			throw "moduleSize";
		}
		//计算二维码尺寸
		var dimension = this.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
		this.codeMatrix = new BitMatrix(dimension, dimension);
		return this.codeMatrix;

	},

	computeDimension : function(topLeft, topRight, bottomLeft, moduleSize) {
		var tltrCentersDimension = Math.round(QUtil.getDistance(topLeft, topRight) / moduleSize);
		var tlblCentersDimension = Math.round(QUtil.getDistance(topLeft, bottomLeft) / moduleSize);
		var dimension = ((tltrCentersDimension + tlblCentersDimension) >> 1) + 7;
		//
		switch (dimension & 0x03) { // mod 4
			case 0:
				dimension++;
				break;
			// 1? do nothing
			case 2:
				dimension--;
				break;
			case 3:
				throw "dimension";
		}
		return dimension;
	},

	//from zXing
	calculateModuleSize : function(topLeft, topRight, bottomLeft){
		var moduleSize1 = this.calculateModuleSizeOneWay(topLeft, topRight);
        var moduleSize2 = this.calculateModuleSizeOneWay(topLeft, bottomLeft);
        return (moduleSize1 + moduleSize2) / 2;
	},

	calculateModuleSizeOneWay : function(pattern1 , pattern2){
		var size1 = this.sizeOfBlackWhiteBlackRunBothWays(pattern1.x>>0, pattern1.y>>0, pattern2.x>>0, pattern2.y>>0);
		var size2 = this.sizeOfBlackWhiteBlackRunBothWays(pattern1.x>>0, pattern1.y>>0, pattern2.x>>0, pattern2.y>>0);

		if(isNaN(size1)){
			return size2 / 7;
		}
		if(isNaN(size2)){
			return size1 / 7;
		}
		return (size1 + size2) / 14;
	},

	sizeOfBlackWhiteBlackRunBothWays : function(fromX, fromY, toX, toY){
		var result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);
		var scale = 1;
		var otherToX = fromX - (toX - fromX);
		if(otherToX < 0){
			scale = fromX / (fromX - otherToX);
			otherToX = 0;
		}else if(otherToX >= this.imgMatrix.width){
			scale = (this.imgMatrix.width - 1 - fromX) / (otherToX - fromX);
		}

		var otherToY = (fromY - (toY - fromY) * scale) >> 0;

		scale = 1;
		 if (otherToY < 0) {
			scale = fromY / (fromY - otherToY);
			otherToY = 0;
        } else if (otherToY >= this.imgMatrix.height) {
			scale = (this.imgMatrix.height - 1 - fromY) /  (otherToY - fromY);
			otherToY = this.imgMatrix.height - 1;
        }
        otherToX = (fromX + (otherToX - fromX) * scale) >> 0;
        
        result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);
        return result - 1;
	},
	
	sizeOfBlackWhiteBlackRun : function(fromX, fromY, toX, toY){
        // Mild variant of Bresenham's algorithm;
        //http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
		var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);

		if (steep) {
			var temp = fromX;
			fromX = fromY;
			fromY = temp;
			temp = toX;
			toX = toY;
			toY = temp;
		}

		var dx = Math.abs(toX - fromX);
		var dy = Math.abs(toY - fromY);

		var error = -dx >> 1;
		var xstep = fromX < toX ? 1 : -1;
		var ystep = fromY < toX ? 1 : -1;
        // In black pixels, looking for white, first or second time.
		var state = 0;

		for(var x = fromX, y = fromY; x != toX; x += xstep) {

			var realX = steep ? y : x;
			var realY = steep ? x : y;
			var pixl = this.imgMatrix.get(realX, realY);
			if(state == 1) {
				// In white pixels, looking for black
				if(pixl) {
					state++;
				}
			} else {
				if(!pixl) {
					state++;
				}
			}

			if(state == 3) {
				// Found black, white, black, and stumbled back onto white; done
				var diffX = x - fromX;
				var diffY = y - fromY;
				return Math.sqrt((diffX * diffX + diffY * diffY));
			}
			error += dy;
			if(error > 0) {
				if(y == toY) {
					break;
				}
				y += ystep;
				error -= dx;
			}
		}
		var diffX2 = toX - fromX;
		var diffY2 = toY - fromY;
		return Math.sqrt((diffX2 * diffX2 + diffY2 * diffY2));
	}
}