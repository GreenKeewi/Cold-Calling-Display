import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { ChevronLeft, ChevronRight } from 'lucide-react';
 

type Business = {
  site_url: string;
  business_name: string;
  industry: string;
  company_name: string;
  city: string;
  phone_number: string;
};

 

const STORAGE_KEY = 'cold-calling-display:current-index';
const INDUSTRY_STORAGE_KEY = 'cold-calling-display:selected-industry';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

const parseBusinesses = (csvText: string) => {
  const parsed = Papa.parse<Business>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const businesses =
    parsed.data
      ?.map((business) => ({
        site_url: business.site_url?.trim() ?? '',
        business_name: business.business_name?.trim() ?? '',
        industry: business.industry?.trim() ?? '',
        company_name: business.company_name?.trim() ?? '',
        city: business.city?.trim() ?? '',
        phone_number: business.phone_number?.trim() ?? '',
      }))
      .filter((business) =>
        Boolean(
          business.business_name ||
            business.company_name ||
            business.site_url ||
            business.phone_number,
        ),
      ) ?? [];

  return { businesses, errors: parsed.errors ?? [] };
};

const getStoredIndex = (total: number) => {
  if (!total) return 0;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) ? clamp(parsed, 0, total - 1) : 0;
  } catch {
    return 0;
  }
};

function App() {
  const [csvText, setCsvText] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    // Auto-load CSV from public/data.csv
    (async () => {
      try {
        const res = await fetch('/data.csv');
        if (res.ok) {
          const text = await res.text();
          if (!cancelled && text && text.trim().length > 0) {
            setCsvText(text);
          }
        }
      } catch {
        // ignore fetch errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { businesses, errors } = useMemo(() => parseBusinesses(csvText), [csvText]);
  
  const [selectedIndustry, setSelectedIndustry] = useState<string>(() => {
    // First try to get from URL
    const params = new URLSearchParams(window.location.search);
    const urlIndustry = params.get('industry');
    if (urlIndustry) return urlIndustry;
    
    // Fall back to localStorage
    try {
      return window.localStorage.getItem(INDUSTRY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Filter businesses by selected industry
  const filteredBusinesses = useMemo(() => {
    if (!selectedIndustry) return businesses;
    return businesses.filter(b => b.industry === selectedIndustry);
  }, [businesses, selectedIndustry]);

  // Get unique industries for the dropdown
  const industries = useMemo(() => {
    const uniqueIndustries = new Set<string>();
    businesses.forEach(b => {
      if (b.industry && b.industry.trim()) {
        uniqueIndustries.add(b.industry);
      }
    });
    return Array.from(uniqueIndustries).sort();
  }, [businesses]);

  const total = filteredBusinesses.length;
  const initializedRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    getStoredIndex(total),
  );

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Persist only after we've rehydrated from storage to avoid clobbering
    if (!hasInitializedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(currentIndex));
      window.localStorage.setItem(INDUSTRY_STORAGE_KEY, selectedIndustry);
      
      // Update URL with industry filter
      const params = new URLSearchParams(window.location.search);
      if (selectedIndustry) {
        params.set('industry', selectedIndustry);
      } else {
        params.delete('industry');
      }
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch {
      // Ignore write errors (e.g. storage disabled)
    }
  }, [currentIndex, selectedIndustry]);

  // After data loads, restore last position once
  useEffect(() => {
    if (!initializedRef.current && total > 0) {
      initializedRef.current = true;
      hasInitializedRef.current = true;
      setCurrentIndex(getStoredIndex(total));
    }
  }, [total]);

  // Reset index when industry filter changes
  useEffect(() => {
    if (hasInitializedRef.current) {
      setCurrentIndex(0);
    }
  }, [selectedIndustry]);

  const currentBusiness = filteredBusinesses[currentIndex];
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;

  const hasErrors = errors && errors.length > 0;
  const errorMessage = hasErrors
    ? `Encountered ${errors.length} parsing issue${
        errors.length > 1 ? 's' : ''
      }. Showing available data.`
    : null;
  
  const [jumpInput, setJumpInput] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  const handleJump = () => {
    const num = parseInt(jumpInput, 10);
    if (num >= 1 && num <= total) {
      setCurrentIndex(num - 1);
      setShowJumpInput(false);
      setJumpInput('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex w-full items-stretch">
        {/* Left Navigation Arrow */}
        <button
          type="button"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={!canGoBack}
          className="flex w-24 flex-shrink-0 items-center justify-center transition-colors duration-200 disabled:opacity-30 hover:enabled:bg-gray-200"
          aria-label="Previous business"
        >
          <ChevronLeft className="h-12 w-12 text-gray-600" />
        </button>

        {/* Main Card */}
        <div className="flex flex-1 items-center justify-center p-8">
          {total > 0 && currentBusiness ? (
            <div className="flex w-full max-w-5xl flex-col gap-8 rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
              {/* Industry Filter */}
              <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                <label htmlFor="industry-filter" className="text-sm font-medium text-gray-700">
                  Filter by Industry:
                </label>
                <select
                  id="industry-filter"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-gray-400 focus:outline-none"
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
                {selectedIndustry && (
                  <span className="text-sm text-gray-500">
                    ({total} {total === 1 ? 'business' : 'businesses'})
                  </span>
                )}
              </div>

              {/* Business Name as Header */}
              <div className="border-b border-gray-200 pb-6">
                <h1 className="text-4xl font-semibold text-gray-900">
                  {currentBusiness.business_name || 'N/A'}
                </h1>
                <div className="mt-3 flex items-center gap-2">
                  {showJumpInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={total}
                        value={jumpInput}
                        onChange={(e) => setJumpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleJump();
                          if (e.key === 'Escape') {
                            setShowJumpInput(false);
                            setJumpInput('');
                          }
                        }}
                        className="w-24 rounded border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-gray-400 focus:outline-none"
                        placeholder="1"
                        autoFocus
                      />
                      <button
                        onClick={handleJump}
                        className="rounded bg-gray-900 px-4 py-2 text-base font-medium text-white hover:bg-gray-700"
                      >
                        Go
                      </button>
                      <button
                        onClick={() => {
                          setShowJumpInput(false);
                          setJumpInput('');
                        }}
                        className="rounded bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowJumpInput(true)}
                      className="text-base text-gray-500 hover:text-gray-700"
                    >
                      Entry {currentIndex + 1} of {total}
                    </button>
                  )}
                </div>
              </div>

              {/* Business Data Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">Company</span>
                  <span className="text-xl text-gray-900">
                    {currentBusiness.company_name || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">Industry</span>
                  <span className="text-xl text-gray-900">
                    {currentBusiness.industry || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">City</span>
                  <span className="text-xl text-gray-900">
                    {currentBusiness.city || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-500">Phone</span>
                  <span className="text-xl text-gray-900">
                    {currentBusiness.phone_number
                      ? formatPhoneNumber(currentBusiness.phone_number)
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Website */}
              {currentBusiness.site_url && (
                <div className="flex flex-col gap-2 border-t border-gray-200 pt-6">
                  <span className="text-sm font-medium text-gray-500">Website</span>
                  <a
                    href={currentBusiness.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl text-blue-600 underline hover:text-blue-800"
                  >
                    {currentBusiness.site_url}
                  </a>
                </div>
              )}

              {errorMessage && (
                <div className="rounded bg-amber-50 px-4 py-3 text-base text-amber-800">
                  {errorMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="flex w-full max-w-5xl flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
              <p className="text-base text-gray-500">No business data to display.</p>
            </div>
          )}
        </div>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
          disabled={!canGoNext}
          className="flex w-24 flex-shrink-0 items-center justify-center transition-colors duration-200 disabled:opacity-30 hover:enabled:bg-gray-200"
          aria-label="Next business"
        >
          <ChevronRight className="h-12 w-12 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default App;
