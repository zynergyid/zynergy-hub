import type { SessionUser } from "@/lib/session";
import { getRecordActivity } from "@/lib/activity";
import { getUserPhotos } from "@/lib/people";
import { Card } from "./Card";
import { ActivityRows } from "./ActivityRows";

/** "Riwayat" on a detail page: the last changes to this one record. */
export async function ActivityCard({ user, collection, docId }: { user: SessionUser; collection: string; docId: number }) {
  const [rows, photos] = await Promise.all([getRecordActivity(user, collection, docId), getUserPhotos()]);
  return (
    <Card title="Riwayat" action={{ label: "Semua aktivitas", href: `/activity?bagian=${collection}` }}>
      {rows.length === 0 ? <p className="text-sm text-muted">Belum ada perubahan tercatat.</p> : <ActivityRows rows={rows} photos={photos} showRecord={false} />}
    </Card>
  );
}
