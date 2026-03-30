import * as React from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
import { Button } from "@/components/ui/button";

export function CreateAccountForm() {
  return (
    <div className="space-y-5">
      <AuthAlert
        title="Administrator setup required"
        message="Account creation is invitation-only right now. Ask your operations administrator to create your Supabase Auth account and company profile."
      />
      <Button className="w-full" disabled>
        Account Provisioning Disabled
      </Button>
      <AuthFormFooter
        prompt="Already have an account?"
        linkLabel="Sign in"
        to="/auth/sign-in"
      />
    </div>
  );
}
