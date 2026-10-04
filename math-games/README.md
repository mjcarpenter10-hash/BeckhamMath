# Math Games

Math practice games for a 1st grader working toward 2nd grade math. Static site for GitHub Pages, installable to the iPhone home screen.

## Files
- `index.html` – game menu, plus a hold-to-open grown-ups screen (progress, skip levels, backup/restore)
- `blocks.html` + `js/blocks.js` – Block Builder
- `js/skills.js` – shared level plan and progress (every game reads and writes this)
- `js/common.js` – read-aloud, sound effects, offline setup
- `sw.js` – offline support. Add every new file to the `FILES` list.

## Deploy
1. Push this folder to a GitHub repo.
2. Settings → Pages → deploy from the `main` branch, root folder.
3. Open the Pages URL in Safari on the iPhone → Share → Add to Home Screen.

Always open it from the home screen icon: the installed app keeps its own saved progress, separate from Safari.

## Adding a game
1. Create `newgame.html` that loads `js/common.js` and `js/skills.js`.
2. List the levels it can teach and call `MG.pick(levels)` for each problem and `MG.record(level, firstTryCorrect)` after each answer.
3. Add a tile to `index.html` and the files to `FILES` in `sw.js`.

## Block Builder levels
1 Count (read the blocks), 3 Make 10, 7 Tens and ones, 8 Hundreds, 10 Two-digit adding, 11 Adding with trading.
A level is done at 18 of the last 20 first tries right; about 1 in 5 problems are review from finished levels.
