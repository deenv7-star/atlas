-- Rollback of 033_property_imports.sql (drops only what 033 created). property-import keeps working without it
-- (no daily cap, minute limiter only).
drop table if exists public.property_imports;
