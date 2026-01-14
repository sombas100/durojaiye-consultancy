import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export const dynamic = "force-dynamic";

export default function ExtraBillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-600">Processing payment…</div>
          </div>
        </main>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
