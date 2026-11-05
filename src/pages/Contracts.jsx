/**
 * חוזים. feat/pages-clarity (Deen 05.11.2026):
 *  - the screen explains itself (GuideEmpty / GuideHint, two designs behind ?clarity=a|b)
 *  - 5 ready templates ship in code, usable with zero setup ("השתמשו בתבנית", "שכפלו ועריכה"), no migration
 *  - the create dialog never shows an empty template list
 *  - the template editor renders (quill.snow.css was never imported, so Quill's picker SVGs drew as giant triangles)
 *  - merge fields are Hebrew chips that insert a token; stored HTML keeps the English tokens
 *  - honest: there is no digital signature. The contract is printed / saved as PDF, or sent as WhatsApp text.
 */
import React, { useMemo, useRef, useState } from 'react';
import { askConfirm } from '@/components/common/confirmDialog';
import DOMPurify from 'dompurify';
import { PageHeader } from '@/components/ds';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, FileText, Send, CheckCircle2, Clock, Edit, Trash2, Eye, Upload, Copy, Printer, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { GuideEmpty, GuideHint } from '@/components/pageguide/PageGuide';
import { GUIDES } from '@/components/pageguide/guides';
import {
  BUILTIN_TEMPLATES, MERGE_FIELDS, LAWYER_NOTE, fieldsIn, toDisplay, toInternal, withChips, fillTemplate, builtinMarker, builtinOf,
} from '@/components/contracts/templates';
import { guestInfoOf } from '@/lib/stay/guestInfo';
import { balanceOf } from '@/lib/stay/bookings';
import { waLink } from '@/lib/stay/whatsapp';
import '@/components/contracts/contracts.css';

const statusColors = {
  DRAFT: 'bg-neutral-100 text-ink-600 border-line',
  SENT: 'bg-brand-100 text-brand-700 border-brand-100',
  SIGNED: 'bg-green-100 text-green-700 border-green-200',
};
const statusLabels = { DRAFT: 'טיוטה', SENT: 'נשלח לאורח', SIGNED: 'נחתם' };
const StatusIcon = ({ s }) => (s === 'SIGNED' ? <CheckCircle2 className="h-3 w-3" /> : s === 'SENT' ? <Send className="h-3 w-3" /> : <Clock className="h-3 w-3" />);

const QUILL_MODULES = { toolbar: [[{ header: [2, 3, false] }], ['bold', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }]] };
const QUILL_FORMATS = ['header', 'bold', 'underline', 'list', 'bullet'];

const textOf = (html) => {
  const el = document.createElement('div');
  el.innerHTML = DOMPurify.sanitize(String(html || '').replace(/<\/(p|h2|h3|li)>/g, '</$1>\n').replace(/<br\s*\/?>/g, '\n'));
  return el.textContent.replace(/\n{3,}/g, '\n\n').trim();
};

function printContract(html, title) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Rubik,Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1B2656;line-height:1.7;font-size:16px}h2{text-align:center}@media print{body{margin:0 auto}}</style></head>
<body>${DOMPurify.sanitize(html)}<script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();
}

/** One built-in template card: name, what it covers, its fields as chips, three actions. */
function BuiltinCard({ t, onUse, onCopy, onPreview }) {
  return (
    <Card className="ct-card">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start gap-2.5">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0">
            <h3 className="text-[17px] font-bold text-navy-900">{t.name}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-600">{t.blurb}</p>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="נמלא לבד מההזמנה">
          {fieldsIn(t.content).slice(0, 3).map((f) => <li key={f.token} className="ct-chip ct-chip--sm">{f.label}</li>)}
          {fieldsIn(t.content).length > 3 ? <li className="ct-chip ct-chip--sm">ועוד {fieldsIn(t.content).length - 3}</li> : null}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => onUse(t)}>השתמשו בתבנית</Button>
          <Button variant="outline" className="flex-1" onClick={() => onCopy(t)}><Copy strokeWidth={1.75} />שכפלו ועריכה</Button>
          <Button variant="ghost" onClick={() => onPreview(t)} aria-label={`תצוגה של ${t.name}`}><Eye strokeWidth={1.75} />תצוגה</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Contracts({ selectedPropertyId, orgId }) {
  const [activeTab, setActiveTab] = useState('contracts');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [newContract, setNewContract] = useState({ booking_id: '', template_id: '' });
  const quillRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['contractTemplates', orgId],
    queryFn: () => (orgId ? base44.entities.ContractTemplate.filter({ org_id: orgId }) : []),
    enabled: !!orgId,
  });
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contractInstances', orgId],
    queryFn: () => (orgId ? base44.entities.ContractInstance.filter({ org_id: orgId }, '-created_date') : []),
    enabled: !!orgId,
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', orgId],
    queryFn: () => (orgId ? base44.entities.Booking.filter({ org_id: orgId }, '-created_date', 50) : []),
    enabled: !!orgId,
  });
  const { data: properties = [] } = useQuery({
    queryKey: ['contract-properties', orgId],
    queryFn: () => base44.entities.Property.list().catch(() => []),
    enabled: !!orgId, staleTime: 5 * 60 * 1000,
  });

  const invalidate = (k) => queryClient.invalidateQueries({ queryKey: [k] });
  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractTemplate.create({ ...data, org_id: orgId, property_id: selectedPropertyId }),
    onSuccess: () => { invalidate('contractTemplates'); setIsTemplateDialogOpen(false); resetTemplateForm(); },
  });
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractTemplate.update(id, data),
    onSuccess: () => { invalidate('contractTemplates'); setIsTemplateDialogOpen(false); resetTemplateForm(); },
  });
  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ContractTemplate.delete(id),
    onSuccess: () => invalidate('contractTemplates'),
  });

  const createContractMutation = useMutation({
    mutationFn: async ({ booking_id, template_id }) => {
      const builtin = template_id.startsWith('builtin:') ? BUILTIN_TEMPLATES.find((t) => `builtin:${t.id}` === template_id) : null;
      const template = builtin || templates.find((t) => t.id === template_id);
      const booking = bookings.find((b) => b.id === booking_id);
      const property = properties.find((p) => p.id === booking?.property_id) || null;
      const info = property ? guestInfoOf(property) : null;
      let deposit = 0;
      try {
        const pays = booking ? await base44.entities.Payment.filter({ booking_id: booking.id }) : [];
        deposit = balanceOf(booking, pays || []).deposit || 0;
      } catch { /* no payments table / offline: leave the line blank to fill by hand */ }
      const body = fillTemplate(template?.content || '', { booking, property, info, deposit });
      return base44.entities.ContractInstance.create({
        org_id: orgId,
        booking_id,
        template_id: builtin ? null : template_id, // built-ins live in code; template_id is a uuid FK
        guest_name: booking?.guest_name || null,
        status: 'DRAFT',
        content: (builtin ? builtinMarker(builtin.id) : '') + body,
      });
    },
    onSuccess: (created) => {
      invalidate('contractInstances');
      setIsSendDialogOpen(false);
      setNewContract({ booking_id: '', template_id: '' });
      setActiveTab('contracts');
      if (created?.id) setSelectedContract(created);
    },
  });
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContractInstance.update(id, data),
    onSuccess: () => invalidate('contractInstances'),
  });

  const resetTemplateForm = () => { setNewTemplate({ name: '', content: '' }); setEditingTemplate(null); };
  const openNewTemplate = (seed) => {
    setEditingTemplate(null);
    setNewTemplate(seed ? { name: `${seed.name} (שלכם)`, content: toDisplay(seed.content) } : { name: '', content: '' });
    setIsSendDialogOpen(false);
    setIsTemplateDialogOpen(true);
  };
  const handleEditTemplate = (t) => { setEditingTemplate(t); setNewTemplate({ name: t.name, content: toDisplay(t.content) }); setIsTemplateDialogOpen(true); };
  const handleSaveTemplate = () => {
    const data = { name: newTemplate.name.trim(), content: toInternal(newTemplate.content) };
    if (editingTemplate) updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    else createTemplateMutation.mutate(data);
  };
  const pickTemplate = (t) => { setNewContract((c) => ({ ...c, template_id: `builtin:${t.id}` })); setPreviewTemplate(null); setIsSendDialogOpen(true); };
  const insertField = (f) => {
    const q = quillRef.current?.getEditor?.();
    const text = `{${f.label}}`;
    if (!q) { setNewTemplate((s) => ({ ...s, content: `${s.content}<p>${text}</p>` })); return; }
    const r = q.getSelection(true) || { index: q.getLength() - 1 };
    q.insertText(r.index, text, 'user');
    q.setSelection(r.index + text.length, 0, 'user');
  };

  const getBooking = (id) => bookings.find((b) => b.id === id);
  const templateName = (c) => builtinOf(c.content)?.name || templates.find((t) => t.id === c.template_id)?.name || '-';
  const contentOf = (c) => String(c?.content || '').replace(/<!--atlas-template:[a-z-]+-->/, '');
  const sendOnWhatsApp = (c) => {
    const b = getBooking(c.booking_id);
    window.open(waLink(b?.guest_phone || '', textOf(contentOf(c))), '_blank', 'noopener');
    if (c.status === 'DRAFT') updateContractMutation.mutate({ id: c.id, data: { status: 'SENT' } });
  };
  const bookingLabel = (b) => `${b.guest_name || 'אורח'}${b.check_in_date ? ` · ${format(parseISO(b.check_in_date), 'd/M')}` : ''}`;
  const empty = !contractsLoading && contracts.length === 0;
  const builtinUsed = useMemo(() => newContract.template_id.startsWith('builtin:'), [newContract.template_id]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-5 pb-16 pt-6 md:px-10 md:pt-10" dir="rtl">
      <PageHeader
        title="חוזים"
        subtitle="חוזה לאורח, מלא לבד בפרטי ההזמנה. מדפיסים או שולחים בוואטסאפ."
        className="!mb-0"
        actions={empty ? null : <Button onClick={() => setIsSendDialogOpen(true)}><Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />חוזה חדש</Button>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contracts" className="gap-2"><FileText className="h-4 w-4" />חוזים</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Edit className="h-4 w-4" />תבניות</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6 space-y-4">
          {contractsLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}</div>
          ) : empty ? (
            <GuideEmpty
              guide={GUIDES.contracts}
              actions={[
                { label: 'חוזה חדש', icon: Plus, onClick: () => setIsSendDialogOpen(true) },
                { label: 'לתבניות המוכנות', icon: FileText, onClick: () => setActiveTab('templates') },
              ]}
            />
          ) : (
            <>
              <GuideHint id="contracts" text={GUIDES.contracts.hint} />
              <ul className="space-y-3">
                {contracts.map((c) => {
                  const b = getBooking(c.booking_id);
                  return (
                    <li key={c.id}>
                      <Card className="ct-row">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <p className="text-[16px] font-bold text-navy-900">{b?.guest_name || c.guest_name || 'אורח'} · {templateName(c)}</p>
                            <p className="text-[14px] text-ink-600">
                              {b?.check_in_date ? format(parseISO(b.check_in_date), 'EEEE d/M', { locale: he }) : 'בלי הזמנה'} · נוצר {c.created_date ? format(parseISO(c.created_date), 'd/M/yy') : ''}
                            </p>
                          </div>
                          <Badge className={`${statusColors[c.status] || statusColors.DRAFT} flex w-fit items-center gap-1 border`}><StatusIcon s={c.status} />{statusLabels[c.status] || statusLabels.DRAFT}</Badge>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedContract(c)}><Eye strokeWidth={1.75} />פתיחה</Button>
                            <Button variant="secondary" size="sm" onClick={() => sendOnWhatsApp(c)}><MessageCircle strokeWidth={1.75} />וואטסאפ</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6 space-y-8">
          <section aria-labelledby="ct-ready">
            <h2 id="ct-ready" className="text-[20px] font-bold text-navy-900">תבניות מוכנות</h2>
            <p className="mt-1 text-[15px] text-ink-600">מוכנות לשימוש. הפרטים מההזמנה נכנסים לבד. {LAWYER_NOTE}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BUILTIN_TEMPLATES.map((t) => <BuiltinCard key={t.id} t={t} onUse={pickTemplate} onCopy={openNewTemplate} onPreview={setPreviewTemplate} />)}
            </div>
          </section>

          <section aria-labelledby="ct-own" className="v7-card p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="ct-own" className="text-[20px] font-bold text-navy-900">התבניות שלכם</h2>
                <p className="mt-1 text-[15px] text-ink-600">נוסח משלכם, או עותק של תבנית מוכנה שעריכתם.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="file" id="import-contract" accept=".txt,text/plain" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    e.target.value = '';
                    if (!file) return;
                    if (!/\.txt$/i.test(file.name) && file.type !== 'text/plain') {
                      window.alert('כרגע אפשר לייבא רק קובץ טקסט (.txt). מקובץ Word או PDF: העתיקו את הנוסח והדביקו בתבנית חדשה.');
                      return;
                    }
                    try {
                      const content = await file.text();
                      setEditingTemplate(null);
                      setNewTemplate({ name: file.name.replace(/\.txt$/i, ''), content: content.slice(0, 50000).split('\n').map((l) => `<p>${l.replace(/[<>&]/g, '')}</p>`).join('') });
                      setIsTemplateDialogOpen(true);
                    } catch { window.alert('לא הצלחנו לקרוא את הקובץ. נסו קובץ אחר.'); }
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById('import-contract').click()}><Upload strokeWidth={1.75} />ייבוא מקובץ</Button>
                <Button variant="outline" onClick={() => openNewTemplate(null)}><Plus strokeWidth={1.75} />צרו תבנית משלכם</Button>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templatesLoading ? [0, 1].map((i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)
                : templates.length === 0 ? (
                  <p className="col-span-full rounded-2xl bg-[#F7F8FB] p-5 text-[15px] text-ink-600">עוד אין תבניות משלכם. אפשר לעבוד עם התבניות המוכנות, או ללחוץ "שכפלו ועריכה" ולשנות נוסח.</p>
                ) : templates.map((t) => (
                  <Card key={t.id} className="ct-card">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-brand-600" /><h3 className="text-[17px] font-bold text-navy-900">{t.name}</h3></div>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleEditTemplate(t)}><Edit strokeWidth={1.75} />עריכה</Button>
                        <Button variant="outline" size="icon" className="text-red-600" aria-label={`מחיקת התבנית ${t.name || ''}`}
                          onClick={() => { askConfirm({ title: 'למחוק את התבנית?', description: 'התבנית תימחק מהרשימה.' }).then((ok) => { if (ok) deleteTemplateMutation.mutate(t.id); }); }}>
                          <Trash2 strokeWidth={1.75} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Template editor */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'עריכת תבנית' : 'תבנית חוזה חדשה'}</DialogTitle>
            <DialogDescription>כותבים פעם אחת. בכל חוזה הפרטים מההזמנה נכנסים לבד.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ct-name">שם התבנית</Label>
              <Input id="ct-name" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} className="mt-1" placeholder="למשל: הסכם אירוח לסוף שבוע" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-navy-900">לחצו כדי להוסיף לחוזה</p>
              <p className="text-[14px] text-ink-600">בכל חוזה זה יתחלף בפרט האמיתי מההזמנה.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MERGE_FIELDS.map((f) => (
                  <button key={f.token} type="button" className="ct-chip ct-chip--btn" onMouseDown={(e) => e.preventDefault()} onClick={() => insertField(f)}>
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label id="ct-body-label">תוכן החוזה</Label>
              <div className="ct-editor mt-1" aria-labelledby="ct-body-label">
                <ReactQuill ref={quillRef} theme="snow" value={newTemplate.content} modules={QUILL_MODULES} formats={QUILL_FORMATS}
                  onChange={(v) => setNewTemplate((s) => ({ ...s, content: v }))} placeholder="כתבו כאן את נוסח החוזה" />
              </div>
              <p className="mt-2 text-[14px] text-ink-600">{LAWYER_NOTE}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveTemplate}
              disabled={!newTemplate.name.trim() || !textOf(newTemplate.content) || createTemplateMutation.isPending || updateTemplateMutation.isPending}>
              {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'שומרים…' : 'שמירה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create a contract */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[460px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>חוזה חדש</DialogTitle>
            <DialogDescription>בוחרים הזמנה ותבנית. השם, התאריכים והסכומים נכנסים לבד.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>הזמנה</Label>
              {bookings.length ? (
                <Select value={newContract.booking_id} onValueChange={(v) => setNewContract({ ...newContract, booking_id: v })}>
                  <SelectTrigger className="mt-1" aria-label="הזמנה"><SelectValue placeholder="בחרו הזמנה" /></SelectTrigger>
                  <SelectContent>{bookings.map((b) => <SelectItem key={b.id} value={b.id}>{bookingLabel(b)}</SelectItem>)}</SelectContent>
                </Select>
              ) : <p className="mt-1 rounded-xl bg-[#F7F8FB] p-3 text-[15px] text-ink-600">עוד אין הזמנות. הוסיפו הזמנה, ואז חזרו לכאן.</p>}
            </div>
            <div>
              <Label>תבנית</Label>
              <Select value={newContract.template_id} onValueChange={(v) => setNewContract({ ...newContract, template_id: v })}>
                <SelectTrigger className="mt-1" aria-label="תבנית"><SelectValue placeholder="בחרו תבנית" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>תבניות מוכנות</SelectLabel>
                    {BUILTIN_TEMPLATES.map((t) => <SelectItem key={t.id} value={`builtin:${t.id}`}>{t.name}</SelectItem>)}
                  </SelectGroup>
                  {templates.length ? (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>התבניות שלכם</SelectLabel>
                        {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectGroup>
                    </>
                  ) : null}
                </SelectContent>
              </Select>
              {builtinUsed ? <p className="mt-1.5 text-[14px] text-ink-600">{LAWYER_NOTE}</p> : null}
              <Button variant="link" className="mt-1 h-11 px-0" onClick={() => openNewTemplate(null)}><Plus strokeWidth={1.75} />צרו תבנית משלכם</Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>ביטול</Button>
            <Button onClick={() => createContractMutation.mutate(newContract)} disabled={!newContract.booking_id || !newContract.template_id || createContractMutation.isPending}>
              {createContractMutation.isPending ? 'מכינים…' : 'הכנת החוזה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A contract: read, print / PDF, send */}
      <Dialog open={!!selectedContract} onOpenChange={(v) => !v && setSelectedContract(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedContract ? `${getBooking(selectedContract.booking_id)?.guest_name || selectedContract.guest_name || 'חוזה'} · ${templateName(selectedContract)}` : 'חוזה'}</DialogTitle>
            <DialogDescription>אין עדיין חתימה דיגיטלית. מדפיסים לחתימה, או שולחים בוואטסאפ והאורח מאשר בתשובה.</DialogDescription>
          </DialogHeader>
          {selectedContract ? (
            <div className="ct-doc" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentOf(selectedContract)) }} />
          ) : null}
          <DialogFooter className="gap-2 sm:justify-start">
            {selectedContract ? <Button onClick={() => sendOnWhatsApp(selectedContract)}><MessageCircle strokeWidth={1.75} />שליחה בוואטסאפ</Button> : null}
            {selectedContract ? <Button variant="outline" onClick={() => printContract(contentOf(selectedContract), templateName(selectedContract))}><Printer strokeWidth={1.75} />הדפסה או PDF</Button> : null}
            {selectedContract && selectedContract.status !== 'SIGNED' ? (
              <Button variant="ghost" onClick={() => { updateContractMutation.mutate({ id: selectedContract.id, data: { status: 'SIGNED', signed_at: new Date().toISOString() } }); setSelectedContract(null); }}>
                <CheckCircle2 strokeWidth={1.75} />סימון כנחתם
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A built-in template: read before using */}
      <Dialog open={!!previewTemplate} onOpenChange={(v) => !v && setPreviewTemplate(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>המילים המסומנות יתחלפו בפרטים מההזמנה. {LAWYER_NOTE}</DialogDescription>
          </DialogHeader>
          {previewTemplate ? <div className="ct-doc" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(withChips(previewTemplate.content)) }} /> : null}
          <DialogFooter className="gap-2 sm:justify-start">
            {previewTemplate ? <Button onClick={() => pickTemplate(previewTemplate)}>השתמשו בתבנית</Button> : null}
            {previewTemplate ? <Button variant="outline" onClick={() => { const t = previewTemplate; setPreviewTemplate(null); openNewTemplate(t); }}><Copy strokeWidth={1.75} />שכפלו ועריכה</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
