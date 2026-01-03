import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Guide {
    id: string;
    title: string;
    description: string;
    category: string;
    content: string;
    thumbnail_url: string | null;
    pdf_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export const useGuides = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGuides = useCallback(async (includeInactive = false) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('guides')
                .select('*')
                .order('sort_order', { ascending: true });

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setGuides(data || []);
        } catch (err) {
            console.error('Error fetching guides:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch guides');
        } finally {
            setLoading(false);
        }
    }, []);

    const getGuideById = useCallback(async (id: string): Promise<Guide | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('guides')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Error fetching guide:', err);
            return null;
        }
    }, []);

    const createGuide = useCallback(async (guide: Omit<Guide, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const { data, error: createError } = await supabase
                .from('guides')
                .insert([guide])
                .select()
                .single();

            if (createError) throw createError;
            await fetchGuides(true);
            return data;
        } catch (err) {
            console.error('Error creating guide:', err);
            setError(err instanceof Error ? err.message : 'Failed to create guide');
            throw err;
        }
    }, [fetchGuides]);

    const updateGuide = useCallback(async (id: string, updates: Partial<Guide>) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('guides')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchGuides(true);
            return data;
        } catch (err) {
            console.error('Error updating guide:', err);
            setError(err instanceof Error ? err.message : 'Failed to update guide');
            throw err;
        }
    }, [fetchGuides]);

    const deleteGuide = useCallback(async (id: string) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('guides')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchGuides(true);
        } catch (err) {
            console.error('Error deleting guide:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete guide');
            throw err;
        }
    }, [fetchGuides]);

    const getCategories = useCallback(() => {
        const uniqueCategories = [...new Set(guides.map(g => g.category))];
        return uniqueCategories.sort();
    }, [guides]);

    useEffect(() => {
        fetchGuides();
    }, [fetchGuides]);

    return {
        guides,
        loading,
        error,
        fetchGuides,
        getGuideById,
        createGuide,
        updateGuide,
        deleteGuide,
        getCategories,
        refetch: () => fetchGuides(true)
    };
};
