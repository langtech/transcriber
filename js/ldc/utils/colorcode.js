/**
@module ldc
@submodule utils
@namespace ColorCode
*/
goog.provide('ldc.utils.ColorCode');

/**
Class representing a mapping from a set of strings to a set of colors.

@class ColorCode
*/
ldc.utils.ColorCode = function() {
	var a_color = ldc.utils.Color.fromHSV(100, 0.5, 0.5);
	this.cs = new ldc.utils.ColorSeries(a_color);
}

/**
Returns color associated with the code. If the code is not registered yet,
new distinct color is automatically assigned to the code.

@method get
@param {string} code
@return {utils.Color}
*/
ldc.utils.ColorCode.prototype.get = function(code) {
	if (!this.colors.hasOwnProperty(code))
		this.colors[code] = this.cs.nextColor();
	return this.colors[code];
}

