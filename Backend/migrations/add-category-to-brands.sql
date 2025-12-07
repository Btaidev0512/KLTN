-- Add category_id to brands table
ALTER TABLE brands 
ADD COLUMN category_id INT NULL AFTER brand_slug,
ADD CONSTRAINT fk_brands_category 
  FOREIGN KEY (category_id) 
  REFERENCES categories(category_id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_brands_category_id ON brands(category_id);

-- Example: Update existing brands with categories
-- UPDATE brands SET category_id = 1 WHERE brand_name = 'Yonex' AND EXISTS (SELECT 1 FROM categories WHERE category_name LIKE '%Giày%' AND category_id = 1);
