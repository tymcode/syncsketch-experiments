const TICKS_PER_SECOND = 254016000000;

/**
 * @defType Timebase {object} An object specifying a precise timebase (framerate) using a rational number expressed as a fraction of rate over scale: { rate: 24000, scale: 1001 }
 * @property {Number} rate An integer framerate value respecting multipliers applied to the scale (denominator), i.e. if scale is 1001, then 24 -> 24000
 * @property {Number} scale An integer value that serves as the denominator, i.e. 1001
 */

/**
 * Get the offset in seconds for frame `frame` at framerate `framerate`. If error, returns null.
 * @param {Number} frames An integer number of frames.
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive number of seconds
 */
function timeFromFrames( frames, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        return frames * ( t.rate/t.scale );
    } else return null;
}

/**
 * To determine the frame number at a given time offset in seconds.
 * @param {Number} time A positive number, in seconds, such as 6.33
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive integer number of frames
 */
function framesFromTime( time, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        let tpf =  ( ( TICKS_PER_SECOND*1000/t.rate )/t.scale );
        return Math.round( time * TICKS_PER_SECOND / tpf );
    } else return null;
}

/**
 * To determine the number of ticks (Adobe's underlying time unit) at a given number of frames.
 * @param {Number} frames A positive integer
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive integer number of ticks
 */
function ticksFromFrames( frames, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        let tpf =  ( ( TICKS_PER_SECOND*1000/t.rate )/t.scale );
        return frames * tpf;
    } else return null;
}

/**
 * To determine the number of frames, given a number of ticks (Adobe's underlying time unit).
 * @param {Number} ticks A positive integer
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive integer number of frames
 */
function framesFromTicks( ticks, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        let tpf =  ( ( TICKS_PER_SECOND*1000/t.rate )/t.scale );
        return Math.round( ticks / tpf );
    } else return null;
}

/**
 * To determine the number of seconds, given a number of ticks (Adobe's underlying time unit).
 * @param {Number} ticks A positive integer
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive number of seconds
 */
function timeFromTicks( ticks, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        let tpf =  ( ( TICKS_PER_SECOND*1000/t.rate )/t.scale );
        return Math.round( ticks / TICKS_PER_SECOND );
    } else return null;
}

/**
 * To determine the number of ticks (Adobe's underlying time unit) at a given number of seconds
 * @param {Number} time A positive number, in seconds, such as 6.33
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Number} A positive integer number of ticks
*/
function ticksFromTime( time, framerate ) {
    var t = this.toTimebase( framerate );
    if( t ) {
        return time * TICKS_PER_SECOND;
    } else return null;
} 

/**
 * This function normalizes framerates to a Timebase object that expresses framerate as a rational number (i.e. 30000/1001)
 * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Either a framerate number (i.e. 23.976) or Timebase object with a rate as a numerator and scale as a denominator, such as { rate: 24000, scale: 1001 }
 * @returns {Timebase}, or null if error.
 */
function toTimebase ( framerate ) {
    if( typeof framerate == 'object' ) {
        if( framerate.hasOwnProperty('rate') && framerate.hasOwnProperty('scale')) {
            return framerate;
        } else return null;
    } else if( typeof framerate === undefined ) {
        return null
    } else {
        let tb = new Timebase( framerate );
        if( tb.rate == null ) return null;
        return tb;
    }       
}


/**
 * The Timebase object expresses framerate very precisely using a numerator (`rate`) and denominator (`scale`), typically multiplied out to integers.
 * This function normalizes framerate inputs to this format.
 */
class Timebase {
    /**
     * 
     * @param {Timebase|Number=[23.976 | 23.98 | 24 | 25 | 29/97 | 30 | 59.94 | 60]} framerate Typically this is a framerate value, like 23.98 and converts it to a Timebase object. If a Timebase-like opject is supplied, it is simply returned.
     * @returns {Timebase} or a null `rate` property if error.
     */
    constructor( framerate ) {
        this.rate = null;
        this.scale = 1001;

        switch (framerate) {
            case 23.976:
                this.rate = 24000
                this.scale = 1001
                break;
            case 23.98:
                this.rate = 24000
                this.scale = 1001
                break;
            case 24:
                this.rate = 24000
                this.scale = 1000
                break;
            case 25:
                this.rate = 25000
                this.scale = 1000
                break;
            case 29.97:
                this.rate = 30000
                this.scale = 1001
                break;
            case 30:
                this.rate = 30000
                this.scale = 1000
                break;
            case 59.94:
                this.rate = 60000
                this.scale = 1001
                break;
            case 60:
                this.rate = 60000
                this.scale = 1000
                break;
        
            default:
                // error
                this.rate = null;
                break;
        }
        return this;
    }
}
