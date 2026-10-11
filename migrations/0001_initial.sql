CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL DEFAULT 'その他', message TEXT NOT NULL, created_at TEXT NOT NULL);
INSERT OR IGNORE INTO site_content (key,value) VALUES
('hero_title','ふたりらしい、あたたかな一日を。'),
('hero_text','大切な人たちと、心から笑える結婚式。Elua Weddingが、ふたりの想いをかたちにします。'),
('concept_title','結婚式に、決まった正解はない。'),
('concept_text','好きなものも、大切にしたいことも、ふたりだけのもの。背伸びしすぎず、ふたりのペースで。'),
('contact_title','まずは、お話ししませんか。'),
('contact_email','');


CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '要相談',
  image_url TEXT NOT NULL DEFAULT '',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_published INTEGER NOT NULL DEFAULT 1
);
INSERT INTO plans (sort_order,title,category,description,price,image_url,is_published)
SELECT 1,'少人数ウェディング','INTIMATE','家族や親しい友人と、ゆっくり語らうあたたかな時間。','要相談','',1
WHERE NOT EXISTS (SELECT 1 FROM plans);
INSERT INTO plans (sort_order,title,category,description,price,image_url,is_published)
SELECT 2,'セレモニー＆パーティー','CEREMONY','ふたりらしい演出で、みんなの記憶に残る一日を。','要相談','',1
WHERE (SELECT COUNT(*) FROM plans)=1;
INSERT INTO plans (sort_order,title,category,description,price,image_url,is_published)
SELECT 3,'ウェディングフォト','PHOTO','自然な表情やふたりの空気感を、美しい写真に。','要相談','',1
WHERE (SELECT COUNT(*) FROM plans)=2;

INSERT OR IGNORE INTO site_content(key,value) VALUES ('site_name','Elua Wedding'),('hero_image_url',''),('contact_text','結婚式のこと、予算のこと、まだ漠然としたイメージでも。ふたりのペースで、お気軽にお問い合わせください。'),('instagram_url',''),('line_url',''),('phone',''),('address',''),('footer_text','ふたりらしい、あたたかなウェディングを。');
