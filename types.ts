
export interface ROIInputs {
  averageFee: number;
  labCost: number;
  suppliesCost: number;
  providerCompPercent: number;
  tcCommissionPercent: number;
  marketingCostPerArch: number;
  archesPerMonth: number;
  // Dynamic financing assumptions
  financingUsagePercent: number;
  financingAmtPercent: number;
  financingFeePercent: number;
}

export interface ROIResults {
  providerComp: number;
  tcCommission: number;
  financingFees: number;
  totalCostPerArch: number;
  profitPerArch: number;
  profitMargin: number;
  returnOnMarketing: number;
  monthlyRevenue: number;
  monthlyMarketingSpend: number;
  monthlyProfit: number;
}

// Initial defaults moved to a constant for resetting if needed
export const DEFAULT_FINANCING_ASSUMPTIONS = {
  usagePercent: 70,
  financedPercent: 70,
  feePercent: 7,
};
