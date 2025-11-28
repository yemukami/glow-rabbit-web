/**
 * PaceCalculator
 * Calculates split times and command schedules based on target time or segments.
 */
export class PaceCalculator {
    
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
        
        // Basic pace per meter
        const baseSecondsPerMeter = targetTimeSeconds / totalDistanceMeters;
        
        let currentDist = 0;
        let elapsedTime = 0;
        
        while (currentDist < totalDistanceMeters) {
            let nextDist = Math.min(currentDist + intervalMeters, totalDistanceMeters);
            let segmentDist = nextDist - currentDist;
            
            // Ideal time at nextDist
            let idealTimeAtNext = nextDist * baseSecondsPerMeter;
            
            // Duration for this segment to hit the ideal time
            // We might add logic here later to round to 0.1s and carry over error
            let segmentDuration = idealTimeAtNext - elapsedTime;
            
            // Rounding to 0.1s precision as per requirement
            // But we must carry the error to the next segment to avoid drift
            // For now, let's calculate raw ideal duration first.
            
            // Convert to 400m pace for command
            // paceCmd = seconds per 400m
            let paceCmd = (segmentDuration / segmentDist) * 400;
            
            plan.push({
                startDist: currentDist,
                endDist: nextDist,
                startTime: elapsedTime,
                endTime: idealTimeAtNext, // logical exact time
                duration: segmentDuration,
                paceFor400m: paceCmd
            });
            
            currentDist = nextDist;
            elapsedTime = idealTimeAtNext;
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
        
        // Segment definition: "Up to X meters, run at Y sec/400m"
        // We need to chop this into 'intervalMeters' chunks for the controller
        
        for (const seg of segments) {
            // seg.distance is the cumulative distance (e.g. 400, 800, 1000)
            // seg.pace is sec/400m
            
            while (currentDist < seg.distance) {
                let nextDist = Math.min(currentDist + intervalMeters, seg.distance);
                let chunkDist = nextDist - currentDist;
                
                // Calculate duration for this chunk based on specified pace
                let speedMetersPerSec = 400.0 / seg.pace;
                let chunkDuration = chunkDist / speedMetersPerSec;
                
                plan.push({
                    startDist: currentDist,
                    endDist: nextDist,
                    startTime: elapsedTime,
                    endTime: elapsedTime + chunkDuration,
                    duration: chunkDuration,
                    paceFor400m: seg.pace
                });
                
                currentDist = nextDist;
                elapsedTime += chunkDuration;
            }
        }
        
        return plan;
    }
}
