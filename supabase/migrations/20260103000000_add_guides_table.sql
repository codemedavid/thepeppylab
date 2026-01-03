-- Create guides table for Electronic Guide section
-- This table stores educational content, how-to guides, and resources

CREATE TABLE IF NOT EXISTS public.guides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  content text NOT NULL, -- Markdown/rich text content
  thumbnail_url text,
  pdf_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (active guides only)
CREATE POLICY "Allow public read active guides" ON public.guides
  FOR SELECT USING (is_active = true);

-- Create policy for authenticated users to manage guides
CREATE POLICY "Allow authenticated insert guides" ON public.guides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update guides" ON public.guides
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete guides" ON public.guides
  FOR DELETE USING (true);

-- Create policy for authenticated users to read all guides (including inactive)
CREATE POLICY "Allow authenticated read all guides" ON public.guides
  FOR SELECT TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS guides_category_idx ON public.guides (category);
CREATE INDEX IF NOT EXISTS guides_active_idx ON public.guides (is_active);
CREATE INDEX IF NOT EXISTS guides_sort_order_idx ON public.guides (sort_order ASC);
CREATE INDEX IF NOT EXISTS guides_created_at_idx ON public.guides (created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guides_updated_at ON public.guides;
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW
  EXECUTE FUNCTION update_guides_updated_at();

-- Grant permissions
GRANT SELECT ON public.guides TO anon;
GRANT SELECT ON public.guides TO authenticated;
GRANT ALL ON public.guides TO authenticated;

-- Insert sample guides
INSERT INTO public.guides (title, description, category, content, is_active, sort_order) VALUES
('Getting Started with Peptides', 
 'A beginner''s guide to understanding peptides and their benefits.',
 'Beginner',
 '# Getting Started with Peptides

## What are Peptides?

Peptides are short chains of amino acids that serve as building blocks of proteins. They play crucial roles in various biological functions.

## Benefits

- **Weight Management**: Support metabolic health
- **Skin Health**: Promote collagen production
- **Recovery**: Aid in muscle recovery
- **Wellness**: Overall health optimization

## How to Use

1. Consult with a healthcare professional
2. Start with the recommended dosage
3. Store properly in refrigeration
4. Follow the usage schedule

## Safety Tips

- Always purchase from verified sources
- Check COA (Certificate of Analysis)
- Monitor your body''s response
- Stay hydrated',
 true, 1),

('Reconstitution Guide',
 'Step-by-step instructions for properly reconstituting peptides.',
 'How-To',
 '# How to Reconstitute Peptides

## Materials Needed

- Peptide vial
- Bacteriostatic water (BAC water)
- Insulin syringe
- Alcohol swabs

## Steps

### Step 1: Preparation
Clean your workspace and wash hands thoroughly.

### Step 2: Gather Materials
- Peptide vial
- BAC water
- Sterile syringe (insulin type preferred)
- Alcohol swabs

### Step 3: Draw BAC Water
Draw the recommended amount of bacteriostatic water into the syringe.

### Step 4: Add Water to Vial
Inject the water slowly against the side of the vial. Do not shake!

### Step 5: Let it Dissolve
Allow the peptide to dissolve naturally - this may take a few minutes.

### Step 6: Storage
Store reconstituted peptide in the refrigerator at 2-8°C.

## Important Notes

- Never freeze reconstituted peptides
- Use within 4-6 weeks after reconstitution
- Always use sterile technique',
 true, 2),

('Storage & Handling',
 'Best practices for storing and handling peptides safely.',
 'Safety',
 '# Peptide Storage & Handling Guide

## Unreconstituted Peptides

- **Temperature**: Store at -20°C for long-term, 2-8°C for short-term
- **Light**: Keep away from direct light
- **Duration**: Can last 2+ years when properly stored

## Reconstituted Peptides

- **Temperature**: Always refrigerate at 2-8°C
- **Duration**: Use within 4-6 weeks
- **Never freeze**: Freezing damages reconstituted peptides

## Travel Tips

- Use insulated bags with ice packs
- Minimize time outside refrigeration
- Avoid direct sunlight

## Signs of Degradation

- Cloudy appearance
- Unusual odor
- Particles in solution

If you notice any of these signs, do not use the peptide.',
 true, 3);
