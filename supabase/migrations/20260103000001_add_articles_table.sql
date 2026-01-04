-- Create articles table for Article Knowledge Hub
-- This table stores blog posts, educational articles, and news

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE, -- SEO-friendly URL
  excerpt text NOT NULL, -- Short summary for listings
  content text NOT NULL, -- Markdown/rich text content
  featured_image_url text,
  author text NOT NULL DEFAULT 'The Peppy Lab',
  category text NOT NULL DEFAULT 'General',
  tags text[] DEFAULT '{}', -- Array of tags
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous/public read access (published articles only)
CREATE POLICY "Allow public read published articles" ON public.articles
  FOR SELECT TO anon USING (is_published = true);

-- Create policy for authenticated users to read all articles (including drafts)
CREATE POLICY "Allow authenticated read all articles" ON public.articles
  FOR SELECT TO authenticated USING (true);

-- Create policy for authenticated users to manage articles
CREATE POLICY "Allow authenticated insert articles" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update articles" ON public.articles
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete articles" ON public.articles
  FOR DELETE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS articles_slug_idx ON public.articles (slug);
CREATE INDEX IF NOT EXISTS articles_category_idx ON public.articles (category);
CREATE INDEX IF NOT EXISTS articles_published_idx ON public.articles (is_published);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles (published_at DESC);
CREATE INDEX IF NOT EXISTS articles_tags_idx ON public.articles USING GIN (tags);
CREATE INDEX IF NOT EXISTS articles_created_at_idx ON public.articles (created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_article_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.articles TO authenticated;
GRANT ALL ON public.articles TO authenticated;

-- Insert sample articles
INSERT INTO public.articles (title, slug, excerpt, content, author, category, tags, is_published, published_at) VALUES
('Understanding GLP-1 Peptides: A Complete Guide',
 'understanding-glp1-peptides-complete-guide',
 'Learn everything you need to know about GLP-1 peptides, their benefits, and how they work for weight management.',
 '# Understanding GLP-1 Peptides: A Complete Guide

## Introduction

GLP-1 (Glucagon-Like Peptide-1) peptides have revolutionized the approach to weight management and metabolic health. In this comprehensive guide, we''ll explore what they are, how they work, and what benefits they offer.

## What is GLP-1?

GLP-1 is a naturally occurring hormone produced in your intestines after eating. It plays several important roles:

- **Regulates blood sugar** by stimulating insulin release
- **Reduces appetite** by signaling fullness to the brain
- **Slows digestion** to promote satiety

## Popular GLP-1 Peptides

### Tirzepatide
A dual-action peptide that targets both GLP-1 and GIP receptors, offering enhanced benefits for weight management.

### Semaglutide
A GLP-1 receptor agonist that has shown remarkable results in clinical studies.

## Benefits

1. **Weight Management**: Clinical studies show significant weight loss
2. **Blood Sugar Control**: Helps maintain healthy glucose levels
3. **Appetite Reduction**: Natural decrease in hunger signals
4. **Cardiovascular Health**: Potential heart health benefits

## How to Use

Always consult with a healthcare professional before starting any peptide regimen. Proper dosing and administration are crucial for safety and effectiveness.

## Conclusion

GLP-1 peptides represent an exciting advancement in metabolic health. With proper guidance and use, they can be a valuable tool in your wellness journey.',
 'The Peppy Lab',
 'Education',
 ARRAY['peptides', 'glp-1', 'weight-loss', 'health'],
 true,
 now()),

('5 Tips for First-Time Peptide Users',
 '5-tips-first-time-peptide-users',
 'New to peptides? Here are essential tips to help you get started safely and effectively.',
 '# 5 Tips for First-Time Peptide Users

Starting your peptide journey can feel overwhelming. Here are five essential tips to help you get started on the right foot.

## Tip 1: Do Your Research

Before purchasing any peptide, thoroughly research:
- What it does
- Potential side effects
- Proper storage requirements
- Reconstitution instructions

## Tip 2: Choose Quality Sources

Not all peptides are created equal. Look for:
- Third-party testing
- Certificates of Analysis (COA)
- Transparent sourcing
- Good customer reviews

## Tip 3: Start Low and Go Slow

When beginning any peptide regimen:
- Start with the lowest recommended dose
- Monitor your body''s response
- Increase gradually if needed
- Keep a journal of effects

## Tip 4: Proper Storage is Critical

Peptides are delicate molecules:
- Store unreconstituted peptides in freezer or refrigerator
- Keep reconstituted peptides refrigerated
- Avoid temperature fluctuations
- Protect from light

## Tip 5: Consult a Professional

Always speak with a healthcare provider who understands peptides:
- Get proper dosing guidance
- Monitor for any issues
- Adjust your protocol as needed

## Final Thoughts

Taking the time to educate yourself and prepare properly will set you up for the best possible experience with peptides.',
 'The Peppy Lab',
 'Guides',
 ARRAY['beginner', 'tips', 'safety', 'peptides'],
 true,
 now() - interval '2 days'),

('The Science Behind Peptide Therapy',
 'science-behind-peptide-therapy',
 'Dive deep into the scientific mechanisms that make peptide therapy effective for various health goals.',
 '# The Science Behind Peptide Therapy

## What Makes Peptides Special?

Peptides are short chains of amino acids, typically containing 2-50 amino acids linked by peptide bonds. Unlike larger proteins, their smaller size allows for:

- Better absorption
- Targeted action
- Specific biological effects

## How Peptides Work

### Cell Signaling

Peptides act as signaling molecules, binding to specific receptors on cell surfaces. This triggers cascades of biological responses within the cell.

### Receptor Specificity

Each peptide has a unique structure that determines which receptors it can bind to. This specificity is what allows for targeted therapeutic effects.

## Types of Therapeutic Peptides

### Metabolic Peptides
- GLP-1 analogs
- Tirzepatide
- Growth hormone-releasing peptides

### Skin Health Peptides
- Collagen peptides
- Copper peptides
- Matrixyl

### Performance Peptides
- BPC-157
- TB-500

## The Future of Peptide Therapy

Research continues to unlock new applications for peptide therapy, from anti-aging to recovery and beyond.

## Conclusion

Understanding the science helps you appreciate why proper use and quality matter so much in peptide therapy.',
 'The Peppy Lab',
 'Science',
 ARRAY['science', 'research', 'peptides', 'therapy'],
 true,
 now() - interval '5 days');
