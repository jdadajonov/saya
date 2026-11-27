-- Fix English distractors: pick from same topic instead of all topics
-- This ensures animals questions have only animal options, colors have only colors, etc.

DO $$
DECLARE
  topics JSONB := '[
    {"skill":"en.a1.animals","words":[
      {"en":"cat","ru":"кошка"},{"en":"dog","ru":"собака"},{"en":"bird","ru":"птица"},
      {"en":"fish","ru":"рыба"},{"en":"horse","ru":"лошадь"},{"en":"bear","ru":"медведь"},
      {"en":"rabbit","ru":"кролик"},{"en":"frog","ru":"лягушка"},{"en":"lion","ru":"лев"},
      {"en":"tiger","ru":"тигр"},{"en":"mouse","ru":"мышь"},{"en":"cow","ru":"корова"},
      {"en":"pig","ru":"свинья"},{"en":"sheep","ru":"овца"},{"en":"chicken","ru":"курица"},
      {"en":"duck","ru":"утка"},{"en":"elephant","ru":"слон"},{"en":"monkey","ru":"обезьяна"},
      {"en":"snake","ru":"змея"},{"en":"wolf","ru":"волк"}
    ]},
    {"skill":"en.a1.family","words":[
      {"en":"mother","ru":"мама"},{"en":"father","ru":"папа"},{"en":"sister","ru":"сестра"},
      {"en":"brother","ru":"брат"},{"en":"baby","ru":"малыш"},{"en":"family","ru":"семья"},
      {"en":"grandmother","ru":"бабушка"},{"en":"grandfather","ru":"дедушка"},{"en":"aunt","ru":"тётя"},
      {"en":"uncle","ru":"дядя"},{"en":"son","ru":"сын"},{"en":"daughter","ru":"дочь"},
      {"en":"parents","ru":"родители"},{"en":"child","ru":"ребёнок"},{"en":"children","ru":"дети"},
      {"en":"husband","ru":"муж"},{"en":"wife","ru":"жена"},{"en":"cousin","ru":"двоюродный брат"},
      {"en":"friend","ru":"друг"},{"en":"people","ru":"люди"}
    ]},
    {"skill":"en.a1.food","words":[
      {"en":"apple","ru":"яблоко"},{"en":"bread","ru":"хлеб"},{"en":"milk","ru":"молоко"},
      {"en":"egg","ru":"яйцо"},{"en":"water","ru":"вода"},{"en":"juice","ru":"сок"},
      {"en":"cake","ru":"торт"},{"en":"cheese","ru":"сыр"},{"en":"soup","ru":"суп"},
      {"en":"rice","ru":"рис"},{"en":"meat","ru":"мясо"},{"en":"banana","ru":"банан"},
      {"en":"orange","ru":"апельсин"},{"en":"potato","ru":"картошка"},{"en":"tomato","ru":"помидор"},
      {"en":"carrot","ru":"морковь"},{"en":"tea","ru":"чай"},{"en":"coffee","ru":"кофе"},
      {"en":"sugar","ru":"сахар"},{"en":"salt","ru":"соль"}
    ]},
    {"skill":"en.a1.colors","words":[
      {"en":"red","ru":"красный"},{"en":"blue","ru":"синий"},{"en":"green","ru":"зелёный"},
      {"en":"yellow","ru":"жёлтый"},{"en":"white","ru":"белый"},{"en":"black","ru":"чёрный"},
      {"en":"orange","ru":"оранжевый"},{"en":"pink","ru":"розовый"},{"en":"purple","ru":"фиолетовый"},
      {"en":"brown","ru":"коричневый"},{"en":"grey","ru":"серый"},{"en":"gold","ru":"золотой"},
      {"en":"silver","ru":"серебряный"},{"en":"light","ru":"светлый"},{"en":"dark","ru":"тёмный"}
    ]},
    {"skill":"en.a1.school","words":[
      {"en":"book","ru":"книга"},{"en":"pen","ru":"ручка"},{"en":"table","ru":"стол"},
      {"en":"chair","ru":"стул"},{"en":"bag","ru":"сумка"},{"en":"teacher","ru":"учитель"},
      {"en":"class","ru":"класс"},{"en":"pencil","ru":"карандаш"},{"en":"board","ru":"доска"},
      {"en":"school","ru":"школа"},{"en":"student","ru":"ученик"},{"en":"lesson","ru":"урок"},
      {"en":"homework","ru":"домашнее задание"},{"en":"paper","ru":"бумага"},{"en":"page","ru":"страница"},
      {"en":"word","ru":"слово"},{"en":"letter","ru":"буква"},{"en":"number","ru":"число"},
      {"en":"question","ru":"вопрос"},{"en":"answer","ru":"ответ"}
    ]},
    {"skill":"en.a1.sports","words":[
      {"en":"ball","ru":"мяч"},{"en":"run","ru":"бежать"},{"en":"swim","ru":"плавать"},
      {"en":"jump","ru":"прыгать"},{"en":"tennis","ru":"теннис"},{"en":"football","ru":"футбол"},
      {"en":"basketball","ru":"баскетбол"},{"en":"bike","ru":"велосипед"},{"en":"dance","ru":"танцевать"},
      {"en":"win","ru":"побеждать"},{"en":"game","ru":"игра"},{"en":"team","ru":"команда"},
      {"en":"sport","ru":"спорт"},{"en":"player","ru":"игрок"},{"en":"goal","ru":"гол"}
    ]},
    {"skill":"en.a1.body","words":[
      {"en":"head","ru":"голова"},{"en":"hand","ru":"рука"},{"en":"eye","ru":"глаз"},
      {"en":"face","ru":"лицо"},{"en":"foot","ru":"нога"},{"en":"heart","ru":"сердце"},
      {"en":"hair","ru":"волосы"},{"en":"ear","ru":"ухо"},{"en":"nose","ru":"нос"},
      {"en":"mouth","ru":"рот"},{"en":"arm","ru":"рука"},{"en":"leg","ru":"нога"},
      {"en":"finger","ru":"палец"},{"en":"tooth","ru":"зуб"},{"en":"back","ru":"спина"},
      {"en":"neck","ru":"шея"},{"en":"shoulder","ru":"плечо"},{"en":"knee","ru":"колено"},
      {"en":"stomach","ru":"живот"},{"en":"skin","ru":"кожа"}
    ]},
    {"skill":"en.a1.home","words":[
      {"en":"house","ru":"дом"},{"en":"room","ru":"комната"},{"en":"door","ru":"дверь"},
      {"en":"window","ru":"окно"},{"en":"bed","ru":"кровать"},{"en":"kitchen","ru":"кухня"},
      {"en":"bathroom","ru":"ванная"},{"en":"floor","ru":"пол"},{"en":"wall","ru":"стена"},
      {"en":"garden","ru":"сад"},{"en":"home","ru":"дом"},{"en":"apartment","ru":"квартира"},
      {"en":"stairs","ru":"лестница"},{"en":"roof","ru":"крыша"},{"en":"lamp","ru":"лампа"},
      {"en":"sofa","ru":"диван"},{"en":"mirror","ru":"зеркало"},{"en":"clock","ru":"часы"},
      {"en":"key","ru":"ключ"},{"en":"phone","ru":"телефон"}
    ]},
    {"skill":"en.a1.time","words":[
      {"en":"day","ru":"день"},{"en":"week","ru":"неделя"},{"en":"month","ru":"месяц"},
      {"en":"year","ru":"год"},{"en":"today","ru":"сегодня"},{"en":"tomorrow","ru":"завтра"},
      {"en":"yesterday","ru":"вчера"},{"en":"morning","ru":"утро"},{"en":"evening","ru":"вечер"},
      {"en":"night","ru":"ночь"},{"en":"hour","ru":"час"},{"en":"minute","ru":"минута"},
      {"en":"second","ru":"секунда"},{"en":"time","ru":"время"},{"en":"now","ru":"сейчас"},
      {"en":"always","ru":"всегда"},{"en":"never","ru":"никогда"},{"en":"often","ru":"часто"},
      {"en":"early","ru":"рано"},{"en":"late","ru":"поздно"}
    ]},
    {"skill":"en.a1.actions","words":[
      {"en":"go","ru":"идти"},{"en":"come","ru":"приходить"},{"en":"see","ru":"видеть"},
      {"en":"take","ru":"брать"},{"en":"give","ru":"давать"},{"en":"make","ru":"делать"},
      {"en":"know","ru":"знать"},{"en":"think","ru":"думать"},{"en":"want","ru":"хотеть"},
      {"en":"look","ru":"смотреть"},{"en":"use","ru":"использовать"},{"en":"find","ru":"находить"},
      {"en":"tell","ru":"рассказывать"},{"en":"ask","ru":"спрашивать"},{"en":"work","ru":"работать"},
      {"en":"feel","ru":"чувствовать"},{"en":"try","ru":"пытаться"},{"en":"leave","ru":"уходить"},
      {"en":"call","ru":"звонить"},{"en":"help","ru":"помогать"}
    ]},
    {"skill":"en.a1.adjectives","words":[
      {"en":"big","ru":"большой"},{"en":"small","ru":"маленький"},{"en":"new","ru":"новый"},
      {"en":"old","ru":"старый"},{"en":"good","ru":"хороший"},{"en":"bad","ru":"плохой"},
      {"en":"happy","ru":"счастливый"},{"en":"sad","ru":"грустный"},{"en":"hot","ru":"горячий"},
      {"en":"cold","ru":"холодный"},{"en":"fast","ru":"быстрый"},{"en":"slow","ru":"медленный"},
      {"en":"easy","ru":"лёгкий"},{"en":"hard","ru":"трудный"},{"en":"beautiful","ru":"красивый"},
      {"en":"clean","ru":"чистый"},{"en":"dirty","ru":"грязный"},{"en":"full","ru":"полный"},
      {"en":"empty","ru":"пустой"},{"en":"strong","ru":"сильный"}
    ]},
    {"skill":"en.a1.places","words":[
      {"en":"city","ru":"город"},{"en":"street","ru":"улица"},{"en":"park","ru":"парк"},
      {"en":"shop","ru":"магазин"},{"en":"market","ru":"рынок"},{"en":"hospital","ru":"больница"},
      {"en":"bank","ru":"банк"},{"en":"restaurant","ru":"ресторан"},{"en":"hotel","ru":"гостиница"},
      {"en":"airport","ru":"аэропорт"},{"en":"station","ru":"станция"},{"en":"library","ru":"библиотека"},
      {"en":"museum","ru":"музей"},{"en":"cinema","ru":"кинотеатр"},{"en":"church","ru":"церковь"},
      {"en":"office","ru":"офис"},{"en":"country","ru":"страна"},{"en":"world","ru":"мир"},
      {"en":"place","ru":"место"},{"en":"road","ru":"дорога"}
    ]},
    {"skill":"en.a1.nature","words":[
      {"en":"sun","ru":"солнце"},{"en":"moon","ru":"луна"},{"en":"star","ru":"звезда"},
      {"en":"sky","ru":"небо"},{"en":"rain","ru":"дождь"},{"en":"snow","ru":"снег"},
      {"en":"wind","ru":"ветер"},{"en":"tree","ru":"дерево"},{"en":"flower","ru":"цветок"},
      {"en":"grass","ru":"трава"},{"en":"river","ru":"река"},{"en":"sea","ru":"море"},
      {"en":"mountain","ru":"гора"},{"en":"lake","ru":"озеро"},{"en":"forest","ru":"лес"},
      {"en":"fire","ru":"огонь"},{"en":"earth","ru":"земля"},{"en":"air","ru":"воздух"},
      {"en":"cloud","ru":"облако"},{"en":"weather","ru":"погода"}
    ]},
    {"skill":"en.a1.transport","words":[
      {"en":"car","ru":"машина"},{"en":"bus","ru":"автобус"},{"en":"train","ru":"поезд"},
      {"en":"plane","ru":"самолёт"},{"en":"bike","ru":"велосипед"},{"en":"boat","ru":"лодка"},
      {"en":"ship","ru":"корабль"},{"en":"taxi","ru":"такси"},{"en":"metro","ru":"метро"},
      {"en":"ticket","ru":"билет"}
    ]},
    {"skill":"en.a1.clothes","words":[
      {"en":"shirt","ru":"рубашка"},{"en":"dress","ru":"платье"},{"en":"shoes","ru":"обувь"},
      {"en":"hat","ru":"шляпа"},{"en":"coat","ru":"пальто"},{"en":"jacket","ru":"куртка"},
      {"en":"pants","ru":"брюки"},{"en":"jeans","ru":"джинсы"},{"en":"sock","ru":"носок"},
      {"en":"gloves","ru":"перчатки"},{"en":"scarf","ru":"шарф"},{"en":"sweater","ru":"свитер"},
      {"en":"skirt","ru":"юбка"},{"en":"boots","ru":"сапоги"},{"en":"belt","ru":"ремень"}
    ]},
    {"skill":"en.a1.numbers","words":[
      {"en":"one","ru":"один"},{"en":"two","ru":"два"},{"en":"three","ru":"три"},
      {"en":"four","ru":"четыре"},{"en":"five","ru":"пять"},{"en":"six","ru":"шесть"},
      {"en":"seven","ru":"семь"},{"en":"eight","ru":"восемь"},{"en":"nine","ru":"девять"},
      {"en":"ten","ru":"десять"},{"en":"hundred","ru":"сто"},{"en":"thousand","ru":"тысяча"},
      {"en":"first","ru":"первый"},{"en":"second","ru":"второй"},{"en":"last","ru":"последний"}
    ]}
  ]';
  topic JSONB;
  word JSONB;
  v_skill_id UUID;
  topic_translations TEXT[];
  topic_en_words TEXT[];
BEGIN
  FOR topic IN SELECT * FROM jsonb_array_elements(topics) LOOP
    SELECT id INTO v_skill_id FROM skills WHERE code = topic->>'skill';

    IF v_skill_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Build arrays of translations and English words for THIS topic only
    SELECT ARRAY_AGG(w->>'ru') INTO topic_translations
    FROM jsonb_array_elements(topic->'words') w;

    SELECT ARRAY_AGG(w->>'en') INTO topic_en_words
    FROM jsonb_array_elements(topic->'words') w;

    FOR word IN SELECT * FROM jsonb_array_elements(topic->'words') LOOP
      -- Update word_match exercises: distractors from same topic
      UPDATE exercises
      SET payload = jsonb_set(
        payload,
        '{distractors}',
        (
          SELECT jsonb_agg(t) FROM (
            SELECT t FROM unnest(topic_translations) AS t
            WHERE t <> word->>'ru'
            ORDER BY random() LIMIT 3
          ) sub
        )
      )
      WHERE exercises.skill_id = v_skill_id
        AND type = 'english.word_match'
        AND payload->>'word' = word->>'en';

      -- Update listen_match exercises: distractors from same topic
      UPDATE exercises
      SET payload = jsonb_set(
        payload,
        '{distractors}',
        (
          SELECT jsonb_agg(t) FROM (
            SELECT t FROM unnest(topic_en_words) AS t
            WHERE t <> word->>'en'
            ORDER BY random() LIMIT 3
          ) sub
        )
      )
      WHERE exercises.skill_id = v_skill_id
        AND type = 'english.listen_match'
        AND payload->>'word' = word->>'en';
    END LOOP;
  END LOOP;
END;
$$;
