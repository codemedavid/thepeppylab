import { useState, useEffect } from 'react';
import { Calculator, FlaskConical, Syringe, RotateCcw, Info, ArrowLeft } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const PeptideCalculator = () => {
    const [vialAmountMg, setVialAmountMg] = useState<number>(5);
    const [waterAmountMl, setWaterAmountMl] = useState<number>(2);
    const [desiredDoseMcg, setDesiredDoseMcg] = useState<number>(250);
    const [doseUnit, setDoseUnit] = useState<'mg' | 'mcg'>('mcg');
    const [result, setResult] = useState<{
        concentration: number;
        volumeMl: number;
        units: number;
        ticks: number;
    } | null>(null);

    useEffect(() => {
        calculate();
    }, [vialAmountMg, waterAmountMl, desiredDoseMcg]);

    const calculate = () => {
        // 1. Calculate concentration (mcg/ml)
        // Convert vial amount to mcg: mg * 1000
        const totalMcg = vialAmountMg * 1000;

        if (waterAmountMl <= 0 || vialAmountMg <= 0) {
            setResult(null);
            return;
        }

        const concentration = totalMcg / waterAmountMl; // mcg per ml

        // 2. Calculate volume to inject (ml) needed for desired dose
        // desired dose (mcg) / concentration (mcg/ml) = volume (ml)
        const volumeMl = desiredDoseMcg / concentration;

        // 3. Convert to Insulin Units (U-100 syringe)
        // 1ml = 100 units
        const units = volumeMl * 100;

        // 4. Estimate "ticks" (assuming a standard 1ml syringe often has ticks every 2 units, or 10 units depending on size, but usually "units" is the standard readout)
        const ticks = units; // Simplified, as "units" ARE the ticks on a U-100 syringe essentially. We can clarify in UI.

        setResult({
            concentration,
            volumeMl,
            units,
            ticks
        });
    };

    return (
        <div className="min-h-screen bg-theme-bg font-inter flex flex-col">
            {/* ... */}
            <Header
                cartItemsCount={0}
                onCartClick={() => window.location.href = '/?view=cart'}
                onMenuClick={() => window.location.href = '/'}
            />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-gray-600 hover:text-theme-accent font-medium mb-6 flex items-center gap-2 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm md:text-base">Back to Home</span>
                </button>

                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-theme-secondary/20 rounded-2xl mb-4 text-theme-accent">
                            <Calculator className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-4">Peptide Calculator</h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Easily calculate your reconstitution and dosage. Determine exactly how many units to draw on your insulin syringe.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Calculator Inputs */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FlaskConical className="w-5 h-5 text-theme-accent" />
                                    Configuration
                                </h2>

                                {/* Vial Quantity */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Vial Quantity (mg)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={vialAmountMg}
                                            onChange={(e) => setVialAmountMg(Number(e.target.value))}
                                            className="w-full p-3 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-900"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">mg</span>
                                    </div>
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">
                                        {[2, 5, 10, 15].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setVialAmountMg(val)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${vialAmountMg === val ? 'bg-theme-secondary text-white border-theme-secondary' : 'bg-white text-gray-500 border-gray-200 hover:border-theme-secondary'}`}
                                            >
                                                {val}mg
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Water Amount */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Bacteriostatic Water (ml)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={waterAmountMl}
                                            onChange={(e) => setWaterAmountMl(Number(e.target.value))}
                                            className="w-full p-3 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent font-medium text-gray-900"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">ml</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {[1, 2, 3].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setWaterAmountMl(val)}
                                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${waterAmountMl === val ? 'bg-theme-accent text-white border-theme-accent' : 'bg-white text-gray-500 border-gray-200 hover:border-theme-accent'}`}
                                            >
                                                {val}ml
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Desired Dose */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Desired Dose
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => setDoseUnit('mcg')}
                                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${doseUnit === 'mcg' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-white text-gray-500 border-gray-200 hover:border-theme-accent'}`}
                                        >
                                            mcg
                                        </button>
                                        <button
                                            onClick={() => setDoseUnit('mg')}
                                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-colors ${doseUnit === 'mg' ? 'bg-theme-accent text-white border-theme-accent' : 'bg-white text-gray-500 border-gray-200 hover:border-theme-accent'}`}
                                        >
                                            mg
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={doseUnit === 'mcg' ? desiredDoseMcg : desiredDoseMcg / 1000}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setDesiredDoseMcg(doseUnit === 'mcg' ? value : value * 1000);
                                            }}
                                            className="w-full p-3 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent font-medium text-gray-900"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">{doseUnit}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {doseUnit === 'mcg' ? (
                                            [100, 250, 500, 1000].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setDesiredDoseMcg(val)}
                                                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${desiredDoseMcg === val ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black'}`}
                                                >
                                                    {val}mcg
                                                </button>
                                            ))
                                        ) : (
                                            [0.1, 0.25, 0.5, 1].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setDesiredDoseMcg(val * 1000)}
                                                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${desiredDoseMcg === val * 1000 ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black'}`}
                                                >
                                                    {val}mg
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setVialAmountMg(5);
                                            setWaterAmountMl(2);
                                            setDesiredDoseMcg(250);
                                        }}
                                        className="w-full py-2 text-sm text-gray-500 hover:text-theme-text flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results Display */}
                        <div className="lg:col-span-2">
                            {result ? (
                                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden h-full flex flex-col">
                                    <div className="bg-gradient-to-r from-theme-text to-theme-accent p-6 text-white text-center">
                                        <h3 className="text-lg font-medium opacity-90 mb-1">
                                            To get {doseUnit === 'mcg' ? desiredDoseMcg + 'mcg' : (desiredDoseMcg / 1000) + 'mg'}
                                        </h3>
                                        <div className="text-4xl md:text-5xl font-bold flex items-center justify-center gap-2 my-2">
                                            {Math.round(result.units * 10) / 10} <span className="text-xl md:text-2xl font-medium opacity-80">Units</span>
                                        </div>
                                        <p className="text-sm opacity-90">Draw to this mark on your U-100 Insulin Syringe</p>
                                    </div>

                                    <div className="p-6 md:p-8 flex items-center justify-center bg-gray-50 border-b border-gray-100 flex-grow min-h-[200px]">
                                        {/* Visual Representation of Syringe */}
                                        <div className="relative w-full max-w-lg h-16 md:h-20 bg-white border-2 border-gray-300 rounded-full flex items-center px-2">
                                            {/* Plunger */}
                                            <div
                                                className="absolute left-[4px] top-[4px] bottom-[4px] bg-gradient-to-r from-theme-secondary/50 to-theme-secondary rounded-l-full transition-all duration-500 ease-out"
                                                style={{ width: `${Math.min(Math.max((result.units / 100) * 100, 5), 100)}%` }}
                                            >
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gray-400/30 border-r border-gray-400/50"></div>
                                            </div>

                                            {/* Ticks (Simplified Visual) */}
                                            {/* ... */}
                                            {/* ... */}
                                            <div className="absolute inset-x-4 top-0 bottom-0 flex justify-between items-end pb-2 pointer-events-none opacity-50">
                                                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(tick => (
                                                    <div key={tick} className="h-2 w-px bg-gray-400 relative">
                                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono">{tick}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Value Label */}
                                            <div className="absolute z-10 right-4 top-1/2 -translate-y-1/2 font-bold text-gray-900 tabular-nums text-xl">
                                                100 units (1ml)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-theme-secondary/10 border border-theme-secondary/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FlaskConical className="w-4 h-4 text-theme-text" />
                                                <span className="text-xs font-bold text-theme-text uppercase">Peptide Concentration</span>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {result.concentration.toLocaleString()} <span className="text-sm font-medium text-gray-500">mcg/ml</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-theme-accent/10 border border-theme-accent/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Syringe className="w-4 h-4 text-theme-accent" />
                                                <span className="text-xs font-bold text-theme-accent uppercase">Injection Volume</span>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {Number(result.volumeMl.toFixed(3))} <span className="text-sm font-medium text-gray-500">ml</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                    <Calculator className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Enter your configuration to see results</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 bg-yellow-50 rounded-xl p-4 border border-yellow-100 flex gap-3 text-yellow-800 text-sm">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>
                            <strong>Disclaimer:</strong> This calculator is for educational and informational purposes only. Always double-check your calculations. The Peppy Lab is not responsible for dosing errors.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PeptideCalculator;
