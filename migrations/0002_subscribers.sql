-- Newsletter subscribers. Applied to D1 `thetrendtimes` on 2026-11-05.
CREATE TABLE IF NOT EXISTS subscribers (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT UNIQUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	source TEXT DEFAULT 'web'
);
