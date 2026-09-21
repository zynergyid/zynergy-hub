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
import * as migration_20260919_084628_project_document_presentasi from './20260919_084628_project_document_presentasi';
import * as migration_20260919_093512_project_brief_references from './20260919_093512_project_brief_references';
import * as migration_20260919_120410_project_log_pertemuan from './20260919_120410_project_log_pertemuan';
import * as migration_20260919_183753_seo_audits from './20260919_183753_seo_audits';
import * as migration_20260920_132345_client_kind from './20260920_132345_client_kind';
import * as migration_20260920_141530_events from './20260920_141530_events';
import * as migration_20260920_142918_content_posts_and_calendar_token from './20260920_142918_content_posts_and_calendar_token';
import * as migration_20260920_160217_roles_and_permissions from './20260920_160217_roles_and_permissions';
import * as migration_20260920_161619_job_titles_english from './20260920_161619_job_titles_english';
import * as migration_20260920_163027_roles_are_jobs from './20260920_163027_roles_are_jobs';
import * as migration_20260920_173034_event_photos from './20260920_173034_event_photos';
import * as migration_20260921_025352_accounts from './20260921_025352_accounts';
import * as migration_20260921_030958_content_platforms from './20260921_030958_content_platforms';
import * as migration_20260921_092905_activity_and_presence from './20260921_092905_activity_and_presence';
import * as migration_20260921_094559_user_profile from './20260921_094559_user_profile';
import * as migration_20260921_100235_event_kind_fokus from './20260921_100235_event_kind_fokus';
import * as migration_20260921_101122_perintis from './20260921_101122_perintis';
import * as migration_20260921_102953_event_kind_mentoring from './20260921_102953_event_kind_mentoring';
import * as migration_20260921_111635_prospect_kind from './20260921_111635_prospect_kind';
import * as migration_20260921_113339_accounts_password from './20260921_113339_accounts_password';
import * as migration_20260921_134118_prospect_sector_and_links from './20260921_134118_prospect_sector_and_links';
import * as migration_20260921_140250_prospect_source_kenalan from './20260921_140250_prospect_source_kenalan';
import * as migration_20260921_141031_account_holders_and_login from './20260921_141031_account_holders_and_login';

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
    name: '20260918_191416_project_brief',
  },
  {
    up: migration_20260919_084628_project_document_presentasi.up,
    down: migration_20260919_084628_project_document_presentasi.down,
    name: '20260919_084628_project_document_presentasi',
  },
  {
    up: migration_20260919_093512_project_brief_references.up,
    down: migration_20260919_093512_project_brief_references.down,
    name: '20260919_093512_project_brief_references',
  },
  {
    up: migration_20260919_120410_project_log_pertemuan.up,
    down: migration_20260919_120410_project_log_pertemuan.down,
    name: '20260919_120410_project_log_pertemuan',
  },
  {
    up: migration_20260919_183753_seo_audits.up,
    down: migration_20260919_183753_seo_audits.down,
    name: '20260919_183753_seo_audits',
  },
  {
    up: migration_20260920_132345_client_kind.up,
    down: migration_20260920_132345_client_kind.down,
    name: '20260920_132345_client_kind',
  },
  {
    up: migration_20260920_141530_events.up,
    down: migration_20260920_141530_events.down,
    name: '20260920_141530_events',
  },
  {
    up: migration_20260920_142918_content_posts_and_calendar_token.up,
    down: migration_20260920_142918_content_posts_and_calendar_token.down,
    name: '20260920_142918_content_posts_and_calendar_token',
  },
  {
    up: migration_20260920_160217_roles_and_permissions.up,
    down: migration_20260920_160217_roles_and_permissions.down,
    name: '20260920_160217_roles_and_permissions',
  },
  {
    up: migration_20260920_161619_job_titles_english.up,
    down: migration_20260920_161619_job_titles_english.down,
    name: '20260920_161619_job_titles_english',
  },
  {
    up: migration_20260920_163027_roles_are_jobs.up,
    down: migration_20260920_163027_roles_are_jobs.down,
    name: '20260920_163027_roles_are_jobs',
  },
  {
    up: migration_20260920_173034_event_photos.up,
    down: migration_20260920_173034_event_photos.down,
    name: '20260920_173034_event_photos',
  },
  {
    up: migration_20260921_025352_accounts.up,
    down: migration_20260921_025352_accounts.down,
    name: '20260921_025352_accounts',
  },
  {
    up: migration_20260921_030958_content_platforms.up,
    down: migration_20260921_030958_content_platforms.down,
    name: '20260921_030958_content_platforms',
  },
  {
    up: migration_20260921_092905_activity_and_presence.up,
    down: migration_20260921_092905_activity_and_presence.down,
    name: '20260921_092905_activity_and_presence',
  },
  {
    up: migration_20260921_094559_user_profile.up,
    down: migration_20260921_094559_user_profile.down,
    name: '20260921_094559_user_profile',
  },
  {
    up: migration_20260921_100235_event_kind_fokus.up,
    down: migration_20260921_100235_event_kind_fokus.down,
    name: '20260921_100235_event_kind_fokus',
  },
  {
    up: migration_20260921_101122_perintis.up,
    down: migration_20260921_101122_perintis.down,
    name: '20260921_101122_perintis',
  },
  {
    up: migration_20260921_102953_event_kind_mentoring.up,
    down: migration_20260921_102953_event_kind_mentoring.down,
    name: '20260921_102953_event_kind_mentoring',
  },
  {
    up: migration_20260921_111635_prospect_kind.up,
    down: migration_20260921_111635_prospect_kind.down,
    name: '20260921_111635_prospect_kind',
  },
  {
    up: migration_20260921_113339_accounts_password.up,
    down: migration_20260921_113339_accounts_password.down,
    name: '20260921_113339_accounts_password',
  },
  {
    up: migration_20260921_134118_prospect_sector_and_links.up,
    down: migration_20260921_134118_prospect_sector_and_links.down,
    name: '20260921_134118_prospect_sector_and_links',
  },
  {
    up: migration_20260921_140250_prospect_source_kenalan.up,
    down: migration_20260921_140250_prospect_source_kenalan.down,
    name: '20260921_140250_prospect_source_kenalan',
  },
  {
    up: migration_20260921_141031_account_holders_and_login.up,
    down: migration_20260921_141031_account_holders_and_login.down,
    name: '20260921_141031_account_holders_and_login'
  },
];
