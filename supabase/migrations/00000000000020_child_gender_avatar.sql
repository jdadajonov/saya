-- Add gender to children and improve avatar support

-- Add gender column
ALTER TABLE children ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('boy', 'girl'));

-- Add avatar_url for custom photo uploads
ALTER TABLE children ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS to allow children table updates by family parents (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'children' AND policyname = 'children: parent update'
  ) THEN
    CREATE POLICY "children: parent update"
      ON children FOR UPDATE
      USING (
        family_id IN (
          SELECT family_id FROM members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'parent')
        )
      );
  END IF;
END $$;
