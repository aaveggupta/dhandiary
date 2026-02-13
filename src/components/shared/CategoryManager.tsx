'use client';

import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks';
import {
  CATEGORY_ICON_MAP,
  AVAILABLE_CATEGORY_ICONS,
  getCategoryIconComponent,
} from '@/lib/category-icons';
import { Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown } from 'lucide-react';
import type { Category, TransactionType } from '@/types';

const AVAILABLE_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
];

const TYPE_CONFIG: Record<TransactionType, { label: string; accent: string }> = {
  EXPENSE: { label: 'Expense', accent: 'text-red-400' },
  INCOME: { label: 'Income', accent: 'text-emerald-400' },
  TRANSFER: { label: 'Transfer', accent: 'text-violet-400' },
};

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isDeleting: boolean;
}

function CategoryItem({ category, onEdit, onDelete, isDeleting }: CategoryItemProps) {
  const IconComponent = getCategoryIconComponent(category.icon);

  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/10">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${category.color || '#6b7280'}20` }}
        >
          <IconComponent size={22} style={{ color: category.color || '#6b7280' }} />
        </div>
        <div className="min-w-0">
          <span className="block font-medium">{category.name}</span>
          {category.isSystem && (
            <Badge variant="neutral" className="mt-0.5 text-[10px]">
              Default
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
          className="h-9 w-9 p-0 text-muted hover:bg-white/10 hover:text-text"
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(category)}
          disabled={isDeleting}
          className="h-9 w-9 p-0 text-muted hover:bg-red-500/10 hover:text-red-400"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

  const IconComponent = getCategoryIconComponent(icon);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coffee, Subscriptions"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors placeholder:text-white/30 focus:border-primary/50 focus:bg-white/10 focus:outline-none"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Icon</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/10 ${
              showIconPicker ? 'border-primary/50 ring-1 ring-primary/30' : ''
            }`}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <IconComponent size={18} style={{ color }} />
            </div>
            <span className="text-sm font-medium">{icon.replace(/([A-Z])/g, ' $1').trim()}</span>
            <ChevronDown
              size={16}
              className={`ml-auto text-muted transition-transform ${showIconPicker ? 'rotate-180' : ''}`}
            />
          </button>
          {showIconPicker && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-surface p-3 shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
                  const Icon = CATEGORY_ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setIcon(iconName);
                        setShowIconPicker(false);
                      }}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:scale-110 ${
                        icon === iconName
                          ? 'bg-primary/30 text-primary ring-1 ring-primary/50'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-muted">Color</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-lg transition-all hover:scale-110 ${
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="flex-1 bg-gradient-to-r from-primary to-secondary"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} className="mr-1.5" />
              {category ? 'Save Changes' : 'Add Category'}
            </>
          )}
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
  const { accent } = TYPE_CONFIG[type];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${accent}`}>{title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className={`gap-1.5 ${accent} hover:bg-white/10`}
        >
          <Plus size={18} />
          Add
        </Button>
      </div>
      {typeCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
          <p className="text-muted">No {title.toLowerCase()} yet</p>
          <Button variant="ghost" size="sm" onClick={onAdd} className="mt-4">
            <Plus size={16} className="mr-1.5" />
            Add your first category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {typeCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === category.id}
            />
          ))}
        </div>
      )}
    </section>
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
  const [showModal, setShowModal] = useState(false);

  const openForm = (category: Category | null, type: TransactionType | null) => {
    setEditingCategory(category);
    setAddingType(type);
    setShowModal(true);
  };

  const closeForm = () => {
    setEditingCategory(null);
    setAddingType(null);
    setShowModal(false);
  };

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
      closeForm();
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted" />
      </div>
    );
  }

  const isFormOpen = showModal && (editingCategory || addingType);

  return (
    <>
      {/* Vertical stacked sections - full width, no truncation */}
      <div className="space-y-8">
        <CategorySection
          title="Expense Categories"
          type="EXPENSE"
          categories={categories}
          onEdit={(c) => openForm(c, null)}
          onDelete={handleDelete}
          onAdd={() => openForm(null, 'EXPENSE')}
          deletingId={deletingId}
        />
        <CategorySection
          title="Income Categories"
          type="INCOME"
          categories={categories}
          onEdit={(c) => openForm(c, null)}
          onDelete={handleDelete}
          onAdd={() => openForm(null, 'INCOME')}
          deletingId={deletingId}
        />
        <CategorySection
          title="Transfer"
          type="TRANSFER"
          categories={categories}
          onEdit={(c) => openForm(c, null)}
          onDelete={handleDelete}
          onAdd={() => openForm(null, 'TRANSFER')}
          deletingId={deletingId}
        />
      </div>

      {/* Modal for Add/Edit */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCategory
                  ? `Edit ${TYPE_CONFIG[editingCategory.type].label} Category`
                  : `New ${TYPE_CONFIG[addingType || 'EXPENSE'].label} Category`}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/10 hover:text-text"
              >
                <X size={20} />
              </button>
            </div>
            <CategoryForm
              category={editingCategory}
              type={editingCategory?.type || addingType || 'EXPENSE'}
              onSave={handleSave}
              onCancel={closeForm}
              isLoading={createCategory.isPending || updateCategory.isPending}
            />
          </div>
        </div>
      )}
    </>
  );
}
