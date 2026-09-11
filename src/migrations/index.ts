import * as migration_20260911_061942_initial from './20260911_061942_initial';

export const migrations = [
  {
    up: migration_20260911_061942_initial.up,
    down: migration_20260911_061942_initial.down,
    name: '20260911_061942_initial'
  },
];
