import type { Order } from "@/payload-types";
import { orderStatuses } from "@/lib/options";
import { Card } from "@/components/hub/Card";
import { Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { updateOrderStatus } from "./actions";

/** For members: the only PO fields they change are the status and the team notes. */
export function StatusCard({ order }: { order: Order }) {
  return (
    <Card title="Ubah status">
      <form action={updateOrderStatus} className="space-y-3">
        <input type="hidden" name="orderId" value={order.id} />
        <div>
          <Label htmlFor="sc-status">Status</Label>
          <Select id="sc-status" name="status" defaultValue={order.status} options={orderStatuses} />
        </div>
        <div>
          <Label htmlFor="sc-notes">Catatan</Label>
          <textarea id="sc-notes" name="notes" rows={2} defaultValue={order.notes ?? ""} className={fieldClass} placeholder="Catatan untuk tim" />
        </div>
        <button type="submit" className={buttonPrimary}>Simpan</button>
      </form>
    </Card>
  );
}
