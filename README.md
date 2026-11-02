# taper-turning-calc

A TypeScript CLI for lathe taper turning. Requires Node.js 18 or newer and has no runtime dependencies.

## Install and build

```sh
npm install
npm run build
node dist/cli.js --help
npm test
```

The package executable `taper-turning-calc` points to `dist/cli.js`. After building, `npm link` makes it available on your PATH.

## Examples

```sh
node dist/cli.js --large 30 --small 20 --length 50 --work-length 100
node dist/cli.js --large 20 --ratio 20 --length 40 --decimals 4
node dist/cli.js --large 30 --half-angle 5 --length 50 --json
```

The first example reports taper C = 0.200, ratio 1:5.000, compound-slide half angle 5.711°, included angle 11.421°, and tailstock offset 10.000 mm. The second gives a small diameter of 18.0000 mm and half angle of 1.4321°. The third gives a small diameter of 21.251 mm.

Provide `--large` and `--length` plus exactly one of `--small`, `--ratio`, or `--half-angle`. All lengths are in mm; angles are in degrees. Large diameter and taper length must be positive. Small diameter must be nonnegative and less than the large diameter, including when derived from ratio or angle. Ratio must be positive and half angle must be strictly between 0° and 45°. Optional `--work-length` is the length between centres and must be at least the taper length.

`--decimals` accepts an integer from 0 through 6 (default 3). Text output preserves trailing zeros. JSON contains numeric fields `large`, `small`, `length`, `taper`, `ratio`, `halfAngle`, and `includedAngle`, rounded to the selected precision. `ratio` is the numeric k in 1:k. When requested, JSON also includes `workLength` and `tailstockOffset`. JSON numbers do not preserve trailing zeros. All calculations use unrounded intermediate values.

Invalid, missing, duplicate, unknown, or nonfinite inputs produce an error on stderr and exit status 1. Successful calculations and `--help` exit with status 0.

## Formulas

For large diameter D, small diameter d, and taper length L:

- Taper C = (D − d) / L; ratio is 1:k, where k = 1 / C.
- Compound-slide half angle = atan((D − d) / (2L)), converted to degrees.
- Included angle = 2 × half angle.
- From ratio k: d = D − L / k.
- From half angle a: d = D − 2L × tan(a), converting degrees to radians first.
- Tailstock offset = (D − d) × Lw / (2L), where Lw is the work length between centres. It is only reported when `--work-length` is supplied.

Licensed under MIT.
