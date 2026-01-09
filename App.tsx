
import React, { useState, useMemo } from 'react';
import { ROIInputs, ROIResults, DEFAULT_FINANCING_ASSUMPTIONS } from './types';
import { InputGroup } from './components/InputGroup';
import { DisplayCard } from './components/DisplayCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calculator, TrendingUp, DollarSign, PieChart as PieChartIcon, Info, Lock, Unlock, Download } from 'lucide-react';

const App: React.FC = () => {
  // Brand Colors
  const COLORS = {
    cyan: '#19B5F6',
    azure: '#0D7BEA',
    royal: '#0A4FD6',
    charcoal: '#1F2328',
    white: '#FFFFFF',
  };

  const [inputs, setInputs] = useState<ROIInputs>({
    averageFee: 28000,
    labCost: 6000,
    suppliesCost: 3000,
    providerCompPercent: 0,
    tcCommissionPercent: 1,
    marketingCostPerArch: 2000,
    archesPerMonth: 3,
    financingUsagePercent: DEFAULT_FINANCING_ASSUMPTIONS.usagePercent,
    financingAmtPercent: DEFAULT_FINANCING_ASSUMPTIONS.financedPercent,
    financingFeePercent: DEFAULT_FINANCING_ASSUMPTIONS.feePercent,
  });

  const [isFinancingUnlocked, setIsFinancingUnlocked] = useState(false);

  const showFooter = useMemo(() => {
    try {
      const url = window.top?.location.href || window.location.href;
      return url.includes('/blog');
    } catch (e) {
      return document.referrer.includes('/blog/');
    }
  }, []);

  const results = useMemo((): ROIResults => {
    const A = inputs.averageFee;
    const B = inputs.labCost;
    const C = inputs.suppliesCost;
    const D = inputs.providerCompPercent / 100;
    const E = inputs.tcCommissionPercent / 100;
    const G = inputs.marketingCostPerArch;
    const H = inputs.archesPerMonth;

    const finUsage = inputs.financingUsagePercent / 100;
    const finAmt = inputs.financingAmtPercent / 100;
    const finFee = inputs.financingFeePercent / 100;

    const providerComp = A * D;
    const tcCommission = A * E;
    const financingFees = A * finUsage * finAmt * finFee;
    
    const totalCostPerArch = B + C + providerComp + tcCommission + financingFees + G;
    const profitPerArch = A - totalCostPerArch;
    const profitMargin = (profitPerArch / A) * 100;
    const returnOnMarketing = G > 0 ? profitPerArch / G : 0;

    return {
      providerComp,
      tcCommission,
      financingFees,
      totalCostPerArch,
      profitPerArch,
      profitMargin,
      returnOnMarketing,
      monthlyRevenue: A * H,
      monthlyMarketingSpend: G * H,
      monthlyProfit: profitPerArch * H,
    };
  }, [inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;
  const formatROM = (val: number) => `${val.toFixed(1)}x`;

  const chartData = useMemo(() => {
    const total = inputs.averageFee || 1;
    const feesCompTotal = results.financingFees + results.tcCommission + results.providerComp;
    
    return [
      { name: 'Lab', value: Math.max(0, inputs.labCost), fill: COLORS.royal, percentage: (inputs.labCost / total) * 100 },
      { name: 'Supplies', value: Math.max(0, inputs.suppliesCost), fill: COLORS.azure, percentage: (inputs.suppliesCost / total) * 100 },
      { name: 'Marketing', value: Math.max(0, inputs.marketingCostPerArch), fill: COLORS.cyan, percentage: (inputs.marketingCostPerArch / total) * 100 },
      { name: 'Fees/Comp', value: Math.max(0, feesCompTotal), fill: '#94a3b8', percentage: (feesCompTotal / total) * 100 },
      { name: 'Profit', value: Math.max(0, results.profitPerArch), fill: COLORS.charcoal, percentage: (results.profitPerArch / total) * 100 },
    ];
  }, [inputs, results, COLORS]);

  const exportToCSV = () => {
    const rows = [
      ['Parameter', 'Value'],
      ['--- INPUTS ---', ''],
      ['Treatment Price per Arch', inputs.averageFee],
      ['Lab Cost per Arch', inputs.labCost],
      ['Supplies Cost per Arch', inputs.suppliesCost],
      ['Outside Provider Fee %', `${inputs.providerCompPercent}%`],
      ['TC Commission %', `${inputs.tcCommissionPercent}%`],
      ['Marketing Cost per Arch', inputs.marketingCostPerArch],
      ['Arches per Month', inputs.archesPerMonth],
      ['Financing Patient Usage %', `${inputs.financingUsagePercent}%`],
      ['Amount Financed %', `${inputs.financingAmtPercent}%`],
      ['Lender Fee %', `${inputs.financingFeePercent}%`],
      ['', ''],
      ['--- RESULTS ---', ''],
      ['Profit per Arch', results.profitPerArch],
      ['Profit Margin %', `${results.profitMargin.toFixed(2)}%`],
      ['Return on Marketing', `${results.returnOnMarketing.toFixed(2)}x`],
      ['Monthly Revenue', results.monthlyRevenue],
      ['Monthly Marketing Spend', results.monthlyMarketingSpend],
      ['Monthly Profit', results.monthlyProfit],
      ['Provider Fees Total', results.providerComp],
      ['Financing Fees Total', results.financingFees],
      ['TC Commission Total', results.tcCommission],
      ['Total Cost per Arch', results.totalCostPerArch],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `The_Implant_Engine_ROI_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <section className="lg:col-span-5 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6 border-l-4 border-[#0D7BEA] pl-3">
              <h2 className="text-lg font-bold text-[#1F2328]">Treatment & Practice Costs</h2>
            </div>
            
            <InputGroup
              label="Treatment price per arch"
              value={inputs.averageFee}
              onChange={(val) => setInputs({ ...inputs, averageFee: val })}
              type="currency"
              helperText="What the patient is charged for one All-on-X arch."
              step={500}
            />
            <InputGroup
              label="Lab cost per arch"
              value={inputs.labCost}
              onChange={(val) => setInputs({ ...inputs, labCost: val })}
              type="currency"
              step={100}
            />
            <InputGroup
              label="Implants & surgical supplies"
              value={inputs.suppliesCost}
              onChange={(val) => setInputs({ ...inputs, suppliesCost: val })}
              type="currency"
              step={100}
            />

            <hr className="my-6 border-slate-100" />

            <div className="flex items-center gap-2 mb-6 border-l-4 border-[#0D7BEA] pl-3">
              <h2 className="text-lg font-bold text-[#1F2328]">Provider Fees (If Outsourced)</h2>
            </div>

            <InputGroup
              label="Outside provider fee (% of arch price)"
              value={inputs.providerCompPercent}
              onChange={(val) => setInputs({ ...inputs, providerCompPercent: val })}
              type="percent"
              helperText="Use this only if you pay an outside surgeon or prosthodontist to perform the surgery or prosthesis. Practices that complete All-on-X fully in-house should leave this set to 0%."
            />
            <InputGroup
              label="TC commission (%)"
              value={inputs.tcCommissionPercent}
              onChange={(val) => setInputs({ ...inputs, tcCommissionPercent: val })}
              type="percent"
            />

            <hr className="my-6 border-slate-100" />

            <div className="flex items-center gap-2 mb-6 border-l-4 border-[#0D7BEA] pl-3">
              <h2 className="text-lg font-bold text-[#1F2328]">Marketing & Growth</h2>
            </div>

            <InputGroup
              label="Marketing cost per arch (all-in)"
              value={inputs.marketingCostPerArch}
              onChange={(val) => setInputs({ ...inputs, marketingCostPerArch: val })}
              type="currency"
              helperText="Includes advertising and agency fees. Typical all-in cost is around $2,000 per arch, but this varies by market."
              step={100}
            />
            <InputGroup
              label="Arches placed per month"
              value={inputs.archesPerMonth}
              onChange={(val) => setInputs({ ...inputs, archesPerMonth: val })}
              type="number"
              min={1}
            />
          </div>

          {/* Financing Assumptions */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 ${isFinancingUnlocked ? 'bg-[#0D7BEA]/5 border-[#0D7BEA]/20 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1F2328] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0D7BEA]" />
                Financing Assumptions
              </h3>
              <button 
                onClick={() => setIsFinancingUnlocked(!isFinancingUnlocked)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isFinancingUnlocked 
                    ? 'bg-[#0D7BEA] text-white shadow-sm' 
                    : 'bg-white text-[#1F2328] border border-slate-200 hover:border-[#0D7BEA]/30'
                }`}
              >
                {isFinancingUnlocked ? (
                  <><Unlock className="w-3 h-3" /> Unlocked</>
                ) : (
                  <><Lock className="w-3 h-3" /> Lock to Edit</>
                )}
              </button>
            </div>

            {isFinancingUnlocked ? (
              <div className="space-y-4">
                <InputGroup
                  label="Patient usage (%)"
                  value={inputs.financingUsagePercent}
                  onChange={(val) => setInputs({ ...inputs, financingUsagePercent: val })}
                  type="percent"
                />
                <InputGroup
                  label="Amount financed (%)"
                  value={inputs.financingAmtPercent}
                  onChange={(val) => setInputs({ ...inputs, financingAmtPercent: val })}
                  type="percent"
                />
                <InputGroup
                  label="Average lender fee (%)"
                  value={inputs.financingFeePercent}
                  onChange={(val) => setInputs({ ...inputs, financingFeePercent: val })}
                  type="percent"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-sm font-bold text-[#1F2328]">{formatPercent(inputs.financingUsagePercent)}</div>
                  <div className="text-[10px] text-slate-500 uppercase leading-tight font-medium mt-1">Patient Usage</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-sm font-bold text-[#1F2328]">{formatPercent(inputs.financingAmtPercent)}</div>
                  <div className="text-[10px] text-slate-500 uppercase leading-tight font-medium mt-1">Amt Financed</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-sm font-bold text-[#1F2328]">{formatPercent(inputs.financingFeePercent)}</div>
                  <div className="text-[10px] text-slate-500 uppercase leading-tight font-medium mt-1">Avg Fee</div>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-slate-600 mt-4 leading-relaxed italic bg-white/60 p-2 rounded border border-[#0D7BEA]/10">
              The 'Average lender fee' is applied only to the portion of the treatment price actually financed, not the total treatment amount. This ensures accurate modeling of net revenue after merchant costs.
            </p>
          </div>
          
          <div className="bg-slate-900 p-4 rounded-xl border border-[#1F2328] flex gap-3 items-start shadow-md text-white">
            <Info className="w-5 h-5 text-[#19B5F6] shrink-0 mt-0.5" />
            <p className="text-sm leading-snug">
              <strong>Required note:</strong> All numbers are per arch (not per case). A double-arch patient counts as two arches.
            </p>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DisplayCard 
              label="Profit Per Arch" 
              value={formatCurrency(results.profitPerArch)} 
              variant="primary"
              subLabel={`${formatPercent(results.profitMargin)} Margin`}
            />
            <DisplayCard 
              label="Monthly Profit" 
              value={formatCurrency(results.monthlyProfit)} 
              variant="secondary"
              subLabel={`From ${inputs.archesPerMonth} Arches`}
            />
            <DisplayCard 
              label="Return on Marketing" 
              value={formatROM(results.returnOnMarketing)} 
              variant="neutral"
              subLabel="Profit/Ads Multiplier"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-[#0D7BEA]" />
                <h3 className="text-lg font-bold text-[#1F2328]">Per-Arch Breakdown</h3>
              </div>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity outline-none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fee Per Arch</span>
                  <span className="text-xl font-bold text-[#1F2328]">{formatCurrency(inputs.averageFee)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-800">{formatCurrency(item.value)}</span>
                      <span className="text-[10px] font-medium text-slate-400 w-10 text-right">{formatPercent(item.percentage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-[#0D7BEA]" />
                <h3 className="text-lg font-bold text-[#1F2328]">Cost Details (Per Arch)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Provider Fees (if any)</span>
                  <span className="font-semibold text-[#1F2328]">{formatCurrency(results.providerComp)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Financing Fees (Est.)</span>
                  <span className="font-semibold text-[#1F2328]">{formatCurrency(results.financingFees)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">TC Commission</span>
                  <span className="font-semibold text-[#1F2328]">{formatCurrency(results.tcCommission)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Marketing Cost</span>
                  <span className="font-semibold text-[#1F2328]">{formatCurrency(inputs.marketingCostPerArch)}</span>
                </div>
                <hr className="border-slate-100" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Total Cost Per Arch</span>
                  <span className="text-lg font-bold text-[#1F2328]">{formatCurrency(results.totalCostPerArch)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export CSV Button - 3rd Row */}
          <div className="flex justify-end">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-[#0D7BEA]/20 hover:border-[#0D7BEA] text-[#0D7BEA] rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Export ROI Report (CSV)</span>
            </button>
          </div>

          {/* Monthly Projections - 4th Row */}
          <div className="bg-[#1F2328] text-white p-8 rounded-2xl shadow-2xl overflow-hidden relative border border-slate-800">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <DollarSign className="w-6 h-6 text-[#19B5F6]" />
                <h3 className="text-xl font-bold uppercase tracking-wide">Monthly Practice Totals</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-[#19B5F6] text-xs font-bold uppercase tracking-widest mb-2 opacity-90">Monthly Revenue</div>
                  <div className="text-4xl font-bold">{formatCurrency(results.monthlyRevenue)}</div>
                  <div className="text-slate-400 text-[10px] mt-2 italic uppercase">Gross Production</div>
                </div>
                <div>
                  <div className="text-[#0D7BEA] text-xs font-bold uppercase tracking-widest mb-2 opacity-90">Marketing Spend</div>
                  <div className="text-4xl font-bold">{formatCurrency(results.monthlyMarketingSpend)}</div>
                  <div className="text-slate-400 text-[10px] mt-2 italic uppercase">All-In Ad Budget</div>
                </div>
                <div>
                  <div className="text-[#19B5F6] text-xs font-bold uppercase tracking-widest mb-2">Monthly Profit</div>
                  <div className="text-4xl font-bold text-[#19B5F6]">{formatCurrency(results.monthlyProfit)}</div>
                  <div className="text-slate-400 text-[10px] mt-2 italic uppercase tracking-tighter">Net Profit After Expenses</div>
                </div>
              </div>
            </div>
            {/* Elegant gradient overlay matching brand cyan/azure */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0D7BEA]/10 to-transparent pointer-events-none"></div>
          </div>
          
          <div className={`text-center text-slate-500 text-xs py-8 ${showFooter ? 'block' : 'hidden'}`}>
            &copy; {new Date().getFullYear()} <span className="font-bold text-[#1F2328]"><a href="https://theimplantengine.com" target='blank'>The Implant Engine</a></span> | Designed for implant-focused practices
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
