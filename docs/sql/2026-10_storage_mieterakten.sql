-- Privater Speicher für Mieterakten (Dokumente je Mietverhältnis, Ordner wie im Finder); Zugriff nur mit Login
insert into storage.buckets (id, name, public) values ('mieterakten','mieterakten', false) on conflict (id) do nothing;
create policy mieterakten_select on storage.objects for select to authenticated using (bucket_id = 'mieterakten');
create policy mieterakten_insert on storage.objects for insert to authenticated with check (bucket_id = 'mieterakten');
create policy mieterakten_update on storage.objects for update to authenticated using (bucket_id = 'mieterakten');
create policy mieterakten_delete on storage.objects for delete to authenticated using (bucket_id = 'mieterakten');
