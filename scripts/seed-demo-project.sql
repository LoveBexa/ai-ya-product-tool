-- Optional demo project for local development.
-- Run in the Supabase SQL editor after scripts/schema.sql
-- Open in the app: /projects/00000000-0000-4000-a800-000000000001

DELETE FROM cards WHERE project_id = '00000000-0000-4000-a800-000000000001';
DELETE FROM features WHERE project_id = '00000000-0000-4000-a800-000000000001';
DELETE FROM requirements WHERE project_id = '00000000-0000-4000-a800-000000000001';
DELETE FROM projects WHERE id = '00000000-0000-4000-a800-000000000001';

INSERT INTO projects (id, title, idea, stage, chat, foundation_prompt)
VALUES (
  '00000000-0000-4000-a800-000000000001',
  'Dog Walking Marketplace',
  'An app that helps dog owners find trusted local dog walkers and book walks easily.',
  'mvp',
  '[
    {"role":"user","content":"A app that helps dog owners find trusted local dog walkers and book walks easily."},
    {"role":"assistant","content":"Nice idea. Who needs this most — busy dog owners, walkers looking for clients, or both?"},
    {"role":"user","content":"Mostly busy owners who do not have time to walk their dog every day."},
    {"role":"assistant","content":"Got it. When you know it is working, what would success look like?"},
    {"role":"user","content":"An owner finds a walker nearby, books a walk, and comes back because they felt safe."}
  ]'::jsonb,
  ''
);

INSERT INTO requirements (
  id, project_id, audience, problem, solution, revenue_model, success_metric
) VALUES (
  '00000000-0000-4000-a800-000000000101',
  '00000000-0000-4000-a800-000000000001',
  'Busy dog owners who need someone trustworthy to walk their dog during the week.',
  'Finding a reliable walker is stressful — owners rely on word of mouth or strangers online with no real way to check trust.',
  'Owners search by location; walkers create profiles; reviews build trust initially.',
  'Take a small fee on each booked walk. Walkers can pay later for extra visibility.',
  'An owner completes their first booked walk and leaves a review.'
);

INSERT INTO features (id, project_id, name, priority, reasoning, sort_order, verify) VALUES
  ('00000000-0000-4000-a800-000000000201', '00000000-0000-4000-a800-000000000001', 'Sign up & log in', 'must', 'Owners and walkers both need their own account.', 0, ''),
  ('00000000-0000-4000-a800-000000000202', '00000000-0000-4000-a800-000000000001', 'Find walkers nearby', 'must', 'Owners need to see who is available in their area.', 1, ''),
  ('00000000-0000-4000-a800-000000000203', '00000000-0000-4000-a800-000000000001', 'Book a walk', 'must', 'This is the main thing you are testing — can someone actually book?', 2, ''),
  ('00000000-0000-4000-a800-000000000204', '00000000-0000-4000-a800-000000000001', 'Leave a review', 'must', 'Reviews help owners trust walkers they have never met before.', 3, ''),
  ('00000000-0000-4000-a800-000000000205', '00000000-0000-4000-a800-000000000001', 'Chat in the app', 'nice', 'Handy later — not needed to prove people will book.', 4, ''),
  ('00000000-0000-4000-a800-000000000206', '00000000-0000-4000-a800-000000000001', 'Video meet-and-greet', 'ignore', 'Fun idea, but too much for the first version.', 5, '');
