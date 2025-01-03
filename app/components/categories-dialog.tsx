import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[425px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
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
                      {(() => {
                        const Icon = category.icon;
                        return <Icon className="h-4 w-4" />;
                      })()}
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
