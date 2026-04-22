"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect root priority route to urgent by default.
 */
export default function PriorityIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/priority/urgent");
  }, [router]);

  return null;
}
