INSERT INTO core.clients (client_name, company_name, contact_email, contact_phone) VALUES
  ('Budi Santoso', 'PT Maju Bersama', 'budi@majubersama.co.id', '081234567890'),
  ('Siti Nurhaliza', 'Toko Online Berkah', 'siti@tokoberka.id', '082345678901'),
  ('Ahmad Wijaya', 'Startup Teknologi Indo', 'ahmad@tekindonesia.com', '083456789012'),
  ('Lisa Manobal', 'Fashion Brand Trendi', 'lisa@trendifashion.id', '084567890123'),
  ('Rudi Hartono', 'UMKM Kerajinan Batik', 'rudi@batikcraft.id', '085678901234')
ON CONFLICT DO NOTHING;

INSERT INTO core.contracts (client_id, contract_name, description, start_date, end_date, status, created_by) VALUES
  (1, 'Campaign Ramadan 2025', 'Kampanye marketing komprehensif selama bulan Ramadan', '2025-03-01', '2025-04-15', 'ongoing', 1),
  (2, 'Grand Opening Toko Online', 'Strategi peluncuran toko online baru', '2025-04-01', '2025-05-31', 'planning', 1),
  (3, 'Product Launch TI-2025', 'Kampanye peluncuran produk teknologi baru', '2025-05-01', '2025-06-30', 'planning', 2),
  (4, 'Summer Collection 2025', 'Kampanye koleksi musim panas', '2025-06-01', '2025-08-31', 'planning', 1),
  (5, 'Batik Excellence Campaign', 'Kampanye internasional produk batik', '2025-04-15', '2025-12-31', 'ongoing', 2)
ON CONFLICT DO NOTHING;

INSERT INTO core.contents (contract_id, content_type_id, title, file_url, description, publish_date, status) VALUES
  (1, 2, 'Tips Produktif di Bulan Ramadan', 'https://drive.google.com/file/d/1ramadan-tips-1',
   'Tingkatkan produktivitas Anda selama Ramadan! #Ramadan2025', '2025-03-08 09:00:00', 'draft'),
  (1, 2, 'Cara Merawat Kesehatan Saat Berpuasa', 'https://drive.google.com/file/d/1ramadan-health-tips',
   'Jaga kesehatan selama berpuasa', '2025-03-10 09:00:00', 'draft'),
  (1, 3, 'Promo Spesial Ramadan - Diskon 50%', 'https://drive.google.com/file/d/1ramadan-promo-50',
   'Diskon hingga 50% selama Ramadan!', '2025-03-07 10:00:00', 'approved'),
  (1, 2, 'Flash Sale Malam Ramadan Pertama', 'https://drive.google.com/file/d/1ramadan-flash-sale',
   'Flash sale eksklusif 3 jam!', '2025-03-02 20:00:00', 'published'),
  (2, 1, 'Teaser: Toko Online Berkah Segera Hadir', 'https://drive.google.com/file/d/1teaser-grand-opening',
   'Toko Online Berkah segera hadir', '2025-04-05 09:00:00', 'draft'),
  (3, 6, 'Pengenalan Fitur Unggulan Produk Baru', 'https://drive.google.com/file/d/1product-launch-demo',
   '5 fitur unggulan produk terbaru', '2025-05-08 09:00:00', 'draft'),
  (4, 1, 'Koleksi Musim Panas: Inspirasi Gaya Anda', 'https://drive.google.com/file/d/1summer-collection-1',
   'Koleksi musim panas eksklusif', '2025-06-15 09:00:00', 'draft'),
  (5, 2, 'Keindahan Batik Tradisional Kita', 'https://drive.google.com/file/d/1batik-excellence-1',
   'Lestarikan batik tradisional Indonesia', '2025-05-01 09:00:00', 'draft')
ON CONFLICT DO NOTHING;

INSERT INTO core.contents_platforms (content_id, platform_id) VALUES
  (1, 1), (1, 2),
  (3, 1), (3, 2),
  (4, 1), (4, 2), (4, 3)
ON CONFLICT DO NOTHING;

INSERT INTO core.tasks (content_id, pillar_id, title, description, start_date, due_date, status) VALUES
  (1, 1, 'Buat 10 script reels edukasi', 'Script untuk 10 video reels tips produktif Ramadan', '2025-03-01', '2025-03-10', 'in_progress'),
  (1, 1, 'Desain 5 carousel posts', 'Desain carousel tips dan promo', '2025-03-05', '2025-03-15', 'pending'),
  (3, 3, 'Rekam & edit 5 video TikTok', 'Produksi konten video pendek', '2025-03-10', '2025-03-20', 'pending'),
  (5, 3, 'Buat teaser campaign graphics', 'Design 8 teaser image dengan countdown', '2025-04-01', '2025-04-05', 'pending'),
  (6, 1, 'Buat demo video produk', 'Video demonstrasi fitur utama', '2025-05-01', '2025-05-10', 'pending'),
  (7, 4, 'Photoshoot koleksi musim panas', 'Sesi pemotretan 20 produk', '2025-06-01', '2025-06-08', 'pending'),
  (8, 2, 'Dokumentasi proses batik tradisional', 'Video behind the scenes batik', '2025-04-15', '2025-05-01', 'pending')
ON CONFLICT DO NOTHING;

INSERT INTO core.task_assignments (task_id, assigned_to, assignment_role, status, script_text) VALUES
  (1, 5, 'scriptwriter', 'in_progress', 'Draft script reel #1-3'),
  (2, 4, 'content_editor', 'pending', NULL),
  (3, 6, 'social_media_admin', 'pending', NULL),
  (4, 4, 'content_editor', 'pending', NULL),
  (5, 5, 'scriptwriter', 'pending', NULL),
  (6, 6, 'social_media_admin', 'pending', NULL),
  (7, 5, 'scriptwriter', 'pending', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO core.reviews (task_assignment_id, reviewer_id, feedback, status, reviewed_at) VALUES
  (1, 3, 'Intro perlu lebih hook, tambahkan visual eye-catching', 'revision', now()),
  (2, 3, 'Desain carousel sudah sesuai brief', 'approved', now())
ON CONFLICT DO NOTHING;

UPDATE core.contents SET published_at = now() WHERE id = 4;

INSERT INTO analytics.engagements (content_id, likes, views) VALUES
  (4, 1250, 15000),
  (3, 850, 8500),
  (2, 920, 12000)
ON CONFLICT DO NOTHING;

INSERT INTO public.portfolio_items (content_id, is_featured, display_order) VALUES
  (4, true, 1),
  (3, true, 2),
  (2, false, 3)
ON CONFLICT DO NOTHING;
