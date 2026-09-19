/**
 * Copies the Claude Code skills that ship with this repo (.claude/skills/*)
 * into ~/.claude/skills so they work from any folder, not only inside this
 * repo. Run again after pulling: `pnpm skills:install`. The repo copy is the
 * source of truth; edit it there and re-run.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const source = join(process.cwd(), ".claude", "skills");
const target = join(homedir(), ".claude", "skills");
if (!existsSync(source)) {
  console.error("Tidak ada folder .claude/skills di repo ini.");
  process.exit(1);
}
mkdirSync(target, { recursive: true });
const names = readdirSync(source, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const name of names) {
  cpSync(join(source, name), join(target, name), { recursive: true, force: true });
  console.log(`Skill /${name} dipasang ke ${join(target, name)}`);
}
console.log("Buka sesi Claude Code baru supaya skill terbaca.");
