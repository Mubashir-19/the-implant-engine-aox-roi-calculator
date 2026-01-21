import React, { useState, useMemo } from 'react';
import { ROIInputs, ROIResults, DEFAULT_FINANCING_ASSUMPTIONS } from './types';
import { InputGroup } from './components/InputGroup';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Zap, 
  Info,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const COLORS = {
    profit: '#1e293b', // Dark Slate
    marketing: '#3b82f6', // Blue-500
    lab: '#93c5fd', // Blue-300
    feeComp: '#fde047', // Yellow-300
    financing: '#e0f2fe', // Very Light Blue-100
    providers: '#60a5fa', // Blue-400
  };

  const [inputs, setInputs] = useState<ROIInputs>({
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
  });

  const [isFinancingUnlocked, setIsFinancingUnlocked] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('treatment');
  const [viewType, setViewType] = useState<'per-arch' | 'monthly'>('per-arch');
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleSeries = (name: string) => {
    setHiddenSeries(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const results = useMemo((): ROIResults & { breakEvenArches: number } => {
    // Simplified marketing cost (removed lead flow logic)
    const marketingCost = inputs.marketingCostPerArch;

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
    };
  }, [inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  
  const formatROM = (val: number) => `${val.toFixed(1)}x`;

  const chartData = useMemo(() => {
    const total = inputs.averageFee || 1;
    const marketingCost = inputs.marketingCostPerArch;
    
    return [
      { name: 'Lab', value: inputs.labCost + inputs.suppliesCost, fill: COLORS.lab, percentage: ((inputs.labCost + inputs.suppliesCost) / total) * 100 },
      { name: 'Marketing', value: marketingCost, fill: COLORS.marketing, percentage: (marketingCost / total) * 100 },
      { name: 'Providers', value: results.providerComp, fill: COLORS.providers, percentage: (results.providerComp / total) * 100 },
      { name: 'Fee/Comp', value: results.tcCommission, fill: COLORS.feeComp, percentage: (results.tcCommission / total) * 100 },
      { name: 'Financing', value: results.financingFees, fill: COLORS.financing, percentage: (results.financingFees / total) * 100 },
      { name: 'Profit', value: Math.max(0, results.profitPerArch), fill: COLORS.profit, percentage: (Math.max(0, results.profitPerArch) / total) * 100 },
    ];
  }, [inputs, results, COLORS]);

  const activeChartData = useMemo(() => {
    return chartData.filter(item => !hiddenSeries.includes(item.name));
  }, [chartData, hiddenSeries]);

  const viewMultiplier = viewType === 'monthly' ? inputs.archesPerMonth : 1;

  const handleDownload = async () => {
    setIsDownloading(true);
    // Allow React state to update UI before heavy calculation
    await new Promise(resolve => setTimeout(resolve, 50));

    const element = document.getElementById('pdf-content');
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Hide the download button in the PDF
          const btn = clonedDoc.getElementById('download-btn');
          if (btn) btn.style.display = 'none';

          // Show the logo in the PDF
          const logo = clonedDoc.getElementById('pdf-logo');
          if (logo) {
            logo.style.display = 'block';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with same dimensions as the canvas
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      // Add link over the logo area
      // The logo is positioned: right-12 (48px) bottom-12 (48px) with width 180px.
      // We calculate coordinates in the scaled canvas (PDF) space.
      const scale = 2; 
      const margin = 48 * scale;
      const logoW = 180 * scale;
      const logoH = 60 * scale; // Approximate height for the link hit area (3:1 aspect ratio assumption)

      const linkX = canvas.width - margin - logoW;
      const linkY = canvas.height - margin - logoH;

      pdf.link(linkX, linkY, logoW, logoH, { url: 'https://theimplantengine.com/' });

      pdf.save('ROI-Audit.pdf');
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-inter text-slate-900 px-4 py-8 lg:py-12 flex flex-col items-center">
      <div id="pdf-content" className="relative max-w-[1240px] w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[800px]">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-4 bg-[#F8FAFC] border-r border-slate-100 p-6 lg:p-8 space-y-6 flex flex-col">
            
            <div className="space-y-4 pt-4">
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
                    <InputGroup 
                      label="Treatment price per arch" 
                      value={inputs.averageFee} 
                      onChange={(val) => setInputs({ ...inputs, averageFee: val })} 
                      type="currency" 
                      step={100}
                      tooltip="The average fee charged to the patient for a single arch treatment."
                    />
                    <InputGroup 
                      label="Lab cost per arch" 
                      value={inputs.labCost} 
                      onChange={(val) => setInputs({ ...inputs, labCost: val })} 
                      type="currency" 
                      tooltip="The cost paid to the dental lab for fabricating the prosthesis for one arch."
                    />
                    <InputGroup 
                      label="Implants & surgical supplies" 
                      value={inputs.suppliesCost} 
                      onChange={(val) => setInputs({ ...inputs, suppliesCost: val })} 
                      type="currency" 
                      tooltip="The cost of implants, abutments, and other surgical consumables per arch."
                    />
                  </div>
                )}
              </div>

              {/* Financing, Provider & TC Fees */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setOpenSection(openSection === 'financing' ? null : 'financing')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="font-bold text-slate-800 text-[13px] tracking-tight">Financing, Provider & TC Fees</h3>
                  </div>
                  {openSection === 'financing' ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                </button>
                {openSection === 'financing' && (
                  <div className="p-5 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <InputGroup 
                      label="Outside provider fee (%)" 
                      value={inputs.providerCompPercent} 
                      onChange={(v) => setInputs({ ...inputs, providerCompPercent: v })} 
                      type="percent" 
                      tooltip="Percentage of the case fee paid to an external surgeon or prosthodontist, if applicable."
                    />
                    <InputGroup 
                      label="TC Commission (%)" 
                      value={inputs.tcCommissionPercent} 
                      onChange={(v) => setInputs({ ...inputs, tcCommissionPercent: v })} 
                      type="percent" 
                      tooltip="Commission percentage paid to the Treatment Coordinator for closing the case."
                    />
                    
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 mt-4">
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">FINANCING DETAILS</span>
                         <button onClick={() => setIsFinancingUnlocked(!isFinancingUnlocked)} className="p-1 rounded bg-white shadow-sm border border-slate-100">
                           <Lock className="w-3 h-3 text-slate-300" />
                         </button>
                       </div>
                       
                       {!isFinancingUnlocked && (
                         <p className="text-[10px] text-slate-400 leading-relaxed mb-1">
                           Calculations reflect industry benchmarks: {inputs.financingFeePercent}% lender fees, {inputs.financingUsagePercent}% patient usage rate, and {inputs.financingAmtPercent}% of treatment cost financed.
                         </p>
                       )}

                       {isFinancingUnlocked && (
                         <div className="space-y-4 mt-3">
                           <InputGroup 
                             label="Usage Rate (%)" 
                             value={inputs.financingUsagePercent} 
                             onChange={(v) => setInputs({...inputs, financingUsagePercent: v})} 
                             type="percent" 
                             tooltip="The percentage of patients who choose to use financing options."
                           />
                           <InputGroup 
                             label="Avg. % Financed" 
                             value={inputs.financingAmtPercent} 
                             onChange={(v) => setInputs({...inputs, financingAmtPercent: v})} 
                             type="percent" 
                             tooltip="The average percentage of the total treatment cost that is financed by patients."
                           />
                           <InputGroup 
                             label="Lender Fee (%)" 
                             value={inputs.financingFeePercent} 
                             onChange={(v) => setInputs({...inputs, financingFeePercent: v})} 
                             type="percent" 
                             tooltip="The average fee percentage charged by financing companies."
                           />
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>

              {/* Marketing & Volume */}
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <label className="text-[12px] font-bold text-slate-600">Marketing cost per arch</label>
                        <div className="relative group/tooltip flex items-center">
                          <Info className="w-3 h-3 text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-56 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-2xl z-50 leading-relaxed animate-in fade-in zoom-in-95 duration-150">
                            This cost is directly tied to patient acquisition and marketing efforts.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
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
          <main className="lg:col-span-8 p-6 lg:p-10 flex flex-col bg-white">
            
            <header className="mb-8 lg:mb-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">
                  All-on-X ROI Calculator
                </h1>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 lg:mt-8 h-full">
              
              {/* Chart Section */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-center mb-10">
                  {/* Big Toggle Buttons */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm border border-slate-200 shadow-inner">
                    <button 
                      onClick={() => setViewType('per-arch')}
                      className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${viewType === 'per-arch' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Per Arch
                    </button>
                    <button 
                      onClick={() => setViewType('monthly')}
                      className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${viewType === 'monthly' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
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
                          data={activeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {activeChartData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
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
                    {chartData.map((item) => {
                      const isHidden = hiddenSeries.includes(item.name);
                      return (
                        <div 
                          key={item.name} 
                          className={`flex items-center justify-between cursor-pointer transition-all duration-200 ${isHidden ? 'opacity-40 grayscale' : 'hover:opacity-80'}`}
                          onClick={() => toggleSeries(item.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${isHidden ? 'scale-75' : 'scale-100'}`} style={{ backgroundColor: item.fill }} />
                            <span className={`text-[13px] font-bold transition-colors ${isHidden ? 'text-slate-400' : 'text-slate-600'}`}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-10">
                            <span className={`font-black text-[13px] transition-colors ${isHidden ? 'text-slate-400' : 'text-slate-900'}`}>{formatCurrency(item.value * viewMultiplier)}</span>
                            <span className="text-[10px] font-black text-slate-200 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column Metrics */}
              <div className="lg:col-span-5 flex flex-col gap-6 lg:h-full">
                
                {/* Marketing ROI Card */}
                <div className="bg-[#F8FAFC] border border-slate-50 rounded-[32px] p-6 lg:p-8 flex flex-col justify-center min-h-[160px] hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 group-hover:text-blue-500 transition-colors">
                     MARKETING ROI
                   </div>
                   <div className="text-5xl lg:text-6xl font-black text-[#1A365D] leading-none tracking-tighter -ml-0.5">
                     {formatROM(results.returnOnMarketing)}
                   </div>
                   <div className="text-[11px] font-bold text-slate-400/80 mt-2">
                     Return on Ad Spend
                   </div>
                </div>

                {/* Total Cost & Profit Stack */}
                <div className="border border-blue-100 rounded-[32px] overflow-hidden shadow-xl shadow-blue-500/5 flex-1 flex flex-col">
                    {/* Total Cost Segment */}
                    <div className="bg-white p-6 lg:p-8 flex-1 flex flex-col justify-center border-b border-slate-50">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">TOTAL COST</span>
                       <span className="text-3xl lg:text-4xl font-black text-[#EF4444] tracking-tighter">
                           {formatCurrency(results.totalCostPerArch * viewMultiplier)}
                       </span>
                       <span className="text-[9px] lg:text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed mt-1">
                           {viewType === 'per-arch' ? 'ALL-IN PER ARCH' : 'MONTHLY ALL-IN'}
                       </span>
                    </div>

                    {/* Total Profit Segment */}
                    <div className="bg-[#ECFDF5] p-6 lg:p-8 flex-1 flex flex-col justify-center">
                       <span className="text-[10px] font-black text-emerald-800/60 uppercase tracking-[0.2em] mb-2">TOTAL PROFIT</span>
                       <span className="text-3xl lg:text-4xl font-black text-emerald-600 tracking-tighter">
                           {formatCurrency(results.profitPerArch * viewMultiplier)}
                       </span>
                       <span className="text-[9px] lg:text-[10px] text-emerald-600/60 font-bold uppercase tracking-widest leading-relaxed mt-1">
                           {viewType === 'per-arch' ? 'NET PER ARCH' : 'MONTHLY NET'}
                       </span>
                    </div>
                </div>

                <button 
                  id="download-btn"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-500 py-5 px-6 rounded-2xl font-black border border-slate-100 shadow-sm transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] uppercase tracking-[0.2em]">GENERATING PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] uppercase tracking-[0.2em]">DOWNLOAD FULL AUDIT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-[#1e293b] p-8 md:p-14 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 items-center mb-14">
            
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">GROSS REVENUE</h4>
                <div className="text-4xl font-black tracking-tight">{formatCurrency(results.monthlyRevenue)}</div>
                <div className="text-blue-400 text-[10px] mt-1.5 font-bold uppercase tracking-[0.1em]">PROJECTED MONTHLY</div>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12 text-center md:text-left">
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2.5">CLINICAL COSTS</h4>
              <div className="text-3xl font-bold text-slate-100 tracking-tight">{formatCurrency((inputs.labCost + inputs.suppliesCost) * inputs.archesPerMonth)}</div>
              <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">SUPPLIES & LAB FEES</div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12 text-center md:text-left">
              <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2.5">AD INVESTMENT</h4>
              <div className="text-3xl font-bold text-blue-400 tracking-tight">{formatCurrency(results.monthlyMarketingSpend)}</div>
              <div className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-wider">TOTAL ADSPEND BUDGET</div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-700/50 pt-10 md:pt-0 md:pl-12 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2.5">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">MONTHLY NET</h4>
                <div className="relative group/tooltip flex items-center">
                  <Info className="w-3 h-3 text-slate-500 cursor-help hover:text-blue-400 transition-colors" />
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tooltip:block w-56 p-2.5 bg-slate-900 text-slate-100 text-[10px] rounded-lg shadow-2xl z-50 leading-relaxed animate-in fade-in zoom-in-95 duration-150 border border-slate-700">
                    Calculated based on your Profit Per Arch multiplied by the Monthly Arches volume.
                    <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>
              </div>
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
        
        {/* Hidden Logo for PDF Generation Only */}
        <img 
          id="pdf-logo"
          src="https://theimplantengine.com/wp-content/uploads/2025/03/the-implant-engine-logo-white.png"
          alt="The Implant Engine"
          crossOrigin="anonymous"
          className="absolute bottom-12 right-12 w-[180px] z-50 hidden"
          style={{ display: 'none' }} 
        />
      </div>
    </div>
  );
};

export default App;