import * as migration_20260911_061942_initial from './20260911_061942_initial';
import * as migration_20260911_075750_add_unit from './20260911_075750_add_unit';
import * as migration_20260911_100514_roles_units from './20260911_100514_roles_units';
import * as migration_20260911_124322_supply_orders from './20260911_124322_supply_orders';
import * as migration_20260911_125832_rename_unit_products_to_apps from './20260911_125832_rename_unit_products_to_apps';
import * as migration_20260911_131101_funding_categories from './20260911_131101_funding_categories';
import * as migration_20260911_132812_staff_role_documents from './20260911_132812_staff_role_documents';
import * as migration_20260911_152205_order_buyer from './20260911_152205_order_buyer';
import * as migration_20260911_153950_ai_usage from './20260911_153950_ai_usage';
import * as migration_20260917_162501_outreach_prospects_api_keys from './20260917_162501_outreach_prospects_api_keys';
import * as migration_20260917_163932_prospect_history from './20260917_163932_prospect_history';
import * as migration_20260917_171115_vault from './20260917_171115_vault';
import * as migration_20260917_173829_vault_thumbnail from './20260917_173829_vault_thumbnail';
import * as migration_20260918_184010_projects from './20260918_184010_projects';
import * as migration_20260918_191416_project_brief from './20260918_191416_project_brief';

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
    name: '20260911_132812_staff_role_documents',
  },
  {
    up: migration_20260911_152205_order_buyer.up,
    down: migration_20260911_152205_order_buyer.down,
    name: '20260911_152205_order_buyer',
  },
  {
    up: migration_20260911_153950_ai_usage.up,
    down: migration_20260911_153950_ai_usage.down,
    name: '20260911_153950_ai_usage',
  },
  {
    up: migration_20260917_162501_outreach_prospects_api_keys.up,
    down: migration_20260917_162501_outreach_prospects_api_keys.down,
    name: '20260917_162501_outreach_prospects_api_keys',
  },
  {
    up: migration_20260917_163932_prospect_history.up,
    down: migration_20260917_163932_prospect_history.down,
    name: '20260917_163932_prospect_history',
  },
  {
    up: migration_20260917_171115_vault.up,
    down: migration_20260917_171115_vault.down,
    name: '20260917_171115_vault',
  },
  {
    up: migration_20260917_173829_vault_thumbnail.up,
    down: migration_20260917_173829_vault_thumbnail.down,
    name: '20260917_173829_vault_thumbnail',
  },
  {
    up: migration_20260918_184010_projects.up,
    down: migration_20260918_184010_projects.down,
    name: '20260918_184010_projects',
  },
  {
    up: migration_20260918_191416_project_brief.up,
    down: migration_20260918_191416_project_brief.down,
    name: '20260918_191416_project_brief'
  },
];
