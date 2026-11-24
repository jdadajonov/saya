-- Stage: Chess learning module - skills and exercises

-- ── Skills ────────────────────────────────────────────────────────────────────
INSERT INTO skills (id, subject, code) VALUES
  -- Root
  ('30000000-0000-0000-0000-000000000001', 'chess', 'chess'),
  -- Pieces identification
  ('30000000-0000-0000-0000-000000000010', 'chess', 'chess.pieces'),
  ('30000000-0000-0000-0000-000000000011', 'chess', 'chess.pieces.king'),
  ('30000000-0000-0000-0000-000000000012', 'chess', 'chess.pieces.queen'),
  ('30000000-0000-0000-0000-000000000013', 'chess', 'chess.pieces.rook'),
  ('30000000-0000-0000-0000-000000000014', 'chess', 'chess.pieces.bishop'),
  ('30000000-0000-0000-0000-000000000015', 'chess', 'chess.pieces.knight'),
  ('30000000-0000-0000-0000-000000000016', 'chess', 'chess.pieces.pawn'),
  -- Movement
  ('30000000-0000-0000-0000-000000000020', 'chess', 'chess.movement'),
  ('30000000-0000-0000-0000-000000000021', 'chess', 'chess.movement.rook'),
  ('30000000-0000-0000-0000-000000000022', 'chess', 'chess.movement.bishop'),
  ('30000000-0000-0000-0000-000000000023', 'chess', 'chess.movement.queen'),
  ('30000000-0000-0000-0000-000000000024', 'chess', 'chess.movement.knight'),
  ('30000000-0000-0000-0000-000000000025', 'chess', 'chess.movement.king'),
  ('30000000-0000-0000-0000-000000000026', 'chess', 'chess.movement.pawn'),
  -- Tactics (future)
  ('30000000-0000-0000-0000-000000000030', 'chess', 'chess.tactics'),
  ('30000000-0000-0000-0000-000000000031', 'chess', 'chess.tactics.capture'),
  ('30000000-0000-0000-0000-000000000032', 'chess', 'chess.tactics.check');

-- Set parent relationships
UPDATE skills SET parent_id = '30000000-0000-0000-0000-000000000001'
WHERE code IN ('chess.pieces', 'chess.movement', 'chess.tactics');

UPDATE skills SET parent_id = '30000000-0000-0000-0000-000000000010'
WHERE code LIKE 'chess.pieces.%';

UPDATE skills SET parent_id = '30000000-0000-0000-0000-000000000020'
WHERE code LIKE 'chess.movement.%';

UPDATE skills SET parent_id = '30000000-0000-0000-0000-000000000030'
WHERE code LIKE 'chess.tactics.%';

-- ── Exercises ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pieces TEXT[] := ARRAY['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  all_pieces TEXT[] := ARRAY['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  piece TEXT;
  color TEXT;
  distractors TEXT[];
  skill_id UUID;
  movement_data JSONB;
  m JSONB;
BEGIN
  -- Piece identification exercises (2 per piece - white and black)
  FOREACH piece IN ARRAY pieces LOOP
    SELECT id INTO skill_id FROM skills WHERE code = 'chess.pieces.' || piece;

    -- Get 3 random distractors (other pieces)
    SELECT ARRAY_AGG(p) INTO distractors
    FROM (SELECT unnest(all_pieces) AS p WHERE unnest <> piece ORDER BY random() LIMIT 3) sub;

    FOREACH color IN ARRAY ARRAY['white', 'black'] LOOP
      INSERT INTO exercises (skill_id, type, payload, difficulty, locale)
      VALUES (
        skill_id,
        'chess.piece_identify',
        jsonb_build_object(
          'pieceType', piece,
          'color', color,
          'distractors', to_jsonb(distractors),
          'skillCode', 'chess.pieces.' || piece
        ),
        1,
        'any'
      );
    END LOOP;
  END LOOP;

  -- Movement exercises - various positions for each piece
  movement_data := '[
    {"piece": "rook", "from": "e4", "difficulty": 1},
    {"piece": "rook", "from": "a1", "difficulty": 1},
    {"piece": "rook", "from": "h8", "difficulty": 1},
    {"piece": "bishop", "from": "c4", "difficulty": 1},
    {"piece": "bishop", "from": "f1", "difficulty": 1},
    {"piece": "bishop", "from": "d5", "difficulty": 1},
    {"piece": "queen", "from": "d4", "difficulty": 2},
    {"piece": "queen", "from": "e1", "difficulty": 2},
    {"piece": "knight", "from": "e4", "difficulty": 1},
    {"piece": "knight", "from": "b1", "difficulty": 1},
    {"piece": "knight", "from": "g1", "difficulty": 1},
    {"piece": "knight", "from": "f3", "difficulty": 1},
    {"piece": "king", "from": "e4", "difficulty": 1},
    {"piece": "king", "from": "e1", "difficulty": 1},
    {"piece": "pawn", "from": "e2", "difficulty": 1},
    {"piece": "pawn", "from": "e4", "difficulty": 1},
    {"piece": "pawn", "from": "d7", "difficulty": 1}
  ]';

  FOR m IN SELECT * FROM jsonb_array_elements(movement_data) LOOP
    SELECT id INTO skill_id FROM skills WHERE code = 'chess.movement.' || (m->>'piece');

    INSERT INTO exercises (skill_id, type, payload, difficulty, locale)
    VALUES (
      skill_id,
      'chess.piece_move',
      jsonb_build_object(
        'pieceType', m->>'piece',
        'color', 'white',
        'from', m->>'from',
        'position', jsonb_build_object(
          m->>'from', jsonb_build_object('type', m->>'piece', 'color', 'white')
        ),
        'legalSquares', '[]'::jsonb,
        'skillCode', 'chess.movement.' || (m->>'piece')
      ),
      (m->>'difficulty')::int,
      'any'
    );
  END LOOP;
END;
$$;
