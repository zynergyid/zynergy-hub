import { revalidatePath } from "next/cache";

/**
 * revalidatePath throws outside a Next request context (payload CLI scripts,
 * seeds, migrations). There is no cache to refresh there, ignore it.
 */
export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Running outside Next, nothing to revalidate.
  }
}
