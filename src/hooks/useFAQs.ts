import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const useFAQs = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFAQs = useCallback(async (includeInactive = false) => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('faqs')
                .select('*')
                .order('order_index', { ascending: true });

            if (!includeInactive) {
                query = query.eq('is_active', true);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setFaqs(data || []);
        } catch (err) {
            console.error('Error fetching FAQs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch FAQs');
        } finally {
            setLoading(false);
        }
    }, []);

    const createFAQ = useCallback(async (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const { data, error: createError } = await supabase
                .from('faqs')
                .insert([faq])
                .select()
                .single();

            if (createError) throw createError;
            await fetchFAQs(true);
            return data;
        } catch (err) {
            console.error('Error creating FAQ:', err);
            setError(err instanceof Error ? err.message : 'Failed to create FAQ');
            throw err;
        }
    }, [fetchFAQs]);

    const updateFAQ = useCallback(async (id: string, updates: Partial<FAQ>) => {
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('faqs')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchFAQs(true);
            return data;
        } catch (err) {
            console.error('Error updating FAQ:', err);
            setError(err instanceof Error ? err.message : 'Failed to update FAQ');
            throw err;
        }
    }, [fetchFAQs]);

    const deleteFAQ = useCallback(async (id: string) => {
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('faqs')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchFAQs(true);
        } catch (err) {
            console.error('Error deleting FAQ:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete FAQ');
            throw err;
        }
    }, [fetchFAQs]);

    const reorderFAQs = useCallback(async (reorderedFaqs: FAQ[]) => {
        try {
            setError(null);
            const updates = reorderedFaqs.map((faq, index) => ({
                id: faq.id,
                order_index: index + 1
            }));

            for (const update of updates) {
                await supabase
                    .from('faqs')
                    .update({ order_index: update.order_index })
                    .eq('id', update.id);
            }

            await fetchFAQs(true);
        } catch (err) {
            console.error('Error reordering FAQs:', err);
            setError(err instanceof Error ? err.message : 'Failed to reorder FAQs');
            throw err;
        }
    }, [fetchFAQs]);

    const getCategories = useCallback(() => {
        const uniqueCategories = [...new Set(faqs.map(f => f.category))];
        return uniqueCategories.sort();
    }, [faqs]);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    return {
        faqs,
        loading,
        error,
        fetchFAQs,
        createFAQ,
        updateFAQ,
        deleteFAQ,
        reorderFAQs,
        getCategories,
        refetch: () => fetchFAQs(true)
    };
};
