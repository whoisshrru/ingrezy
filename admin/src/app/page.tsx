"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && user.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5] text-[#504932] text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#B34E22] border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-[#504932]">Routing to Ingrezy Admin...</p>
      </div>
    </div>
  );
}
