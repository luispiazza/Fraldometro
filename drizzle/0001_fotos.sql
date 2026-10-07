-- Fotos dos bebês no Supabase Storage.
-- Leitura pública (a página do bebê mostra a foto para qualquer convidado com o link).
-- Cada usuário só grava na própria pasta: fotos/<id do usuário>/<arquivo>.
-- O navegador já manda a foto reduzida; o limite aqui é a rede de segurança.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
--> statement-breakpoint
create policy "usuario envia foto na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
create policy "usuario troca foto da propria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
create policy "usuario apaga foto da propria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
