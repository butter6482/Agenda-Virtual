import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../server/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/bookings");
  redirect("/login");
}
