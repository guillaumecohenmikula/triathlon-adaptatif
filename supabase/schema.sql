-- Synchronisation du programme d'entraînement
-- À jouer une seule fois dans l'éditeur SQL du projet Supabase « cockpit ».
-- Les tables sont préfixées tri_ pour cohabiter avec le cockpit et la prospection.

-- Un seul magasin pour tout ce que l'app stocke localement. Chaque enregistrement
-- porte son horodatage, ce qui permet une synchronisation « le plus récent gagne »
-- sans avoir à comparer les contenus.
create table if not exists tri_sync (
  user_id    uuid        not null references auth.users on delete cascade,
  -- 'settings' | 'journal' | 'week' | 'weight'
  kind       text        not null,
  -- l'identifiant local : 'app', '2026-09-07|Mardi', '2026-09-07', ...
  key        text        not null,
  payload    jsonb       not null,
  -- pierre tombale : une suppression doit se propager aux autres appareils
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

-- La synchronisation ne lit que ce qui a changé depuis son dernier passage.
create index if not exists tri_sync_updated_idx on tri_sync (user_id, updated_at);

alter table tri_sync enable row level security;

-- Chacun ne voit et ne modifie que ses propres lignes. Rien n'est lisible sans être
-- connecté : contrairement au cockpit, ces données ne sont pas une démo publique.
drop policy if exists tri_sync_select on tri_sync;
create policy tri_sync_select on tri_sync
  for select using (auth.uid() = user_id);

drop policy if exists tri_sync_insert on tri_sync;
create policy tri_sync_insert on tri_sync
  for insert with check (auth.uid() = user_id);

drop policy if exists tri_sync_update on tri_sync;
create policy tri_sync_update on tri_sync
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists tri_sync_delete on tri_sync;
create policy tri_sync_delete on tri_sync
  for delete using (auth.uid() = user_id);

-- L'horodatage est posé par le serveur, jamais par le client : deux appareils dont
-- les horloges divergent produiraient sinon des conflits impossibles à arbitrer.
create or replace function tri_sync_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tri_sync_touch_trg on tri_sync;
create trigger tri_sync_touch_trg
  before insert or update on tri_sync
  for each row execute function tri_sync_touch();
