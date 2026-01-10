
import React, { useState, useMemo } from 'react';
import { ROIInputs, ROIResults, DEFAULT_FINANCING_ASSUMPTIONS } from './types';
import { InputGroup } from './components/InputGroup';
import { DisplayCard } from './components/DisplayCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  TrendingUp, 
  Download, 
  PlusCircle, 
  ChevronDown, 
  ChevronRight, 
  BarChart3, 
  Info, 
  Lock, 
  Unlock, 
  Target, 
  Zap, 
  Stethoscope, 
  Users,
  Layout
} from 'lucide-react';

const App: React.FC = () => {
  const COLORS = {
    profit: '#1A365D',
    marketing: '#3B82F6',
    lab: '#93C5FD',
    feeComp: '#FDE047',
    financing: '#E0F2FE',
    providers: '#60A5FA',
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
  const [openSection, setOpenSection] = useState<string | null>('marketing');

  const applyPreset = (type: 'standard' | 'boutique' | 'high-volume') => {
    const presets = {
      'standard': { averageFee: 28000, labCost: 6000, marketingCostPerArch: 2000, archesPerMonth: 8 },
      'boutique': { averageFee: 35000, labCost: 8500, marketingCostPerArch: 3500, archesPerMonth: 4 },
      'high-volume': { averageFee: 24000, labCost: 4500, marketingCostPerArch: 1500, archesPerMonth: 15 }
    };
    setInputs(prev => ({ ...prev, ...presets[type] }));
  };

  const results = useMemo((): ROIResults & { breakEvenArches: number; leadsRequired: number } => {
    const marketingCost = inputs.useLeadFlow 
      ? (inputs.costPerLead / (inputs.conversionRate / 100))
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

  const clinicalCostsMonthly = useMemo(() => {
    const marketingCost = inputs.useLeadFlow ? (inputs.costPerLead / (inputs.conversionRate / 100)) : inputs.marketingCostPerArch;
    return (results.totalCostPerArch - marketingCost) * inputs.archesPerMonth;
  }, [results, inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  const formatROM = (val: number) => `${val.toFixed(1)}x`;

  const chartData = useMemo(() => {
    const total = inputs.averageFee || 1;
    const marketingCost = inputs.useLeadFlow ? (inputs.costPerLead / (inputs.conversionRate / 100)) : inputs.marketingCostPerArch;
    return [
      { name: 'Lab', value: inputs.labCost, fill: COLORS.lab, percentage: (inputs.labCost / total) * 100 },
      { name: 'Marketing', value: marketingCost, fill: COLORS.marketing, percentage: (marketingCost / total) * 100 },
      { name: 'Providers', value: results.providerComp, fill: COLORS.providers, percentage: (results.providerComp / total) * 100 },
      { name: 'Fee/Comp', value: results.tcCommission, fill: COLORS.feeComp, percentage: (results.tcCommission / total) * 100 },
      { name: 'Financing', value: results.financingFees, fill: COLORS.financing, percentage: (results.financingFees / total) * 100 },
      { name: 'Profit', value: Math.max(0, results.profitPerArch), fill: COLORS.profit, percentage: (Math.max(0, results.profitPerArch) / total) * 100 },
    ];
  }, [inputs, results, COLORS]);

  const handleDownloadCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Monthly Arches", inputs.archesPerMonth],
      ["Treatment Fee (Per Arch)", formatCurrency(inputs.averageFee)],
      ["Lab Cost (Per Arch)", formatCurrency(inputs.labCost)],
      ["Supplies Cost (Per Arch)", formatCurrency(inputs.suppliesCost)],
      ["Marketing Strategy", inputs.useLeadFlow ? "Lead Flow Model" : "Flat Cost Model"],
      ["Marketing Cost (Per Arch)", formatCurrency(inputs.useLeadFlow ? (inputs.costPerLead / (inputs.conversionRate / 100)) : inputs.marketingCostPerArch)],
      ["Monthly Revenue", formatCurrency(results.monthlyRevenue)],
      ["Monthly Marketing Spend", formatCurrency(results.monthlyMarketingSpend)],
      ["Monthly Clinical Costs", formatCurrency(clinicalCostsMonthly)],
      ["Total Cost Per Arch", formatCurrency(results.totalCostPerArch)],
      ["Profit Per Arch", formatCurrency(results.profitPerArch)],
      ["Monthly Net Profit", formatCurrency(results.monthlyProfit)],
      ["Net Profit Margin", `${results.profitMargin.toFixed(1)}%`],
      ["Marketing ROI (ROAS)", formatROM(results.returnOnMarketing)],
      ["Break-Even Arches", results.breakEvenArches.toFixed(1)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AOX_ROI_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-full bg-[#F1F5F9] font-inter text-slate-900 px-4 py-8 md:px-8 lg:px-12" style={{ backgroundImage: 'radial-gradient(circle at top right, #EBF8FF, #F1F5F9)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Main Application Shell */}
        <div className="bg-white rounded-[48px] shadow-2xl shadow-blue-900/10 overflow-hidden border border-white">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 pt-10">
            
            {/* Sidebar Controls */}
            <aside className="lg:col-span-4 bg-[#F8FAFC] border-r border-slate-100 p-8 space-y-5">
              
              {/* Accordion Sections */}
              {[
                { id: 'treatment', title: 'Treatment & Clinical', icon: <ChevronRight className="w-4 h-4" /> },
                { id: 'marketing', title: 'Marketing & Volume', icon: <ChevronDown className="w-4 h-4" /> },
                { id: 'financing', title: 'Financing & Provider', icon: <ChevronRight className="w-4 h-4" /> }
              ].map(sec => (
                <div key={sec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setOpenSection(openSection === sec.id ? null : sec.id)}
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                      <h3 className="font-bold text-slate-800 text-sm">{sec.title}</h3>
                    </div>
                    <span className="text-slate-300">{openSection === sec.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                  </button>
                  
                  {openSection === sec.id && (
                    <div className="p-6 pt-2 space-y-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                      {sec.id === 'treatment' && (
                        <>
                          <InputGroup label="Treatment price per arch" value={inputs.averageFee} onChange={(val) => setInputs({ ...inputs, averageFee: val })} type="currency" />
                          <InputGroup label="Lab cost per arch" value={inputs.labCost} onChange={(val) => setInputs({ ...inputs, labCost: val })} type="currency" />
                          <InputGroup label="Implants & surgical supplies" value={inputs.suppliesCost} onChange={(val) => setInputs({ ...inputs, suppliesCost: val })} type="currency" />
                        </>
                      )}
                      {sec.id === 'marketing' && (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">LEAD FLOW LOGIC</span>
                            <button 
                              onClick={() => setInputs(prev => ({ ...prev, useLeadFlow: !prev.useLeadFlow }))}
                              className={`w-10 h-5 rounded-full transition-all relative ${inputs.useLeadFlow ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${inputs.useLeadFlow ? 'left-6' : 'left-1'}`} />
                            </button>
                          </div>
                          {inputs.useLeadFlow ? (
                            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                              <InputGroup label="Cost Per Lead (CPL)" value={inputs.costPerLead} onChange={(v) => setInputs({...inputs, costPerLead: v})} type="currency" />
                              <InputGroup label="Lead-to-Start Rate (%)" value={inputs.conversionRate} onChange={(v) => setInputs({...inputs, conversionRate: v})} type="percent" />
                            </div>
                          ) : (
                            <InputGroup 
                              label="Marketing cost per arch" 
                              value={inputs.marketingCostPerArch} 
                              onChange={(v) => setInputs({...inputs, marketingCostPerArch: v})} 
                              type="currency" 
                              tooltip="The total marketing investment (Ad spend + fees) required to start one arch. Industry benchmark is typically $1,500 - $2,500." 
                            />
                          )}
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[13px] font-bold text-slate-600">Monthly Arches</label>
                              <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{inputs.archesPerMonth}</span>
                            </div>
                            <input type="range" min="1" max="30" value={inputs.archesPerMonth} onChange={(e) => setInputs({...inputs, archesPerMonth: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </div>
                        </>
                      )}
                      {sec.id === 'financing' && (
                        <>
                          <InputGroup 
                            label="Outside provider fee (%)" 
                            value={inputs.providerCompPercent} 
                            onChange={(v) => setInputs({ ...inputs, providerCompPercent: v })} 
                            type="percent" 
                            tooltip="This fee applies when an external surgeon or prosthodontist is engaged for the procedure."
                          />
                          <InputGroup 
                            label="TC Commission (%)" 
                            value={inputs.tcCommissionPercent} 
                            onChange={(v) => setInputs({ ...inputs, tcCommissionPercent: v })} 
                            type="percent" 
                            tooltip="Incentive commission paid to the Treatment Coordinator (TC) for successfully closing the case. Often calculated as a % of production. Typical range: 0.5% - 2%."
                          />
                          <div className={`mt-4 p-4 rounded-xl border transition-all ${isFinancingUnlocked ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financing Details</span>
                              <button onClick={() => setIsFinancingUnlocked(!isFinancingUnlocked)} className="p-1.5 rounded bg-white shadow-sm border border-slate-100">
                                {isFinancingUnlocked ? <Unlock className="w-3 h-3 text-blue-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                              </button>
                            </div>
                            {isFinancingUnlocked && (
                               <div className="space-y-4">
                                 <InputGroup 
                                   label="Lender Fee (%)" 
                                   value={inputs.financingFeePercent} 
                                   onChange={(v) => setInputs({...inputs, financingFeePercent: v})} 
                                   type="percent" 
                                   tooltip="The average merchant fee charged by lenders (CareCredit, Proceed, etc.) to the practice for financing the procedure. Usually ranges from 5% to 15%."
                                 />
                                 <InputGroup label="Usage Rate (%)" value={inputs.financingUsagePercent} onChange={(v) => setInputs({...inputs, financingUsagePercent: v})} type="percent" />
                               </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Break-Even Milestone Card */}
              <div className="p-7 bg-[#1A365D] rounded-[24px] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500"></div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200/80">BREAK-EVEN MILESTONE</span>
                </div>
                <div className="text-3xl font-black mb-1 relative z-10">{results.breakEvenArches.toFixed(1)} Arches</div>
                <p className="text-[11px] text-blue-200/60 font-medium leading-relaxed relative z-10">Monthly volume needed to cover the total marketing investment.</p>
              </div>

            </aside>

            {/* Main Insights Content */}
            <main className="lg:col-span-8 p-10 flex flex-col gap-12 bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DisplayCard label="PROFIT PER ARCH" value={formatCurrency(results.profitPerArch)} subLabel={`${results.profitMargin.toFixed(1)}% Net Margin`} />
                <DisplayCard label="MONTHLY PROFIT" value={formatCurrency(results.monthlyProfit)} subLabel={`From ${inputs.archesPerMonth} Arches`} />
                <DisplayCard label="MARKETING ROI" value={formatROM(results.returnOnMarketing)} subLabel="Return on Ad Spend (ROAS)" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Visual Breakdown Column */}
                <div className="lg:col-span-6">
                  <div className="flex items-center gap-2 mb-10">
                    <div className="w-5 h-5 rounded-full border-4 border-blue-500 flex items-center justify-center">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-lg">Financial Composition</h3>
                  </div>
                  
                  <div className="h-72 relative mb-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={105}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-85 transition-opacity cursor-pointer" />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">TOTAL PRODUCTION</span>
                      <span className="text-4xl font-black text-[#1A365D]">{formatCurrency(inputs.averageFee)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-[14px] text-slate-600 font-bold group-hover:text-slate-900 transition-colors">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="font-black text-slate-900 text-[14px]">{formatCurrency(item.value)}</span>
                          <span className="text-[11px] font-black text-slate-300 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations & Summary Column */}
                <div className="lg:col-span-6 space-y-8">
                  <div className="bg-[#F8FAFC] rounded-[32px] p-8 border border-slate-100 relative">
                    <div className="flex items-center gap-3 mb-10">
                      <Users className="w-5 h-5 text-blue-500" />
                      <h3 className="font-extrabold text-slate-800 text-lg">Lead Flow Metrics</h3>
                    </div>
                    
                    <div className="space-y-7">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-slate-500 font-bold text-[14px]">Monthly Leads Required</span>
                           <span className="text-[10px] text-slate-400 font-medium">At {inputs.conversionRate}% conversion</span>
                        </div>
                        <span className="font-black text-slate-900 text-lg">{~~results.leadsRequired} <span className="text-xs text-slate-300 ml-1">Leads</span></span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold text-[14px]">Ad Spend Per Start</span>
                        <span className="font-black text-slate-900 text-lg">{formatCurrency(inputs.useLeadFlow ? (inputs.costPerLead / (inputs.conversionRate / 100)) : inputs.marketingCostPerArch)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold text-[14px]">Clinical Cost %</span>
                        <span className="font-black text-slate-900 text-lg">{(( (inputs.labCost + inputs.suppliesCost) / inputs.averageFee ) * 100).toFixed(1)}%</span>
                      </div>
                      
                      <div className="pt-8 border-t border-slate-200 flex justify-between items-end">
                        <div className="flex flex-col">
                           <span className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1">TOTAL COST</span>
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ALL-IN PER ARCH</span>
                        </div>
                        <span className="text-4xl font-black text-[#EF4444]">{formatCurrency(results.totalCostPerArch)}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-[#1A365D] py-5 px-6 rounded-2xl font-black transition-all border-2 border-[#1A365D]/10 hover:border-[#1A365D]/30 group"
                  >
                    <Download className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    DOWNLOAD FULL AUDIT
                  </button>
                </div>
              </div>
            </main>
          </div>

          {/* New Footer Design */}
          <footer className="bg-[#1e293b] p-10 md:p-14 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center mb-10">
              
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">GROSS PRODUCTION</h4>
                  <div className="text-4xl font-black tracking-tight">{formatCurrency(results.monthlyRevenue)}</div>
                  <div className="text-blue-400 text-[10px] mt-1 font-bold uppercase tracking-widest">PROJECTED MONTHLY</div>
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-8 md:pt-0 md:pl-12">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">CLINICAL COSTS</h4>
                <div className="text-3xl font-bold text-slate-100 tracking-tight">{formatCurrency(clinicalCostsMonthly)}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-bold uppercase">SUPPLIES & LAB FEES</div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-8 md:pt-0 md:pl-12">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">AD INVESTMENT</h4>
                <div className="text-3xl font-bold text-blue-400 tracking-tight">{formatCurrency(results.monthlyMarketingSpend)}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-bold uppercase">TOTAL ADSPEND BUDGET</div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-8 md:pt-0 md:pl-12">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">MONTHLY NET</h4>
                <div className="text-3xl font-bold text-[#60A5FA] tracking-tight">{formatCurrency(results.monthlyProfit)}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-bold uppercase">AFTER-TAX ESTIMATES</div>
              </div>
            </div>

            <div className="border-t border-slate-700/30 pt-8 text-center md:text-left">
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-4xl mx-auto md:mx-0 italic uppercase tracking-wider">
                Note: All calculations are projections based on user-provided inputs and industry benchmarks. These figures are for informational purposes only and do not constitute financial or professional accounting advice. Individual practice results may vary significantly based on overhead, location, and operational efficiency.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
