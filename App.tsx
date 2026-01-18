
import React, { useState, useMemo } from 'react';
import { ROIInputs, ROIResults, DEFAULT_FINANCING_ASSUMPTIONS } from './types';
import { InputGroup } from './components/InputGroup';
import { DisplayCard } from './components/DisplayCard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Zap, 
  Users,
  Settings2,
  Info,
  Circle
} from 'lucide-react';

const App: React.FC = () => {
  const COLORS = {
    profit: '#1e293b', // Dark Slate
    marketing: '#3b82f6', // Blue-500
    lab: '#93c5fd', // Blue-300
    feeComp: '#fde047', // Yellow-300
    financing: '#e0f2fe', // Very Light Blue-100
    providers: '#60a5fa', // Blue-400
  };

  const [inputs, setInputs] = useState<ROIInputs & { costPerLead: number; conversionRate: number; useLeadFlow: boolean }>({
    averageFee: 24000,
    labCost: 4500,
    suppliesCost: 2000,
    providerCompPercent: 0,
    tcCommissionPercent: 1,
    marketingCostPerArch: 1500,
    archesPerMonth: 15,
    financingUsagePercent: DEFAULT_FINANCING_ASSUMPTIONS.usagePercent,
    financingAmtPercent: DEFAULT_FINANCING_ASSUMPTIONS.financedPercent,
    financingFeePercent: DEFAULT_FINANCING_ASSUMPTIONS.feePercent,
    costPerLead: 150,
    conversionRate: 10,
    useLeadFlow: false
  });

  const [isFinancingUnlocked, setIsFinancingUnlocked] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('treatment');
  const [activePreset, setActivePreset] = useState<string | null>('high-volume');
  const [viewType, setViewType] = useState<'per-arch' | 'monthly'>('per-arch');

  const applyPreset = (type: 'standard' | 'boutique' | 'high-volume') => {
    setActivePreset(type);
    const presets = {
      'standard': { 
        averageFee: 28000, 
        labCost: 6000, 
        suppliesCost: 2000,
        marketingCostPerArch: 2000, 
        archesPerMonth: 8,
        providerCompPercent: 0,
        tcCommissionPercent: 1,
        financingUsagePercent: 60,
        financingAmtPercent: 80,
        financingFeePercent: 7
      },
      'boutique': { 
        averageFee: 35000, 
        labCost: 8500, 
        suppliesCost: 2500,
        marketingCostPerArch: 3500, 
        archesPerMonth: 4,
        providerCompPercent: 0,
        tcCommissionPercent: 1.5,
        financingUsagePercent: 40,
        financingAmtPercent: 100,
        financingFeePercent: 6
      },
      'high-volume': { 
        averageFee: 24000, 
        labCost: 4500, 
        suppliesCost: 2000,
        marketingCostPerArch: 1500, 
        archesPerMonth: 15,
        providerCompPercent: 0,
        tcCommissionPercent: 1,
        financingUsagePercent: 70,
        financingAmtPercent: 70,
        financingFeePercent: 8
      }
    };
    setInputs(prev => ({ ...prev, ...presets[type] }));
  };

  const results = useMemo((): ROIResults & { breakEvenArches: number; leadsRequired: number } => {
    const marketingCost = inputs.useLeadFlow 
      ? (inputs.costPerLead / (inputs.conversionRate / 100 || 0.01))
      : inputs.marketingCostPerArch;

    const A = inputs.averageFee;
    const B = inputs.labCost;
    const C = inputs.suppliesCost;
    const D = inputs.providerCompPercent / 100;
    const E = inputs.tcCommissionPercent / 100;
    const G = marketingCost;
    const H = inputs.archesPerMonth;

    const finUsage = inputs.financingUsagePercent / 100;
    const finAmt = inputs.financingAmtPercent / 100;
    const finFee = inputs.financingFeePercent / 100;

    const providerComp = A * D;
    const tcCommission = A * E;
    const financingFees = A * finUsage * finAmt * finFee;
    
    const totalCostPerArch = B + C + providerComp + tcCommission + financingFees + G;
    const profitPerArch = A - totalCostPerArch;
    const profitMargin = (profitPerArch / (A || 1)) * 100;
    const returnOnMarketing = G > 0 ? profitPerArch / G : 0;

    const monthlyAdSpend = G * H;
    const profitBeforeMarketing = A - (B + C + providerComp + tcCommission + financingFees);
    const breakEvenArches = profitBeforeMarketing > 0 ? monthlyAdSpend / profitBeforeMarketing : 0;
    const leadsRequired = H / (inputs.conversionRate / 100 || 0.01);

    return {
      providerComp,
      tcCommission,
      financingFees,
      totalCostPerArch,
      profitPerArch,
      profitMargin,
      returnOnMarketing,
      monthlyRevenue: A * H,
      monthlyMarketingSpend: monthlyAdSpend,
      monthlyProfit: profitPerArch * H,
      breakEvenArches,
      leadsRequired
    };
  }, [inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  const formatROM = (val: number) => `${val.toFixed(1)}x`;

  const chartData = useMemo(() => {
    const total = inputs.averageFee || 1;
    const marketingCost = inputs.useLeadFlow ? (inputs.costPerLead / (inputs.conversionRate / 100 || 0.01)) : inputs.marketingCostPerArch;
    
    return [
      { name: 'Lab', value: inputs.labCost + inputs.suppliesCost, fill: COLORS.lab, percentage: ((inputs.labCost + inputs.suppliesCost) / total) * 100 },
      { name: 'Marketing', value: marketingCost, fill: COLORS.marketing, percentage: (marketingCost / total) * 100 },
      { name: 'Providers', value: results.providerComp, fill: COLORS.providers, percentage: (results.providerComp / total) * 100 },
      { name: 'Fee/Comp', value: results.tcCommission, fill: COLORS.feeComp, percentage: (results.tcCommission / total) * 100 },
      { name: 'Financing', value: results.financingFees, fill: COLORS.financing, percentage: (results.financingFees / total) * 100 },
      { name: 'Profit', value: Math.max(0, results.profitPerArch), fill: COLORS.profit, percentage: (Math.max(0, results.profitPerArch) / total) * 100 },
    ];
  }, [inputs, results, COLORS]);

  const totalCostPercent = ((results.totalCostPerArch / (inputs.averageFee || 1)) * 100).toFixed(1);
  const viewMultiplier = viewType === 'monthly' ? inputs.archesPerMonth : 1;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-inter text-slate-900 px-4 py-12 flex flex-col items-center">
      <div className="max-w-[1240px] w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[900px]">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-4 bg-[#F8FAFC] border-r border-slate-100 p-8 space-y-6 flex flex-col">
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Practice Presets</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['standard', 'boutique', 'high-volume'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => applyPreset(type)}
                    className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                      activePreset === type 
                        ? 'bg-white text-blue-600 border-blue-600 ring-2 ring-blue-100 shadow-sm' 
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {type.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Treatment & Clinical */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setOpenSection(openSection === 'treatment' ? null : 'treatment')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="font-bold text-slate-800 text-[13px] tracking-tight">Treatment & Clinical</h3>
                  </div>
                  {openSection === 'treatment' ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                </button>
                {openSection === 'treatment' && (
                  <div className="p-5 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <InputGroup label="Treatment price per arch" value={inputs.averageFee} onChange={(val) => setInputs({ ...inputs, averageFee: val })} type="currency" />
                    <InputGroup label="Lab cost per arch" value={inputs.labCost} onChange={(val) => setInputs({ ...inputs, labCost: val })} type="currency" />
                    <InputGroup label="Implants & surgical supplies" value={inputs.suppliesCost} onChange={(val) => setInputs({ ...inputs, suppliesCost: val })} type="currency" />
                  </div>
                )}
              </div>

              {/* Financing & Provider - Now Above Marketing */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setOpenSection(openSection === 'financing' ? null : 'financing')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="font-bold text-slate-800 text-[13px] tracking-tight">Financing & Provider</h3>
                  </div>
                  {openSection === 'financing' ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                </button>
                {openSection === 'financing' && (
                  <div className="p-5 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <InputGroup label="Outside provider fee (%)" value={inputs.providerCompPercent} onChange={(v) => setInputs({ ...inputs, providerCompPercent: v })} type="percent" />
                    <InputGroup label="TC Commission (%)" value={inputs.tcCommissionPercent} onChange={(v) => setInputs({ ...inputs, tcCommissionPercent: v })} type="percent" />
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 mt-4">
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">FINANCING DETAILS</span>
                         <button onClick={() => setIsFinancingUnlocked(!isFinancingUnlocked)} className="p-1 rounded bg-white shadow-sm border border-slate-100">
                           <Lock className="w-3 h-3 text-slate-300" />
                         </button>
                       </div>
                       {isFinancingUnlocked && (
                         <div className="space-y-4">
                           <InputGroup label="Usage Rate (%)" value={inputs.financingUsagePercent} onChange={(v) => setInputs({...inputs, financingUsagePercent: v})} type="percent" />
                           <InputGroup label="Avg. % Financed" value={inputs.financingAmtPercent} onChange={(v) => setInputs({...inputs, financingAmtPercent: v})} type="percent" />
                           <InputGroup label="Lender Fee (%)" value={inputs.financingFeePercent} onChange={(v) => setInputs({...inputs, financingFeePercent: v})} type="percent" />
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>

              {/* Marketing & Volume - Now Below Financing */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setOpenSection(openSection === 'marketing' ? null : 'marketing')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="font-bold text-slate-800 text-[13px] tracking-tight">Marketing & Volume</h3>
                  </div>
                  {openSection === 'marketing' ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                </button>
                {openSection === 'marketing' && (
                  <div className="p-5 pt-0 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LEAD FLOW LOGIC</span>
                      <button 
                        onClick={() => setInputs(prev => ({ ...prev, useLeadFlow: !prev.useLeadFlow }))}
                        className={`w-8 h-4 rounded-full transition-all relative ${inputs.useLeadFlow ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${inputs.useLeadFlow ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <label className="text-[12px] font-bold text-slate-600">Marketing cost per arch</label>
                        <Info className="w-3 h-3 text-slate-300" />
                      </div>
                      <div className="bg-[#F1F5F9] p-3 rounded-lg flex items-center justify-between">
                         <span className="text-slate-400 font-bold text-sm">$</span>
                         <span className="text-slate-900 font-black text-sm">{inputs.marketingCostPerArch}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-[12px] font-bold text-slate-600">Monthly Arches</label>
                          <div className="bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-black text-xs">{inputs.archesPerMonth}</div>
                       </div>
                       <input 
                         type="range" min="1" max="30" value={inputs.archesPerMonth} 
                         onChange={(e) => setInputs({...inputs, archesPerMonth: parseInt(e.target.value)})} 
                         className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                       />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="p-6 bg-[#1a365d] rounded-[24px] text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200/80">BREAK-EVEN MILESTONE</span>
                </div>
                <div className="text-3xl font-black mb-1">{results.breakEvenArches.toFixed(1)} Arches</div>
                <p className="text-[10px] text-blue-200/40 leading-relaxed">Monthly volume needed to cover the total marketing investment.</p>
              </div>
            </div>

          </aside>

          {/* Main Insights Content */}
          <main className="lg:col-span-8 p-10 flex flex-col bg-white">
            
            <header className="mb-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  All-on-X ROI Calculator
                </h1>
              </div>
              <button onClick={() => window.print()} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <Download className="w-6 h-6" />
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <DisplayCard label="MARKETING ROI" value={formatROM(results.returnOnMarketing)} subLabel="Return on Ad Spend" />
              <DisplayCard label="TOTAL COST %" value={`${totalCostPercent}%`} subLabel="Percentage of Production" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Financial Composition */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3 border border-blue-600 px-5 py-3 rounded-2xl">
                    <Circle className="w-4 h-4 text-blue-600 fill-blue-600" />
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.15em]">Financial Composition</h3>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50 shadow-inner">
                    <button 
                      onClick={() => setViewType('per-arch')}
                      className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewType === 'per-arch' ? 'bg-white text-blue-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Per Arch
                    </button>
                    <button 
                      onClick={() => setViewType('monthly')}
                      className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewType === 'monthly' ? 'bg-white text-blue-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="h-64 w-full relative mb-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mb-1">
                        {viewType === 'per-arch' ? 'PER ARCH REVENUE' : 'MONTHLY REVENUE'}
                      </span>
                      <span className="text-[32px] font-black text-[#1A365D] tracking-tight leading-none">
                        {formatCurrency(inputs.averageFee * viewMultiplier)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full space-y-4 px-4">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-[13px] text-slate-600 font-bold">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-10">
                          <span className="font-black text-slate-900 text-[13px]">{formatCurrency(item.value * viewMultiplier)}</span>
                          <span className="text-[10px] font-black text-slate-200 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead Flow Metrics Card */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-[#F8FAFC]/40 rounded-[40px] border border-slate-50 relative overflow-hidden flex flex-col flex-1">
                  <div className="p-10 pb-6 flex-1">
                    <div className="flex items-center gap-3 mb-12">
                      <Users className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">Lead Flow Metrics</h3>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-slate-600 font-bold text-sm leading-tight">Monthly Leads Required</span>
                           <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">At {inputs.conversionRate}% conversion</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-2xl tracking-tight">{~~results.leadsRequired}</span>
                          <span className="text-[10px] text-slate-300 font-black uppercase ml-1.5">Leads</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-bold text-sm">Ad Spend Per Start</span>
                        <span className="font-black text-slate-900 text-2xl tracking-tight">{formatCurrency(results.monthlyMarketingSpend / inputs.archesPerMonth)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-bold text-sm">Clinical Cost %</span>
                        <span className="font-black text-slate-900 text-2xl tracking-tight">{(( (inputs.labCost + inputs.suppliesCost) / (inputs.averageFee || 1) ) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Combined Highlighted Section - Styled to match screenshot exactly */}
                  <div className="mx-6 mb-10 border-2 border-blue-500 rounded-[32px] overflow-hidden shadow-xl shadow-blue-500/5">
                    {/* Total Cost Segment */}
                    <div className="bg-white p-7 flex justify-between items-end border-b border-blue-500/20">
                      <div className="flex flex-col">
                         <span className="font-black text-slate-800 text-sm tracking-tight uppercase mb-1">TOTAL COST</span>
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">
                           {viewType === 'per-arch' ? 'ALL-IN PER ARCH' : 'MONTHLY ALL-IN'}
                         </span>
                      </div>
                      <span className="text-3xl font-black text-[#EF4444] tracking-tight">{formatCurrency(results.totalCostPerArch * viewMultiplier)}</span>
                    </div>

                    {/* Total Profit Segment */}
                    <div className="bg-[#ECFDF5] p-7 flex justify-between items-end">
                      <div className="flex flex-col">
                         <span className="font-black text-emerald-900 text-sm tracking-tight uppercase mb-1">TOTAL PROFIT</span>
                         <span className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.15em]">
                           {viewType === 'per-arch' ? 'NET PER ARCH' : 'MONTHLY NET'}
                         </span>
                      </div>
                      <span className="text-4xl font-black text-emerald-600 tracking-tight">{formatCurrency(results.profitPerArch * viewMultiplier)}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-500 py-4 px-6 rounded-2xl font-black border border-slate-100 shadow-sm transition-all group">
                  <Download className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                  <span className="text-[10px] uppercase tracking-[0.2em]">DOWNLOAD FULL AUDIT</span>
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-[#1e293b] p-10 md:p-14 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center mb-14">
            
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">GROSS REVENUE</h4>
                <div className="text-4xl font-black tracking-tight">{formatCurrency(results.monthlyRevenue)}</div>
                <div className="text-blue-400 text-[10px] mt-1.5 font-bold uppercase tracking-[0.1em]">PROJECTED MONTHLY</div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12">
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2.5">CLINICAL COSTS</h4>
              <div className="text-3xl font-bold text-slate-100 tracking-tight">{formatCurrency((inputs.labCost + inputs.suppliesCost) * inputs.archesPerMonth)}</div>
              <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">SUPPLIES & LAB FEES</div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12">
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2.5">AD INVESTMENT</h4>
              <div className="text-3xl font-bold text-blue-400 tracking-tight">{formatCurrency(results.monthlyMarketingSpend)}</div>
              <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">TOTAL ADSPEND BUDGET</div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12">
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2.5">MONTHLY NET</h4>
              <div className="text-3xl font-bold text-[#60A5FA] tracking-tight">{formatCurrency(results.monthlyProfit)}</div>
              <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">AFTER-TAX ESTIMATES</div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-700/40 text-center">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-5xl mx-auto italic uppercase tracking-[0.15em]">
              Note: All calculations are projections based on user-provided inputs and industry benchmarks. These figures are for informational purposes only and do not constitute financial or professional accounting advice. Individual practice results may vary significantly based on overhead, location, and operational efficiency.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
