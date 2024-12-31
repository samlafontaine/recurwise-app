"use client";
import { useState, useEffect } from "react";
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
import { Filter } from "lucide-react";
import { PlusIcon } from "lucide-react";
import { addWeeks, addMonths, addYears, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubscriptionCard } from "@/app/components/subscription-card";
import { useRouter } from "next/navigation";
import SubscriptionsListEmpty from "@/app/components/subscription-list-empty";
import { MoreVertical } from "lucide-react";
import { LayoutGrid } from "lucide-react";
import { LogOut } from "lucide-react";

interface Subscription {
  id: string;
  title: string;
  category: CategoryType;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  notifyBeforeRenewal: boolean;
  startDate: Date;
}

interface FormData extends Omit<Subscription, "id"> {
  title: string;
  category: CategoryType;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  notifyBeforeRenewal: boolean;
  startDate: Date;
}

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "streaming",
    amount: 0,
    frequency: "monthly",
    notifyBeforeRenewal: false,
    startDate: new Date(),
  });
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);
  const [showCategoryGrouping, setShowCategoryGrouping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const subscriptionsWithDates = data.map((sub) => ({
        ...sub,
        startDate: new Date(sub.start_date),
        notifyBeforeRenewal: sub.notify_before_renewal,
      }));

      const getNextRenewalDate = (startDate: Date, frequency: string) => {
        let nextDate = new Date(startDate);
        const today = new Date();

        while (nextDate <= today) {
          switch (frequency) {
            case "weekly":
              nextDate = addWeeks(nextDate, 1);
              break;
            case "monthly":
              nextDate = addMonths(nextDate, 1);
              break;
            case "yearly":
              nextDate = addYears(nextDate, 1);
              break;
          }
        }
        return nextDate;
      };

      subscriptionsWithDates.sort((a, b) => {
        const nextRenewalA = getNextRenewalDate(a.startDate, a.frequency);
        const nextRenewalB = getNextRenewalDate(b.startDate, b.frequency);
        return nextRenewalA.getTime() - nextRenewalB.getTime();
      });

      setSubscriptions(subscriptionsWithDates);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "streaming",
      amount: 0,
      frequency: "monthly",
      notifyBeforeRenewal: false,
      startDate: new Date(),
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            title: formData.title,
            category: formData.category,
            amount: formData.amount,
            frequency: formData.frequency,
            notify_before_renewal: formData.notifyBeforeRenewal,
            start_date: formData.startDate.toISOString(),
            user_id: session.user.id,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert([
          {
            id: crypto.randomUUID(),
            title: formData.title,
            category: formData.category,
            amount: formData.amount,
            frequency: formData.frequency,
            notify_before_renewal: formData.notifyBeforeRenewal,
            start_date: formData.startDate.toISOString(),
            user_id: session.user.id,
          },
        ]);

        if (error) throw error;
      }

      await loadSubscriptions();
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadSubscriptions();
      setOpen(false);
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setFormData({
      title: subscription.title,
      category: subscription.category,
      amount: subscription.amount,
      frequency: subscription.frequency,
      notifyBeforeRenewal: subscription.notifyBeforeRenewal,
      startDate: subscription.startDate,
    });
    setEditingId(subscription.id);
    setOpen(true);
  };

  const calculateMonthlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      switch (sub.frequency) {
        case "weekly":
          monthlyAmount = (sub.amount * 52) / 12; // weekly to monthly
          break;
        case "yearly":
          monthlyAmount = sub.amount / 12; // yearly to monthly
          break;
        // monthly stays as is
      }
      return total + monthlyAmount;
    }, 0);
  };

  const calculateCategoryTotal = (category: string) => {
    return subscriptions
      .filter((sub) => sub.category === category)
      .reduce((total, sub) => {
        let monthlyAmount = sub.amount;
        switch (sub.frequency) {
          case "weekly":
            monthlyAmount = (sub.amount * 52) / 12;
            break;
          case "yearly":
            monthlyAmount = sub.amount / 12;
            break;
        }
        return total + monthlyAmount;
      }, 0);
  };

  const getActiveCategories = () => {
    return Array.from(new Set(subscriptions.map((sub) => sub.category)));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      router.push("/auth");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mb-20">
        <main className="max-w-2xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Recurwise</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="end">
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowCategoriesDialog(true);
                      const popoverTrigger = document.querySelector(
                        '[data-state="open"]',
                      );
                      if (popoverTrigger) {
                        (popoverTrigger as HTMLButtonElement).click();
                      }
                    }}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Categories
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

          {subscriptions.length > 0 ? (
            <>
              <div className="flex flex-row justify-between items-end mb-4">
                <div className="flex flex-row gap-1 items-end">
                  <p className="text-2xl font-bold">
                    ${calculateMonthlyTotal().toFixed(0)}
                  </p>
                  <p className="text-xs mb-1">per month</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCategoryGrouping(!showCategoryGrouping)}
                  className={showCategoryGrouping ? "bg-secondary" : ""}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-6">
                {showCategoryGrouping ? (
                  getActiveCategories().map((category) => (
                    <div key={category} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold capitalize">
                          {category}
                        </h2>
                        <div className="flex items-center">
                          <p className="text-sm font-semibold">
                            ${calculateCategoryTotal(category).toFixed(0)}
                          </p>
                          <p className="text-sm text-muted-foreground">/mo</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {subscriptions
                          .filter((sub) => sub.category === category)
                          .map((sub) => (
                            <SubscriptionCard
                              key={sub.id}
                              sub={sub}
                              onEdit={handleEdit}
                            />
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <SubscriptionCard
                        key={sub.id}
                        sub={sub}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <SubscriptionsListEmpty />
            </div>
          )}

          {subscriptions.length > 0 && (
            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
              }}
            >
              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100%-4rem)] max-w-2xl">
                <DialogTrigger asChild>
                  <div className="flex justify-center relative h-full">
                    <Button className="absolute top-1/2 transform -translate-y-8 z-10">
                      <PlusIcon />
                      Add Subscription
                    </Button>
                  </div>
                </DialogTrigger>
              </div>
              <DialogContent className="h-[95vh] sm:h-auto p-6 overflow-y-auto">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col h-full space-y-4"
                >
                  <DialogHeader className="sm:p-0 relative">
                    <DialogTitle className="text-center pt-4">
                      {editingId
                        ? `Edit ${formData.title || "Subscription"}`
                        : formData.title
                          ? `New Subscription: ${formData.title}`
                          : "Add New Subscription"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 sm:p-0">
                    <div className="space-y-4 mb-4">
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
                              <SelectItem
                                key={category.value}
                                value={category.value}
                              >
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
                          step="1"
                          placeholder="0.00"
                          value={formData.amount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              frequency: value as
                                | "weekly"
                                | "monthly"
                                | "yearly",
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

                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.startDate ? (
                                format(formData.startDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.startDate}
                              onSelect={(date) =>
                                setFormData({
                                  ...formData,
                                  startDate: date || new Date(),
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                    </div>
                  </div>

                  <div className="mt-auto sm:p-0 bg-white border-t sm:border-0 space-y-2">
                    {editingId && (
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDelete(editingId)}
                      >
                        Delete Subscription
                      </Button>
                    )}
                    <Button type="submit" className="w-full">
                      {editingId ? (
                        "Save Changes"
                      ) : (
                        <>
                          <PlusIcon /> Add Subscription
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog
            open={showCategoriesDialog}
            onOpenChange={setShowCategoriesDialog}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-center pt-4">
                  Categories
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {[...categories]
                  .sort(
                    (a, b) =>
                      calculateCategoryTotal(b.value) -
                      calculateCategoryTotal(a.value),
                  )
                  .map((category) => (
                    <div
                      key={category.value}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ${calculateCategoryTotal(category.value).toFixed(0)}/mo
                      </div>
                    </div>
                  ))}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
