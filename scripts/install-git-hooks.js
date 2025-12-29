'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const hooksPath = path.join('.', '.githooks');
execFileSync('git', ['config', 'core.hooksPath', hooksPath], { stdio: 'inherit' });
