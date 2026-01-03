import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image_url: string | null;
    author: string;
    category: string;
    tags: string[];
    is_published: boolean;
    published_at: string | null;
    view_count: number;
    created_at: string;
    updated_at: string;
}

export const useArticles = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchArticles = useCallback(async (includeUnpublished = false) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('articles')
                .select('*')
                .order('published_at', { ascending: false, nullsFirst: false });

            if (!includeUnpublished) {
                query = query.eq('is_published', true);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setArticles(data || []);
        } catch (err) {
            console.error('Error fetching articles:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    }, []);

    const getArticleBySlug = useCallback(async (slug: string): Promise<Article | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('articles')
                .select('*')
                .eq('slug', slug)
                .single();

            if (fetchError) throw fetchError;

            // Increment view count
            if (data) {
                await supabase
                    .from('articles')
                    .update({ view_count: (data.view_count || 0) + 1 })
                    .eq('id', data.id);
            }

            return data;
        } catch (err) {
            console.error('Error fetching article:', err);
            return null;
        }
    }, []);

    const getArticleById = useCallback(async (id: string): Promise<Article | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Error fetching article:', err);
            return null;
        }
    }, []);

    const createArticle = useCallback(async (article: Omit<Article, 'id' | 'view_count' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const { data, error: createError } = await supabase
                .from('articles')
                .insert([article])
                .select()
                .single();

            if (createError) throw createError;
            await fetchArticles(true);
            return data;
        } catch (err) {
            console.error('Error creating article:', err);
            setError(err instanceof Error ? err.message : 'Failed to create article');
            throw err;
        }
    }, [fetchArticles]);

    const updateArticle = useCallback(async (id: string, updates: Partial<Article>) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('articles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchArticles(true);
            return data;
        } catch (err) {
            console.error('Error updating article:', err);
            setError(err instanceof Error ? err.message : 'Failed to update article');
            throw err;
        }
    }, [fetchArticles]);

    const deleteArticle = useCallback(async (id: string) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchArticles(true);
        } catch (err) {
            console.error('Error deleting article:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete article');
            throw err;
        }
    }, [fetchArticles]);

    const publishArticle = useCallback(async (id: string) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('articles')
                .update({
                    is_published: true,
                    published_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchArticles(true);
            return data;
        } catch (err) {
            console.error('Error publishing article:', err);
            setError(err instanceof Error ? err.message : 'Failed to publish article');
            throw err;
        }
    }, [fetchArticles]);

    const unpublishArticle = useCallback(async (id: string) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('articles')
                .update({ is_published: false })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchArticles(true);
            return data;
        } catch (err) {
            console.error('Error unpublishing article:', err);
            setError(err instanceof Error ? err.message : 'Failed to unpublish article');
            throw err;
        }
    }, [fetchArticles]);

    const generateSlug = useCallback((title: string): string => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }, []);

    const getCategories = useCallback(() => {
        const uniqueCategories = [...new Set(articles.map(a => a.category))];
        return uniqueCategories.sort();
    }, [articles]);

    const getAllTags = useCallback(() => {
        const allTags = articles.flatMap(a => a.tags || []);
        const uniqueTags = [...new Set(allTags)];
        return uniqueTags.sort();
    }, [articles]);

    const searchArticles = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase();
        return articles.filter(article =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.excerpt.toLowerCase().includes(lowerQuery) ||
            article.content.toLowerCase().includes(lowerQuery) ||
            article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }, [articles]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    return {
        articles,
        loading,
        error,
        fetchArticles,
        getArticleBySlug,
        getArticleById,
        createArticle,
        updateArticle,
        deleteArticle,
        publishArticle,
        unpublishArticle,
        generateSlug,
        getCategories,
        getAllTags,
        searchArticles,
        refetch: () => fetchArticles(true)
    };
};
