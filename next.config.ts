import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Server actions carry file uploads (receipts, PO PDFs, vault documents).
  // Next defaults to 1 MB; Vercel functions cap request bodies at 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default withPayload(nextConfig);
