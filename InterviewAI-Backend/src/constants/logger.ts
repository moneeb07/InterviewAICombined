import chalk from 'chalk';
export const DEFAULT_LOG_LEVEL = 'info';
export const SERVER_ERROR_LOG_LEVEL = 'error';
export const CLIENT_ERROR_LOG_LEVEL = 'warn';
export const DEBUG_LOG_LEVEL = 'debug';
export const SUCCESS_LOG_LEVEL = 'log';
export const VERBOSE_LOG_LEVEL = 'verbose';
export const LEVEL_LABELS = {
    log: 'SUCCESS',
    error: 'ERROR',
    warn: 'WARNING',
    debug: 'INFO',
    verbose: 'VERBOSE',
  };

export const LEVEL_COLORS = {
    log: chalk.green,
    error: chalk.red,
    warn: chalk.yellow,
    debug: chalk.blue,
    verbose: chalk.cyan,
  };

export const BOX_WIDTH = 80;