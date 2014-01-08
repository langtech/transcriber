(function() {
/**
@module ldc
@submodule utils
@namespace utils
*/
goog.provide('ldc.utils.ColorSeries');

/**
Generates a series of distinct colors.

@class ColorSeries
@param {utils.Color} c Initial color.
*/
ldc.utils.ColorSeries = function(c) {
	var a = c.toHSV().replace(/[^0-9.]+/g, ' ').trim().split(/\s+/);
	this.h_val = Math.round(parseFloat(a[0]));
	this.s_val = Math.round(parseFloat(a[1]) * 2.56);
	this.v_val = Math.round(parseFloat(a[2]) * 2.56);
}

/**
Generate a new color.
@method nextColor
@return {utils.Color} A Color object.
*/
ldc.utils.ColorSeries.prototype.nextColor = function() {
	var new_color = ldc.utils.Color.fromHSV(this.h_val, this.s_val / 256, this.v_val / 256);

	// compute next color
	this.h_val += 107;
	if (this.h_val >= 360) {
        this.h_val = modulo(this.h_val, 360);
        this.s_val = this.s_val < 147 ? this.s_val - 147 + 256 : this.s_val - 89;
        this.v_val = this.v_val < 177 ? this.v_val - 177 + 256 : this.v_val - 59;
    }

    return new_color;
}

function modulo(a, b) {
	return a - Math.floor(a / b) * b;
}

})();