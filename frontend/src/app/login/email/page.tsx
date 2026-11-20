import { redirect } from "next/navigation";

/** Email login is now the main login page. */
export default function EmailLoginPage() {
  redirect("/login");
}
