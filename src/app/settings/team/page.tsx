"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employees");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}
