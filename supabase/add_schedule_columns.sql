-- Add scheduling columns to inspection_templates
alter table public.inspection_templates 
add column if not exists schedule_type text check (schedule_type in ('one_time', 'recurring')) default 'recurring',
add column if not exists recurrence text check (recurrence in ('daily', 'weekly', 'monthly', 'yearly', 'custom'));

-- Comment on columns
comment on column public.inspection_templates.schedule_type is 'Whether the inspection is a one-off task or recurring.';
comment on column public.inspection_templates.recurrence is 'Frequency of the inspection if recurring.';
