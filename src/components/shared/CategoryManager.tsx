'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Sparkles,
  Heart,
  GraduationCap,
  Shield,
  Plane,
  Gift,
  Wrench,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Award,
  RotateCcw,
  ArrowLeftRight,
  PawPrint,
  Shirt,
  type LucideIcon,
} from 'lucide-react';
import type { Category, TransactionType } from '@/types';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Home,
  Receipt,
  ShoppingBag,
  Gamepad2,
  CreditCard,
  Sparkles,
  Heart,
  GraduationCap,
  Shield,
  Plane,
  Gift,
  Wrench,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Award,
  RotateCcw,
  ArrowLeftRight,
  PawPrint,
  Shirt,
  Plus,
};

const availableIcons = Object.keys(iconMap);

const availableColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#6b7280', // gray
];

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isDeleting: boolean;
}

function CategoryItem({ category, onEdit, onDelete, isDeleting }: CategoryItemProps) {
  const IconComponent = iconMap[category.icon || 'MoreHorizontal'] || MoreHorizontal;

  return (
    <div className="flex items-center justify-between border-b border-border p-3 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <IconComponent size={18} style={{ color: category.color || '#6b7280' }} />
        </div>
        <span className="font-medium">{category.name}</span>
        {category.isSystem && (
          <Badge variant="default" className="text-xs">
            Default
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(category)} className="h-8 w-8 p-0">
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category)}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-400"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </Button>
      </div>
    </div>
  );
}

interface CategoryFormProps {
  category?: Category | null;
  type: TransactionType;
  onSave: (data: { name: string; icon: string; color: string; type: TransactionType }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CategoryForm({ category, type, onSave, onCancel, isLoading }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'MoreHorizontal');
  const [color, setColor] = useState(category?.color || '#6b7280');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, type });
  };

  const IconComponent = iconMap[icon] || MoreHorizontal;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="w-full rounded-lg border border-border bg-surfaceHighlight px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-muted">Icon</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-surfaceHighlight px-3 py-2 text-sm hover:border-primary"
            >
              <IconComponent size={18} style={{ color }} />
              <span>{icon}</span>
            </button>
            {showIconPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 grid max-h-48 w-full grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-xl">
                {availableIcons.map((iconName) => {
                  const Icon = iconMap[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setIcon(iconName);
                        setShowIconPicker(false);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surfaceHighlight ${icon === iconName ? 'bg-primary/20 text-primary' : ''}`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-muted">Color</label>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surfaceHighlight p-2">
            {availableColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          <X size={16} className="mr-1" />
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isLoading}>
          {isLoading ? (
            <Loader2 size={16} className="mr-1 animate-spin" />
          ) : (
            <Check size={16} className="mr-1" />
          )}
          {category ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

interface CategorySectionProps {
  title: string;
  type: TransactionType;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAdd: () => void;
  deletingId: string | null;
}

function CategorySection({
  title,
  type,
  categories,
  onEdit,
  onDelete,
  onAdd,
  deletingId,
}: CategorySectionProps) {
  const typeCategories = categories.filter((c) => c.type === type);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted">{title}</h4>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs">
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {typeCategories.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted">No categories yet</div>
        ) : (
          typeCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === category.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function CategoryManager() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingType, setAddingType] = useState<TransactionType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async (data: {
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
  }) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      setEditingCategory(null);
      setAddingType(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;

    setDeletingId(category.id);
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      </Card>
    );
  }

  const isFormOpen = editingCategory || addingType;

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Categories</h3>
          <p className="text-sm text-muted">Manage your transaction categories</p>
        </div>
      </div>

      {isFormOpen && (
        <div className="mb-6">
          <CategoryForm
            category={editingCategory}
            type={editingCategory?.type || addingType || 'EXPENSE'}
            onSave={handleSave}
            onCancel={() => {
              setEditingCategory(null);
              setAddingType(null);
            }}
            isLoading={createCategory.isPending || updateCategory.isPending}
          />
        </div>
      )}

      <div className="space-y-6">
        <CategorySection
          title="Expense Categories"
          type="EXPENSE"
          categories={categories}
          onEdit={setEditingCategory}
          onDelete={handleDelete}
          onAdd={() => setAddingType('EXPENSE')}
          deletingId={deletingId}
        />

        <CategorySection
          title="Income Categories"
          type="INCOME"
          categories={categories}
          onEdit={setEditingCategory}
          onDelete={handleDelete}
          onAdd={() => setAddingType('INCOME')}
          deletingId={deletingId}
        />

        <CategorySection
          title="Transfer"
          type="TRANSFER"
          categories={categories}
          onEdit={setEditingCategory}
          onDelete={handleDelete}
          onAdd={() => setAddingType('TRANSFER')}
          deletingId={deletingId}
        />
      </div>
    </Card>
  );
}
