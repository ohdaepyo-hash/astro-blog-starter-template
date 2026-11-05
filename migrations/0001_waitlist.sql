-- Applied to D1 `thetrendtimes` on 2026-11-05.
CREATE TABLE IF NOT EXISTS waitlist (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL,
	source TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	UNIQUE (email, source)
);
