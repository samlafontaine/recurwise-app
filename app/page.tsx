"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { categories, CategoryType } from "@/app/components/categories";

interface Subscription {
  id: string;
  title: string;
  category: CategoryType;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  notifyBeforeRenewal: boolean;
}

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Subscription, "id">>({
    title: "",
    category: "streaming",
    amount: 0,
    frequency: "monthly",
    notifyBeforeRenewal: false,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "streaming",
      amount: 0,
      frequency: "monthly",
      notifyBeforeRenewal: false,
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === editingId ? { ...formData, id: editingId } : sub,
        ),
      );
    } else {
      const newSubscription = {
        ...formData,
        id: crypto.randomUUID(),
      };
      setSubscriptions([...subscriptions, newSubscription]);
    }

    resetForm();
    setOpen(false);
  };

  const handleEdit = (subscription: Subscription) => {
    setFormData({
      title: subscription.title,
      category: subscription.category,
      amount: subscription.amount,
      frequency: subscription.frequency,
      notifyBeforeRenewal: subscription.notifyBeforeRenewal,
    });
    setEditingId(subscription.id);
    setOpen(true);
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subscription Tracker</h1>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>Add Subscription</Button>
            </DialogTrigger>
            <DialogContent className="max-w-full h-screen w-screen">
              <DialogHeader>
                <DialogTitle>
                  {editingId
                    ? `Edit ${formData.title || "Subscription"}`
                    : formData.title
                      ? `New Subscription: ${formData.title}`
                      : "Add New Subscription"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: CategoryType) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center gap-2">
                            {category.icon} {category.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        frequency: value as "weekly" | "monthly" | "yearly",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notify"
                    checked={formData.notifyBeforeRenewal}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifyBeforeRenewal: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="notify">Notify before renewal</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingId ? "Save Changes" : "Add Subscription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="border rounded p-4 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => handleEdit(sub)}
            >
              <h3 className="font-bold">{sub.title}</h3>
              <p className="text-sm text-gray-600">
                Category:{" "}
                {categories.find((c) => c.value === sub.category)?.icon}{" "}
                {categories.find((c) => c.value === sub.category)?.label}
              </p>
              <p className="text-sm text-gray-600">
                ${sub.amount} • {sub.frequency}
              </p>
              {sub.notifyBeforeRenewal && (
                <p className="text-sm text-blue-500">Notifications enabled</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
