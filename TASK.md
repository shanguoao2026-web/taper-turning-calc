# taper-turning-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) for lathe taper turning: taper ratio, compound-slide (half) angle, and tailstock offset.

Inputs (mm / degrees): --large <D> large diameter (required), plus exactly ONE of: --small <d>, --ratio <k> (taper 1:k, i.e. diameter change of 1 per k length), --half-angle <deg>; --length <L> taper length (required); optional --work-length <Lw> total workpiece length between centres for tailstock offset; --decimals <n> 0..6 (default 3); --json; --help.
Formulas: C = (D-d)/L; ratio k = 1/C (print as "1:k"); half angle = atan((D-d)/(2L)) in degrees (compound slide setting); included angle = 2×half; from ratio: d = D - L/k; from half angle: d = D - 2·L·tan(half); tailstock offset = (D-d)·Lw/(2L) (only when --work-length given; Lw must be >= L).
- Validate finite numbers; D <= 0, L <= 0, d < 0 or d >= D, ratio <= 0, half-angle <= 0 or >= 45, none or more than one of small/ratio/half-angle, Lw < L, decimals out of range → error to stderr, exit 1.
- Readable text output by default, README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- package.json "bin" must point to the built CLI. npm test must build and pass. No secrets, no personal info.

Check values (must be in tests):
- D30 d20 L50 → C 0.2, ratio 1:5, half angle 5.7106°, included 11.4212° (4 dp in test); work-length 100 → offset 10.000.
- D20 ratio 20 L40 → d 18.000, half angle 1.4321°.
- D30 half-angle 5 L50 → d 21.251.
- d=D, small+ratio together, none of the three, half-angle 45, work-length 40 with L50 → exit 1.
