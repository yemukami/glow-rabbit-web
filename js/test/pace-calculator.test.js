
import { PaceCalculator } from '../core/pace-calculator.js';

// Mock globals if needed (none for this pure logic test)

function runTests() {
    console.log("=== PaceCalculator Logic Tests ===");

    // TEST 1: Fixed Target Time (Simple)
    // 1000m in 3:00 (180s). Pace should be 72s/400m constantly.
    console.log("\n[Test 1] 1000m / 180s (Ideal 72s pace)");
    const plan1 = PaceCalculator.createPlanFromTargetTime(1000, 180, 400);
    
    // Expected: 
    // 0-400m: 72s
    // 400-800m: 72s
    // 800-1000m: 36s (which is 72s/400m rate)
    
    if (plan1.length === 3) console.log("✅ Segments count: 3");
    else console.error("❌ Segments count:", plan1.length);

    if (Math.abs(plan1[0].paceFor400m - 72.0) < 0.01) console.log("✅ Seg 1 Pace: 72.0");
    else console.error("❌ Seg 1 Pace:", plan1[0].paceFor400m);

    if (Math.abs(plan1[2].paceFor400m - 72.0) < 0.01) console.log("✅ Seg 3 Pace: 72.0 (Normalized)");
    else console.error("❌ Seg 3 Pace:", plan1[2].paceFor400m);

    if (Math.abs(plan1[2].endTime - 180.0) < 0.01) console.log("✅ Total Time: 180.0");
    else console.error("❌ Total Time:", plan1[2].endTime);


    // TEST 2: Segments (Build-up)
    // 0-400m: 80s pace
    // 400-800m: 70s pace
    console.log("\n[Test 2] Build-up: 0-400@80s, 400-800@70s");
    const segments = [
        { distance: 400, pace: 80.0 },
        { distance: 800, pace: 70.0 }
    ];
    const plan2 = PaceCalculator.createPlanFromSegments(segments, 400); // controller updates every 400m
    
    if (plan2.length === 2) console.log("✅ Segments count: 2");
    
    if (plan2[0].paceFor400m === 80.0) console.log("✅ Seg 1 Pace: 80.0");
    else console.error("❌ Seg 1 Pace:", plan2[0].paceFor400m);
    
    if (plan2[1].paceFor400m === 70.0) console.log("✅ Seg 2 Pace: 70.0");
    else console.error("❌ Seg 2 Pace:", plan2[1].paceFor400m);
    
    const totalTime = 80 + 70;
    if (Math.abs(plan2[1].endTime - totalTime) < 0.01) console.log("✅ Total Time: " + totalTime);


    // TEST 3: Rounding Adjustment Logic (The "Real World" Test)
    // 1000m in 3:00 (180s). But let's say we force integer rounding on duration?
    // Actually, let's test if we give weird distance.
    // 402m race. Target 72s. 
    // Pace should be slightly faster than 72s/400m? 
    // 402m in 72s -> speed = 5.5833 m/s.
    // 400m time -> 71.64s.
    console.log("\n[Test 3] 402m / 72s (Fractional Distance)");
    const plan3 = PaceCalculator.createPlanFromTargetTime(402, 72, 400);
    
    // 0-400m: 71.64...s
    // 400-402m: 0.358...s
    
    const p1 = plan3[0].paceFor400m;
    console.log("Seg 1 Pace (sec/400m):", p1.toFixed(3)); 
    // Expected: 72 * (400/402) = 71.641...
    
    if (Math.abs(p1 - 71.641) < 0.01) console.log("✅ Pace calculation correct");
    else console.error("❌ Pace calculation off");
}

runTests();
