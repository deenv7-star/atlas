import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, EmptyState } from '@/components/ds';
import { FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Owner payout reports need units linked to third-party owners (name, ID, commission), and ATLAS does
 * not store owners yet. Until it does, this page says so instead of showing sample owners as if real.
 * The real monthly report (income, expenses, occupancy per unit, CSV for the accountant) is at /monthly-report.
 */
export default function OwnerReports() {
  return (
    <div dir="rtl">
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10">
        <PageHeader title="דוח לבעלי הצימר" subtitle="דוח תשלום לכל בעלים של יחידה שאתם מנהלים עבורם." className="!mb-0" />
        <div className="v7-card">
          <EmptyState
            icon={FileBarChart}
            title="דוח לבעלי הצימר יגיע בקרוב"
            description="כדי להפיק דוח לבעלים צריך לשייך כל יחידה לבעלים ולעמלה שלכם, ואת זה עוד אי אפשר לעשות כאן. בינתיים, הדוח החודשי מראה הכנסות, הוצאות ותפוסה לכל יחידה, ואפשר להוריד אותו לרואה החשבון."
            action={<Button asChild><Link to="/monthly-report">לדוח החודשי</Link></Button>}
          />
        </div>
      </div>
    </div>
  );
}
