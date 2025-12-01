import { formatTime } from '../utils/render-utils.js';

export function renderSegmentTable(segments, tbody, onChange) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!segments || segments.length === 0) segments = [{ distance: 400, pace: 72 }];
    segments.forEach((s) => addSegmentRow(tbody, s.distance, s.pace, onChange));
    onChange();
}

export function addSegmentRow(tbody, dist = "", pace = "", onChange) {
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="number" class="segment-input inp-dist" value="${dist}" step="100"></td>
        <td><input type="number" class="segment-input inp-pace" value="${pace}" step="0.1"></td>
        <td><button class="btn-sm btn-danger" data-action="remove-segment">×</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', onChange);
        inp.addEventListener('change', onChange);
    });
    tr.querySelector('[data-action="remove-segment"]').addEventListener('click', () => {
        tr.remove();
        onChange();
    });
}

export function updateSegmentSummary(segments, summaryEl, totalDistance) {
    if (!summaryEl) return;
    const plan = segments && segments.length
        ? segments.reduce((acc, seg, idx) => {
            const prev = idx === 0 ? 0 : segments[idx - 1].distance;
            const pace = seg.pace || 72;
            const dist = seg.distance - prev;
            const timeSec = (dist / 400) * pace;
            acc.total += timeSec;
            return acc;
        }, { total: 0 })
        : { total: 0 };
    const total = plan.total || 0;
    summaryEl.innerText = `ゴール予想タイム: ${total > 0 ? formatTime(total) : '--:--.-'}`;
}
