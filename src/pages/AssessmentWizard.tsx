import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Adjust path if needed
import { ChevronRight, ChevronLeft, Check, AlertCircle, ShieldCheck } from 'lucide-react';

interface AssessmentFormData {
    full_name: string;
    email: string;
    age_range: string;
    location: string;
    goals: string[];
    medical_history: string[]; // Added
    experience_level: string;
    preferences: {
        budget?: string;
        frequency?: string;
        [key: string]: any;
    };
    consent_agreed: boolean;
}

const INITIAL_DATA: AssessmentFormData = {
    full_name: '',
    email: '',
    age_range: '',
    location: '',
    goals: [],
    medical_history: [],
    experience_level: '',
    preferences: {
        budget: '',
        frequency: '',
    },
    consent_agreed: false,
};

// Options for the form
const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+'];
const GOALS = [
    'Weight Loss',
    'Muscle Gain',
    'Anti-Aging/Longevity',
    'Energy & Focus',
    'Better Sleep',
    'Injury Recovery',
    'Skin Health',
];
const EXPERIENCE_LEVELS = [
    { value: 'Beginner', label: 'New to Peptides', desc: 'I have never used peptides before.' },
    { value: 'Intermediate', label: 'Some Experience', desc: 'I have used peptides a few times.' },
    { value: 'Advanced', label: 'Experienced User', desc: 'I use peptides regularly.' },
];
const MEDICAL_CONDITIONS = [
    'Cancer',
    'Diabetes',
    'Heart Condition',
    'Kidney Issues',
    'Liver Issues',
    'Pregnant / Nursing',
    'None of the above',
];

const BUDGET_RANGES = ['Low (Budget-conscious)', 'Medium (Standard)', 'High (Premium)'];
const FREQUENCIES = ['Daily', 'Weekly', 'As needed'];

const TermsAndConditions: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="space-y-6 animate-fadeIn transition-all duration-300">
            <button
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-theme-text transition-colors mb-4 group"
            >
                <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Assessment
            </button>

            <h2 className="text-2xl font-bold text-theme-text mb-6">Terms and Conditions</h2>

            <div className="space-y-6 text-gray-700 leading-relaxed overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <section>
                    <h3 className="font-bold text-theme-text mb-2">1. Acceptance of Terms</h3>
                    <p>By accessing and using Peptology.ph, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">2. Research Purposes Only</h3>
                    <p>All peptides sold on this website are for research purposes only. They are not intended for human consumption, medical use, or any therapeutic application. By purchasing from Peptology.ph, you acknowledge that you are a qualified researcher or institution.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">3. Assessment Disclaimer</h3>
                    <p>The peptide assessment tool is for informational and educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before starting any new health regimen or supplement program.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">4. Product Information</h3>
                    <p>While we strive to provide accurate product information, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">5. Limitation of Liability</h3>
                    <p>Peptology.ph shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">6. Age Restriction</h3>
                    <p>You must be at least 18 years old to use this website and purchase products.</p>
                </section>

                <section>
                    <h3 className="font-bold text-theme-text mb-2">7. Contact Information</h3>
                    <p>If you have any questions about these Terms and Conditions, please contact us at support@peptology.ph</p>
                </section>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button onClick={onBack} className="btn-secondary">
                    Close
                </button>
            </div>
        </div>
    );
};

const AssessmentWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Intro, 1: Consent, 2: Personal, 3: Medical, 4: Goals, 5: Preferences
    const [showTerms, setShowTerms] = useState(false);
    const [formData, setFormData] = useState<AssessmentFormData>({
        ...INITIAL_DATA,
        medical_history: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateField = (field: keyof AssessmentFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const updatePreference = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            preferences: { ...prev.preferences, [key]: value },
        }));
    };

    const toggleGoal = (goal: string) => {
        setFormData((prev) => {
            const currentGoals = prev.goals;
            if (currentGoals.includes(goal)) {
                return { ...prev, goals: currentGoals.filter((g) => g !== goal) };
            } else {
                return { ...prev, goals: [...currentGoals, goal] };
            }
        });
    };

    const toggleMedical = (condition: string) => {
        setFormData((prev) => {
            const currentConditions = prev.medical_history || [];

            // Logic: If 'None' is selected, clear others. If other selected, clear 'None'.
            if (condition === 'None of the above') {
                return { ...prev, medical_history: ['None of the above'] };
            } else {
                let newConditions = [...currentConditions];
                // Remove 'None' if it exists
                newConditions = newConditions.filter(c => c !== 'None of the above');

                if (newConditions.includes(condition)) {
                    newConditions = newConditions.filter(c => c !== condition);
                } else {
                    newConditions.push(condition);
                }
                return { ...prev, medical_history: newConditions };
            }
        });
    };

    const nextStep = () => {
        // Validation before next
        if (step === 1) { // Consent Step
            if (!formData.consent_agreed) {
                setError('You must accept the terms to proceed.');
                return;
            }
        }
        if (step === 2) { // Personal Info Step
            if (!formData.full_name || !formData.email || !formData.age_range) {
                setError('Please fill in all required fields.');
                return;
            }
        }
        if (step === 3) { // Medical History Step (New)
            if (!formData.medical_history || formData.medical_history.length === 0) {
                setError('Please select at least one option (or "None").');
                return;
            }
        }
        setError(null);
        setStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setError(null);
        setStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        // Final check just in case
        if (!formData.consent_agreed) {
            setError('You must agree to the disclaimer to proceed.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('assessment_responses')
                .insert([
                    {
                        full_name: formData.full_name,
                        email: formData.email,
                        age_range: formData.age_range,
                        location: formData.location,
                        goals: formData.goals,
                        medical_history: formData.medical_history, // Add this
                        experience_level: formData.experience_level,
                        preferences: formData.preferences,
                        consent_agreed: formData.consent_agreed,
                        status: 'new',
                        recommendation_generated: null
                    },
                ]);

            if (insertError) throw insertError;

            // Note: We cannot get the ID back without SELECT permissions (which anon users don't have).
            // We pass the local form data to the results page.
            navigate('/assessment/results', {
                state: {
                    assessmentData: {
                        ...formData,
                        status: 'new',
                        created_at: new Date().toISOString()
                    }
                }
            });
        } catch (err: any) {
            console.error('Error submitting assessment:', err);
            setError('Failed to submit assessment. Please try again. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderStep = () => {
        if (showTerms) {
            return <TermsAndConditions onBack={() => setShowTerms(false)} />;
        }

        switch (step) {
            case 0: // Intro
                return (
                    <div className="text-center space-y-6 animate-fadeIn py-8">
                        <div className="w-20 h-20 bg-theme-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🧬</span>
                        </div>
                        <h2 className="text-3xl font-bold text-theme-text">Peptide Compatibility Assessment</h2>
                        <p className="text-gray-600 max-w-lg mx-auto text-lg">
                            Discover the perfect peptide protocol tailored to your unique goals and physiology.
                            Complete this 2-minute assessment to get a personalized recommendation.
                        </p>
                        <button onClick={nextStep} className="btn-primary mt-8 flex items-center gap-2 mx-auto">
                            Start Assessment <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 1: // Consent
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-theme-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-theme-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-theme-text">Thank you for choosing The Peppy Lab!</h2>
                            <p className="text-gray-600 mt-2">Let's start by reviewing our terms and consent</p>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-sm text-orange-900 leading-relaxed shadow-sm">
                            <div className="flex items-center gap-2 mb-3 text-orange-700 font-bold text-lg">
                                <AlertCircle className="w-5 h-5" /> Important Notice
                            </div>
                            <p className="mb-4">
                                By clicking "I accept," you agree to our{' '}
                                <button
                                    onClick={() => setShowTerms(true)}
                                    className="font-bold underline cursor-pointer hover:text-orange-700"
                                >
                                    Terms and Conditions
                                </button>
                                , Privacy Policy, and consent to receive personalized peptide recommendations based on the information you provide.
                            </p>
                            <div className="font-medium bg-white/50 p-4 rounded border border-orange-100 italic">
                                "This assessment is for educational and informational purposes only. It does not constitute medical advice. Always consult with a qualified healthcare provider before starting any new health regimen."
                            </div>
                        </div>

                        <label className="flex items-start gap-3 p-5 border-2 border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-all hover:border-theme-secondary/30">
                            <input
                                type="checkbox"
                                checked={formData.consent_agreed}
                                onChange={(e) => updateField('consent_agreed', e.target.checked)}
                                className="mt-1 w-5 h-5 text-theme-accent rounded border-gray-300 focus:ring-theme-accent"
                            />
                            <span className="text-gray-700 font-medium select-none">
                                I accept the terms and conditions and understand that this is not medical advice
                            </span>
                        </label>
                    </div>
                );

            case 2: // Personal Info
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-2xl font-bold text-theme-text mb-4">Tell us about yourself</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => updateField('full_name', e.target.value)}
                                    className="input-field"
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    className="input-field"
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Range *</label>
                                    <select
                                        value={formData.age_range}
                                        onChange={(e) => updateField('age_range', e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="">Select Age Range</option>
                                        {AGE_RANGES.map((range) => (
                                            <option key={range} value={range}>
                                                {range}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (City/Province)</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => updateField('location', e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. Makati, Metro Manila"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3: // Medical History (NEW)
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <h3 className="text-2xl font-bold text-theme-text mb-2">Medical History</h3>
                            <p className="text-gray-500 text-sm mb-4">Please select if you have been diagnosed with any of the following. This helps us ensure safety.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {MEDICAL_CONDITIONS.map((condition) => (
                                    <button
                                        key={condition}
                                        onClick={() => toggleMedical(condition)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${(formData.medical_history || []).includes(condition)
                                            ? 'border-theme-accent bg-theme-accent/5 text-theme-accent'
                                            : 'border-gray-200 hover:border-theme-secondary text-gray-600 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{condition}</span>
                                            {(formData.medical_history || []).includes(condition) && <Check className="w-5 h-5" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4: // Goals (moved from 3)
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <h3 className="text-2xl font-bold text-theme-text mb-2">What are your primary goals?</h3>
                            <p className="text-gray-500 text-sm mb-4">Select all that apply.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {GOALS.map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleGoal(goal)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${formData.goals.includes(goal)
                                            ? 'border-theme-accent bg-theme-accent/5 text-theme-accent'
                                            : 'border-gray-200 hover:border-theme-secondary text-gray-600 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{goal}</span>
                                            {formData.goals.includes(goal) && <Check className="w-5 h-5" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-theme-text mb-2">Experience Level</h3>
                            <div className="space-y-3">
                                {EXPERIENCE_LEVELS.map((level) => (
                                    <label
                                        key={level.value}
                                        className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.experience_level === level.value
                                            ? 'border-theme-accent bg-theme-accent/5'
                                            : 'border-gray-200 hover:border-theme-secondary bg-white'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="experience"
                                            value={level.value}
                                            checked={formData.experience_level === level.value}
                                            onChange={(e) => updateField('experience_level', e.target.value)}
                                            className="mt-1 mr-3 text-theme-accent focus:ring-theme-accent"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{level.label}</div>
                                            <div className="text-sm text-gray-500">{level.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 5: // Preferences (moved from 4)
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-2xl font-bold text-theme-text mb-4">Preferences</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Preference</label>
                                <select
                                    value={formData.preferences.budget}
                                    onChange={(e) => updatePreference('budget', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">No Preference</option>
                                    {BUDGET_RANGES.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Frequency</label>
                                <select
                                    value={formData.preferences.frequency}
                                    onChange={(e) => updatePreference('frequency', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="">No Preference</option>
                                    {FREQUENCIES.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-theme-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar (only show after start) */}
                {step > 0 && !showTerms && (
                    <div className="mb-8">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-theme-accent transition-all duration-500 ease-out"
                                style={{ width: `${(step / 5) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
                            <span>Consent</span>
                            <span>Personal</span>
                            <span>History</span>
                            <span>Goals</span>
                            <span>Preferences</span>
                        </div>
                    </div>
                )}

                <div className="card p-8 md:p-10 min-h-[400px] flex flex-col justify-between relative bg-white shadow-xl">
                    {/* Back Button */}
                    {step > 0 && !showTerms && (
                        <button
                            onClick={prevStep}
                            className="absolute top-8 left-8 text-gray-400 hover:text-theme-text transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    <div className="mt-8 mb-8">
                        {/* Error Message */}
                        {error && !showTerms && (
                            <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {renderStep()}
                    </div>

                    {!showTerms && (
                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            {step === 0 ? (
                                // Button is inside renderStep for step 0
                                <span />
                            ) : step === 5 ? ( // Submit on Step 5 (Preferences)
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="spinner w-5 h-5 border-white border-t-transparent" />
                                    ) : (
                                        <>
                                            Submit Assessment <Check className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    Next Step <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssessmentWizard;
