import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../server/auth";
import { BookingContainer } from "../../components/BookingContainer";

export const metadata = { title: "Citas — HB Style" };

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FFF9EC 0%, #F5EDD8 100%)" }}>
      {/* Top bar */}
      <header
        className="border-b px-5 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #FFF9EC 0%, #F5EDD8 100%)", borderColor: "#D4B870" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">✂️</span>
          <span className="text-base font-black text-[#1A1A1A]">HB Style</span>
        </div>
        <a
          href="/api/auth/signout"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#B8860B] hover:bg-[#D4A01722]">
          Salir
        </a>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <BookingContainer />
      </main>
    </div>
  );
}
