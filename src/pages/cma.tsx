import { useState } from 'react';
import type { Subject, AdjustmentInput, CMAResponse } from '../lib/types';
import { cmaBaseline, cmaAdjust, cmaPdf } from '../lib/api';

// Default subject used to initialise the form
const defaultSubject: Subject = {
  address: '',
  lat: 0,
  lng: 0,
  beds: 0,
  baths: 0,
  sqft: 0,
};

/**
 * CMA page implements a simple three-step wizard:
 *  1. Snapshot: collect subject details and call the baseline API
 *  2. Adjustments: collect adjustments and call the adjust API
 *  3. New CMA: display the updated estimate and comps
 *
 * This is a minimal implementation for demonstration purposes.  In a production
 * app, you would replace text inputs with autocomplete, dropdowns, sliders,
 * proper error handling, and role-based gating for PDF downloads.
 */
export default function CMA() {
  const [tab, setTab] = useState<'snapshot' | 'adjustments' | 'newcma'>('snapshot');
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [baselineResp, setBaselineResp] = useState<CMAResponse | null>(null);
  const [adjustResp, setAdjustResp] = useState<CMAResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Adjustment form state
  const [conditionAdj, setConditionAdj] = useState<string>('');
  const [renovationsAdj, setRenovationsAdj] = useState<string>('');
  const [addBedsAdj, setAddBedsAdj] = useState<number>(0);
  const [addBathsAdj, setAddBathsAdj] = useState<number>(0);
  const [addSqftAdj, setAddSqftAdj] = useState<number>(0);

  const handleBaseline = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await cmaBaseline({ subject });
      setBaselineResp(resp);
      setTab('adjustments');
    } catch (e: any) {
      setError(e?.message || 'Failed to generate baseline CMA');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!baselineResp) return;
    setLoading(true);
    setError(null);
    const adjInput: AdjustmentInput = {
      cma_run_id: baselineResp.cma_run_id,
      condition: conditionAdj || undefined,
      renovations: renovationsAdj ? renovationsAdj.split(',').map((s) => s.trim()) : undefined,
      add_beds: addBedsAdj || undefined,
      add_baths: addBathsAdj || undefined,
      add_sqft: addSqftAdj || undefined,
    };
    try {
      const resp = await cmaAdjust(adjInput);
      setAdjustResp(resp);
      setTab('newcma');
    } catch (e: any) {
      setError(e?.message || 'Failed to apply adjustments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (runId: string) => {
    try {
      const { url } = await cmaPdf(runId);
      window.open(url, '_blank');
    } catch (e) {
      console.error('PDF generation failed', e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Comparative Market Analysis</h1>
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-3 py-1 border ${tab === 'snapshot' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setTab('snapshot')}
        >
          Snapshot
        </button>
        <button
          className={`px-3 py-1 border ${tab === 'adjustments' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => baselineResp && setTab('adjustments')}
          disabled={!baselineResp}
        >
          Adjustments
        </button>
        <button
          className={`px-3 py-1 border ${tab === 'newcma' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => adjustResp && setTab('newcma')}
          disabled={!adjustResp}
        >
          New CMA
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {tab === 'snapshot' && (
        <div>
          <div className="mb-4 space-y-2">
            <label className="block">Address</label>
            <input
              type="text"
              value={subject.address}
              onChange={(e) => setSubject({ ...subject, address: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <label className="block">Beds</label>
            <input
              type="number"
              value={subject.beds}
              onChange={(e) => setSubject({ ...subject, beds: parseInt(e.target.value) || 0 })}
              className="w-full border p-2 rounded"
            />
            <label className="block">Baths</label>
            <input
              type="number"
              value={subject.baths}
              onChange={(e) => setSubject({ ...subject, baths: parseFloat(e.target.value) || 0 })}
              className="w-full border p-2 rounded"
            />
            <label className="block">Sqft</label>
            <input
              type="number"
              value={subject.sqft}
              onChange={(e) => setSubject({ ...subject, sqft: parseInt(e.target.value) || 0 })}
              className="w-full border p-2 rounded"
            />
            <label className="block">Year Built (optional)</label>
            <input
              type="number"
              value={subject.year_built ?? ''}
              onChange={(e) =>
                setSubject({ ...subject, year_built: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="w-full border p-2 rounded"
            />
            <label className="block">Lot Sqft (optional)</label>
            <input
              type="number"
              value={subject.lot_sqft ?? ''}
              onChange={(e) =>
                setSubject({ ...subject, lot_sqft: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="w-full border p-2 rounded"
            />
          </div>
          <button
            onClick={handleBaseline}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? 'Loading...' : 'Generate CMA'}
          </button>
          {baselineResp && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Baseline Estimate: ${baselineResp.estimate.toLocaleString()}</h2>
              <h3 className="mt-2 font-semibold">Comps:</h3>
              <ul className="list-disc pl-4">
                {baselineResp.comps.map((comp) => (
                  <li key={comp.id}>
                    {comp.address} – ${comp.raw_price.toLocaleString()} ({comp.beds}bd/{comp.baths}ba, {comp.living_sqft} sqft)
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <button
                  onClick={() => baselineResp && handleDownloadPdf(baselineResp.cma_run_id)}
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                >
                  Download AI-CMA PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'adjustments' && baselineResp && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Adjustments</h2>
          <div className="space-y-2 mb-4">
            <label className="block">Condition (poor, fair, good, very_good, excellent)</label>
            <input
              type="text"
              value={conditionAdj}
              onChange={(e) => setConditionAdj(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <label className="block">Renovations (comma-separated: kitchen,bath,flooring,roof,dock,hvac)</label>
            <input
              type="text"
              value={renovationsAdj}
              onChange={(e) => setRenovationsAdj(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <label className="block">Add Bedrooms</label>
            <input
              type="number"
              value={addBedsAdj}
              onChange={(e) => setAddBedsAdj(parseInt(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
            <label className="block">Add Bathrooms</label>
            <input
              type="number"
              step="0.5"
              value={addBathsAdj}
              onChange={(e) => setAddBathsAdj(parseFloat(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
            <label className="block">Add Sqft</label>
            <input
              type="number"
              value={addSqftAdj}
              onChange={(e) => setAddSqftAdj(parseInt(e.target.value) || 0)}
              className="w-full border p-2 rounded"
            />
          </div>
          <button
            onClick={handleAdjust}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? 'Loading...' : 'Apply Adjustments'}
          </button>
        </div>
      )}
      {tab === 'newcma' && adjustResp && (
        <div>
          <h2 className="text-xl font-semibold">Adjusted Estimate: ${adjustResp.estimate.toLocaleString()}</h2>
          <h3 className="mt-2 font-semibold">Comps:</h3>
          <ul className="list-disc pl-4">
            {adjustResp.comps.map((comp) => (
              <li key={comp.id}>
                {comp.address} – ${comp.raw_price.toLocaleString()} ({comp.beds}bd/{comp.baths}ba, {comp.living_sqft} sqft)
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <button
              onClick={() => adjustResp && handleDownloadPdf(adjustResp.cma_run_id)}
              className="px-3 py-1 bg-purple-600 text-white rounded"
            >
              Download AI-CMA PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}