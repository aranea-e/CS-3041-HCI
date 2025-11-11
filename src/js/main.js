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
            const target = document.querySelector(`.spell-slot[data-position="${pos}"]`);
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
                const target = document.querySelector(`.spell-slot[data-position="${clearedPos}"]`);
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

    const spellGrid = document.querySelector('.spell-grid');

    spellGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.spell-slot');
        if (!button) return;

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

            // Reset all spell-slot texts to default
            document.querySelectorAll('.spell-slot').forEach(slot => {
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
    const url = `pages/selection.html?pos=${encodeURIComponent(position)}`;
    window.location.href = url;
}