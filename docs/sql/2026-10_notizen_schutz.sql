-- Notizen in den Mieterkonten sind unveränderbar (angewendet am 12.10.2026)
create or replace function public.os_docs_notizen_schutz() returns trigger language plpgsql as $$
begin
  if old.app = 'oc' and old.pfad like 'notizen/%' then
    raise exception 'Notizen können nicht geändert oder gelöscht werden';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger os_docs_notizen_schutz before update or delete on public.os_docs for each row execute function public.os_docs_notizen_schutz();
-- Dateien zu Notizen (Ordner Notizen in der Mieterakte) können nicht gelöscht oder überschrieben werden
alter policy mieterakten_delete on storage.objects using (bucket_id = 'mieterakten' and position('/Notizen/' in name) = 0);
alter policy mieterakten_update on storage.objects using (bucket_id = 'mieterakten' and position('/Notizen/' in name) = 0);

-- Änderung 12.10.2026: Notizen dürfen vom Verfasser gelöscht werden (niemand darf sie ändern)
create or replace function public.os_docs_notizen_schutz() returns trigger language plpgsql as $$
begin
  if old.app = 'oc' and old.pfad like 'notizen/%' then
    if tg_op = 'DELETE' and (
         coalesce(old.data->>'uid','') = coalesce(auth.uid()::text,'-')
      or lower(coalesce(old.data->>'mail', old.data->>'by', '')) = lower(coalesce(auth.jwt()->>'email','-'))
    ) then
      return old;
    end if;
    raise exception 'Notizen können nur vom Verfasser gelöscht und von niemandem geändert werden';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
alter policy mieterakten_delete on storage.objects using (bucket_id = 'mieterakten' and (position('/Notizen/' in name) = 0 or owner_id = auth.uid()::text));
