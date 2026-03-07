-- Add custom_interval column for custom recurrence
alter table public.inspection_templates 
add column if not exists custom_interval integer;

comment on column public.inspection_templates.custom_interval is 'Number of days for custom recurrence intervals.';
