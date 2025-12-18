-- Add medical_history column to assessment_responses table
ALTER TABLE public.assessment_responses 
ADD COLUMN IF NOT EXISTS medical_history TEXT[] DEFAULT '{}';
