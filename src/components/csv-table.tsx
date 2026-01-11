import React from 'react';

type Business = {
  site_url: string;
  business_name: string;
  industry: string;
  company_name: string;
  city: string;
  phone_number: string;
};

type CsvTableProps = {
  rows: Business[];
  maxRows?: number;
};

export function CsvTable({ rows, maxRows = 100 }: CsvTableProps) {
  const display = rows.slice(0, maxRows);
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <Th>Business Name</Th>
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>City</Th>
              <Th>Phone</Th>
              <Th>Website</Th>
            </tr>
          </thead>
          <tbody>
            {display.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-2 text-sm text-slate-600">
                  No rows to display.
                </td>
              </tr>
            ) : (
              display.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <Td>{row.business_name || '—'}</Td>
                  <Td>{row.company_name || '—'}</Td>
                  <Td>{row.industry || '—'}</Td>
                  <Td>{row.city || '—'}</Td>
                  <Td>{row.phone_number || '—'}</Td>
                  <Td>
                    {row.site_url ? (
                      <a
                        href={row.site_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline underline-offset-2"
                      >
                        {row.site_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows ? (
        <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-200">
          Showing first {maxRows} of {rows.length} rows
        </div>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold text-slate-700">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-sm text-slate-800">{children}</td>;
}
