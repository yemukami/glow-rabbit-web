export let races = [];
export let activeRaceId = null;

export function setActiveRaceId(id) {
    activeRaceId = id;
}

export function addNewRace() {
    races.push({id: Date.now(), time:"10:00", name:"New Race", group:1, distance:1000, startPos:0, count:10, status:"ready", pacers:[], markers:[]});
}

export function getActiveRace() {
    if (activeRaceId === null) return null;
    return races.find(r => r.id === activeRaceId) || null;
}

export function getRaceById(id) {
    if (id === null || id === undefined) return null;
    return races.find(r => r.id === id) || null;
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
