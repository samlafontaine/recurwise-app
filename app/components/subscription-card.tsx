import { categories } from "@/app/components/categories";
import { formatDistanceToNow, addWeeks, addMonths, addYears } from "date-fns";
import { CategoryType } from "@/app/components/categories";

interface Subscription {
  id: string;
  title: string;
  category: CategoryType;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  notifyBeforeRenewal: boolean;
  startDate: Date;
}

interface SubscriptionCardProps {
  sub: Subscription;
  onEdit: (subscription: Subscription) => void;
}

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

export function SubscriptionCard({ sub, onEdit }: SubscriptionCardProps) {
  return (
    <div
      className="border rounded-lg px-4 py-2 relative bg-white hover:border-gray-300"
      onClick={() => onEdit(sub)}
    >
      <div className="cursor-pointer transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{sub.title}</h3>
            {sub.notifyBeforeRenewal && (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <span>${sub.amount}</span>
            <span className="text-gray-600">
              {sub.frequency === "monthly"
                ? "/mo"
                : sub.frequency === "yearly"
                  ? "/yr"
                  : sub.frequency === "weekly"
                    ? "/wk"
                    : `/${sub.frequency}`}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-600 flex items-center gap-1">
            {categories.find((c) => c.value === sub.category)?.icon}{" "}
            {categories.find((c) => c.value === sub.category)?.label}
          </p>
          <p
            className={`text-sm ${
              isWithinWeek(sub.startDate, sub.frequency)
                ? "text-red-500"
                : "text-gray-600"
            }`}
          >
            Renews {getNextRenewal(sub.startDate, sub.frequency)}
          </p>
        </div>
      </div>
    </div>
  );
}
