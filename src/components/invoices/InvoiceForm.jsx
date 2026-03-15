import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceForm({ invoice, bookings, orgId, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    org_id: orgId,
    booking_id: '',
    invoice_number: '',
    type: 'INVOICE',
    guest_name: '',
    guest_email: '',
    customer_phone: '',
    customer_address: '',
    customer_tax_id: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    tax_rate: 17,
    tax_amount: 0,
    total_amount: 0,
    currency: 'ILS',
    status: 'DRAFT',
    payment_method: '',
    notes: '',
    ...invoice,
  });

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_amount = (subtotal * formData.tax_rate) / 100;
    const total_amount = subtotal + tax_amount;

    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(tax_amount.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2)),
    }));
  };

  const handleBookingSelect = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFormData(prev => ({
        ...prev,
        booking_id: bookingId,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        customer_phone: booking.guest_phone,
        items: [{
          description: `שהייה בנכס - ${format(new Date(booking.check_in_date), 'dd/MM/yyyy')} עד ${format(new Date(booking.check_out_date), 'dd/MM/yyyy')}`,
          quantity: 1,
          unit_price: booking.total_price || 0,
          total: booking.total_price || 0,
        }],
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate invoice number if not exists
    if (!formData.invoice_number) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      formData.invoice_number = `INV-${randomNum}`;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>בחר הזמנה (אופציונלי)</Label>
          <Select value={formData.booking_id} onValueChange={handleBookingSelect}>
            <SelectTrigger>
              <SelectValue placeholder="בחר הזמנה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>ללא הזמנה</SelectItem>
              {bookings.map(booking => (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.guest_name} - {format(new Date(booking.check_in_date), 'dd/MM/yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>סוג מסמך</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INVOICE">חשבונית</SelectItem>
              <SelectItem value="RECEIPT">קבלה</SelectItem>
              <SelectItem value="TAX_INVOICE">חשבונית מס</SelectItem>
              <SelectItem value="PROFORMA">חשבונית עסקה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>מספר חשבונית</Label>
          <Input
            value={formData.invoice_number}
            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
            placeholder="יוצר אוטומטית אם ריק"
          />
        </div>

        <div>
          <Label>סטטוס</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">טיוטה</SelectItem>
              <SelectItem value="SENT">נשלח</SelectItem>
              <SelectItem value="PAID">שולם</SelectItem>
              <SelectItem value="OVERDUE">באיחור</SelectItem>
              <SelectItem value="CANCELLED">בוטל</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">פרטי לקוח</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>שם לקוח *</Label>
            <Input
              required
              value={formData.guest_name}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
            />
          </div>

          <div>
            <Label>אימייל</Label>
            <Input
              type="email"
              value={formData.guest_email}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
            />
          </div>

          <div>
            <Label>טלפון</Label>
            <Input
              value={formData.customer_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
            />
          </div>

          <div>
            <Label>ת.ז / ח.פ</Label>
            <Input
              value={formData.customer_tax_id}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_tax_id: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label>כתובת</Label>
            <Input
              value={formData.customer_address}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">תאריכים</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>תאריך הנפקה *</Label>
            <Input
              type="date"
              required
              value={formData.issue_date}
              onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
            />
          </div>

          <div>
            <Label>תאריך תשלום</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">פריטים</h3>
          <Button type="button" size="sm" onClick={addItem} variant="outline">
            <Plus className="w-4 h-4 ml-1" />
            הוסף פריט
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 sm:col-span-5">
                <Input
                  placeholder="תיאור"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="כמות"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="מחיר"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  value={`₪${item.total.toFixed(2)}`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="max-w-sm mr-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span>סכום ביניים:</span>
            <span>₪{formData.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span>מע"מ:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20 h-8 text-sm"
                value={formData.tax_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              />
              <span>% = ₪{formData.tax_amount.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>סה"כ:</span>
            <span>₪{formData.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <Label>הערות</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="הערות נוספות..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" className="bg-[#00D1C1] hover:bg-[#00D1C1]/90">
          שמור חשבונית
        </Button>
      </div>
    </form>
  );
}