-- Add all Ghana SHS subjects not yet in the subjects table
INSERT INTO subjects (id, name, short_name, icon, color, order_index, is_live) VALUES
  ('computer_science',      'Computer Science',                              'CompSci', '⌨', '#06B6D4', 20, false),
  ('ict',                   'ICT',                                           'ICT',     '◧', '#0EA5E9', 21, false),
  ('french',                'French',                                        'French',  '◐', '#EC4899', 22, false),
  ('ghanaian_language',     'Ghanaian Language',                             'Gh Lang', '⚹', '#84CC16', 23, false),
  ('crs',                   'Christian Religious Studies',                   'CRS',     '✟', '#A855F7', 24, false),
  ('irs',                   'Islamic Religious Studies',                     'IRS',     '☪', '#7C3AED', 25, false),
  ('agriculture',           'Agriculture',                                   'Agric',   '◇', '#16A34A', 26, false),
  ('food_nutrition',        'Food and Nutrition',                            'F&N',     '◯', '#DC2626', 27, false),
  ('clothing_textiles',     'Clothing and Textiles',                         'C&T',     '◊', '#F97316', 28, false),
  ('building_construction', 'Building Construction and Wood Technology',     'BCWT',    '◰', '#92400E', 29, false),
  ('electrical_electronic', 'Electrical and Electronic Technology',          'EET',     '⚡','#FACC15', 30, false),
  ('automobile_metal',      'Automobile and Metal Technology',               'AMT',     '◯', '#64748B', 31, false),
  ('rme',                   'Religious and Moral Education',                 'RME',     '◐', '#9333EA', 32, false),
  ('peh_elective',          'PEH (Elective)',                                'PEH',     '◌', '#22C55E', 33, false),
  ('arabic',                'Arabic',                                        'Arabic',  '◑', '#1E40AF', 34, false),
  ('spanish',               'Spanish',                                       'Spanish', '◒', '#B91C1C', 35, false),
  ('management_living',     'Management in Living',                          'M-Liv',   '◓', '#0F766E', 36, false),
  ('art_design_studio',     'Art and Design Studio',                         'Art-S',   '◔', '#BE185D', 37, false)
ON CONFLICT (id) DO NOTHING;
