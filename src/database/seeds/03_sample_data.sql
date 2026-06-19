-- Sample clients
INSERT INTO core.clients (client_name, company_name, contact_email, contact_phone) VALUES
  ('Budi Santoso', 'PT Maju Bersama', 'budi@majubersama.co.id', '081234567890'),
  ('Siti Nurhaliza', 'Toko Online Berkah', 'siti@tokoberka.id', '082345678901'),
  ('Ahmad Wijaya', 'Startup Teknologi Indo', 'ahmad@tekindonesia.com', '083456789012'),
  ('Lisa Manobal', 'Fashion Brand Trendi', 'lisa@trendifashion.id', '084567890123'),
  ('Rudi Hartono', 'UMKM Kerajinan Batik', 'rudi@batikcraft.id', '085678901234')
ON CONFLICT DO NOTHING;

-- Sample contracts (created_by=1=SuperAdmin, lead_by=2=Owner)
INSERT INTO core.contracts (client_id, contract_code, contract_name, description, start_date, end_date, revenue, status, created_by, lead_by) VALUES
  (1, 'CTR-2025-001', 'Campaign Ramadan 2025', 'Kampanye marketing komprehensif selama bulan Ramadan', '2025-03-01', '2025-04-15', 25000000, 'active', 1, 2),
  (2, 'CTR-2025-002', 'Grand Opening Toko Online', 'Strategi peluncuran toko online baru', '2025-04-01', '2025-05-31', 15000000, 'active', 1, 2),
  (3, 'CTR-2025-003', 'Product Launch TI-2025', 'Kampanye peluncuran produk teknologi baru', '2025-05-01', '2025-06-30', 35000000, 'active', 1, 2),
  (4, 'CTR-2025-004', 'Summer Collection 2025', 'Kampanye koleksi musim panas', '2025-06-01', '2025-08-31', 45000000, 'active', 1, 2),
  (5, 'CTR-2025-005', 'Batik Excellence Campaign', 'Kampanye internasional produk batik', '2025-04-15', '2025-12-31', 60000000, 'active', 1, 2)
ON CONFLICT DO NOTHING;

-- Contract platforms
INSERT INTO core.contracts_platforms (contract_id, platform_id) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2),
  (3, 1), (3, 2), (3, 3),
  (4, 1), (4, 2),
  (5, 1), (5, 2), (5, 3)
ON CONFLICT DO NOTHING;

-- Contract teams
INSERT INTO core.contract_teams (contract_id, user_id) VALUES
  (1, 3), (1, 4), (1, 5), (1, 6),
  (2, 3), (2, 4), (2, 5),
  (3, 3), (3, 4), (3, 5), (3, 6),
  (4, 3), (4, 4), (4, 5),
  (5, 3), (5, 4), (5, 5), (5, 6)
ON CONFLICT DO NOTHING;

-- Contents (platform_id=1=Instagram, 2=TikTok, 3=YouTube; content_category_id=1=BTS,2=tutorial,3=product_demo,4=challenge,5=review; pillar_id=1=Entertainment,2=Education,3=Lifestyle,4=Promotion)
INSERT INTO core.contents (contract_id, platform_id, content_category_id, pillar_id, title, content_url, objective, target_audience, description, due_date, priority, status) VALUES
  (1, 2, 2, 2, 'Tips Produktif di Bulan Ramadan', 'https://drive.google.com/file/d/ramadan-tips-1', 'Mengedukasi audiens tentang produktivitas selama Ramadan', 'Pekerja muda 20-35 tahun', 'Tingkatkan produktivitas Anda selama Ramadan! #Ramadan2025', '2025-03-08 09:00:00', 'high', 'draft'),
  (1, 1, 2, 4, 'Promo Spesial Ramadan - Diskon 50%', 'https://drive.google.com/file/d/ramadan-promo-50', 'Meningkatkan penjualan selama Ramadan', 'Pelanggan existing dan new leads', 'Diskon hingga 50% selama Ramadan!', '2025-03-07 10:00:00', 'high', 'approved'),
  (1, 2, 4, 1, 'Flash Sale Malam Ramadan Pertama', 'https://drive.google.com/file/d/ramadan-flash-sale', 'Menciptakan urgency untuk flash sale', 'Pengguna TikTok aktif', 'Flash sale eksklusif 3 jam!', '2025-03-02 20:00:00', 'high', 'published'),
  (2, 1, 1, 3, 'Teaser: Toko Online Berkah Segera Hadir', 'https://drive.google.com/file/d/teaser-grand-opening', 'Membangun anticipation peluncuran toko', 'Pembeli online Indonesia', 'Toko Online Berkah segera hadir', '2025-04-05 09:00:00', 'medium', 'draft'),
  (3, 3, 3, 6, 'Pengenalan Fitur Unggulan Produk Baru', 'https://drive.google.com/file/d/product-launch-demo', 'Mendemonstrasikan fitur produk baru', 'Tech enthusiast & early adopter', '5 fitur unggulan produk terbaru', '2025-05-08 09:00:00', 'high', 'draft'),
  (4, 1, 5, 3, 'Koleksi Musim Panas: Inspirasi Gaya Anda', 'https://drive.google.com/file/d/summer-collection-1', 'Menginspirasi pembelian koleksi musim panas', 'Wanita 18-35 tahun', 'Koleksi musim panas eksklusif', '2025-06-15 09:00:00', 'medium', 'draft'),
  (5, 2, 1, 1, 'Keindahan Batik Tradisional Kita', 'https://drive.google.com/file/d/batik-excellence-1', 'Melestarikan dan mempromosikan batik', 'Masyarakat umum & wisatawan', 'Lestarikan batik tradisional Indonesia', '2025-05-01 09:00:00', 'medium', 'draft')
ON CONFLICT DO NOTHING;

-- Tasks (assigned_to=5=Script Writer, 4=Content Editor, 6=Admin Sosmed)
INSERT INTO core.tasks (content_id, assigned_to, title, description, deadline, status) VALUES
  (1, 5, 'Buat 10 script reels edukasi', 'Script untuk 10 video reels tips produktif Ramadan', '2025-03-10', 'on_progress'),
  (1, 4, 'Desain 5 carousel posts', 'Desain carousel tips dan promo', '2025-03-15', 'to_do'),
  (3, 6, 'Rekam & edit 5 video TikTok', 'Produksi konten video pendek untuk flash sale', '2025-03-05', 'published'),
  (4, 4, 'Buat teaser campaign graphics', 'Design 8 teaser image dengan countdown', '2025-04-05', 'to_do'),
  (5, 5, 'Buat demo video produk', 'Video demonstrasi fitur utama', '2025-05-10', 'to_do'),
  (6, 6, 'Photoshoot koleksi musim panas', 'Sesi pemotretan 20 produk', '2025-06-08', 'to_do'),
  (7, 5, 'Dokumentasi proses batik tradisional', 'Video behind the scenes pembuatan batik', '2025-05-01', 'to_do')
ON CONFLICT DO NOTHING;

-- Task outputs
INSERT INTO core.task_outputs (task_id, caption, hashtag, file_url, version) VALUES
  (1, 'Draft script reel #1-3: Tips produktif selama puasa', '#Ramadan2025 #Produktif #Tips', 'https://drive.google.com/file/d/script-draft-1', 1),
  (3, 'Video TikTok final - Flash Sale Ramadan', '#FlashSale #Ramadan #Diskon', 'https://drive.google.com/file/d/tiktok-final-1', 2)
ON CONFLICT DO NOTHING;

-- Task comments
INSERT INTO core.task_comments (task_id, user_id, message) VALUES
  (1, 3, 'Script masih perlu penyesuaian tone, tolong lebih casual'),
  (1, 5, 'Baik, saya revisi script sesuai feedback'),
  (3, 3, 'Video sudah approved, siap publish')
ON CONFLICT DO NOTHING;

-- Content reviews
INSERT INTO core.content_reviews (content_id, reviewer_id, feedback) VALUES
  (1, 3, 'Konten masih perlu penyesuaian objective dan target audience'),
  (2, 3, 'Konten sudah sesuai brief dan siap publish')
ON CONFLICT DO NOTHING;

-- Update published content timestamp
UPDATE core.contents SET published_at = now() WHERE id = 3;

-- Analytics engagements
INSERT INTO analytics.engagements (content_id, likes, views, comments, shares) VALUES
  (3, 1250, 15000, 85, 42),
  (2, 850, 8500, 35, 20),
  (1, 920, 12000, 60, 30)
ON CONFLICT DO NOTHING;

-- Portfolio items
INSERT INTO public.portfolio_items (content_id, is_featured, display_order) VALUES
  (3, true, 1),
  (2, true, 2),
  (1, false, 3)
ON CONFLICT DO NOTHING;

-- Update published content timestamp
UPDATE core.contents SET published_at = now() WHERE id = 3;
