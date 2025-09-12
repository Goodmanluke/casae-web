import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSubscription } from "../hooks/useSubscription";

/*
 * InvestmentCalculators component
 *
 * This component renders three investment analysis tools—BRRR, Flip and Buy & Hold—
 * with a simple tabbed interface. It accepts baseline CMA data, optional
 * adjusted data and an estimated monthly rent to pre‑fill a handful of
 * important inputs. Users can override any of the fields. The calculators
 * perform basic return analyses based on commonly used formulas in
 * real‑estate investing. Premium access is required to view and interact
 * with the calculators. If a user does not have an active subscription or
 * trial, an upgrade call‑to‑action is displayed instead of the tools.
 */

interface CMAData {
  estimate: number;
  subject: {
    address?: string;
    beds?: number;
    baths?: number;
    sqft?: number;
    year_built?: number;
    lot_sqft?: number;
  };
}

interface InvestmentCalculatorsProps {
  baselineData: CMAData;
  adjustedData?: CMAData | null;
  monthlyRent?: number | null;
  adjustedMonthlyRent?: number | null;
}

// Helper to compute a loan payment. Formula: r*L/(1-(1+r)^-n)
function monthlyPayment(
  rate: number,
  nPeriods: number,
  principal: number
): number {
  const r = rate / 12;
  if (r === 0) return principal / nPeriods;
  const pmt = (r * principal) / (1 - Math.pow(1 + r, -nPeriods));
  return pmt;
}

export default function InvestmentCalculators({
  baselineData,
  adjustedData,
  monthlyRent,
  adjustedMonthlyRent,
}: InvestmentCalculatorsProps) {
  const [activeTab, setActiveTab] = useState<"brrr" | "flip" | "hold">("brrr");
  // Prefill values from CMA
  const purchasePrice = baselineData?.estimate ?? 0;
  const arvValue = adjustedData?.estimate ?? purchasePrice;
  const estRent = adjustedMonthlyRent ?? monthlyRent ?? 0;

  // Retrieve userId to check subscription status
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    // load session on mount
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id);
    })();
  }, []);
  const { isPremium, isPro, isTrialing, hasProAccess, createCheckoutSession } =
    useSubscription(userId);

  /*
   * BRRR calculator state. Many of these values are expressed as
   * percentages (0.2 instead of 20%) to make the formulas easier.
   */
  const [brrrDownPayment, setBrrrDownPayment] = useState(0.25);
  const [brrrClosingPct, setBrrrClosingPct] = useState(0.03);
  const [brrrRehab, setBrrrRehab] = useState(0);
  const [brrrHoldingMonths, setBrrrHoldingMonths] = useState(6);
  const [brrrVacancy, setBrrrVacancy] = useState(0.05);
  const [brrrMaintenance, setBrrrMaintenance] = useState(0.05);
  const [brrrCapex, setBrrrCapex] = useState(0.05);
  const [brrrMgmt, setBrrrMgmt] = useState(0.1);
  const [brrrInterestRate, setBrrrInterestRate] = useState(0.1);
  const [brrrRefiRate, setBrrrRefiRate] = useState(0.07);
  const [brrrRefiLtv, setBrrrRefiLtv] = useState(0.75);
  const [brrrRefiAmortYears, setBrrrRefiAmortYears] = useState(30);
  const [brrrRefiClosingPct, setBrrrRefiClosingPct] = useState(0.03);

  // Flip calculator state
  const [flipDownPayment, setFlipDownPayment] = useState(0.2);
  const [flipClosingBuyPct, setFlipClosingBuyPct] = useState(0.03);
  const [flipClosingSellPct, setFlipClosingSellPct] = useState(0.06);
  const [flipRehab, setFlipRehab] = useState(0);
  const [flipHoldingMonths, setFlipHoldingMonths] = useState(6);
  const [flipInterestRate, setFlipInterestRate] = useState(0.1);
  const [flipUtilities, setFlipUtilities] = useState(0);

  // Hold calculator state
  const [holdDownPayment, setHoldDownPayment] = useState(0.2);
  const [holdClosingPct, setHoldClosingPct] = useState(0.03);
  const [holdInterestRate, setHoldInterestRate] = useState(0.08);
  const [holdLoanYears, setHoldLoanYears] = useState(30);
  const [holdVacancy, setHoldVacancy] = useState(0.05);
  const [holdMaintenance, setHoldMaintenance] = useState(0.05);
  const [holdCapex, setHoldCapex] = useState(0.05);
  const [holdMgmt, setHoldMgmt] = useState(0.1);

  // Calculations for BRRR
  const brrrLoanAmount = purchasePrice * (1 - brrrDownPayment);
  const brrrDownPaymentAmt = purchasePrice * brrrDownPayment;
  const brrrBuyClosing = purchasePrice * brrrClosingPct;
  const brrrMonthlyInterest = (brrrInterestRate / 12) * brrrLoanAmount;
  const brrrHoldingCost = brrrMonthlyInterest * brrrHoldingMonths;
  const brrrCashIn =
    brrrDownPaymentAmt + brrrBuyClosing + brrrRehab + brrrHoldingCost;
  // Stabilized operations
  const brrrGrossRent = estRent * 12;
  const brrrVacancyLoss = brrrGrossRent * brrrVacancy;
  const brrrOperatingExpenses =
    (brrrMaintenance + brrrCapex + brrrMgmt) * brrrGrossRent;
  const brrrNoi = brrrGrossRent - brrrVacancyLoss - brrrOperatingExpenses;
  // Refinance
  const brrrRefiLoan = arvValue * brrrRefiLtv;
  const brrrRefiClosing = brrrRefiLoan * brrrRefiClosingPct;
  const brrrCashOut =
    brrrRefiLoan - brrrLoanAmount - brrrRehab - brrrRefiClosing;
  const brrrCashLeftIn = Math.max(brrrCashIn - brrrCashOut, 0);
  const brrrRefiMonthlyPi = monthlyPayment(
    brrrRefiRate,
    brrrRefiAmortYears * 12,
    brrrRefiLoan
  );
  const brrrAnnualDebtService = brrrRefiMonthlyPi * 12;
  const brrrAnnualCashFlow = brrrNoi - brrrAnnualDebtService;
  const brrrCoC = brrrCashLeftIn > 0 ? brrrAnnualCashFlow / brrrCashLeftIn : 0;

  // Calculations for Flip
  const flipLoanAmount = purchasePrice * (1 - flipDownPayment);
  const flipDownPaymentAmt = purchasePrice * flipDownPayment;
  const flipBuyClosing = purchasePrice * flipClosingBuyPct;
  const flipMonthlyInterest = (flipInterestRate / 12) * flipLoanAmount;
  const flipHoldingCost =
    flipMonthlyInterest * flipHoldingMonths + flipUtilities * flipHoldingMonths;
  const flipTotalCost =
    purchasePrice + flipBuyClosing + flipRehab + flipHoldingCost;
  const flipSellClosing = arvValue * flipClosingSellPct;
  const flipNetProfit = arvValue - flipSellClosing - flipTotalCost;
  const flipCashInvested =
    flipDownPaymentAmt +
    flipBuyClosing +
    flipRehab +
    flipMonthlyInterest * flipHoldingMonths;
  const flipRoi = flipCashInvested > 0 ? flipNetProfit / flipCashInvested : 0;
  const flipAnnualizedRoi = flipRoi * (12 / (flipHoldingMonths || 1));

  // Calculations for Hold
  const holdLoanAmount = purchasePrice * (1 - holdDownPayment);
  const holdDownPaymentAmt = purchasePrice * holdDownPayment;
  const holdBuyClosing = purchasePrice * holdClosingPct;
  const holdMonthlyPi = monthlyPayment(
    holdInterestRate,
    holdLoanYears * 12,
    holdLoanAmount
  );
  const holdGrossRent = estRent * 12;
  const holdVacancyLoss = holdGrossRent * holdVacancy;
  const holdOperatingExpenses =
    (holdMaintenance + holdCapex + holdMgmt) * holdGrossRent;
  const holdNoi = holdGrossRent - holdVacancyLoss - holdOperatingExpenses;
  const holdAnnualDebtService = holdMonthlyPi * 12;
  const holdAnnualCashFlow = holdNoi - holdAnnualDebtService;
  const holdTotalCashInvested = holdDownPaymentAmt + holdBuyClosing;
  const holdCoC =
    holdTotalCashInvested > 0 ? holdAnnualCashFlow / holdTotalCashInvested : 0;
  const holdCapRate = purchasePrice > 0 ? holdNoi / purchasePrice : 0;

  // Render helper for number formatting
  const fmtPct = (value: number) => `${(value * 100).toFixed(1)}%`;
  const fmtUsd = (value: number) =>
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  if (!isPro) {
    return (
      <div className="mt-6 text-center bg-white/10 p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-white mb-4">Pro Feature</h2>
        <p className="text-gray-300 mb-6">
          Investment calculators are available on the Pro plan or higher.
          Upgrade to unlock BRRR, Flip and Buy & Hold analyses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-lg transition-all"
            onClick={() => {
              if (createCheckoutSession) {
                createCheckoutSession("pro");
              } else {
                window.location.href = "/plans";
              }
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Tabs for calculator types */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab("brrr")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "brrr"
              ? "bg-cyan-500 text-white shadow-lg"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          BRRR
        </button>
        <button
          onClick={() => setActiveTab("flip")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "flip"
              ? "bg-cyan-500 text-white shadow-lg"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          Flip
        </button>
        <button
          onClick={() => setActiveTab("hold")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "hold"
              ? "bg-cyan-500 text-white shadow-lg"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          Buy & Hold
        </button>
      </div>
      {/* BRRR calculator */}
      {activeTab === "brrr" && (
        <div className="bg-white/10 p-6 rounded-xl text-white space-y-4">
          <h3 className="text-xl font-semibold">BRRR Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Purchase Price</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => {
                  /* purchase price is derived from CMA, no change */
                }}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                After Repair Value (ARV)
              </label>
              <input
                type="number"
                value={arvValue}
                onChange={(e) => {
                  /* ARV derived from CMA, no change */
                }}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rehab Budget</label>
              <input
                type="number"
                value={brrrRehab}
                onChange={(e) => setBrrrRehab(Number(e.target.value) || 0)}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Down Payment (%)</label>
              <input
                type="number"
                value={brrrDownPayment * 100}
                onChange={(e) =>
                  setBrrrDownPayment((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Closing Costs (%)</label>
              <input
                type="number"
                value={brrrClosingPct * 100}
                onChange={(e) =>
                  setBrrrClosingPct((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Holding Months</label>
              <input
                type="number"
                value={brrrHoldingMonths}
                onChange={(e) =>
                  setBrrrHoldingMonths(Number(e.target.value) || 0)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Vacancy (%)</label>
              <input
                type="number"
                value={brrrVacancy * 100}
                onChange={(e) =>
                  setBrrrVacancy((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Maintenance (%)</label>
              <input
                type="number"
                value={brrrMaintenance * 100}
                onChange={(e) =>
                  setBrrrMaintenance((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CapEx (%)</label>
              <input
                type="number"
                value={brrrCapex * 100}
                onChange={(e) =>
                  setBrrrCapex((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Management (%)</label>
              <input
                type="number"
                value={brrrMgmt * 100}
                onChange={(e) =>
                  setBrrrMgmt((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={brrrInterestRate * 100}
                onChange={(e) =>
                  setBrrrInterestRate((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Refi Rate (%)</label>
              <input
                type="number"
                value={brrrRefiRate * 100}
                onChange={(e) =>
                  setBrrrRefiRate((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Refi LTV (%)</label>
              <input
                type="number"
                value={brrrRefiLtv * 100}
                onChange={(e) =>
                  setBrrrRefiLtv((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Refi Amort (Years)</label>
              <input
                type="number"
                value={brrrRefiAmortYears}
                onChange={(e) =>
                  setBrrrRefiAmortYears(Number(e.target.value) || 0)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl">
            <div>
              <div className="text-sm text-gray-300">Cash Left In</div>
              <div className="text-lg font-semibold">
                {fmtUsd(Math.round(brrrCashLeftIn))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Annual Cash Flow</div>
              <div className="text-lg font-semibold">
                {fmtUsd(Math.round(brrrAnnualCashFlow))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Cash‑on‑Cash Return</div>
              <div className="text-lg font-semibold">{fmtPct(brrrCoC)}</div>
            </div>
          </div>
        </div>
      )}
      {/* Flip calculator */}
      {activeTab === "flip" && (
        <div className="bg-white/10 p-6 rounded-xl text-white space-y-4">
          <h3 className="text-xl font-semibold">Flip Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Purchase Price</label>
              <input
                type="number"
                value={purchasePrice}
                disabled
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Sale Price (ARV)</label>
              <input
                type="number"
                value={arvValue}
                disabled
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rehab Budget</label>
              <input
                type="number"
                value={flipRehab}
                onChange={(e) => setFlipRehab(Number(e.target.value) || 0)}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Down Payment (%)</label>
              <input
                type="number"
                value={flipDownPayment * 100}
                onChange={(e) =>
                  setFlipDownPayment((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Buy Closing Costs (%)
              </label>
              <input
                type="number"
                value={flipClosingBuyPct * 100}
                onChange={(e) =>
                  setFlipClosingBuyPct((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Sell Closing Costs (%)
              </label>
              <input
                type="number"
                value={flipClosingSellPct * 100}
                onChange={(e) =>
                  setFlipClosingSellPct((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Holding Months</label>
              <input
                type="number"
                value={flipHoldingMonths}
                onChange={(e) =>
                  setFlipHoldingMonths(Number(e.target.value) || 0)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={flipInterestRate * 100}
                onChange={(e) =>
                  setFlipInterestRate((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Monthly Utilities</label>
              <input
                type="number"
                value={flipUtilities}
                onChange={(e) => setFlipUtilities(Number(e.target.value) || 0)}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl">
            <div>
              <div className="text-sm text-gray-300">Net Profit</div>
              <div className="text-lg font-semibold">
                {fmtUsd(Math.round(flipNetProfit))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">ROI</div>
              <div className="text-lg font-semibold">{fmtPct(flipRoi)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Annualized ROI</div>
              <div className="text-lg font-semibold">
                {fmtPct(flipAnnualizedRoi)}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hold calculator */}
      {activeTab === "hold" && (
        <div className="bg-white/10 p-6 rounded-xl text-white space-y-4">
          <h3 className="text-xl font-semibold">Buy & Hold Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Purchase Price</label>
              <input
                type="number"
                value={purchasePrice}
                disabled
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Down Payment (%)</label>
              <input
                type="number"
                value={holdDownPayment * 100}
                onChange={(e) =>
                  setHoldDownPayment((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Closing Costs (%)</label>
              <input
                type="number"
                value={holdClosingPct * 100}
                onChange={(e) =>
                  setHoldClosingPct((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Interest Rate (%)</label>
              <input
                type="number"
                value={holdInterestRate * 100}
                onChange={(e) =>
                  setHoldInterestRate((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Loan Term (Years)</label>
              <input
                type="number"
                value={holdLoanYears}
                onChange={(e) => setHoldLoanYears(Number(e.target.value) || 0)}
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Vacancy (%)</label>
              <input
                type="number"
                value={holdVacancy * 100}
                onChange={(e) =>
                  setHoldVacancy((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Maintenance (%)</label>
              <input
                type="number"
                value={holdMaintenance * 100}
                onChange={(e) =>
                  setHoldMaintenance((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CapEx (%)</label>
              <input
                type="number"
                value={holdCapex * 100}
                onChange={(e) =>
                  setHoldCapex((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Management (%)</label>
              <input
                type="number"
                value={holdMgmt * 100}
                onChange={(e) =>
                  setHoldMgmt((Number(e.target.value) || 0) / 100)
                }
                className="w-full bg-white/90 text-gray-800 p-2 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl">
            <div>
              <div className="text-sm text-gray-300">Annual Cash Flow</div>
              <div className="text-lg font-semibold">
                {fmtUsd(Math.round(holdAnnualCashFlow))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Cash‑on‑Cash Return</div>
              <div className="text-lg font-semibold">{fmtPct(holdCoC)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Cap Rate</div>
              <div className="text-lg font-semibold">{fmtPct(holdCapRate)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
