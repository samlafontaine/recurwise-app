"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SubscriptionsListEmpty() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center place-content-center">
      <div className="space-y-1 flex flex-col items-center gap-1">
        <CreditCard className="size-6 stroke-zinc-500" />
        <p className="text-zinc-900 text-lg font-medium dark:text-zinc-400">
          No subscriptions
        </p>
        <p className="text-zinc-500 text-sm">
          Get started by adding your first subscription.
        </p>
      </div>

      <div className="m-6"></div>
      <Button
        className="h-8 w-min-1/2"
        onClick={() => {
          router.push("/actions/new-subscription");
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a subscription
      </Button>
    </div>
  );
}
