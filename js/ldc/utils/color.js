/**
@module ldc
@submodule utils
@namespace utils
*/
goog.provide('ldc.utils.Color');

(function() {

/**
An RGB color.

@class Color
@param {number} r Number between 0 and 256.
@param {number} g Number between 0 and 256.
@param {number} b Number between 0 and 256.
*/
ldc.utils.Color = function(r, g, b) {
	[r, g, b].forEach(function(v) {
		if (typeof v != 'number' || v < 0 || v >= 256)
			throw new Error('Invalid RGB value');
	});

	this.rgb = [r, g, b];
}

/**
Return the color as rgb() functional notation.

@method toRGB
@return {string}
*/
ldc.utils.Color.prototype.toRGB = function() {
	var rgb = this.rgb.map(function(v) {
		return Math.round(v);
	});
	return 'rgb(' + rgb.join(',') + ')';
}

/**
Return the color as hsl() functional notation.

@method toHSL
@return {string}
*/
ldc.utils.Color.prototype.toHSL = function() {
	var rgb = this.rgb.map(function(v) {
		return v / 256;
	});
	var M = Math.max.apply(this, rgb);
	var m = Math.min.apply(this, rgb);
	var C = M - m;
	var H1;
	if (C == 0)
		H1 = undefined;
	else if (M == rgb[0])
		H1 = (rgb[1] - rgb[2]) / C % 6;
	else if (M == rgb[1])
		H1 = (rgb[2] - rgb[0]) / C + 2;
	else
		H1 = (rgb[0] - rgb[1]) / C + 4;
	var H = H1 != 'undefined' ? H1 * 60 : 0;
	var L = (M + m) / 2;
	var S = C / (1 - Math.abs(2 * L - 1));
	H = modulo(H, 360);
	return 'hsl(' + H + ',' + (S * 100) + '%,' + (L * 100) + '%)';
}

/**
Return the color as hsv() function notation. Note that this is not recognized
by CSS standards.

@method toHSV
@return {string}
*/
ldc.utils.Color.prototype.toHSV = function() {
	var rgb = this.rgb.map(function(v) {
		return v / 256;
	});
	var M = Math.max.apply(this, rgb);
	var m = Math.min.apply(this, rgb);
	var C = M - m;
	var H1;
	if (C == 0)
		H1 = undefined;
	else if (M == rgb[0])
		H1 = (rgb[1] - rgb[2]) / modulo(C, 6);
	else if (M == rgb[1])
		H1 = (rgb[2] - rgb[0]) / C + 2;
	else
		H1 = (rgb[0] - rgb[1]) / C + 4;
	var H = H1 != 'undefined' ? H1 * 60 : 0;
	var V = M;
	var S = C / V;
	H = modulo(H, 360);
	return 'hsv(' + H + ',' + (S * 100) + '%,' + (V * 100) + '%)';
}

/**
Create a Color object from HSL values.

@method fromHSL
@static
@param {number} h Number between [0, 360]
@param {number} s Number between [0,1]
@param {number} l Number between [0,1]
@return {utils.Color} A Color object;
*/
ldc.utils.Color.fromHSL = function(h, s, l) {
	if (typeof h != 'number' || h < 0 || h > 360)
		throw new Error('Invalid HSL values');
	if (typeof s != 'number' || s < 0 || s > 1)
		throw new Error('Invalid HSL values');
	if (typeof l != 'number' || l < 0 || l > 1)
		throw new Error('Invalid HSL values');

	var C = (1 - Math.abs(2*l - 1)) * s;
	var H1 = h / 60;
	var X = C * (1 - Math.abs(modulo(H1,2) - 1));

	var R1, G1, B1;
	if (typeof h == 'undefined')
		R1 = G1 = B1 = 0;
	else if (H1 >= 0 && H1 < 1) {
		R1 = C;
		G1 = X;
		B1 = 0;
	}
	else if (H1 >= 1 && H1 < 2) {
		R1 = X;
		G1 = C;
		B1 = 0;
	}
	else if (H1 >= 2 && H1 < 3) {
		R1 = 0;
		G1 = C;
		B1 = X;
	}
	else if (H1 >= 3 && H1 < 4) {
		R1 = 0;
		G1 = X;
		B1 = C;
	}
	else if (H1 >= 4 && H1 < 5) {
		R1 = X;
		G1 = 0;
		B1 = C;
	}
	else {
		R1 = C;
		G1 = 0;
		B1 = X;
	}

	var m = l - C / 2;
	var R = R1 + m;
	var G = G1 + m;
	var B = B1 + m;

	return new ldc.utils.Color(R * 256, G * 256, B * 256);
}

/**
Create a Color object from HSV values.

@ethod fromHSV
@static
@param {number} h Number between [0, 360]
@param {number} s Number between [0,1]
@param {number} v Number between [0,1]
@return {utils.Color} A Color object.
*/
ldc.utils.Color.fromHSV = function(h, s, v) {
	if (typeof h != 'number' || h < 0 || h > 360)
		throw new Error('Invalid HSV values');
	if (typeof s != 'number' || s < 0 || s > 1)
		throw new Error('Invalid HSV values');
	if (typeof v != 'number' || v < 0 || v > 1)
		throw new Error('Invalid HSV values');

	var C = v * s;
	var H1 = h / 60;
	var X = C * (1 - Math.abs(modulo(H1, 2) - 1));

	var R1, G1, B1;
	if (typeof h == 'undefined')
		R1 = G1 = B1 = 0;
	else if (H1 >= 0 && H1 < 1) {
		R1 = C;
		G1 = X;
		B1 = 0;
	}
	else if (H1 >= 1 && H1 < 2) {
		R1 = X;
		G1 = C;
		B1 = 0;
	}
	else if (H1 >= 2 && H1 < 3) {
		R1 = 0;
		G1 = C;
		B1 = X;
	}
	else if (H1 >= 3 && H1 < 4) {
		R1 = 0;
		G1 = X;
		B1 = C;
	}
	else if (H1 >= 4 && H1 < 5) {
		R1 = X;
		G1 = 0;
		B1 = C;
	}
	else {
		R1 = C;
		G1 = 0;
		B1 = X;
	}

	var m = v - C;
	var R = R1 + m;
	var G = G1 + m;
	var B = B1 + m;

	return new ldc.utils.Color(R * 256, G * 256, B * 256);
}

function modulo(a, b) {
	return a - Math.floor(a / b) * b;
}

})();
