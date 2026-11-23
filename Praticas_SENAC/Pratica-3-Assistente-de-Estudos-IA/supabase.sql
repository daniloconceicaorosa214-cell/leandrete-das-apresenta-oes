create table if not exists perguntas (
 id bigint generated always as identity primary key,
 pergunta text not null,
 resposta text not null,
 created_at timestamptz not null default now()
);
alter table perguntas enable row level security;
drop policy if exists "Leitura perguntas" on perguntas;
drop policy if exists "Insercao perguntas" on perguntas;
drop policy if exists "Exclusao perguntas" on perguntas;
create policy "Leitura perguntas" on perguntas for select to anon using (true);
create policy "Insercao perguntas" on perguntas for insert to anon with check (true);
create policy "Exclusao perguntas" on perguntas for delete to anon using (true);
grant select, insert, delete on perguntas to anon;
