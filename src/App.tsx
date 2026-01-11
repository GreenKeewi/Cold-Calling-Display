import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  Briefcase,
  Building2,
  Globe,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Button } from './components/ui/button';
 

type Business = {
  site_url: string;
  business_name: string;
  industry: string;
  company_name: string;
  city: string;
  phone_number: string;
};

 

const STORAGE_KEY = 'cold-calling-display:current-index';

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
  const total = businesses.length;
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
    } catch {
      // Ignore write errors (e.g. storage disabled)
    }
  }, [currentIndex]);

  // After data loads, restore last position once
  useEffect(() => {
    if (!initializedRef.current && total > 0) {
      initializedRef.current = true;
      hasInitializedRef.current = true;
      setCurrentIndex(getStoredIndex(total));
    }
  }, [total]);

  const currentBusiness = businesses[currentIndex];
  const showNavigation = total > 0;

  const [isEditingIndex, setIsEditingIndex] = useState(false);
  const [inputIndex, setInputIndex] = useState<string>('');

  const commitIndex = () => {
    const parsed = parseInt(inputIndex, 10);
    if (Number.isFinite(parsed)) {
      setCurrentIndex(clamp(parsed - 1, 0, total - 1));
    }
    setIsEditingIndex(false);
  };

  const hasErrors = errors && errors.length > 0;
  const errorMessage = hasErrors
    ? `Encountered ${errors.length} parsing issue${
        errors.length > 1 ? 's' : ''
      }. Showing available data.`
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardDescription className="text-xs uppercase tracking-[0.2em] text-indigo-600">
            Cold Calling Dashboard
          </CardDescription>
          <CardTitle>
            {currentBusiness?.business_name || 'No business available'}
          </CardTitle>
          <CardDescription>
            {showNavigation ? (
              isEditingIndex ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={total}
                    value={inputIndex}
                    onChange={(e) => setInputIndex(e.target.value)}
                    onBlur={commitIndex}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitIndex();
                      if (e.key === 'Escape') setIsEditingIndex(false);
                    }}
                    className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                    aria-label="Set business position"
                    autoFocus
                  />
                  <Button variant="outline" onClick={commitIndex}>
                    Go
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingIndex(false)}>
                    Cancel
                  </Button>
                  <span className="text-xs text-slate-500">of {total}</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  onClick={() => {
                    setIsEditingIndex(true);
                    setInputIndex(String(currentIndex + 1));
                  }}
                  aria-label="Edit business position"
                >
                  {`Business ${currentIndex + 1} of ${total}`}
                </button>
              )
            ) : (
              'No businesses loaded from the CSV data.'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {errorMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {errorMessage}
            </div>
          ) : null}

          {currentBusiness ? (
            <div className="space-y-3">
              <InfoRow
                icon={<Building2 className="h-4 w-4 text-indigo-600" />}
                label="Company"
                value={currentBusiness.company_name || '—'}
              />
              <InfoRow
                icon={<Briefcase className="h-4 w-4 text-indigo-600" />}
                label="Industry"
                value={currentBusiness.industry || '—'}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4 text-indigo-600" />}
                label="City"
                value={currentBusiness.city || '—'}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4 text-indigo-600" />}
                label="Phone"
                value={
                  currentBusiness.phone_number
                    ? formatPhoneNumber(currentBusiness.phone_number)
                    : '—'
                }
              />
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="mt-1 rounded-md bg-indigo-100 p-2 text-indigo-700">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-900">
                    Website
                  </span>
                  {currentBusiness.site_url ? (
                    <a
                      href={currentBusiness.site_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-indigo-600 underline underline-offset-2"
                    >
                      {currentBusiness.site_url}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-600">—</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              No business data to display.
            </div>
          )}

          
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={!showNavigation || currentIndex === 0}
            onClick={() => setCurrentIndex((index) => clamp(index - 1, 0, total - 1))}
          >
            Previous
          </Button>
          <Button
            disabled={!showNavigation || currentIndex >= total - 1}
            onClick={() =>
              setCurrentIndex((index) => clamp(index + 1, 0, total - 1))
            }
          >
            Next
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

type InfoRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="mt-1 rounded-md bg-indigo-100 p-2 text-indigo-700">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        <span className="text-sm text-slate-700">{value}</span>
      </div>
    </div>
  );
}

export default App;
