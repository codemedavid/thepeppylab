import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, EyeOff, BookOpen, Globe, FileText } from 'lucide-react';
import { useArticles, Article } from '../hooks/useArticles';

interface ArticleManagerProps {
    onBack: () => void;
}

const CATEGORIES = ['Education', 'Guides', 'Science', 'News', 'Tips', 'General'];

const ArticleManager: React.FC<ArticleManagerProps> = ({ onBack }) => {
    const {
        articles,
        loading,
        error,
        fetchArticles,
        createArticle,
        updateArticle,
        deleteArticle,
        publishArticle,
        unpublishArticle,
        generateSlug
    } = useArticles();

    const [isEditing, setIsEditing] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [tagsInput, setTagsInput] = useState('');

    useEffect(() => {
        fetchArticles(true); // Include unpublished articles for admin
    }, []);

    const filteredArticles = articles.filter(article => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'published') return article.is_published;
        if (selectedFilter === 'draft') return !article.is_published;
        return true;
    });

    const handleAdd = () => {
        setEditingArticle({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            featured_image_url: null,
            author: 'The Peppy Lab',
            category: CATEGORIES[0],
            tags: [],
            is_published: false,
            published_at: null
        });
        setTagsInput('');
        setIsEditing(true);
    };

    const handleEdit = (article: Article) => {
        setEditingArticle({ ...article });
        setTagsInput(article.tags?.join(', ') || '');
        setIsEditing(true);
    };

    const handleTitleChange = (title: string) => {
        setEditingArticle({
            ...editingArticle,
            title,
            slug: editingArticle?.id ? editingArticle.slug : generateSlug(title)
        });
    };

    const handleTagsChange = (value: string) => {
        setTagsInput(value);
        const tags = value.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
        setEditingArticle({ ...editingArticle, tags });
    };

    const handleSave = async () => {
        if (!editingArticle?.title || !editingArticle?.excerpt || !editingArticle?.content) {
            alert('Please fill in title, excerpt, and content.');
            return;
        }

        if (!editingArticle.slug) {
            setEditingArticle({ ...editingArticle, slug: generateSlug(editingArticle.title) });
        }

        setSaving(true);
        try {
            const articleData = {
                ...editingArticle,
                slug: editingArticle.slug || generateSlug(editingArticle.title)
            };

            if (editingArticle.id) {
                await updateArticle(editingArticle.id, articleData);
            } else {
                await createArticle(articleData as Omit<Article, 'id' | 'view_count' | 'created_at' | 'updated_at'>);
            }
            setIsEditing(false);
            setEditingArticle(null);
            setTagsInput('');
        } catch (err) {
            console.error('Error saving article:', err);
            alert('Failed to save article. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteArticle(id);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting article:', err);
            alert('Failed to delete article.');
        }
    };

    const handleTogglePublish = async (article: Article) => {
        try {
            if (article.is_published) {
                await unpublishArticle(article.id);
            } else {
                await publishArticle(article.id);
            }
        } catch (err) {
            console.error('Error toggling article publish status:', err);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Draft';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-theme-accent border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (isEditing && editingArticle) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-theme-text">
                        {editingArticle.id ? 'Edit Article' : 'Add New Article'}
                    </h2>
                    <button
                        onClick={() => { setIsEditing(false); setEditingArticle(null); setTagsInput(''); }}
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
                            value={editingArticle.title || ''}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="Article title"
                        />
                    </div>

                    {/* Slug */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">/articles/</span>
                            <input
                                type="text"
                                value={editingArticle.slug || ''}
                                onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent font-mono text-sm"
                                placeholder="article-url-slug"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={editingArticle.category || CATEGORIES[0]}
                            onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                        <input
                            type="text"
                            value={editingArticle.author || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="Author name"
                        />
                    </div>

                    {/* Featured Image URL */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                        <input
                            type="text"
                            value={editingArticle.featured_image_url || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, featured_image_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => handleTagsChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            placeholder="peptides, health, tips"
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Excerpt <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editingArticle.excerpt || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                            rows={2}
                            placeholder="Brief summary for article listings..."
                        />
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content (Markdown) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={editingArticle.content || ''}
                            onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent font-mono text-sm"
                            rows={15}
                            placeholder="# Article Title&#10;&#10;## Introduction&#10;&#10;Your content here..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Supports markdown: # Headers, **bold**, *italic*, - lists, [links](url)
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={editingArticle.is_published ?? false}
                            onChange={(e) => setEditingArticle({
                                ...editingArticle,
                                is_published: e.target.checked,
                                published_at: e.target.checked && !editingArticle.published_at ? new Date().toISOString() : editingArticle.published_at
                            })}
                            className="w-4 h-4 text-theme-accent border-gray-300 rounded focus:ring-theme-accent"
                        />
                        <span className="text-sm text-gray-700">Publish immediately</span>
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setIsEditing(false); setEditingArticle(null); setTagsInput(''); }}
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
                            {saving ? 'Saving...' : 'Save Article'}
                        </button>
                    </div>
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
                    <h2 className="text-xl font-semibold text-theme-text">Manage Articles</h2>
                </div>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Article
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'published', 'draft'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${selectedFilter === filter
                                ? 'bg-theme-accent text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {filter} ({filter === 'all' ? articles.length : articles.filter(a => filter === 'published' ? a.is_published : !a.is_published).length})
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>
            )}

            {/* Articles List */}
            <div className="space-y-3">
                {filteredArticles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No articles yet. Click "Add Article" to create one.</p>
                    </div>
                ) : (
                    filteredArticles.map(article => (
                        <div
                            key={article.id}
                            className="bg-white rounded-lg border p-4 flex items-start gap-4"
                        >
                            {/* Thumbnail */}
                            <div className="w-20 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                {article.featured_image_url ? (
                                    <img src={article.featured_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-theme-text truncate">{article.title}</h3>
                                    {article.is_published ? (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            Published
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{article.excerpt}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span>{article.category}</span>
                                    <span>•</span>
                                    <span>{formatDate(article.published_at)}</span>
                                    <span>•</span>
                                    <span>{article.view_count || 0} views</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleTogglePublish(article)}
                                    className={`p-2 transition-colors ${article.is_published ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                                    title={article.is_published ? 'Unpublish' : 'Publish'}
                                >
                                    {article.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(article)}
                                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(article.id)}
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
                        <h3 className="text-lg font-semibold text-theme-text mb-2">Delete Article?</h3>
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

export default ArticleManager;
