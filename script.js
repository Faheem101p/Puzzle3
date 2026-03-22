"use strict";

const WORD_DEFS = [
    { w:"ARRAY",      r:0,  c:0,  d:"across", clue:"A list that stores multiple values in a single variable" },
    { w:"HTML5",      r:1,  c:5,  d:"across", clue:"The fifth version of the web's markup language" },
    { w:"JAVASCRIPT", r:2,  c:1,  d:"across", clue:"The scripting language that makes web pages interactive" },
    { w:"EDGE",       r:3,  c:10, d:"across", clue:"Microsoft's modern web browser, built on Chromium" },
    { w:"BACKEND",    r:4,  c:1,  d:"across", clue:"The server-side part of a web application" },
    { w:"PATCH",      r:5,  c:10, d:"across", clue:"HTTP method used to partially update a resource" },
    { w:"HTTPS",      r:6,  c:1,  d:"across", clue:"Secure protocol used to transfer data on the web" },
    { w:"AREA",       r:7,  c:1,  d:"across", clue:"HTML element that defines a clickable region in an image map" },
    { w:"SPLIT",      r:8,  c:1,  d:"across", clue:"String method that divides text using a separator" },
    { w:"EXECUTE",    r:9,  c:1,  d:"across", clue:"To run or carry out a piece of code" },
    { w:"FETCH",      r:11, c:1,  d:"across", clue:"Built-in browser function for making HTTP requests" },
    { w:"ICON",       r:11, c:8,  d:"across", clue:"Small image or symbol representing an action or app" },
    { w:"NULL",       r:12, c:2,  d:"across", clue:"A value that means intentionally empty or absent" },
    { w:"MODAL",      r:13, c:1,  d:"across", clue:"A popup dialog box that appears over the main content" },
    { w:"DOM",        r:0,  c:12, d:"down",   clue:"The tree structure a browser builds from an HTML page" },
    { w:"PHP",        r:2,  c:9,  d:"down",   clue:"Server-side scripting language often used with HTML" },
    { w:"TEMPLATE",   r:2,  c:10, d:"down",   clue:"A reusable HTML structure or page skeleton" },
    { w:"NODE",       r:4,  c:6,  d:"down",   clue:"JavaScript runtime that lets you run JS outside a browser" },
];

const ROWS = 15, COLS = 15;

function validate(defs) {
    const cellMap = {}, errors = [];
    defs.forEach((def, idx) => {
        const { w, r, c, d } = def;
        const endR = d === 'across' ? r : r + w.length - 1;
        const endC = d === 'across' ? c + w.length - 1 : c;
        if (r < 0 || c < 0 || endR >= ROWS || endC >= COLS)
            errors.push(`[OOB] "${w}" at (${r},${c}) ${d}`);
        for (let i = 0; i < w.length; i++) {
            const cr = d === 'across' ? r : r + i;
            const cc = d === 'across' ? c + i : c;
            const key = `${cr},${cc}`;
            const letter = w[i];
            if (cellMap[key]) {
                if (cellMap[key].letter !== letter)
                    errors.push(`[COLLISION] (${cr},${cc}): "${defs[cellMap[key].defIdx].w}"='${cellMap[key].letter}' vs "${w}"='${letter}'`);
            } else {
                cellMap[key] = { letter, defIdx: idx };
            }
        }
    });
    return { errors, cellMap };
}

function autoNumber(defs) {
    const startCells = {};
    defs.forEach((def, idx) => {
        const key = `${def.r},${def.c}`;
        if (!startCells[key]) startCells[key] = [];
        startCells[key].push(idx);
    });
    const sorted = Object.keys(startCells).sort((a, b) => {
        const [ar, ac] = a.split(',').map(Number);
        const [br, bc] = b.split(',').map(Number);
        return ar !== br ? ar - br : ac - bc;
    });
    let n = 1;
    const numberByCell = {}, numberByDef = new Array(defs.length).fill(null);
    sorted.forEach(key => {
        numberByCell[key] = n;
        startCells[key].forEach(idx => { numberByDef[idx] = n; });
        n++;
    });
    return { numberByCell, numberByDef };
}

const { errors, cellMap } = validate(WORD_DEFS);
const { numberByCell, numberByDef } = autoNumber(WORD_DEFS);

const solution = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
Object.entries(cellMap).forEach(([key, { letter }]) => {
    const [r, c] = key.split(',').map(Number);
    solution[r][c] = letter;
});

const valLogEl = document.getElementById('val-log');
if (errors.length) {
    valLogEl.style.display = 'block';
    valLogEl.textContent = '⚠ VALIDATION ERRORS:\n\n' + errors.join('\n');
}

const gridEl = document.getElementById('grid');
let activeDir = 'across', activeDefIdx = null;

for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        const isLit = solution[r][c] !== null;
        const cell  = document.createElement('div');
        cell.className = isLit ? 'cell' : 'cell black';
        cell.dataset.r = r; cell.dataset.c = c;

        if (isLit) {
            const key = `${r},${c}`;
            if (numberByCell[key] !== undefined) {
                const span = document.createElement('span');
                span.className = 'num';
                span.textContent = numberByCell[key];
                cell.appendChild(span);
            }
            const inp = document.createElement('input');
            inp.maxLength = 1; inp.dataset.r = r; inp.dataset.c = c;
            inp.autocomplete = 'off'; inp.spellcheck = false;

            inp.addEventListener('mousedown', e => {
                if (document.activeElement === inp) {
                    e.preventDefault();
                    const hasA = WORD_DEFS.some(w => w.d === 'across' && inWord(w, r, c));
                    const hasD = WORD_DEFS.some(w => w.d === 'down'   && inWord(w, r, c));
                    if (hasA && hasD) activeDir = activeDir === 'across' ? 'down' : 'across';
                    setHighlight(r, c);
                }
            });
            inp.addEventListener('focus', () => setHighlight(r, c));
            inp.addEventListener('blur', () => {
            });
            inp.addEventListener('keydown', e => {
                switch (e.key) {
                    case 'Backspace':   e.preventDefault(); inp.value ? (inp.value = '') : stepInWord(-1); break;
                    case 'ArrowRight':  e.preventDefault(); activeDir = 'across'; stepAbs(r, c + 1); break;
                    case 'ArrowLeft':   e.preventDefault(); activeDir = 'across'; stepAbs(r, c - 1); break;
                    case 'ArrowDown':   e.preventDefault(); activeDir = 'down';   stepAbs(r + 1, c); break;
                    case 'ArrowUp':     e.preventDefault(); activeDir = 'down';   stepAbs(r - 1, c); break;
                    case 'Tab':         e.preventDefault(); cycleWord(e.shiftKey ? -1 : 1); break;
                }
            });
            inp.addEventListener('input', e => {
                const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                e.target.value = v ? v[v.length - 1] : '';
                if (e.target.value) stepInWord(1);
            });
            cell.appendChild(inp);
        }
        gridEl.appendChild(cell);
    }
}

['across', 'down'].forEach(dir => {
    const listEl = document.getElementById(`${dir}-list`);
    WORD_DEFS
        .map((def, idx) => ({ def, idx, n: numberByDef[idx] }))
        .filter(({ def }) => def.d === dir)
        .sort((a, b) => a.n - b.n)
        .forEach(({ def, idx, n }) => {
            const item = document.createElement('div');
            item.className = 'clue-item'; item.id = `clue-${idx}`;
            item.innerHTML = `<span class="clue-n">${n}.</span>${def.clue}<span class="clue-len">(${def.w.length})</span>`;
            item.addEventListener('click', () => {
                activeDir = def.d; activeDefIdx = idx;
                document.querySelector(`input[data-r="${def.r}"][data-c="${def.c}"]`)?.focus();
            });
            listEl.appendChild(item);
        });
});

function inWord(def, r, c) {
    return def.d === 'across'
        ? (def.r === r && c >= def.c && c < def.c + def.w.length)
        : (def.c === c && r >= def.r && r < def.r + def.w.length);
}
function cellEl(r, c) {
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return null;
    return gridEl.children[r * COLS + c] ?? null;
}
function setHighlight(r, c) {
    let def = WORD_DEFS.find(w => w.d === activeDir && inWord(w, r, c));
    if (!def) {
        const other = activeDir === 'across' ? 'down' : 'across';
        def = WORD_DEFS.find(w => w.d === other && inWord(w, r, c));
        if (def) activeDir = other;
    }
    if (!def) return;
    activeDefIdx = WORD_DEFS.indexOf(def);
    document.querySelectorAll('.cell.word-hl, .cell.cell-hl').forEach(el => el.classList.remove('word-hl', 'cell-hl'));
    document.querySelectorAll('.clue-item.selected').forEach(el => el.classList.remove('selected'));
    for (let i = 0; i < def.w.length; i++) {
        const wr = def.d === 'across' ? def.r : def.r + i;
        const wc = def.d === 'across' ? def.c + i : def.c;
        cellEl(wr, wc)?.classList.add('word-hl');
    }
    cellEl(r, c)?.classList.add('cell-hl');
    const clueEl = document.getElementById(`clue-${activeDefIdx}`);
    if (clueEl) {
        clueEl.classList.add('selected');
        if (!('ontouchstart' in window)) {
            clueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
function stepInWord(step) {
    if (activeDefIdx === null) return;
    const def = WORD_DEFS[activeDefIdx];
    const cur = document.activeElement;
    if (!cur?.dataset?.r) return;
    const r = parseInt(cur.dataset.r), c = parseInt(cur.dataset.c);
    const nr = def.d === 'across' ? r : r + step;
    const nc = def.d === 'across' ? c + step : c;
    if (def.d === 'across' && (nc < def.c || nc >= def.c + def.w.length)) return;
    if (def.d === 'down'   && (nr < def.r || nr >= def.r + def.w.length)) return;
    stepAbs(nr, nc);
}
function stepAbs(r, c) {
    const el = document.querySelector(`input[data-r="${r}"][data-c="${c}"]`);
    if (el) el.focus({ preventScroll: true });
}
function cycleWord(dir) {
    const ordered = WORD_DEFS
        .map((def, idx) => ({ def, idx, n: numberByDef[idx] }))
        .sort((a, b) => a.n !== b.n ? a.n - b.n : (a.def.d === 'across' ? -1 : 1));
    const cur  = ordered.findIndex(({ idx }) => idx === activeDefIdx);
    const next = ordered[(cur + dir + ordered.length) % ordered.length];
    if (!next) return;
    activeDir = next.def.d; activeDefIdx = next.idx;
    document.querySelector(`input[data-r="${next.def.r}"][data-c="${next.def.c}"]`)?.focus();
}

function checkAnswers() {
    let correct = 0, filled = 0;
    const all = document.querySelectorAll('input');
    all.forEach(inp => {
        const r = parseInt(inp.dataset.r), c = parseInt(inp.dataset.c);
        const cell = inp.parentElement;
        cell.classList.remove('correct', 'incorrect');
        if (inp.value) {
            filled++;
            const ok = inp.value.toUpperCase() === solution[r][c];
            cell.classList.add(ok ? 'correct' : 'incorrect');
            if (ok) correct++;
        }
    });
    const total     = all.length;
    const statusEl  = document.getElementById('status');
    const successEl = document.getElementById('success');
    if (!filled) {
        statusEl.textContent = 'Fill in some cells first.'; statusEl.className = '';
        successEl.classList.add('hidden');
    } else if (correct === total) {
        statusEl.textContent = ''; statusEl.className = '';
        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        statusEl.textContent = `${correct}/${total} correct · ${filled} filled`;
        statusEl.className = correct === filled ? 'ok' : 'err';
        successEl.classList.add('hidden');
    }
}

function clearAll() {
    document.querySelectorAll('input').forEach(inp => {
        inp.value = '';
        inp.parentElement.classList.remove('correct', 'incorrect');
    });
    document.getElementById('status').textContent = '';
    document.getElementById('status').className = '';
    document.getElementById('success').classList.add('hidden');
}
