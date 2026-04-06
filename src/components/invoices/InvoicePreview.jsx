import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function InvoicePreview({ invoice }) {
  const handlePrint = () => {
    window.print();
  };

  const typeLabels = {
    INVOICE: 'חשבונית',
    RECEIPT: 'קבלה',
    TAX_INVOICE: 'חשבונית מס',
    PROFORMA: 'חשבונית עסקה'
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="w-4 h-4 ml-2" />
          הדפס
        </Button>
      </div>

      <div className="bg-white p-8 rounded-lg border print:border-0 print:shadow-none" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1220] mb-2">STAYFLOW</h1>
            <p className="text-sm text-gray-600">מערכת ניהול נכסים</p>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-[#0B1220] mb-2">
              {typeLabels[invoice.type] || 'חשבונית'}
            </h2>
            <p className="text-sm text-gray-600">מספר: {invoice.invoice_number}</p>
            <p className="text-sm text-gray-600">תאריך: {format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-3 text-[#0B1220]">ללקוח:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-lg mb-1">{invoice.customer_name}</p>
            {invoice.customer_tax_id && (
              <p className="text-sm text-gray-600">ת.ז / ח.פ: {invoice.customer_tax_id}</p>
            )}
            {invoice.customer_address && (
              <p className="text-sm text-gray-600">{invoice.customer_address}</p>
            )}
            {invoice.customer_phone && (
              <p className="text-sm text-gray-600">טלפון: {invoice.customer_phone}</p>
            )}
            {invoice.customer_email && (
              <p className="text-sm text-gray-600">אימייל: {invoice.customer_email}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-right p-3 font-semibold">תיאור</th>
                <th className="text-center p-3 font-semibold w-20">כמות</th>
                <th className="text-center p-3 font-semibold w-24">מחיר יחידה</th>
                <th className="text-left p-3 font-semibold w-24">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3 text-right">{item.description}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-center">₪{item.unit_price.toFixed(2)}</td>
                  <td className="p-3 text-left font-semibold">₪{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm pb-2">
              <span>סכום ביניים:</span>
              <span>₪{invoice.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pb-2">
              <span>מע"מ ({invoice.tax_rate}%):</span>
              <span>₪{invoice.tax_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-300">
              <span>סה"כ לתשלום:</span>
              <span className="text-[#00D1C1]">₪{invoice.total_amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {invoice.due_date && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">תאריך לתשלום:</span>{' '}
              {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
            </p>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">הערות:</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-6 border-t mt-8">
          <p>מסמך זה הופק באמצעות מערכת STAYFLOW</p>
          <p>תודה על העסקה!</p>
        </div>
      </div>
    </div>
  );
}