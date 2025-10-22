Users table:
id: UUID (primary key)
email: string (unique, not null)
password: string (not null)
created_at: timestamp (default now)
is_active: boolean