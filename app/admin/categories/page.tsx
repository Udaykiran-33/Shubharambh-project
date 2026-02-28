'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  ToggleLeft,
  ToggleRight,
  Edit2,
  Save,
  X,
  Search,
  GripVertical
} from 'lucide-react';
import { 
  getAdminCategories, 
  toggleCategoryStatus, 
  updateCategory 
} from '@/app/actions/admin';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  image: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
  priceLabel: string;
  priceUnit: string;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleToggleStatus = async (categoryId: string) => {
    setActionLoading(categoryId);
    try {
      const result = await toggleCategoryStatus(categoryId);
      if (result.success) {
        loadCategories();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category._id);
    setEditForm({
      name: category.name,
      description: category.description,
      image: category.image,
      order: category.order,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      const result = await updateCategory(editingId, editForm);
      if (result.success) {
        loadCategories();
        setEditingId(null);
        setEditForm({});
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
          fontWeight: 800, 
          color: 'var(--olive-800)',
          marginBottom: '8px',
        }}>
          Categories Management
        </h1>
        <p style={{ color: 'var(--olive-500)' }}>
          Manage service categories and their visibility
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '320px' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--olive-400)',
            }} 
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: '10px',
              border: '1px solid var(--cream-200)',
              background: 'white',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--cream-200)',
            borderTopColor: 'var(--olive-600)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--cream-200)',
        }}>
          <FolderOpen size={48} color="var(--olive-300)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--olive-700)', marginBottom: '8px' }}>No categories found</h3>
          <p style={{ color: 'var(--olive-500)', fontSize: '14px' }}>
            {searchQuery ? 'No categories match your search' : 'No categories created yet'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--cream-200)',
          overflow: 'hidden',
        }}>
          {filteredCategories.map((category, index) => (
            <div
              key={category._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: index < filteredCategories.length - 1 ? '1px solid var(--cream-100)' : 'none',
              }}
            >
              {/* Drag Handle */}
              <div style={{ color: 'var(--olive-300)', cursor: 'grab' }}>
                <GripVertical size={20} />
              </div>

              {/* Image */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                overflow: 'hidden',
                flexShrink: 0,
                background: category.backgroundColor || 'var(--cream-100)',
              }}>
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {category.icon}
                  </div>
                )}
              </div>

              {/* Info or Edit Form */}
              {editingId === category._id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Category name"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--cream-200)',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--cream-200)',
                      fontSize: '14px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={editForm.image || ''}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      placeholder="Image URL"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-200)',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="number"
                      value={editForm.order || 0}
                      onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) })}
                      placeholder="Order"
                      style={{
                        width: '80px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-200)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: 'var(--olive-800)',
                    marginBottom: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {category.name}
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--olive-500)',
                      background: 'var(--cream-100)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      /{category.slug}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--olive-500)' }}>
                    {category.description || 'No description'}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: category.isActive ? '#d1fae5' : '#fee2e2',
                color: category.isActive ? '#065f46' : '#991b1b',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {category.isActive ? 'Active' : 'Hidden'}
              </span>

              {/* Order Badge */}
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--olive-100)',
                color: 'var(--olive-700)',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                Order: {category.order}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {editingId === category._id ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={actionLoading === category._id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--olive-600)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-200)',
                        background: 'white',
                        color: 'var(--olive-700)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-200)',
                        background: 'white',
                        color: 'var(--olive-700)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category._id)}
                      disabled={actionLoading === category._id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--cream-200)',
                        background: 'white',
                        color: 'var(--olive-700)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {category.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {category.isActive ? 'Hide' : 'Show'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Note */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'var(--cream-100)',
        border: '1px solid var(--cream-200)',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--olive-600)' }}>
          <strong>Note:</strong> Categories are used to organize vendors and their services. 
          Hidden categories won{`'`}t appear on the public website. Order determines the display sequence.
        </p>
      </div>
    </div>
  );
}
