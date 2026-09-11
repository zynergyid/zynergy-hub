import * as migration_20260911_061942_initial from './20260911_061942_initial';
import * as migration_20260911_075750_add_unit from './20260911_075750_add_unit';
import * as migration_20260911_100514_roles_units from './20260911_100514_roles_units';
import * as migration_20260911_124322_supply_orders from './20260911_124322_supply_orders';
import * as migration_20260911_125832_rename_unit_products_to_apps from './20260911_125832_rename_unit_products_to_apps';
import * as migration_20260911_131101_funding_categories from './20260911_131101_funding_categories';
import * as migration_20260911_132812_staff_role_documents from './20260911_132812_staff_role_documents';

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
    name: '20260911_100514_roles_units',
  },
  {
    up: migration_20260911_124322_supply_orders.up,
    down: migration_20260911_124322_supply_orders.down,
    name: '20260911_124322_supply_orders',
  },
  {
    up: migration_20260911_125832_rename_unit_products_to_apps.up,
    down: migration_20260911_125832_rename_unit_products_to_apps.down,
    name: '20260911_125832_rename_unit_products_to_apps',
  },
  {
    up: migration_20260911_131101_funding_categories.up,
    down: migration_20260911_131101_funding_categories.down,
    name: '20260911_131101_funding_categories',
  },
  {
    up: migration_20260911_132812_staff_role_documents.up,
    down: migration_20260911_132812_staff_role_documents.down,
    name: '20260911_132812_staff_role_documents'
  },
];
