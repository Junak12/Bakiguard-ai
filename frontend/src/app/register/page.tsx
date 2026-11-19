import { redirect } from "next/navigation";

/** Sign-up now happens through phone login: a new number creates an account. */
export default function RegisterPage() {
  redirect("/login");
}
