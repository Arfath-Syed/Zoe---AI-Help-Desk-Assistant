
import React, { useEffect, useMemo, useState } from "react";
import { Bot, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";

function ChatHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    const saved = localStorage.getItem("userEmail");
    if (saved) setEmail(saved);
  }, []);


  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  async function handleStart(e) {
    e?.preventDefault?.();
    if (!isValidEmail || busy) return;

    setBusy(true);

    
    localStorage.setItem("userEmail", email.trim());

    navigate(`/chat?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <div className="min-h-screen w-full grid place-items-center px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Bot className="h-8 w-8" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Zoe</span>
          <span className="text-muted-foreground"> — AI Help Desk Assistant</span>
        </h1>

        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Start a conversation and I’ll help you report, track, and resolve issues. 
          I’ll also avoid duplicate tickets and keep your requests organized.
        </p>

        <form
          onSubmit={handleStart}
          className="mt-8 mx-auto grid gap-3 sm:grid-cols-[1fr_auto] items-center"
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="pl-9 rounded-2xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Your email"
            />
            {!isValidEmail && email.length > 0 && (
              <div className="mt-1 text-left text-xs text-destructive">
                Please enter a valid email.
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="rounded-2xl px-5"
            disabled={!isValidEmail || busy}
          >
            {busy ? "Starting..." : "Start Getting Help"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to follow our ticket workflow: 
          <span className="mx-1 font-medium">OPEN → IN_PROGRESS → RESOLVED → CLOSED</span>.
        </div>
      </div>
    </div>
  );
}

export default ChatHome;
