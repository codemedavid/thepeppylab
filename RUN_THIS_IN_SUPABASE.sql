-- ============================================================
-- PEPTIDE ASSESSMENT SETUP
-- Run this entire file in the Supabase SQL Editor.
-- The assessment fails because these tables don't exist yet.
-- ============================================================

-- Create assessment_responses table
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    age_range TEXT,
    location TEXT,
    goals TEXT[] DEFAULT '{}',
    medical_history TEXT[] DEFAULT '{}',
    experience_level TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    consent_agreed BOOLEAN DEFAULT false,
    recommendation_generated JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('new', 'reviewed', 'contacted')) DEFAULT 'new'
);

-- Create recommendation_rules table
CREATE TABLE IF NOT EXISTS public.recommendation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    target_goal TEXT,
    target_experience TEXT,
    primary_product_id TEXT,
    secondary_product_ids TEXT[] DEFAULT '{}',
    educational_note TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;

-- Policies for assessment_responses
DROP POLICY IF EXISTS "Allow anonymous insert for assessment_responses" ON public.assessment_responses;
CREATE POLICY "Allow anonymous insert for assessment_responses"
ON public.assessment_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.assessment_responses;
CREATE POLICY "Allow read access for authenticated users"
ON public.assessment_responses
FOR SELECT
TO authenticated
USING (true);

-- Policies for recommendation_rules
DROP POLICY IF EXISTS "Allow public read access for recommendation_rules" ON public.recommendation_rules;
CREATE POLICY "Allow public read access for recommendation_rules"
ON public.recommendation_rules
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated full access for recommendation_rules" ON public.recommendation_rules;
CREATE POLICY "Allow authenticated full access for recommendation_rules"
ON public.recommendation_rules
FOR ALL
TO authenticated
USING (true);
