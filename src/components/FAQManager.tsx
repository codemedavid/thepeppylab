import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, EyeOff, HelpCircle, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useFAQs, FAQ } from '../hooks/useFAQs';

interface FAQManagerProps {
    onBack: () => void;
}

const CATEGORIES = ['PRODUCT & USAGE', 'ORDERING & PACKAGING', 'PAYMENT METHODS', 'SHIPPING & DELIVERY', 'GENERAL'];

const FAQManager: React.FC<FAQManagerProps> = ({ onBack }) => {
    const { faqs, loading, error, fetchFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs } = useFAQs();
    const [isEditing, setIsEditing] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchFAQs(true); // Include inactive FAQs for admin
    }, []);

    const filteredFAQs = selectedCategory === 'all'
        ? faqs
        : faqs.filter(f => f.category === selectedCategory);

    const handleAdd = () => {
        setEditingFAQ({
            question: '',
            answer: '',
            category: CATEGORIES[0],
            order_index: faqs.length + 1,
            is_active: true
        });
        setIsEditing(true);
    };

    const handleEdit = (faq: FAQ) => {
        setEditingFAQ({ ...faq });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingFAQ?.question || !editingFAQ?.answer) {
            alert('Please fill in both question and answer.');
            return;
        }

        setSaving(true);
        try {
            if (editingFAQ.id) {
                await updateFAQ(editingFAQ.id, editingFAQ);
            } else {
                await createFAQ(editingFAQ as Omit<FAQ, 'id' | 'created_at' | 'updated_at'>);
            }
            setIsEditing(false);
            setEditingFAQ(null);
        } catch (err) {
            console.error('Error saving FAQ:', err);
            alert('Failed to save FAQ. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteFAQ(id);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            alert('Failed to delete FAQ.');
        }
    };

    const handleToggleActive = async (faq: FAQ) => {
        try {
            await updateFAQ(faq.id, { is_active: !faq.is_active });
        } catch (err) {
            console.error('Error toggling FAQ status:', err);
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newFAQs = [...filteredFAQs];
        [newFAQs[index - 1], newFAQs[index]] = [newFAQs[index], newFAQs[index - 1]];
        try {
            await reorderFAQs(newFAQs);
        } catch (err) {
            console.error('Error reordering FAQs:', err);
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === filteredFAQs.length - 1) return;
        const newFAQs = [...filteredFAQs];
        [newFAQs[index], newFAQs[index + 1]] = [newFAQs[index + 1], newFAQs[index]];
        try {
            await reorderFAQs(newFAQs);
        } catch (err) {
            console.error('Error reordering FAQs:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-theme-accent border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (isEditing && editingFAQ) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-theme-text">
                        {editingFAQ.id ? 'Edit FAQ' : 'Add New FAQ'}
                    </h2>
                    <button
                        onClick={() => { setIsEditing(false); setEditingFAQ(null); }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Question */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={editingFAQ.question || ''}
                            onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="Enter the question"
                        />
                    </div>

                    {/* Answer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editingFAQ.answer || ''}
                            onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            rows={6}
                            placeholder="Enter the answer..."
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={editingFAQ.category || CATEGORIES[0]}
                            onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={editingFAQ.is_active ?? true}
                            onChange={(e) => setEditingFAQ({ ...editingFAQ, is_active: e.target.checked })}
                            className="w-4 h-4 text-theme-accent border-gray-300 rounded focus:ring-theme-accent"
                        />
                        <span className="text-sm text-gray-700">Active (visible to users)</span>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={() => { setIsEditing(false); setEditingFAQ(null); }}
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
                        {saving ? 'Saving...' : 'Save FAQ'}
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
                    <h2 className="text-xl font-semibold text-theme-text">Manage FAQs</h2>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add FAQ
                </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-theme-accent text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    All ({faqs.length})
                </button>
                {CATEGORIES.map(cat => {
                    const count = faqs.filter(f => f.category === cat).length;
                    return (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                    ? 'bg-theme-accent text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat} ({count})
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>
            )}

            {/* FAQs List */}
            <div className="space-y-2">
                {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No FAQs yet. Click "Add FAQ" to create one.</p>
                    </div>
                ) : (
                    filteredFAQs.map((faq, index) => (
                        <div
                            key={faq.id}
                            className={`bg-white rounded-lg border p-4 ${!faq.is_active ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Reorder buttons */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === filteredFAQs.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-theme-text">{faq.question}</h3>
                                        {!faq.is_active && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{faq.answer}</p>
                                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-theme-accent/10 text-theme-accent rounded-full">
                                        {faq.category}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggleActive(faq)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title={faq.is_active ? 'Hide' : 'Show'}
                                    >
                                        {faq.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(faq)}
                                        className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(faq.id)}
                                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-theme-text mb-2">Delete FAQ?</h3>
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

export default FAQManager;
