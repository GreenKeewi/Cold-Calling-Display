import { type ReactNode, useEffect, useMemo, useState } from 'react';
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

const CSV_DATA = `site_url,business_name,industry,company_name,city,phone_number
https://ontariolitigationlawyers.com/toronto-civil-litigation/,Toronto Civil Litigation Lawyers - Powell Litigation,Law Firm,Toronto Civil Litigation Lawyers - Powell Litigation,"Toronto, ON",(437) 222-2234
https://acmeplumbing.com,Acme Plumbing,Home Services,Acme Plumbing Co.,"Austin, TX",(512) 555-1212
https://designhub.ca,Design Hub,Creative Agency,Design Hub Inc.,"Vancouver, BC",(604) 123-4567
https://greenfarms.org,Green Farms Market,Food & Beverage,Green Farms Market,"Denver, CO",(303) 555-9876
`;

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

const parseBusinesses = () => {
  const parsed = Papa.parse<Business>(CSV_DATA.trim(), {
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
  const { businesses, errors } = useMemo(() => parseBusinesses(), []);
  const total = businesses.length;

  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    getStoredIndex(total),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(currentIndex));
    } catch {
      // Ignore write errors (e.g. storage disabled)
    }
  }, [currentIndex]);

  const currentBusiness = businesses[currentIndex];
  const showNavigation = total > 0;

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
            {showNavigation
              ? `Business ${currentIndex + 1} of ${total}`
              : 'No businesses loaded from the CSV data.'}
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
