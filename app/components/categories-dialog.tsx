import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { categories, CategoryType } from "@/app/components/categories";

interface CategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: Array<{ category: CategoryType }>;
  calculateCategoryTotal: (category: string) => number;
}

export function CategoriesDialog({
  open,
  onOpenChange,
  subscriptions,
  calculateCategoryTotal,
}: CategoriesDialogProps) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ label: "", value: "" });

  const handleAddCategory = () => {
    // Here you would typically:
    // 1. Validate the input
    // 2. Add to your categories list
    // 3. Update your database
    // 4. Close the dialog
    console.log("New category:", newCategory);
    setShowAddCategory(false);
    setNewCategory({ label: "", value: "" });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center pt-4">Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {[...categories]
                .filter((category) =>
                  subscriptions.some((sub) => sub.category === category.value),
                )
                .sort(
                  (a, b) =>
                    calculateCategoryTotal(b.value) -
                    calculateCategoryTotal(a.value),
                )
                .map((category) => (
                  <div
                    key={category.value}
                    className="flex items-center justify-between p-2 rounded-lg border"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
