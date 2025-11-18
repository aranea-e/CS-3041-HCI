document.addEventListener('DOMContentLoaded', () => {
    // Helper: read/write spells map from localStorage
    function readSpellsMap() {
        try {
            const raw = localStorage.getItem('spells');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeSpellsMap(map) {
        try {
            localStorage.setItem('spells', JSON.stringify(map));
        } catch (e) {
            // ignore
        }
    }

    // Mark the first empty slot by iterating columns first.
    function markFirstEmptySlot() {
        try {
            // Clear any previous marking (ignore replica slots)
            document.querySelectorAll('.spell-slot.first-empty:not([data-replica])').forEach(el => el.classList.remove('first-empty'));

            // Gather all positions present in the DOM to determine grid bounds (ignore replica slots)
            const slots = Array.from(document.querySelectorAll('.spell-slot:not([data-replica])'))
                .filter(s => !s.classList.contains('clear-btn') && !s.classList.contains('alchemy-label'));

            let maxRow = 0, maxCol = 0;
            const positions = new Set();
            slots.forEach(s => {
                const pos = s.dataset.position;
                if (!pos) return;
                positions.add(pos);
                const parts = String(pos).split('-').map(x => parseInt(x,10));
                if (parts.length >= 2) {
                    const [r,c] = parts;
                    if (!Number.isNaN(r) && !Number.isNaN(c)) {
                        if (r > maxRow) maxRow = r;
                        if (c > maxCol) maxCol = c;
                    }
                }
            });

            // Fallback bounds if none detected
            if (maxRow === 0) maxRow = 8;
            if (maxCol === 0) maxCol = 3;

            let marked = false;
            for (let col = 1; col <= maxCol && !marked; col++) {
                for (let row = 1; row <= maxRow && !marked; row++) {
                    const key = `${row}-${col}`;
                    if (!positions.has(key)) continue; // position not present in DOM
                    const el = document.querySelector(`.spell-slot[data-position="${key}"]:not([data-replica])`);
                    if (!el) continue;
                    // Skip non-interactable labels and clear button
                    if (el.classList.contains('clear-btn') || el.classList.contains('alchemy-label')) continue;
                    // Consider a slot occupied if it has the 'selected' class
                    if (!el.classList.contains('selected')) {
                        el.classList.add('first-empty');
                        marked = true;
                    }
                }
            }
        } catch (e) {
            console.error('markFirstEmptySlot error', e);
        }
    }

    // If the index was opened with ?pos=...&spell=..., update the stored map first
    try {
        const params = new URLSearchParams(window.location.search);
        const posParam = params.get('pos');
        const spellParam = params.get('spell');
        const clearedPos = params.get('clearedPos');
        if (clearedPos) {
            const map = readSpellsMap();
            if (map.hasOwnProperty(clearedPos)) {
                delete map[clearedPos];
                writeSpellsMap(map);
            }
            // Ensure the target DOM is cleared below (after rehydrate attempt)
            try {
                history.replaceState(null, '', window.location.pathname);
            } catch (e) {
                // ignore
            }
        }
        if (posParam && spellParam) {
            const decodedSpell = spellParam; // URLSearchParams already decodes
            const map = readSpellsMap();
            map[posParam] = decodedSpell;
            writeSpellsMap(map);

            // Count this as a user selection for timing metrics
            try {
                // Prefer sessionStorage value (per-run) when available; otherwise fall
                // back to localStorage. This ensures Start's sessionStorage reset
                // is used and we don't resume from an old localStorage value.
                var prevSraw = sessionStorage.getItem('selectionCount');
                var prevLraw = localStorage.getItem('selectionCount');
                var prev = 0;
                if (prevSraw !== null && prevSraw !== undefined) {
                    prev = parseInt(prevSraw || '0', 10) || 0;
                } else if (prevLraw !== null && prevLraw !== undefined) {
                    prev = parseInt(prevLraw || '0', 10) || 0;
                }
                var next = String(prev + 1);
                try { localStorage.setItem('selectionCount', next); } catch(e){}
                try { sessionStorage.setItem('selectionCount', next); } catch(e){}
            } catch (e) {
                // ignore storage errors
            }

            // Remove query params from the URL so reload won't reapply
            try {
                history.replaceState(null, '', window.location.pathname);
            } catch (e) {
                // ignore
            }
        }
    } catch (e) {
        // ignore any URL parsing errors
    }

    // Rehydrate all stored spells into the index buttons
    try {
        const map = readSpellsMap();
        Object.keys(map).forEach(pos => {
            const label = map[pos];
            // Only rehydrate interactive slots — never touch display-only replicas
            const target = document.querySelector(`.spell-slot[data-position="${pos}"]:not([data-replica])`);
            if (target) {
                target.textContent = label;
                target.classList.add('selected');
            }
        });
        // If a clearedPos was provided in the query params, explicitly clear that slot
        try {
            const params = new URLSearchParams(window.location.search);
            const clearedPos = params.get('clearedPos');
                if (clearedPos) {
                // Ensure we only clear the interactive slot, not any replica display
                const target = document.querySelector(`.spell-slot[data-position="${clearedPos}"]:not([data-replica])`);
                if (target) {
                    target.textContent = 'Select Spell';
                    target.classList.remove('selected');
                }
                // Also ensure localStorage updated (already removed above)
            }
        } catch (e) {
            // ignore
        }
        // Update Alchemy points label based on stored spells
        try {
            const alchemyEl = document.getElementById('alchemy-points');
            if (alchemyEl) {
                const computeAlchemySum = (m) => {
                    let sum = 0;
                    Object.values(m || {}).forEach(lbl => {
                        if (!lbl) return;
                        const match = String(lbl).match(/Alchemy\s*\((\d+)\)/i);
                        if (match) sum += Number(match[1]);
                    });
                    return sum;
                };

                const sum = computeAlchemySum(map);
                alchemyEl.textContent = `Alchemy Points: ${sum}`;
                if (sum > 0) alchemyEl.classList.add('selected'); else alchemyEl.classList.remove('selected');
            }
        } catch (e) {
            // ignore
        }
    } catch (e) {
        // ignore
    }

    // Rehydrate options textarea value
    try {
        const opts = localStorage.getItem('spellOptions');
        const ta = document.getElementById('spell-options');
        if (ta) {
            ta.value = opts || '';
            // placeholder handles display when empty
            ta.addEventListener('input', (ev) => {
                try {
                    localStorage.setItem('spellOptions', ta.value);
                } catch (e) {
                    // ignore
                }
            });
        }
    } catch (e) {
        // ignore
    }

    // After rehydration, mark the first empty slot (iterate columns first).
    try {
        markFirstEmptySlot();
    } catch (e) {
        // ignore
    }

    // --- Keyboard navigation implementation ---
    (function setupKeyboardNavigation() {
        // Build grid model from DOM
        const allSlots = Array.from(document.querySelectorAll('.spell-slot:not([data-replica])'));
        const clearEl = document.querySelector('.spell-slot.clear-btn:not([data-replica])');
        const alchemyEl = document.querySelector('.spell-slot.alchemy-label:not([data-replica])');

        const grid = {}; // grid[col] = sorted array of rows
        let minCol = Infinity, maxCol = -Infinity;
        let minRow = Infinity, maxRow = -Infinity;

        allSlots.forEach(el => {
            const pos = el.dataset.position;
            if (!pos) return;
            const parts = String(pos).split('-').map(x => parseInt(x,10));
            if (parts.length < 2) return;
            const [r,c] = parts;
            if (Number.isNaN(r) || Number.isNaN(c)) return;
            // Skip the alchemy label and the Clear button as they are non-interactable
            if (el === alchemyEl) return;
            if (el === clearEl) return;

            if (!grid[c]) grid[c] = new Set();
            grid[c].add(r);
            if (c < minCol) minCol = c;
            if (c > maxCol) maxCol = c;
            if (r < minRow) minRow = r;
            if (r > maxRow) maxRow = r;
        });

        // Convert sets to sorted arrays
        Object.keys(grid).forEach(k => {
            const arr = Array.from(grid[k]);
            arr.sort((a,b) => a-b);
            grid[k] = arr;
        });

        // Helper to get element for a given row/col
        function elFor(row, col) {
            return document.querySelector(`.spell-slot[data-position="${row}-${col}"]:not([data-replica])`);
        }

        // Find closest row in column to targetRow
        function closestRowInColumn(col, targetRow) {
            const rows = grid[col];
            if (!rows || rows.length === 0) return null;
            // exact match
            if (rows.indexOf(targetRow) !== -1) return targetRow;
            // otherwise find minimal distance
            let best = rows[0]; let bestDist = Math.abs(rows[0] - targetRow);
            for (let i=1;i<rows.length;i++){
                const d = Math.abs(rows[i]-targetRow);
                if (d < bestDist) { bestDist = d; best = rows[i]; }
            }
            return best;
        }

        // State
        let navState = { type: 'cell', row: null, col: null };
        let lastColumnWhileClear = null;

        // Initialize selection: prefer `.first-empty` if present, otherwise
        // fall back to top-left (smallest col, smallest row available).
        function initSelection() {
            try {
                const fe = document.querySelector('.spell-slot.first-empty:not([data-replica])');
                if (fe && fe.dataset && fe.dataset.position) {
                    const parts = fe.dataset.position.split('-').map(x=>parseInt(x,10));
                    if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
                        navState.type = 'cell';
                        navState.row = parts[0];
                        navState.col = parts[1];
                        lastColumnWhileClear = navState.col;
                        applyVisualSelection();
                        return;
                    }
                }
            } catch (e) {
                // ignore and fallback
            }

            // Fallback: Prefer smallest row in smallest column
            const cols = Object.keys(grid).map(x=>parseInt(x,10)).sort((a,b)=>a-b);
            for (let ci=0; ci<cols.length; ci++){
                const col = cols[ci];
                const rows = grid[col];
                if (!rows || rows.length===0) continue;
                // choose top row in that column
                navState.type = 'cell';
                navState.col = col;
                navState.row = rows[0];
                lastColumnWhileClear = col;
                applyVisualSelection();
                return;
            }
            // fallback: select clear if nothing else
            if (clearEl) {
                navState.type = 'clear';
                applyVisualSelection();
            }
        }

        function applyVisualSelection() {
            // Remove previous markers
            document.querySelectorAll('.spell-slot.kbd-selected:not([data-replica])').forEach(s => s.classList.remove('kbd-selected'));
            if (navState.type === 'cell') {
                const el = elFor(navState.row, navState.col);
                if (el) {
                    el.classList.add('kbd-selected');
                    try { el.focus(); } catch(e) {}
                }
            } else if (navState.type === 'clear') {
                if (clearEl) {
                    clearEl.classList.add('kbd-selected');
                    try { clearEl.focus(); } catch(e) {}
                }
            }
        }

        function moveLeft() {
            if (navState.type === 'clear') {
                // rotate column and remain on clear
                const cols = Object.keys(grid).map(x=>parseInt(x,10)).sort((a,b)=>a-b);
                if (cols.length === 0) return;
                let idx = cols.indexOf(lastColumnWhileClear || cols[0]);
                idx = (idx - 1 + cols.length) % cols.length;
                lastColumnWhileClear = cols[idx];
                applyVisualSelection();
                return;
            }
            // compute next column with wrap
            const cols = Object.keys(grid).map(x=>parseInt(x,10)).sort((a,b)=>a-b);
            if (cols.length === 0) return;
            let curIdx = cols.indexOf(navState.col);
            if (curIdx === -1) curIdx = 0;
            const nextIdx = (curIdx - 1 + cols.length) % cols.length;
            const nextCol = cols[nextIdx];
            const targetRow = closestRowInColumn(nextCol, navState.row);
            if (targetRow === null) return;
            navState.col = nextCol; navState.row = targetRow; navState.type = 'cell';
            applyVisualSelection();
        }

        function moveRight() {
            if (navState.type === 'clear') {
                const cols = Object.keys(grid).map(x=>parseInt(x,10)).sort((a,b)=>a-b);
                if (cols.length === 0) return;
                let idx = cols.indexOf(lastColumnWhileClear || cols[0]);
                idx = (idx + 1) % cols.length;
                lastColumnWhileClear = cols[idx];
                applyVisualSelection();
                return;
            }
            const cols = Object.keys(grid).map(x=>parseInt(x,10)).sort((a,b)=>a-b);
            if (cols.length === 0) return;
            let curIdx = cols.indexOf(navState.col);
            if (curIdx === -1) curIdx = 0;
            const nextIdx = (curIdx + 1) % cols.length;
            const nextCol = cols[nextIdx];
            const targetRow = closestRowInColumn(nextCol, navState.row);
            if (targetRow === null) return;
            navState.col = nextCol; navState.row = targetRow; navState.type = 'cell';
            applyVisualSelection();
        }

        function moveUp() {
            if (navState.type === 'clear') {
                // move to bottom of selected column
                const col = lastColumnWhileClear || navState.col;
                const rows = grid[col];
                if (!rows || rows.length === 0) return;
                navState.type = 'cell';
                navState.col = col;
                navState.row = rows[rows.length-1];
                applyVisualSelection();
                return;
            }
            const rows = grid[navState.col] || [];
            if (!rows || rows.length === 0) return;
            const idx = rows.indexOf(navState.row);
            if (idx > 0) {
                navState.row = rows[idx-1];
                applyVisualSelection();
                return;
            }
            // moving off the top -> select clear and remember column
            if (clearEl) {
                lastColumnWhileClear = navState.col;
                navState.type = 'clear'; navState.row = null; navState.col = lastColumnWhileClear;
                applyVisualSelection();
            }
        }

        function moveDown() {
            if (navState.type === 'clear') {
                // move to top of selected column
                const col = lastColumnWhileClear || navState.col;
                const rows = grid[col];
                if (!rows || rows.length === 0) return;
                navState.type = 'cell';
                navState.col = col;
                navState.row = rows[0];
                applyVisualSelection();
                return;
            }
            const rows = grid[navState.col] || [];
            if (!rows || rows.length === 0) return;
            const idx = rows.indexOf(navState.row);
            if (idx < rows.length - 1) {
                navState.row = rows[idx+1];
                applyVisualSelection();
                return;
            }
            // moving off the bottom -> select clear and remember column
            if (clearEl) {
                lastColumnWhileClear = navState.col;
                navState.type = 'clear'; navState.row = null; navState.col = lastColumnWhileClear;
                applyVisualSelection();
            }
        }

        // Skip keyboard nav when focus is on inputs or textarea
        function shouldIgnoreKeydown() {
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            return ['INPUT','TEXTAREA','SELECT'].indexOf(tag.toUpperCase()) !== -1;
        }

        document.addEventListener('keydown', (ev) => {
            if (shouldIgnoreKeydown()) return;
            // Only handle arrow keys
            if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)) return;
            ev.preventDefault();
            if (ev.key === 'ArrowLeft') moveLeft();
            else if (ev.key === 'ArrowRight') moveRight();
            else if (ev.key === 'ArrowUp') moveUp();
            else if (ev.key === 'ArrowDown') moveDown();
        });

        // Clicking with mouse should update navState accordingly
        document.addEventListener('click', (ev) => {
            const btn = ev.target.closest('.spell-slot');
            if (!btn) return;
            // ignore replica (display-only) slots
            if (btn.dataset && btn.dataset.replica) return;
            if (btn.classList.contains('clear-btn')) {
                // When clear is clicked, switch to clear state but DO NOT
                // overwrite the remembered column. Remembered column should
                // reflect the last selected column of cells so Up/Down from
                // Clear returns to that column.
                navState.type = 'clear';
            } else if (!btn.classList.contains('alchemy-label')) {
                const parts = (btn.dataset.position||'').split('-').map(x=>parseInt(x,10));
                if (parts.length>=2) {
                    navState.type = 'cell'; navState.row = parts[0]; navState.col = parts[1]; lastColumnWhileClear = navState.col;
                }
            }
            applyVisualSelection();
        });

        // Hover-to-select: only respond when the mouse moves over buttons.
        // This intentionally does not run on page load; it only reacts to mousemove.
        (function setupHoverToSelect() {
            let lastHoveredBtn = null;
            document.addEventListener('mousemove', (ev) => {
                try {
                    // If user is typing in an input/textarea/select, ignore hover
                    const tag = (document.activeElement && document.activeElement.tagName) || '';
                    if (['INPUT','TEXTAREA','SELECT'].indexOf(tag.toUpperCase()) !== -1) return;

                    const btn = ev.target.closest('.spell-slot');
                    if (!btn) {
                        // moved off any slot; reset so next hover re-triggers
                        lastHoveredBtn = null;
                        return;
                    }
                    // ignore replica (display-only) slots
                    if (btn.dataset && btn.dataset.replica) { lastHoveredBtn = null; return; }
                    // Only act when the hovered element changes
                    if (btn === lastHoveredBtn) return;
                    lastHoveredBtn = btn;

                    // Ignore non-interactable labels
                    if (btn.classList.contains('alchemy-label')) return;

                    if (btn.classList.contains('clear-btn')) {
                        navState.type = 'clear';
                        applyVisualSelection();
                        return;
                    }

                    const parts = (btn.dataset.position||'').split('-').map(x=>parseInt(x,10));
                    if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
                        // Update nav state to this hovered cell and remember column
                        navState.type = 'cell';
                        navState.row = parts[0];
                        navState.col = parts[1];
                        lastColumnWhileClear = navState.col;
                        applyVisualSelection();
                    }
                } catch (e) {
                    // swallow hover errors
                }
            }, { passive: true });
        })();

        // Initialize
        try { initSelection(); } catch(e) { console.error('initSelection', e); }
    })();

    const spellGrid = document.querySelector('.spell-grid');

    spellGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.spell-slot');
        if (!button) return;
        // ignore clicks on the small replica
        if (button.dataset && button.dataset.replica) return;

        const position = button.dataset.position;
        // Clear button handling: if clear button clicked, wipe stored spells and rehydrate UI
        if (button.classList.contains('clear-btn')) {
            try {
                localStorage.removeItem('spells');
            } catch (e) {
                // ignore
            }

            // To avoid a flash where the button text changes immediately but
            // transitionable styles (color/transform) animate a moment later,
            // temporarily disable transitions, perform the updates, force a
            // reflow/paint, then re-enable transitions. This makes text and
            // styling update simultaneously.
            try {
                // add helper class to suspend transitions
                if (spellGrid && !spellGrid.classList.contains('no-transition')) {
                    spellGrid.classList.add('no-transition');
                }
            } catch (e) {
                // ignore
            }

            // Reset all interactive spell-slot texts to default (leave replica alone)
            document.querySelectorAll('.spell-slot:not([data-replica])').forEach(slot => {
                // keep the clear button label as 'Clear' and skip the alchemy label
                if (slot.classList.contains('clear-btn')) return;
                if (slot.classList.contains('alchemy-label')) return;
                slot.textContent = 'Select Spell';
                slot.classList.remove('selected');
            });

            // Also clear the options textarea and persisted options
            try {
                localStorage.removeItem('spellOptions');
                const ta = document.getElementById('spell-options');
                if (ta) ta.value = '';
            } catch (e) {
                // ignore
            }

            // Reset the alchemy points label to 0 and remove its selected styling
            try {
                const alchemyEl = document.getElementById('alchemy-points');
                if (alchemyEl) {
                    alchemyEl.textContent = 'Alchemy Points: 0';
                    alchemyEl.classList.remove('selected');
                }
            } catch (e) {
                // ignore
            }

            // Recompute and mark the first empty slot now that DOM was cleared
            try {
                markFirstEmptySlot();
            } catch (e) {
                // ignore
            }

            // Force a reflow then remove the no-transition helper so future
            // interactions still have the expected animation behavior.
            // Using requestAnimationFrame ensures the browser paints the
            // intermediate state before re-enabling transitions.
            void document.body.offsetHeight; // force reflow
            requestAnimationFrame(() => {
                try {
                    if (spellGrid && spellGrid.classList.contains('no-transition')) {
                        spellGrid.classList.remove('no-transition');
                    }
                } catch (e) {
                    // ignore
                }
            });

            return;
        }

        if (position) {
            navigateToSelection(position);
        }
    });
});

function navigateToSelection(position) {
    // Store position in localStorage for use on selection page
    try {
        localStorage.setItem('selectedPosition', position);
    } catch (e) {
        // localStorage may be unavailable in some contexts; ignore silently
    }

    // Pass position in query string as a fallback (works even when sessionStorage isn't available)
    const url = `selection.html?pos=${encodeURIComponent(position)}`;
    window.location.href = url;
}