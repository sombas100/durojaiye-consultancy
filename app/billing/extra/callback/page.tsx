"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ExtraPaymentCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // Give webhook a moment to run, then redirect
    const t = setTimeout(() => {
      router.replace("/my-appointments"); // or wherever you list appointments
    }, 2500);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-lg font-semibold">Processing payment…</h1>
        <p className="text-sm text-gray-600">
          Please wait while we confirm your extra time.
        </p>
      </div>
    </div>
  );
}
