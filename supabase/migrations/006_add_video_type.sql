alter table public.items
  drop constraint if exists items_type_check;

alter table public.items
  add constraint items_type_check
    check (type in ('note', 'image', 'video', 'audio', 'file'));
