export let races = [];
export let activeRaceId = null;

export function setActiveRaceId(id) {
    activeRaceId = id;
}

export function loadRaces() {
    const saved = localStorage.getItem('glow_races');
    if (saved) {
        try {
            races = JSON.parse(saved);
            if(!Array.isArray(races)) races = [];
            // Data Sanitization
            races = races.filter(r => r && typeof r === 'object').map(r => {
                if(!r.id) r.id = Date.now() + Math.random();
                if(!r.status) r.status = 'ready';
                if(r.status === 'running') r.status = 'ready'; // Reset running state on reload
                if(!Array.isArray(r.pacers)) r.pacers = [];
                if(!Array.isArray(r.markers)) r.markers = [];
                if (typeof r.startPos !== 'number' || Number.isNaN(r.startPos) || r.startPos < 0) r.startPos = 0;
                
                r.pacers.forEach(p => {
                     if(typeof p.pace !== 'number') p.pace = 72.0;
                     if(typeof p.currentDist !== 'number') p.currentDist = 0;
                     if(p.finishTime === undefined) p.finishTime = null;
                });
                return r;
            });
        } catch(e) { console.error("Load Error:", e); races = []; }
    } else {
        races = [];
    }
}

export function saveRaces() {
    localStorage.setItem('glow_races', JSON.stringify(races));
}
