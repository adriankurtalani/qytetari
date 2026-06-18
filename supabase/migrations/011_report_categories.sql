-- Report categories: citizen-focused list (replaces broad defaults in the UI)

UPDATE categories
SET is_active = false
WHERE slug IN (
  'food-restaurants',
  'construction-real-estate',
  'public-infrastructure',
  'services',
  'public-institutions'
);

INSERT INTO categories (name, slug, description, icon, is_active) VALUES
  (
    'Shkolla',
    'shkolla',
    'Probleme në shkolla, kopshte, universitete: ngrohje, higjienë, siguri, mobileri',
    'graduation-cap',
    true
  ),
  (
    'Spital & Shëndetësi',
    'spital-shendetesi',
    'Spitale, klinika, ambulanca, farmaci: radhë, staf, pajisje, shërbim',
    'heart-pulse',
    true
  ),
  (
    'Banka & Financa',
    'banka-financa',
    'Banka, ATM, sigurime, tarifa, radhë, shërbim ndaj klientit',
    'landmark',
    true
  ),
  (
    'Komuna & Administratë',
    'komuna-administrate',
    'Shërbime komunale, dokumente, radhë, pastrim urban, zyra publike',
    'building-2',
    true
  ),
  (
    'Rrugë & Trotuare',
    'rruge-trotuare',
    'Gropa, sinjalistikë, trotuare të prishura, bllokim trafiku',
    'construction',
    true
  ),
  (
    'Mbeturina & Pastrimi',
    'mbeturina-pastrimi',
    'Kontejnerë, zona të papastruara, hedhje të paligjshme e mbeturinave',
    'trash-2',
    true
  ),
  (
    'Ndriçim publik',
    'ndricim-publik',
    'Llampa të fikura, zona të errëta, ndriçim i dëmtuar',
    'lightbulb',
    true
  ),
  (
    'Ujë & Kanalizim',
    'uje-kanalizim',
    'Mungesë uji, rrjedhje, kanalizim i bllokuar, ujë i ndotur',
    'droplets',
    true
  ),
  (
    'Energji & Ngrohje',
    'energji-ngrohje',
    'KESCO, ndërprerje energjie, ngrohje, faturim, gaz',
    'zap',
    true
  ),
  (
    'Internet & Telekomunikacion',
    'internet-telekom',
    'Internet i ngadaltë, telefoni, faturim, shërbim teknik',
    'wifi',
    true
  ),
  (
    'Transport publik',
    'transport-publik',
    'Autobus, stacione, bileta, orare, kushte udhëtimi',
    'bus',
    true
  ),
  (
    'Market & Ushqim',
    'market-ushqim',
    'Supermarket, dyqane, çmime, skadencë produktesh, higjienë',
    'shopping-cart',
    true
  ),
  (
    'Restorant & Kafene',
    'restorant-kafene',
    'Higjienë, çmime, shërbim, cilësi ushqimi',
    'utensils',
    true
  ),
  (
    'Ndërtim & Banim',
    'ndertim-banim',
    'Apartamente, ndërtesa, ashensorë, punime, zhurmë ndërtimi',
    'home',
    true
  ),
  (
    'Siguri & Zhurmë',
    'siguri-zhurme',
    'Zhurmë e tepërt, parkim i paligjshëm, zona të rrezikshme',
    'shield-alert',
    true
  ),
  (
    'Park & Hapësirë publike',
    'park-hapesire-publike',
    'Parke, sheshe, mobileri, mirëmbajtje hapësirash publike',
    'trees',
    true
  ),
  (
    'Siguri publike',
    'siguri-publike',
    'Policia, zjarrfikës, përgjigje në emergjenca, rrezik për qytetarët',
    'siren',
    true
  ),
  (
    'Mjedisi & Ndotje',
    'mjedisi-ndotje',
    'Ndotje ajri, uji, lumenjsh, hedhje të paligjshme, tym',
    'leaf',
    true
  ),
  (
    'Sport & Rekreacion',
    'sport-rekreacion',
    'Fusha sportive, palestra publike, aktivitete rekreative',
    'dumbbell',
    true
  ),
  (
    'Tjetër',
    'tjeter',
    'Kur asnjë kategori tjetër nuk përshtatet',
    'more-horizontal',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;
