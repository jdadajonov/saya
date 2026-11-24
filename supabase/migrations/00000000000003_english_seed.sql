-- Stage 3: English A1 vocabulary skills and exercises

INSERT INTO skills (id, subject, code) VALUES
  ('20000000-0000-0000-0000-000000000001', 'english', 'en.a1'),
  ('20000000-0000-0000-0000-000000000002', 'english', 'en.a1.animals'),
  ('20000000-0000-0000-0000-000000000003', 'english', 'en.a1.school'),
  ('20000000-0000-0000-0000-000000000004', 'english', 'en.a1.family'),
  ('20000000-0000-0000-0000-000000000005', 'english', 'en.a1.food'),
  ('20000000-0000-0000-0000-000000000006', 'english', 'en.a1.colors'),
  ('20000000-0000-0000-0000-000000000007', 'english', 'en.a1.sports');

-- Update parent_id for sub-skills
UPDATE skills SET parent_id = '20000000-0000-0000-0000-000000000001'
WHERE code IN ('en.a1.animals','en.a1.school','en.a1.family','en.a1.food','en.a1.colors','en.a1.sports');

-- ── Exercises ─────────────────────────────────────────────────────────────────
-- 3 types per word: word_match (difficulty 1), spell_it (difficulty 2), listen_match (difficulty 1)
-- Generated from english-a1.json word bank

DO $$
DECLARE
  topics JSONB := '[
    {"skill":"en.a1.animals","words":[
      {"en":"cat","ru":"кошка","uz":"mushuk"},{"en":"dog","ru":"собака","uz":"it"},
      {"en":"bird","ru":"птица","uz":"qush"},{"en":"fish","ru":"рыба","uz":"baliq"},
      {"en":"horse","ru":"лошадь","uz":"ot"},{"en":"bear","ru":"медведь","uz":"ayiq"},
      {"en":"rabbit","ru":"кролик","uz":"quyon"},{"en":"frog","ru":"лягушка","uz":"qurbaqa"},
      {"en":"lion","ru":"лев","uz":"sher"},{"en":"tiger","ru":"тигр","uz":"yo''lbars"}
    ]},
    {"skill":"en.a1.school","words":[
      {"en":"book","ru":"книга","uz":"kitob"},{"en":"pen","ru":"ручка","uz":"qalam"},
      {"en":"table","ru":"стол","uz":"stol"},{"en":"chair","ru":"стул","uz":"stul"},
      {"en":"bag","ru":"сумка","uz":"sumka"},{"en":"teacher","ru":"учитель","uz":"o''qituvchi"},
      {"en":"class","ru":"класс","uz":"sinf"},{"en":"pencil","ru":"карандаш","uz":"qalam"},
      {"en":"board","ru":"доска","uz":"taxta"},{"en":"school","ru":"школа","uz":"maktab"}
    ]},
    {"skill":"en.a1.family","words":[
      {"en":"mother","ru":"мама","uz":"ona"},{"en":"father","ru":"папа","uz":"ota"},
      {"en":"sister","ru":"сестра","uz":"singil"},{"en":"brother","ru":"брат","uz":"aka"},
      {"en":"baby","ru":"малыш","uz":"chaqaloq"},{"en":"family","ru":"семья","uz":"oila"},
      {"en":"grandmother","ru":"бабушка","uz":"buvi"},{"en":"grandfather","ru":"дедушка","uz":"bobo"},
      {"en":"aunt","ru":"тётя","uz":"xola"},{"en":"uncle","ru":"дядя","uz":"amaki"}
    ]},
    {"skill":"en.a1.food","words":[
      {"en":"apple","ru":"яблоко","uz":"olma"},{"en":"bread","ru":"хлеб","uz":"non"},
      {"en":"milk","ru":"молоко","uz":"sut"},{"en":"egg","ru":"яйцо","uz":"tuxum"},
      {"en":"water","ru":"вода","uz":"suv"},{"en":"juice","ru":"сок","uz":"sharbat"},
      {"en":"cake","ru":"торт","uz":"tort"},{"en":"cheese","ru":"сыр","uz":"pishloq"},
      {"en":"soup","ru":"суп","uz":"sho''rva"},{"en":"rice","ru":"рис","uz":"guruch"}
    ]},
    {"skill":"en.a1.colors","words":[
      {"en":"red","ru":"красный","uz":"qizil"},{"en":"blue","ru":"синий","uz":"ko''k"},
      {"en":"green","ru":"зелёный","uz":"yashil"},{"en":"yellow","ru":"жёлтый","uz":"sariq"},
      {"en":"white","ru":"белый","uz":"oq"},{"en":"black","ru":"чёрный","uz":"qora"},
      {"en":"orange","ru":"оранжевый","uz":"to''q sariq"},{"en":"pink","ru":"розовый","uz":"pushti"},
      {"en":"purple","ru":"фиолетовый","uz":"binafsha"},{"en":"brown","ru":"коричневый","uz":"jigarrang"}
    ]},
    {"skill":"en.a1.sports","words":[
      {"en":"ball","ru":"мяч","uz":"to''p"},{"en":"run","ru":"бежать","uz":"yugurish"},
      {"en":"swim","ru":"плавать","uz":"suzish"},{"en":"jump","ru":"прыгать","uz":"sakrash"},
      {"en":"tennis","ru":"теннис","uz":"tennis"},{"en":"football","ru":"футбол","uz":"futbol"},
      {"en":"basketball","ru":"баскетбол","uz":"basketbol"},{"en":"bike","ru":"велосипед","uz":"velosiped"},
      {"en":"dance","ru":"танцевать","uz":"raqs"},{"en":"win","ru":"побеждать","uz":"g''alaba"}
    ]}
  ]';
  topic JSONB; word JSONB; skill_id UUID;
  all_translations TEXT[];
  all_en_words TEXT[];
  distractors_ru TEXT[3];
  distractors_en TEXT[3];
BEGIN
  -- Collect all translations and English words for distractor pool
  SELECT ARRAY_AGG(w->>'ru') INTO all_translations
  FROM jsonb_array_elements(topics) t, jsonb_array_elements(t->'words') w;

  SELECT ARRAY_AGG(w->>'en') INTO all_en_words
  FROM jsonb_array_elements(topics) t, jsonb_array_elements(t->'words') w;

  FOR topic IN SELECT * FROM jsonb_array_elements(topics) LOOP
    SELECT id INTO skill_id FROM skills WHERE code = topic->>'skill';

    FOR word IN SELECT * FROM jsonb_array_elements(topic->'words') LOOP
      -- word_match: see English word, pick Russian translation
      INSERT INTO exercises (skill_id, type, payload, difficulty, locale)
      VALUES (
        skill_id,
        'english.word_match',
        jsonb_build_object(
          'word', word->>'en',
          'correctTranslation', word->>'ru',
          'distractors', (
            SELECT jsonb_agg(t) FROM (
              SELECT t FROM unnest(all_translations) AS t
              WHERE t <> word->>'ru'
              ORDER BY random() LIMIT 3
            ) sub
          ),
          'skillCode', topic->>'skill',
          'locale', 'ru'
        ),
        1,
        'any'
      );

      -- spell_it: see Russian, type English
      INSERT INTO exercises (skill_id, type, payload, difficulty, locale)
      VALUES (
        skill_id,
        'english.spell_it',
        jsonb_build_object(
          'translation', word->>'ru',
          'word', word->>'en',
          'skillCode', topic->>'skill',
          'locale', 'ru'
        ),
        2,
        'any'
      );

      -- listen_match: hear TTS, pick written English word
      INSERT INTO exercises (skill_id, type, payload, difficulty, locale)
      VALUES (
        skill_id,
        'english.listen_match',
        jsonb_build_object(
          'word', word->>'en',
          'distractors', (
            SELECT jsonb_agg(t) FROM (
              SELECT t FROM unnest(all_en_words) AS t
              WHERE t <> word->>'en'
              ORDER BY random() LIMIT 3
            ) sub
          ),
          'skillCode', topic->>'skill',
          'locale', 'ru'
        ),
        1,
        'any'
      );
    END LOOP;
  END LOOP;
END;
$$;
