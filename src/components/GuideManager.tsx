import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, EyeOff, BookOpen, Upload } from 'lucide-react';
import { useGuides, Guide } from '../hooks/useGuides';
import ImageUpload from './ImageUpload';

interface GuideManagerProps {
    onBack: () => void;
}

const CATEGORIES = ['Beginner', 'How-To', 'Safety', 'Advanced', 'General'];

const GuideManager: React.FC<GuideManagerProps> = ({ onBack }) => {
    const { guides, loading, error, fetchGuides, createGuide, updateGuide, deleteGuide } = useGuides();
    const [isEditing, setIsEditing] = useState(false);
    const [editingGuide, setEditingGuide] = useState<Partial<Guide> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGuides(true); // Include inactive guides for admin
    }, []);

    const handleAdd = () => {
        setEditingGuide({
            title: '',
            description: '',
            category: CATEGORIES[0],
            content: '',
            thumbnail_url: null,
            pdf_url: null,
            is_active: true,
            sort_order: guides.length + 1
        });
        setIsEditing(true);
    };

    const handleEdit = (guide: Guide) => {
        setEditingGuide({ ...guide });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingGuide?.title || !editingGuide?.description || !editingGuide?.content) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            if (editingGuide.id) {
                await updateGuide(editingGuide.id, editingGuide);
            } else {
                await createGuide(editingGuide as Omit<Guide, 'id' | 'created_at' | 'updated_at'>);
            }
            setIsEditing(false);
            setEditingGuide(null);
        } catch (err) {
            console.error('Error saving guide:', err);
            alert('Failed to save guide. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGuide(id);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting guide:', err);
            alert('Failed to delete guide.');
        }
    };

    const handleToggleActive = async (guide: Guide) => {
        try {
            await updateGuide(guide.id, { is_active: !guide.is_active });
        } catch (err) {
            console.error('Error toggling guide status:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-theme-accent border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (isEditing && editingGuide) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-theme-text">
                        {editingGuide.id ? 'Edit Guide' : 'Add New Guide'}
                    </h2>
                    <button
                        onClick={() => { setIsEditing(false); setEditingGuide(null); }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={editingGuide.title || ''}
                            onChange={(e) => setEditingGuide({ ...editingGuide, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="Guide title"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={editingGuide.category || CATEGORIES[0]}
                            onChange={(e) => setEditingGuide({ ...editingGuide, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input
                            type="number"
                            value={editingGuide.sort_order || 0}
                            onChange={(e) => setEditingGuide({ ...editingGuide, sort_order: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            min="0"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editingGuide.description || ''}
                            onChange={(e) => setEditingGuide({ ...editingGuide, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            rows={2}
                            placeholder="Brief description of the guide"
                        />
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content (Markdown) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editingGuide.content || ''}
                            onChange={(e) => setEditingGuide({ ...editingGuide, content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent font-mono text-sm"
                            rows={12}
                            placeholder="# Guide Title&#10;&#10;## Section 1&#10;&#10;Content here..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supports markdown: # Headers, **bold**, *italic*, - lists
                        </p>
                    </div>

                    {/* Thumbnail URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                        <input
                            type="text"
                            value={editingGuide.thumbnail_url || ''}
                            onChange={(e) => setEditingGuide({ ...editingGuide, thumbnail_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="https://..."
                        />
                    </div>

                    {/* PDF URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
                        <input
                            type="text"
                            value={editingGuide.pdf_url || ''}
                            onChange={(e) => setEditingGuide({ ...editingGuide, pdf_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={editingGuide.is_active ?? true}
                                onChange={(e) => setEditingGuide({ ...editingGuide, is_active: e.target.checked })}
                                className="w-4 h-4 text-theme-accent border-gray-300 rounded focus:ring-theme-accent"
                            />
                            <span className="text-sm text-gray-700">Active (visible to users)</span>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={() => { setIsEditing(false); setEditingGuide(null); }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Guide'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-theme-text">Manage Guides</h2>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Guide
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>
            )}

            {/* Guides List */}
            <div className="space-y-3">
                {guides.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No guides yet. Click "Add Guide" to create one.</p>
                    </div>
                ) : (
                    guides.map(guide => (
                        <div
                            key={guide.id}
                            className={`bg-white rounded-lg border p-4 flex items-center justify-between gap-4 ${!guide.is_active ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-theme-text truncate">{guide.title}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-theme-accent/10 text-theme-accent rounded-full">
                                        {guide.category}
                                    </span>
                                    {!guide.is_active && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                            Hidden
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{guide.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(guide)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title={guide.is_active ? 'Hide' : 'Show'}
                                >
                                    {guide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(guide)}
                                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(guide.id)}
                                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-theme-text mb-2">Delete Guide?</h3>
                        <p className="text-gray-600 mb-4">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuideManager;
