"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldHint,
  Input,
  Label,
} from "@/components/ui/field";
import {
  sendAdminMagicLink,
  type LoginActionState,
} from "@/server/actions/admin-auth";

const initialState: LoginActionState = {
  status: "idle",
  message: "",
};

export function LoginForm({ next }: { next: string }) {
  const [state, action, isPending] = useActionState(
    sendAdminMagicLink,
    initialState,
  );

  return (
    <form action={action} className="grid gap-5">
      <input name="next" type="hidden" value={next} />
      <Field>
        <Label htmlFor="admin-email">E-mail autorizado</Label>
        <Input
          autoComplete="email"
          id="admin-email"
          inputMode="email"
          name="email"
          placeholder="editor@titans.com.br…"
          spellCheck={false}
          type="email"
        />
        <FieldHint>
          Use o e-mail cadastrado na allowlist administrativa.
        </FieldHint>
        {state.status === "error" ? (
          <FieldError>{state.message}</FieldError>
        ) : null}
      </Field>
      <Button
        isLoading={isPending}
        leadingIcon={<Mail aria-hidden="true" className="size-4" />}
        type="submit"
      >
        Enviar Magic Link
      </Button>
      {state.status === "sent" ? (
        <p aria-live="polite" className="text-sm leading-6 text-success">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
