"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldHint,
  Input,
  Label,
} from "@/components/ui/field";
import {
  signInAdmin,
  type LoginActionState,
} from "@/server/actions/admin-auth";

const initialState: LoginActionState = {
  message: "",
  status: "idle",
};

export function LoginForm({ next }: { next: string }) {
  const [state, action, isPending] = useActionState(signInAdmin, initialState);

  return (
    <form action={action} className="grid min-w-0 gap-5">
      <input name="next" type="hidden" value={next} />
      <Field>
        <Label htmlFor="admin-username">Usuario</Label>
        <Input
          autoComplete="username"
          id="admin-username"
          name="username"
          placeholder="AdminTitans"
          spellCheck={false}
          type="text"
        />
        <FieldHint>Use o usuario administrativo da TITANS.</FieldHint>
      </Field>
      <Field>
        <Label htmlFor="admin-password">Senha</Label>
        <Input
          autoComplete="current-password"
          id="admin-password"
          name="password"
          placeholder="Senha administrativa"
          type="password"
        />
        {state.status === "error" ? (
          <FieldError>{state.message}</FieldError>
        ) : null}
      </Field>
      <Button
        isLoading={isPending}
        leadingIcon={<LogIn aria-hidden="true" className="size-4" />}
        type="submit"
      >
        Entrar
      </Button>
    </form>
  );
}
