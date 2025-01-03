"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CreditCard, LogOut, HelpCircle, MoreVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SubscriptionsListEmpty() {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
      // Continue with redirect even if signOut fails
    } finally {
      // Always redirect to auth page, regardless of whether signOut succeeds or fails
      window.location.href = "/auth";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] relative mx-auto w-full">
      <div className="absolute top-0 right-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="end">
            <div className="flex flex-col space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <a href="mailto:recurwise@gmail.com">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </a>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1 flex flex-col items-center gap-1">
        <CreditCard className="size-6 stroke-zinc-500" />
        <p className="text-zinc-900 text-lg font-medium dark:text-zinc-400">
          No subscriptions
        </p>
        <p className="text-zinc-500 text-sm">
          Get started by adding your first subscription.
        </p>
      </div>
    </div>
  );
}
