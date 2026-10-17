"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldAlert, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter both identifier (email or phone) and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5] p-4 relative overflow-hidden">
      {/* Background warm glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EBD3AA]/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#B34E22]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#E8E2D5] rounded-3xl p-8 shadow-xl relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B34E22] to-[#EBD3AA] flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-[#B34E22]/25 mb-4">
            IN
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#504932]">Ingrezy Admin</h1>
          <p className="text-xs font-medium text-[#7A7056] mt-1">
            Sign in to access platform management & operations
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#504932] uppercase tracking-wider mb-1.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7056]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@ingrezy.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6ED] border border-[#E8E2D5] rounded-xl text-sm text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] focus:ring-2 focus:ring-[#B34E22]/15 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#504932] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7056]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6ED] border border-[#E8E2D5] rounded-xl text-sm text-[#504932] placeholder-[#9C937E] focus:outline-none focus:border-[#B34E22] focus:ring-2 focus:ring-[#B34E22]/15 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#B34E22] hover:bg-[#96401B] active:bg-[#7D3414] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#B34E22]/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fast-Fill Button */}
        <button
          type="button"
          onClick={() => {
            setIdentifier("admin@ingrezy.com");
            setPassword("Password@123");
            setErrorMessage(null);
          }}
          className="w-full mt-6 p-3 bg-[#FAF6ED] hover:bg-[#F5EFE3] border border-[#E8E2D5] rounded-xl text-center cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#504932] group-hover:text-[#B34E22]">
            <span>⚡ 1-Tap Fill Admin Credentials</span>
          </div>
          <p className="text-[11px] text-[#7A7056] mt-0.5 font-mono">admin@ingrezy.com / Password@123</p>
        </button>

        <div className="mt-6 pt-4 border-t border-[#E8E2D5] text-center">
          <p className="text-[11px] text-[#7A7056]">
            Protected endpoint. Non-admin logins are strictly rejected by the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
