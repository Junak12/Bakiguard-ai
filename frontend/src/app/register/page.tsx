"use client";

import AuthShell from "@/components/auth/AuthShell";
import EmailPasswordForm from "@/components/auth/EmailPasswordForm";

export default function RegisterPage() {
  return (
    <AuthShell>
      <EmailPasswordForm mode="register" />
    </AuthShell>
  );
}
