# Peptide Assessment Functionality - Export Package

This document contains all the files and code needed to duplicate the peptide assessment functionality to another project.

---

## 📁 Files to Copy

1. `src/pages/AssessmentWizard.tsx` - The main assessment wizard form
2. `src/pages/AssessmentResults.tsx` - The results/recommendation page
3. Database migration files (run in Supabase)

---

## 📋 Required Types (Add to your types/index.ts)

```typescript
// Assessment Types
export interface AssessmentResponse {
  id: string;
  full_name: string;
  email: string;
  age_range: string;
  location: string;
  goals: string[];
  medical_history: string[];
  experience_level: string;
  preferences: {
    budget?: string;
    frequency?: string;
    [key: string]: any;
  };
  consent_agreed: boolean;
  recommendation_generated?: any;
  created_at: string;
  status: 'new' | 'reviewed' | 'contacted';
}

export interface RecommendationRule {
  id: string;
  rule_name: string;
  target_goal: string;
  target_experience: string;
  primary_product_id: string | null;
  secondary_product_ids: string[] | null;
  educational_note: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}
```

---

## 🗄️ Database SQL (Run in Supabase SQL Editor)

```sql
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
CREATE POLICY "Allow anonymous insert for assessment_responses"
ON public.assessment_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow read access for authenticated users"
ON public.assessment_responses
FOR SELECT
TO authenticated
USING (true);

-- Policies for recommendation_rules
CREATE POLICY "Allow public read access for recommendation_rules"
ON public.recommendation_rules
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated full access for recommendation_rules"
ON public.recommendation_rules
FOR ALL
TO authenticated
USING (true);
```

---

## 🛣️ Routes (Add to your App.tsx or router)

```tsx
import AssessmentWizard from './pages/AssessmentWizard';
import AssessmentResults from './pages/AssessmentResults';

// Add these routes
<Route path="/assessment" element={<AssessmentWizard />} />
<Route path="/assessment/results" element={<AssessmentResults />} />
```

---

## 📦 Dependencies Required

Make sure your project has these dependencies:
- `react-router-dom` - For navigation
- `@supabase/supabase-js` - For database
- `lucide-react` - For icons (ChevronRight, ChevronLeft, Check, AlertCircle, ShieldCheck, etc.)

---

## 🎨 CSS Classes Used

The components use these custom CSS classes that you may need to add to your styles:

```css
/* Buttons */
.btn-primary {
  @apply px-6 py-3 bg-theme-accent text-white rounded-lg font-medium 
         hover:bg-theme-accent/90 transition-colors;
}

.btn-secondary {
  @apply px-6 py-3 border border-gray-300 rounded-lg font-medium 
         text-gray-600 hover:border-theme-text transition-colors;
}

/* Input fields */
.input-field {
  @apply w-full px-4 py-3 border border-gray-200 rounded-lg 
         focus:ring-2 focus:ring-theme-accent focus:border-transparent;
}

/* Card */
.card {
  @apply bg-white rounded-2xl shadow-lg;
}

/* Theme colors (add to tailwind.config.js) */
theme: {
  extend: {
    colors: {
      'theme-text': '#1a1a2e',
      'theme-bg': '#f8f9fa',
      'theme-accent': '#your-accent-color',
      'theme-secondary': '#your-secondary-color',
    }
  }
}

/* Animation */
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Spinner */
.spinner {
  border-width: 3px;
  border-style: solid;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## ⚙️ Configuration Required

### 1. Supabase Client Setup

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. Environment Variables

Add to your `.env`:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🔧 Customization Points

### Goals (in AssessmentWizard.tsx)
```typescript
const GOALS = [
    'Weight Loss',
    'Muscle Gain',
    'Anti-Aging/Longevity',
    'Energy & Focus',
    'Better Sleep',
    'Injury Recovery',
    'Skin Health',
];
```

### Medical Conditions (in AssessmentWizard.tsx)
```typescript
const MEDICAL_CONDITIONS = [
    'Cancer',
    'Diabetes',
    'Heart Condition',
    'Kidney Issues',
    'Liver Issues',
    'Pregnant / Nursing',
    'None of the above',
];
```

### Recommendation Mapping (in AssessmentResults.tsx)
```typescript
const RECOMMENDATION_MAP: Record<string, string[]> = {
    'Weight Loss': ['Semaglutide', 'Tirzepatide', 'Retatrutide', 'Cagrilintide', 'Mazdutide'],
    'Muscle Gain': ['CJC-1295', 'Ipamorelin', 'Tesamorelin', 'IGF-1', 'MK-677'],
    'Anti-Aging/Longevity': ['Epitalon', 'GHK-Cu', 'NAD+', 'Thymalin', 'Foxo4'],
    'Energy & Focus': ['NAD+', 'Semax', 'Selank', 'SS-31'],
    'Better Sleep': ['DSIP', 'Epitalon', 'CJC-1295'],
    'Injury Recovery': ['BPC-157', 'TB-500', 'GHK-Cu'],
    'Skin Health': ['GHK-Cu', 'Melanotan', 'Epitalon'],
};
```

---

## 📝 Assessment Flow

1. **Intro Screen** (Step 0) - Welcome message
2. **Consent** (Step 1) - Terms acceptance
3. **Personal Info** (Step 2) - Name, email, age, location
4. **Medical History** (Step 3) - Health conditions check
5. **Goals & Experience** (Step 4) - Select goals and experience level
6. **Preferences** (Step 5) - Frequency preferences
7. **Submit** - Saves to database, redirects to results
8. **Results Page** - Shows personalized product recommendations

---

## 🔗 Required Hooks/Components

The `AssessmentResults.tsx` uses these hooks that you'll need in your project:

```typescript
// useMenu hook - fetches products/menu items
import { useMenu } from '../hooks/useMenu';

// useCart hook - cart functionality
import { useCart } from '../hooks/useCart';
```

If you don't have these, you can simplify the results page to just show goals and skip the product recommendations.

---

## ✅ Quick Start Checklist

- [ ] Copy `AssessmentWizard.tsx` to `src/pages/`
- [ ] Copy `AssessmentResults.tsx` to `src/pages/`
- [ ] Add TypeScript types to `src/types/index.ts`
- [ ] Run SQL in Supabase SQL Editor
- [ ] Add routes to your App.tsx
- [ ] Set up Supabase client if not already done
- [ ] Add required CSS classes
- [ ] Customize goals, medical conditions, and recommendations as needed
