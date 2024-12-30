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
import { Filter } from "lucide-react";
import {
  formatDistanceToNow,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

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
  const [showCategories, setShowCategories] = useState(false);

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

  const getNextRenewal = (startDate: Date, frequency: string) => {
    const today = new Date();
    let nextDate = new Date(startDate);

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

    const distance = formatDistanceToNow(nextDate, { addSuffix: true });

    if (distance === "in less than a minute") return "today";
    if (distance === "in 1 day") return "tomorrow";
    return distance;
  };

  const isWithinWeek = (startDate: Date, frequency: string) => {
    const today = new Date();
    let nextDate = new Date(startDate);

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

    const weekFromNow = addWeeks(today, 1);
    return nextDate <= weekFromNow;
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Recurwise</h1>
        </div>

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
            onClick={() => setShowCategories(!showCategories)}
            className={showCategories ? "bg-secondary" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {showCategories ? (
            getActiveCategories().map((category) => (
              <div key={category} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold capitalize">
                    {category}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    ${calculateCategoryTotal(category).toFixed(0)}/mo
                  </p>
                </div>
                <div className="space-y-4">
                  {subscriptions
                    .filter((sub) => sub.category === category)
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="border rounded px-4 py-2 cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => handleEdit(sub)}
                      >
                        <h3 className="font-semibold">{sub.title}</h3>
                        <p className="text-sm text-gray-600">
                          {
                            categories.find((c) => c.value === sub.category)
                              ?.icon
                          }{" "}
                          {
                            categories.find((c) => c.value === sub.category)
                              ?.label
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          ${sub.amount} • {sub.frequency}
                        </p>
                        <p
                          className={`text-sm ${isWithinWeek(sub.startDate, sub.frequency) ? "text-red-500" : "text-gray-600"}`}
                        >
                          Next renewal:{" "}
                          {getNextRenewal(sub.startDate, sub.frequency)}
                        </p>
                        {sub.notifyBeforeRenewal && (
                          <p className="text-sm text-blue-500">
                            Notifications enabled
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="border rounded px-4 py-2 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => handleEdit(sub)}
                >
                  <h3 className="font-semibold">{sub.title}</h3>
                  <p className="text-sm text-gray-600">
                    {categories.find((c) => c.value === sub.category)?.icon}{" "}
                    {categories.find((c) => c.value === sub.category)?.label}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${sub.amount} • {sub.frequency}
                  </p>
                  <p
                    className={`text-sm ${isWithinWeek(sub.startDate, sub.frequency) ? "text-red-500" : "text-gray-600"}`}
                  >
                    Next renewal: {getNextRenewal(sub.startDate, sub.frequency)}
                  </p>
                  {sub.notifyBeforeRenewal && (
                    <p className="text-sm text-blue-500">
                      Notifications enabled
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100%-4rem)] max-w-2xl">
              <Button className="w-full">Add Subscription</Button>
            </div>
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
            <form
              onSubmit={handleSubmit}
              className="space-y-4 relative h-full pb-24"
            >
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
                  step="0.01"
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

              <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[calc(100%-4rem)] max-w-2xl">
                <Button type="submit" className="w-full">
                  {editingId ? "Save Changes" : "Add Subscription"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
