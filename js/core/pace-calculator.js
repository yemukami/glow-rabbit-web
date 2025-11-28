/**
 * PaceCalculator
 * Calculates split times and command schedules based on target time or segments.
 */
export class PaceCalculator {
    static #round(val, precision = 0.1) {
        return Math.round(val / precision) * precision;
    }
    
    static #pushChunk(plan, { startDist, endDist, duration, startTime }) {
        const segmentDist = endDist - startDist;
        const paceCmd = (duration / segmentDist) * 400;
        plan.push({
            startDist,
            endDist,
            startTime,
            endTime: startTime + duration,
            duration,
            paceFor400m: paceCmd,
        });
    }

    /**
     * Create a run plan based on a fixed target time for the total distance.
     * It adjusts pace every 'interval' meters to ensure the total time matches targetTime.
     * 
     * @param {number} totalDistanceMeters - Total race distance (e.g. 5000)
     * @param {number} targetTimeSeconds - Goal time in seconds (e.g. 900 for 15:00)
     * @param {number} intervalMeters - Adjustment interval (default 400m)
     * @returns {Array} Schedule of segments [{ startDist, endDist, duration, paceCmd }]
     */
    static createPlanFromTargetTime(totalDistanceMeters, targetTimeSeconds, intervalMeters = 400) {
        const plan = [];
        const baseSecondsPerMeter = targetTimeSeconds / totalDistanceMeters;

        let currentDist = 0;
        let elapsedTime = 0;
        let carry = 0; // rounding residual carried to next chunk

        while (currentDist < totalDistanceMeters) {
            const nextDist = Math.min(currentDist + intervalMeters, totalDistanceMeters);
            const idealRawDuration = (nextDist - currentDist) * baseSecondsPerMeter;

            // apply carry from previous rounding before rounding again
            const adjustedDuration = idealRawDuration + carry;
            const roundedDuration = this.#round(adjustedDuration, 0.1);
            carry = adjustedDuration - roundedDuration;

            this.#pushChunk(plan, {
                startDist: currentDist,
                endDist: nextDist,
                duration: roundedDuration,
                startTime: elapsedTime,
            });

            currentDist = nextDist;
            elapsedTime += roundedDuration;
        }

        return plan;
    }

    /**
     * Create a run plan from explicit segments (Build-up, etc.)
     * @param {Array} segments - [{ distance: 400, pace: 72.0 }, { distance: 1000, pace: 68.0 }]
     * @param {number} intervalMeters - Adjustment interval (default 400m)
     */
    static createPlanFromSegments(segments, intervalMeters = 400) {
        const plan = [];
        let currentDist = 0;
        let elapsedTime = 0;
        let carry = 0;

        // Segment definition: "Up to X meters, run at Y sec/400m"
        // We need to chop this into 'intervalMeters' chunks for the controller
        
        for (const seg of segments) {
            // seg.distance is the cumulative distance (e.g. 400, 800, 1000)
            // seg.pace is sec/400m

            while (currentDist < seg.distance) {
                const nextDist = Math.min(currentDist + intervalMeters, seg.distance);
                const chunkDist = nextDist - currentDist;
                const speedMetersPerSec = 400.0 / seg.pace;

                const idealRawDuration = chunkDist / speedMetersPerSec;
                const adjustedDuration = idealRawDuration + carry;
                const roundedDuration = this.#round(adjustedDuration, 0.1);
                carry = adjustedDuration - roundedDuration;

                this.#pushChunk(plan, {
                    startDist: currentDist,
                    endDist: nextDist,
                    duration: roundedDuration,
                    startTime: elapsedTime,
                });

                currentDist = nextDist;
                elapsedTime += roundedDuration;
            }
        }
        
        return plan;
    }
}
