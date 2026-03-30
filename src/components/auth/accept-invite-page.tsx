import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvitationServerFn } from "@/server/company/accept-invitation";

export function PendingInviteNotice({
  token,
  email,
}: {
  token: string;
  email?: string;
}) {
  return (
    <AuthAlert
      title="Sign in required"
      message={`This invitation is for ${email ?? "the invited email"}. Sign in or create an account with that address, then return to accept it.`}
    />
  );
}

export function InviteAcceptanceCard({
  token,
  companyName,
  role,
  email,
}: {
  token: string;
  companyName: string;
  role: string;
  email: string;
}) {
  const navigate = useNavigate();

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Join {companyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This invitation is for <span className="font-medium text-foreground">{email}</span> as{" "}
          <span className="font-medium text-foreground">{role.replaceAll("_", " ")}</span>.
        </p>
        <div className="grid gap-2">
          <Button
            onClick={async () => {
              const result = await acceptInvitationServerFn({
                data: { token },
              });

              if (!result.ok) {
                toast.error(result.formError ?? "Unable to accept invitation.");
                return;
              }

              toast.success(result.message ?? "Invitation accepted.");
              await navigate({ to: result.data.redirectTo });
            }}
          >
            Accept Invitation
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth/sign-in">Sign In With Another Account</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AcceptInvitePage({
  token,
  status,
  currentUserEmail,
}: {
  token: string;
  status: {
    valid: boolean;
    message: string;
    companyName?: string;
    role?: string;
    email?: string;
  };
  currentUserEmail?: string | null;
}) {
  if (!status.valid) {
    return <AuthAlert title="Invitation unavailable" message={status.message} />;
  }

  if (!currentUserEmail) {
    return (
      <div className="space-y-4">
        <PendingInviteNotice token={token} email={status.email} />
        <div className="grid gap-2">
          <Button asChild>
            <Link to="/auth/sign-in">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth/create-account" search={{ token }}>
              Create Account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InviteAcceptanceCard
      token={token}
      companyName={status.companyName ?? "Company"}
      role={status.role ?? "viewer"}
      email={status.email ?? currentUserEmail}
    />
  );
}
