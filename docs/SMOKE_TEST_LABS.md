# Labs Smoke Test

## Scope
This checklist validates recent changes in:
- `js/labs-page.js`
- `js/labs.json`
- `js/unity.js`
- `py/bh_kinematic_engine.py`

## Quick CLI Checks
Run from repo root.

```powershell
python -c "import json; json.load(open('js/labs.json','r',encoding='utf-8')); print('labs.json ok')"
python -m py_compile py/bh_kinematic_engine.py
```

Expected:
- `labs.json ok`
- no Python compile error

## Local Serve Check
```powershell
python -m http.server 8000
```

Open:
- `http://127.0.0.1:8000/html/labs.html`

## Browser Smoke Flow
1. Open `labs.html`.
2. Confirm all main cards are visible.
3. Confirm `The Answer is 42` card is visible.
4. Confirm `The Answer is 42` button label is `Open Reference`.
5. Click `Open Reference` and verify it navigates to `theory.html#library`.
6. Open devtools console and confirm no runtime error from `labs-page.js`.

## Security/Hardening Spot Check
1. Verify cards render normally.
2. Confirm links work for normal entries.
3. Optional negative check: temporarily set one `lab` value in `js/labs.json` to `javascript:alert(1)`.
4. Reload `labs.html`.
5. Confirm that entry is not rendered (blocked by `safeHref`).
6. Revert test data change.

## BH Engine Plot Check
```powershell
python py/bh_kinematic_engine.py
```

Expected:
- script runs
- x-axis label is `Time [s]`
- reservoir (`M_ext`) does not go negative during stepping

