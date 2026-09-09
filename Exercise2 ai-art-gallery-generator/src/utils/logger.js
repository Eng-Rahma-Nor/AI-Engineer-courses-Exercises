const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function tag(label, color) {
  return `${color}${colors.bold}[${label}]${colors.reset}`;
}

export const log = {
  info: (msg) => console.log(`${tag('info', colors.cyan)} ${msg}`),
  step: (msg) => console.log(`\n${tag('step', colors.magenta)} ${colors.bold}${msg}${colors.reset}`),
  success: (msg) => console.log(`${tag('ok', colors.green)} ${msg}`),
  warn: (msg) => console.log(`${tag('warn', colors.yellow)} ${msg}`),
  error: (msg) => console.log(`${tag('error', colors.red)} ${msg}`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`),
};
