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
import { MoreVertical, LayoutGrid, LogOut, HelpCircle } from "lucide-react";
import { CategoriesDialog } from "@/app/components/categories-dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [showYearlyTotal, setShowYearlyTotal] = useState(false);
  const { toast } = useToast();

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
      if (editingId) {
        setShowEditDialog(false);
      }
      toast({
        title: editingId ? "Subscription updated" : "Subscription added",
        description: (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>
              {formData.title} was {editingId ? "updated" : "added"}{" "}
              successfully
            </span>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast({
        title: "Error",
        description: "Failed to save subscription",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      const subscription = subscriptions.find((sub) => sub.id === id);
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;

      await loadSubscriptions();
      setShowEditDialog(false);
      toast({
        title: "Subscription deleted",
        description: (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>
              {subscription?.title || "Subscription"} was deleted successfully
            </span>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
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
    setShowEditDialog(true);
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

  const calculateYearlyTotal = () => {
    return subscriptions.reduce((total, sub) => {
      let yearlyAmount = sub.amount;
      switch (sub.frequency) {
        case "weekly":
          yearlyAmount = sub.amount * 52; // weekly to yearly
          break;
        case "monthly":
          yearlyAmount = sub.amount * 12; // monthly to yearly
          break;
        // yearly stays as is
      }
      return total + yearlyAmount;
    }, 0);
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
    <>
      <div className="min-h-screen p-8">
        <main className="max-w-2xl mx-auto mb-32">
          {subscriptions.length > 0 ? (
            <>
              <div>
                <div className="sticky top-0 flex flex-row justify-between items-end mb-4 bg-gray-50 z-10 py-4">
                  <div
                    className="flex flex-row gap-1 items-end cursor-pointer hover:opacity-75 transition-opacity rounded-lg p-2 hover:bg-gray-100"
                    onClick={() => setShowYearlyTotal(!showYearlyTotal)}
                  >
                    <p className="text-2xl font-bold">
                      $
                      {showYearlyTotal
                        ? calculateYearlyTotal().toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        : calculateMonthlyTotal().toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                    </p>
                    <p className="text-xs mb-1">
                      per {showYearlyTotal ? "year" : "month"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-gray-100 hover:bg-gray-200 hidden"
                        >
                          <PlusIcon className="" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="h-[95vh] sm:h-auto p-6 overflow-y-auto">
                        <form
                          onSubmit={handleSubmit}
                          className="flex flex-col h-full space-y-4"
                        >
                          <DialogHeader className="sm:p-0 relative">
                            <DialogTitle className="text-center pt-4">
                              {editingId
                                ? `${formData.title || "Subscription"}`
                                : formData.title
                                  ? `${formData.title}`
                                  : "Add New Subscription"}
                            </DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                autoFocus={!editingId}
                                value={formData.title}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    title: e.target.value,
                                  })
                                }
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
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.value}
                                      value={category.value}
                                    >
                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          const Icon = category.icon;
                                          return <Icon className="h-4 w-4" />;
                                        })()}
                                        {category.label}
                                      </div>
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
                                  <SelectItem value="monthly">
                                    Monthly
                                  </SelectItem>
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
                                    className={
                                      "w-full justify-start text-left font-normal"
                                    }
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
                                id="notifyBeforeRenewal"
                                checked={formData.notifyBeforeRenewal}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    notifyBeforeRenewal: checked as boolean,
                                  })
                                }
                              />
                              <Label htmlFor="notifyBeforeRenewal">
                                Notify before renewal
                              </Label>
                            </div>
                          </div>

                          <div className="fixed sm:relative bottom-0 left-0 right-0 p-6 sm:p-0 bg-white border-t sm:border-0 space-y-2">
                            {editingId && (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                  onClick={() => handleDelete(editingId)}
                                >
                                  Delete Subscription
                                </Button>
                                <Button type="submit" className="w-full">
                                  Save Changes
                                </Button>
                              </div>
                            )}
                            {!editingId && (
                              <Button type="submit" className="w-full">
                                Add Subscription
                              </Button>
                            )}
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={showEditDialog}
                      onOpenChange={(open) => {
                        setShowEditDialog(open);
                        if (!open) {
                          resetForm();
                        }
                      }}
                      defaultOpen={false}
                      modal={true}
                    >
                      <DialogContent
                        className="h-[95vh] sm:h-auto p-6 overflow-y-auto"
                        onOpenAutoFocus={(e) => {
                          if (editingId) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <form
                          onSubmit={handleSubmit}
                          className="flex flex-col h-full"
                        >
                          <div className="flex-1">
                            <DialogHeader className="sm:p-0 relative">
                              <DialogTitle className="text-center pt-4">
                                {editingId
                                  ? `${formData.title || "Subscription"}`
                                  : formData.title
                                    ? `${formData.title}`
                                    : "Add New Subscription"}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 mb-24 sm:mb-0">
                              <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                  id="title"
                                  autoFocus={!editingId}
                                  value={formData.title}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                  value={formData.category}
                                  onValueChange={(value: CategoryType) =>
                                    setFormData({
                                      ...formData,
                                      category: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem
                                        key={category.value}
                                        value={category.value}
                                      >
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            const Icon = category.icon;
                                            return <Icon className="h-4 w-4" />;
                                          })()}
                                          {category.label}
                                        </div>
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
                                    <SelectItem value="weekly">
                                      Weekly
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                      Monthly
                                    </SelectItem>
                                    <SelectItem value="yearly">
                                      Yearly
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={
                                        "w-full justify-start text-left font-normal"
                                      }
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
                                  id="notifyBeforeRenewal"
                                  checked={formData.notifyBeforeRenewal}
                                  onCheckedChange={(checked) =>
                                    setFormData({
                                      ...formData,
                                      notifyBeforeRenewal: checked as boolean,
                                    })
                                  }
                                />
                                <Label htmlFor="notifyBeforeRenewal">
                                  Notify before renewal
                                </Label>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 sm:static fixed bottom-0 left-0 right-0 p-6 sm:p-0 bg-white border-t sm:border-0">
                            {editingId && (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                  onClick={() => handleDelete(editingId)}
                                >
                                  Delete Subscription
                                </Button>
                                <Button type="submit" className="w-full">
                                  Save Changes
                                </Button>
                              </div>
                            )}
                            {!editingId && (
                              <Button type="submit" className="w-full">
                                Add Subscription
                              </Button>
                            )}
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                        >
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
                            asChild
                          >
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
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <SubscriptionCard
                        key={sub.id}
                        sub={sub}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <CategoriesDialog
                open={showCategoriesDialog}
                onOpenChange={setShowCategoriesDialog}
                subscriptions={subscriptions}
                calculateCategoryTotal={calculateCategoryTotal}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <SubscriptionsListEmpty />
            </div>
          )}
        </main>
      </div>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full px-6">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent className="flex flex-col h-[95vh] sm:h-auto p-0 overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                <DialogHeader className="sm:p-0 relative">
                  <DialogTitle className="text-center pt-4">
                    {formData.title
                      ? `${formData.title}`
                      : "Add New Subscription"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      autoFocus={!editingId}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          title: e.target.value,
                        })
                      }
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = category.icon;
                                return <Icon className="h-4 w-4" />;
                              })()}
                              {category.label}
                            </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={
                            "w-full justify-start text-left font-normal"
                          }
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
                      id="notifyBeforeRenewal"
                      checked={formData.notifyBeforeRenewal}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          notifyBeforeRenewal: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="notifyBeforeRenewal">
                      Notify before renewal
                    </Label>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 sm:p-6 bg-white border-t">
                <Button type="submit" className="w-full">
                  Add Subscription
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
