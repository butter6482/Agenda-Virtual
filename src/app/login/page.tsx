"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos.");
    } else {
      router.push("/bookings");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF9EC 0%, #F5EDD8 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">✂️</div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">HB Style</h1>
          <p className="text-sm text-[#B8860B]">Sistema de citas</p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-[#D4B870] bg-white shadow-xl">
          <div className="h-1 w-full bg-[#D4A017]" />
          <div className="p-6">
            <h2 className="mb-5 text-base font-bold text-[#1A1A1A]">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A01733]"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A01733]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#D4A017] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#B8860B] disabled:opacity-60 active:scale-[0.98]">
                {loading ? "Iniciando sesión…" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
