import * as migration_20260911_061942_initial from './20260911_061942_initial';
import * as migration_20260911_075750_add_unit from './20260911_075750_add_unit';
import * as migration_20260911_100514_roles_units from './20260911_100514_roles_units';

export const migrations = [
  {
    up: migration_20260911_061942_initial.up,
    down: migration_20260911_061942_initial.down,
    name: '20260911_061942_initial',
  },
  {
    up: migration_20260911_075750_add_unit.up,
    down: migration_20260911_075750_add_unit.down,
    name: '20260911_075750_add_unit',
  },
  {
    up: migration_20260911_100514_roles_units.up,
    down: migration_20260911_100514_roles_units.down,
    name: '20260911_100514_roles_units'
  },
];
