import { categories } from "@/app/components/categories";
import { formatDistanceToNow, addWeeks, addMonths, addYears } from "date-fns";
import { CategoryType } from "@/app/components/categories";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  groupByCategories?: boolean;
  index?: number;
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

export function SubscriptionCard({
  sub,
  onEdit,
  groupByCategories,
  index = 0,
}: SubscriptionCardProps) {
  const slideDownVariants = {
    initial: {
      opacity: 0,
      y: -20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      layout
      variants={slideDownVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="border rounded-lg px-4 py-2 relative bg-white hover:border-gray-500 cursor-pointer"
      onClick={() => {
        console.log("Card clicked", sub);
        onEdit(sub);
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={groupByCategories ? "grouped" : "ungrouped"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {groupByCategories ? (
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{sub.title}</h3>
                {sub.notifyBeforeRenewal && (
                  <Bell className="h-3 w-3 text-black" />
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
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
          ) : (
            <div className="cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{sub.title}</h3>
                  {sub.notifyBeforeRenewal && (
                    <Bell className="h-3 w-3 text-black" />
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
                <div className="flex items-center gap-2">
                  {(() => {
                    const category = categories.find(
                      (c) => c.value === sub.category,
                    );
                    const Icon = category?.icon;
                    return Icon && <Icon className="h-4 w-4 text-gray-500" />;
                  })()}
                  <p className="text-sm text-gray-500">
                    {categories.find((c) => c.value === sub.category)?.label}
                  </p>
                </div>
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
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
