import {createFileRoute, useNavigate} from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import {z} from "zod";

const loginSearchSchema = z.object({
  mode: z
      .enum(["sign-in", "sign-up"])
      .default("sign-in")
      .catch("sign-in")
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate({ from: "/login" });
  const setMode = (nextMode: "sign-in" | "sign-up") => {
    void navigate({
      search: (previous) => ({
        ...previous,
        mode: nextMode,
      }),
      replace: true,
    })
  }

  return mode === "sign-in" ? (
    <SignInForm onSwitchToSignUp={() => setMode("sign-up")} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setMode("sign-in")} />
  );
}
