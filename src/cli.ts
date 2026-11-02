#!/usr/bin/env node

const help = `Usage: taper-turning-calc --large <D> --length <L> <taper input> [options]

Calculate lathe taper geometry. All lengths are in mm and angles in degrees.

Required:
  --large <D>          Large diameter (> 0)
  --length <L>         Taper length (> 0)
  Exactly one taper input:
    --small <d>        Small diameter (0 <= d < D)
    --ratio <k>        Taper 1:k (k > 0)
    --half-angle <deg> Compound-slide angle (0 < angle < 45)

Options:
  --work-length <Lw>   Length between centres (>= taper length)
  --decimals <n>       Display precision, integer 0..6 (default 3)
  --json               Output JSON with numeric values rounded to precision
  --help               Show this help
`;

const numericOptions = new Set([
  '--large', '--small', '--ratio', '--half-angle', '--length',
  '--work-length', '--decimals',
]);

function main(args: string[]): void {
  const values = new Map<string, number>();
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (values.has(arg) || flags.has(arg)) throw new Error(`Duplicate option: ${arg}`);
    if (arg === '--help' || arg === '--json') {
      flags.add(arg);
    } else if (numericOptions.has(arg)) {
      const raw = args[++i];
      if (raw === undefined || raw.trim() === '' || raw.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${arg} must be a finite number`);
      values.set(arg, value);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (flags.has('--help')) {
    process.stdout.write(help);
    return;
  }
  const large = values.get('--large');
  const length = values.get('--length');
  if (large === undefined || large <= 0) throw new Error('--large is required and must be > 0');
  if (length === undefined || length <= 0) throw new Error('--length is required and must be > 0');
  if (['--small', '--ratio', '--half-angle'].filter(key => values.has(key)).length !== 1) {
    throw new Error('Provide exactly one of --small, --ratio, or --half-angle');
  }
  const decimals = values.get('--decimals') ?? 3;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new Error('--decimals must be an integer from 0 to 6');
  }
  const workLength = values.get('--work-length');
  if (workLength !== undefined && workLength < length) {
    throw new Error('--work-length must be >= --length');
  }
  let small = values.get('--small');
  const ratioInput = values.get('--ratio');
  const angleInput = values.get('--half-angle');
  if (ratioInput !== undefined) {
    if (ratioInput <= 0) throw new Error('--ratio must be > 0');
    small = large - length / ratioInput;
  }
  if (angleInput !== undefined) {
    if (angleInput <= 0 || angleInput >= 45) throw new Error('--half-angle must be > 0 and < 45');
    small = large - 2 * length * Math.tan(angleInput * Math.PI / 180);
  }
  if (small === undefined || !Number.isFinite(small) || small < 0 || small >= large) {
    throw new Error('Small diameter must be >= 0 and < large diameter');
  }
  const taper = (large - small) / length;
  const ratio = 1 / taper;
  const halfAngle = Math.atan(taper / 2) * 180 / Math.PI;
  const includedAngle = 2 * halfAngle;
  const tailstockOffset = workLength === undefined ? undefined : taper * (workLength / 2);
  const result = { large, small, length, taper, ratio, halfAngle, includedAngle,
    ...(workLength === undefined ? {} : { workLength, tailstockOffset }) };
  if (Object.values(result).some(value => value === undefined || !Number.isFinite(value))) {
    throw new Error('Inputs exceed the supported numeric range');
  }
  const format = (value: number) => value.toFixed(decimals);
  if (flags.has('--json')) {
    const rounded = Object.fromEntries(Object.entries(result).map(([key, value]) =>
      [key, Number(format(value!))]));
    process.stdout.write(JSON.stringify(rounded, null, 2) + '\n');
  } else {
    const lines = [
      `Large diameter: ${format(large)} mm`,
      `Small diameter: ${format(small)} mm`,
      `Taper length: ${format(length)} mm`,
      `Taper (C): ${format(taper)}`,
      `Taper ratio: 1:${format(ratio)}`,
      `Compound-slide half angle: ${format(halfAngle)}°`,
      `Included angle: ${format(includedAngle)}°`,
    ];
    if (workLength !== undefined && tailstockOffset !== undefined) {
      lines.push(`Work length between centres: ${format(workLength)} mm`,
        `Tailstock offset: ${format(tailstockOffset)} mm`);
    }
    process.stdout.write(lines.join('\n') + '\n');
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
