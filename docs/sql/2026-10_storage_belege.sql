-- Privater Speicher für Belege (Rechnungen) zu Buchungen; Zugriff nur mit Login
insert into storage.buckets (id, name, public) values ('belege','belege', false) on conflict (id) do nothing;
create policy belege_select on storage.objects for select to authenticated using (bucket_id = 'belege');
create policy belege_insert on storage.objects for insert to authenticated with check (bucket_id = 'belege');
create policy belege_update on storage.objects for update to authenticated using (bucket_id = 'belege');
create policy belege_delete on storage.objects for delete to authenticated using (bucket_id = 'belege');
