-- Stage 3b: Expanded English A1 vocabulary (KELLY Project + manual translations)
-- Source: KELLY wordlist (CC-BY license) with Russian/Uzbek translations

-- Add new skill categories
INSERT INTO skills (id, subject, code, parent_id) VALUES
  ('20000000-0000-0000-0000-000000000008', 'english', 'en.a1.body', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000009', 'english', 'en.a1.home', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000010', 'english', 'en.a1.time', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000011', 'english', 'en.a1.actions', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000012', 'english', 'en.a1.adjectives', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000013', 'english', 'en.a1.places', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000014', 'english', 'en.a1.nature', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000015', 'english', 'en.a1.transport', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000016', 'english', 'en.a1.clothes', '20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000017', 'english', 'en.a1.numbers', '20000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Add expanded words to existing topics and new topics
DO $$
DECLARE
  topics JSONB := '[
    {"skill":"en.a1.animals","words":[
      {"en":"mouse","ru":"мышь","uz":"sichqon"},{"en":"cow","ru":"корова","uz":"sigir"},
      {"en":"pig","ru":"свинья","uz":"cho''chqa"},{"en":"sheep","ru":"овца","uz":"qo''y"},
      {"en":"chicken","ru":"курица","uz":"tovuq"},{"en":"duck","ru":"утка","uz":"o''rdak"},
      {"en":"elephant","ru":"слон","uz":"fil"},{"en":"monkey","ru":"обезьяна","uz":"maymun"},
      {"en":"snake","ru":"змея","uz":"ilon"},{"en":"wolf","ru":"волк","uz":"bo''ri"}
    ]},
    {"skill":"en.a1.family","words":[
      {"en":"son","ru":"сын","uz":"o''g''il"},{"en":"daughter","ru":"дочь","uz":"qiz"},
      {"en":"parents","ru":"родители","uz":"ota-ona"},{"en":"child","ru":"ребёнок","uz":"bola"},
      {"en":"children","ru":"дети","uz":"bolalar"},{"en":"husband","ru":"муж","uz":"er"},
      {"en":"wife","ru":"жена","uz":"xotin"},{"en":"cousin","ru":"двоюродный брат","uz":"amakivachcha"},
      {"en":"friend","ru":"друг","uz":"do''st"},{"en":"people","ru":"люди","uz":"odamlar"}
    ]},
    {"skill":"en.a1.food","words":[
      {"en":"meat","ru":"мясо","uz":"go''sht"},{"en":"banana","ru":"банан","uz":"banan"},
      {"en":"orange","ru":"апельсин","uz":"apelsin"},{"en":"potato","ru":"картошка","uz":"kartoshka"},
      {"en":"tomato","ru":"помидор","uz":"pomidor"},{"en":"carrot","ru":"морковь","uz":"sabzi"},
      {"en":"tea","ru":"чай","uz":"choy"},{"en":"coffee","ru":"кофе","uz":"qahva"},
      {"en":"sugar","ru":"сахар","uz":"shakar"},{"en":"salt","ru":"соль","uz":"tuz"}
    ]},
    {"skill":"en.a1.colors","words":[
      {"en":"grey","ru":"серый","uz":"kulrang"},{"en":"gold","ru":"золотой","uz":"oltin"},
      {"en":"silver","ru":"серебряный","uz":"kumush"},{"en":"light","ru":"светлый","uz":"yorqin"},
      {"en":"dark","ru":"тёмный","uz":"qorong''i"}
    ]},
    {"skill":"en.a1.school","words":[
      {"en":"student","ru":"ученик","uz":"o''quvchi"},{"en":"lesson","ru":"урок","uz":"dars"},
      {"en":"homework","ru":"домашнее задание","uz":"uy vazifasi"},{"en":"paper","ru":"бумага","uz":"qog''oz"},
      {"en":"page","ru":"страница","uz":"sahifa"},{"en":"word","ru":"слово","uz":"so''z"},
      {"en":"letter","ru":"буква","uz":"harf"},{"en":"number","ru":"число","uz":"raqam"},
      {"en":"question","ru":"вопрос","uz":"savol"},{"en":"answer","ru":"ответ","uz":"javob"}
    ]},
    {"skill":"en.a1.sports","words":[
      {"en":"game","ru":"игра","uz":"o''yin"},{"en":"team","ru":"команда","uz":"jamoa"},
      {"en":"sport","ru":"спорт","uz":"sport"},{"en":"player","ru":"игрок","uz":"o''yinchi"},
      {"en":"goal","ru":"гол","uz":"gol"}
    ]},
    {"skill":"en.a1.body","words":[
      {"en":"head","ru":"голова","uz":"bosh"},{"en":"hand","ru":"рука","uz":"qo''l"},
      {"en":"eye","ru":"глаз","uz":"ko''z"},{"en":"face","ru":"лицо","uz":"yuz"},
      {"en":"foot","ru":"нога","uz":"oyoq"},{"en":"heart","ru":"сердце","uz":"yurak"},
      {"en":"hair","ru":"волосы","uz":"soch"},{"en":"ear","ru":"ухо","uz":"quloq"},
      {"en":"nose","ru":"нос","uz":"burun"},{"en":"mouth","ru":"рот","uz":"og''iz"},
      {"en":"arm","ru":"рука","uz":"bilak"},{"en":"leg","ru":"нога","uz":"oyoq"},
      {"en":"finger","ru":"палец","uz":"barmoq"},{"en":"tooth","ru":"зуб","uz":"tish"},
      {"en":"back","ru":"спина","uz":"orqa"},{"en":"neck","ru":"шея","uz":"bo''yin"},
      {"en":"shoulder","ru":"плечо","uz":"yelka"},{"en":"knee","ru":"колено","uz":"tizza"},
      {"en":"stomach","ru":"живот","uz":"qorin"},{"en":"skin","ru":"кожа","uz":"teri"}
    ]},
    {"skill":"en.a1.home","words":[
      {"en":"house","ru":"дом","uz":"uy"},{"en":"room","ru":"комната","uz":"xona"},
      {"en":"door","ru":"дверь","uz":"eshik"},{"en":"window","ru":"окно","uz":"deraza"},
      {"en":"bed","ru":"кровать","uz":"karavot"},{"en":"kitchen","ru":"кухня","uz":"oshxona"},
      {"en":"bathroom","ru":"ванная","uz":"hammom"},{"en":"floor","ru":"пол","uz":"pol"},
      {"en":"wall","ru":"стена","uz":"devor"},{"en":"garden","ru":"сад","uz":"bog''"},
      {"en":"home","ru":"дом","uz":"uy"},{"en":"apartment","ru":"квартира","uz":"kvartira"},
      {"en":"stairs","ru":"лестница","uz":"zinaPoya"},{"en":"roof","ru":"крыша","uz":"tom"},
      {"en":"lamp","ru":"лампа","uz":"lampa"},{"en":"sofa","ru":"диван","uz":"divan"},
      {"en":"mirror","ru":"зеркало","uz":"oyna"},{"en":"clock","ru":"часы","uz":"soat"},
      {"en":"key","ru":"ключ","uz":"kalit"},{"en":"phone","ru":"телефон","uz":"telefon"}
    ]},
    {"skill":"en.a1.time","words":[
      {"en":"day","ru":"день","uz":"kun"},{"en":"week","ru":"неделя","uz":"hafta"},
      {"en":"month","ru":"месяц","uz":"oy"},{"en":"year","ru":"год","uz":"yil"},
      {"en":"today","ru":"сегодня","uz":"bugun"},{"en":"tomorrow","ru":"завтра","uz":"ertaga"},
      {"en":"yesterday","ru":"вчера","uz":"kecha"},{"en":"morning","ru":"утро","uz":"ertalab"},
      {"en":"evening","ru":"вечер","uz":"kechqurun"},{"en":"night","ru":"ночь","uz":"tun"},
      {"en":"hour","ru":"час","uz":"soat"},{"en":"minute","ru":"минута","uz":"daqiqa"},
      {"en":"second","ru":"секунда","uz":"soniya"},{"en":"time","ru":"время","uz":"vaqt"},
      {"en":"now","ru":"сейчас","uz":"hozir"},{"en":"always","ru":"всегда","uz":"doim"},
      {"en":"never","ru":"никогда","uz":"hech qachon"},{"en":"often","ru":"часто","uz":"tez-tez"},
      {"en":"early","ru":"рано","uz":"erta"},{"en":"late","ru":"поздно","uz":"kech"}
    ]},
    {"skill":"en.a1.actions","words":[
      {"en":"go","ru":"идти","uz":"bormoq"},{"en":"come","ru":"приходить","uz":"kelmoq"},
      {"en":"see","ru":"видеть","uz":"ko''rmoq"},{"en":"take","ru":"брать","uz":"olmoq"},
      {"en":"give","ru":"давать","uz":"bermoq"},{"en":"make","ru":"делать","uz":"qilmoq"},
      {"en":"know","ru":"знать","uz":"bilmoq"},{"en":"think","ru":"думать","uz":"o''ylamoq"},
      {"en":"want","ru":"хотеть","uz":"xohlamoq"},{"en":"look","ru":"смотреть","uz":"qaramoq"},
      {"en":"help","ru":"помогать","uz":"yordam bermoq"},{"en":"try","ru":"пытаться","uz":"harakat qilmoq"},
      {"en":"walk","ru":"ходить","uz":"yurmoq"},{"en":"sit","ru":"сидеть","uz":"o''tirmoq"},
      {"en":"stand","ru":"стоять","uz":"turmoq"},{"en":"eat","ru":"есть","uz":"yemoq"},
      {"en":"drink","ru":"пить","uz":"ichmoq"},{"en":"sleep","ru":"спать","uz":"uxlamoq"},
      {"en":"read","ru":"читать","uz":"o''qimoq"},{"en":"write","ru":"писать","uz":"yozmoq"},
      {"en":"speak","ru":"говорить","uz":"gapirmoq"},{"en":"listen","ru":"слушать","uz":"tinglamoq"},
      {"en":"play","ru":"играть","uz":"o''ynamoq"},{"en":"work","ru":"работать","uz":"ishlamoq"},
      {"en":"learn","ru":"учиться","uz":"o''rganmoq"},{"en":"open","ru":"открывать","uz":"ochmoq"},
      {"en":"close","ru":"закрывать","uz":"yopmoq"},{"en":"start","ru":"начинать","uz":"boshlamoq"},
      {"en":"stop","ru":"останавливать","uz":"to''xtatmoq"}
    ]},
    {"skill":"en.a1.adjectives","words":[
      {"en":"big","ru":"большой","uz":"katta"},{"en":"small","ru":"маленький","uz":"kichik"},
      {"en":"good","ru":"хороший","uz":"yaxshi"},{"en":"bad","ru":"плохой","uz":"yomon"},
      {"en":"new","ru":"новый","uz":"yangi"},{"en":"old","ru":"старый","uz":"eski"},
      {"en":"long","ru":"длинный","uz":"uzun"},{"en":"short","ru":"короткий","uz":"qisqa"},
      {"en":"hot","ru":"горячий","uz":"issiq"},{"en":"cold","ru":"холодный","uz":"sovuq"},
      {"en":"happy","ru":"счастливый","uz":"baxtli"},{"en":"sad","ru":"грустный","uz":"g''amgin"},
      {"en":"fast","ru":"быстрый","uz":"tez"},{"en":"slow","ru":"медленный","uz":"sekin"},
      {"en":"easy","ru":"лёгкий","uz":"oson"},{"en":"hard","ru":"трудный","uz":"qiyin"},
      {"en":"clean","ru":"чистый","uz":"toza"},{"en":"dirty","ru":"грязный","uz":"iflos"},
      {"en":"beautiful","ru":"красивый","uz":"chiroyli"},{"en":"ugly","ru":"некрасивый","uz":"xunuk"},
      {"en":"young","ru":"молодой","uz":"yosh"},{"en":"strong","ru":"сильный","uz":"kuchli"},
      {"en":"weak","ru":"слабый","uz":"zaif"},{"en":"right","ru":"правильный","uz":"to''g''ri"},
      {"en":"wrong","ru":"неправильный","uz":"noto''g''ri"}
    ]},
    {"skill":"en.a1.places","words":[
      {"en":"city","ru":"город","uz":"shahar"},{"en":"street","ru":"улица","uz":"ko''cha"},
      {"en":"park","ru":"парк","uz":"park"},{"en":"shop","ru":"магазин","uz":"do''kon"},
      {"en":"market","ru":"рынок","uz":"bozor"},{"en":"hospital","ru":"больница","uz":"kasalxona"},
      {"en":"bank","ru":"банк","uz":"bank"},{"en":"restaurant","ru":"ресторан","uz":"restoran"},
      {"en":"hotel","ru":"гостиница","uz":"mehmonxona"},{"en":"airport","ru":"аэропорт","uz":"aeroport"},
      {"en":"station","ru":"станция","uz":"stansiya"},{"en":"library","ru":"библиотека","uz":"kutubxona"},
      {"en":"museum","ru":"музей","uz":"muzey"},{"en":"cinema","ru":"кинотеатр","uz":"kinoteatr"},
      {"en":"church","ru":"церковь","uz":"cherkov"},{"en":"office","ru":"офис","uz":"ofis"},
      {"en":"country","ru":"страна","uz":"mamlakat"},{"en":"world","ru":"мир","uz":"dunyo"},
      {"en":"place","ru":"место","uz":"joy"},{"en":"road","ru":"дорога","uz":"yo''l"}
    ]},
    {"skill":"en.a1.nature","words":[
      {"en":"sun","ru":"солнце","uz":"quyosh"},{"en":"moon","ru":"луна","uz":"oy"},
      {"en":"star","ru":"звезда","uz":"yulduz"},{"en":"sky","ru":"небо","uz":"osmon"},
      {"en":"rain","ru":"дождь","uz":"yomg''ir"},{"en":"snow","ru":"снег","uz":"qor"},
      {"en":"wind","ru":"ветер","uz":"shamol"},{"en":"tree","ru":"дерево","uz":"daraxt"},
      {"en":"flower","ru":"цветок","uz":"gul"},{"en":"grass","ru":"трава","uz":"o''t"},
      {"en":"river","ru":"река","uz":"daryo"},{"en":"sea","ru":"море","uz":"dengiz"},
      {"en":"mountain","ru":"гора","uz":"tog''"},{"en":"lake","ru":"озеро","uz":"ko''l"},
      {"en":"forest","ru":"лес","uz":"o''rmon"},{"en":"fire","ru":"огонь","uz":"olov"},
      {"en":"earth","ru":"земля","uz":"yer"},{"en":"air","ru":"воздух","uz":"havo"},
      {"en":"cloud","ru":"облако","uz":"bulut"},{"en":"weather","ru":"погода","uz":"ob-havo"}
    ]},
    {"skill":"en.a1.transport","words":[
      {"en":"car","ru":"машина","uz":"mashina"},{"en":"bus","ru":"автобус","uz":"avtobus"},
      {"en":"train","ru":"поезд","uz":"poyezd"},{"en":"plane","ru":"самолёт","uz":"samolyot"},
      {"en":"bike","ru":"велосипед","uz":"velosiped"},{"en":"boat","ru":"лодка","uz":"qayiq"},
      {"en":"ship","ru":"корабль","uz":"kema"},{"en":"taxi","ru":"такси","uz":"taksi"},
      {"en":"metro","ru":"метро","uz":"metro"},{"en":"ticket","ru":"билет","uz":"chipta"}
    ]},
    {"skill":"en.a1.clothes","words":[
      {"en":"shirt","ru":"рубашка","uz":"ko''ylak"},{"en":"dress","ru":"платье","uz":"libos"},
      {"en":"shoes","ru":"обувь","uz":"poyabzal"},{"en":"hat","ru":"шляпа","uz":"shlyapa"},
      {"en":"coat","ru":"пальто","uz":"palto"},{"en":"jacket","ru":"куртка","uz":"kurtka"},
      {"en":"pants","ru":"брюки","uz":"shim"},{"en":"jeans","ru":"джинсы","uz":"jinsi"},
      {"en":"sock","ru":"носок","uz":"paypoq"},{"en":"gloves","ru":"перчатки","uz":"qo''lqop"},
      {"en":"scarf","ru":"шарф","uz":"sharf"},{"en":"sweater","ru":"свитер","uz":"sviter"},
      {"en":"skirt","ru":"юбка","uz":"yubka"},{"en":"boots","ru":"сапоги","uz":"etik"},
      {"en":"belt","ru":"ремень","uz":"kamar"}
    ]},
    {"skill":"en.a1.numbers","words":[
      {"en":"one","ru":"один","uz":"bir"},{"en":"two","ru":"два","uz":"ikki"},
      {"en":"three","ru":"три","uz":"uch"},{"en":"four","ru":"четыре","uz":"to''rt"},
      {"en":"five","ru":"пять","uz":"besh"},{"en":"six","ru":"шесть","uz":"olti"},
      {"en":"seven","ru":"семь","uz":"yetti"},{"en":"eight","ru":"восемь","uz":"sakkiz"},
      {"en":"nine","ru":"девять","uz":"to''qqiz"},{"en":"ten","ru":"десять","uz":"o''n"},
      {"en":"hundred","ru":"сто","uz":"yuz"},{"en":"thousand","ru":"тысяча","uz":"ming"},
      {"en":"first","ru":"первый","uz":"birinchi"},{"en":"second","ru":"второй","uz":"ikkinchi"},
      {"en":"last","ru":"последний","uz":"oxirgi"}
    ]}
  ]';
  topic JSONB; word JSONB; skill_id UUID;
  all_translations TEXT[];
  all_en_words TEXT[];
BEGIN
  -- Collect all translations and English words for distractor pool
  SELECT ARRAY_AGG(w->>'ru') INTO all_translations
  FROM jsonb_array_elements(topics) t, jsonb_array_elements(t->'words') w;

  SELECT ARRAY_AGG(w->>'en') INTO all_en_words
  FROM jsonb_array_elements(topics) t, jsonb_array_elements(t->'words') w;

  FOR topic IN SELECT * FROM jsonb_array_elements(topics) LOOP
    SELECT id INTO skill_id FROM skills WHERE code = topic->>'skill';

    -- Skip if skill not found
    IF skill_id IS NULL THEN
      RAISE NOTICE 'Skill not found: %', topic->>'skill';
      CONTINUE;
    END IF;

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
