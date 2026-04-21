-- IN-08: Consolidate duplicate brand color/font columns on sg_marcas.
--
-- Legacy Portuguese columns (cor_primaria, cor_secundaria, cor_texto,
-- fonte_titulo, fonte_texto) coexisted with the newer English ones
-- (color_primary, color_secondary, color_accent, font_heading, font_body).
-- Different parts of the app read from different sets, so a brand saved
-- through Marca (which only writes the new columns) would render with
-- the default gradient in Topbar (which reads the legacy columns).
--
-- Back-fill any unset new column from its legacy counterpart, then drop
-- the legacy columns. Callers are migrated to the new names in the same
-- commit.

UPDATE public.sg_marcas SET
  color_primary   = COALESCE(color_primary,   cor_primaria),
  color_secondary = COALESCE(color_secondary, cor_secundaria),
  color_accent    = COALESCE(color_accent,    cor_texto),
  font_heading    = COALESCE(font_heading,    fonte_titulo),
  font_body       = COALESCE(font_body,       fonte_texto);

ALTER TABLE public.sg_marcas
  DROP COLUMN IF EXISTS cor_primaria,
  DROP COLUMN IF EXISTS cor_secundaria,
  DROP COLUMN IF EXISTS cor_texto,
  DROP COLUMN IF EXISTS fonte_titulo,
  DROP COLUMN IF EXISTS fonte_texto;
