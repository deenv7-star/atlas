/** Stay sheets (record payment, WhatsApp composer) now open in the shared AtlasSheet. */
import React from 'react';
import { AtlasSheet } from '@/components/ui/sheet/AtlasSheet';
import { SheetFooter } from '@/components/ui/sheet/fields';
import '@/styles/atlas-brand.css';

export function StaySheet({ open, onOpenChange, title, description, children, footer }) {
  return (
    <AtlasSheet open={open} onOpenChange={onOpenChange} title={title} subtitle={description || null} bodyClassName="ab-root !bg-transparent">
      <div className="mb-5 min-w-0">{children}</div>
      {footer ? (
        <SheetFooter>
          <div className="flex flex-col gap-2 [&>*]:w-full">{footer}</div>
        </SheetFooter>
      ) : null}
    </AtlasSheet>
  );
}
