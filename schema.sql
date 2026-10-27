-- Generated from app/models.py (PostgreSQL). The backend also creates these tables on startup.

CREATE TABLE conversations (
	id SERIAL NOT NULL, 
	pair_key VARCHAR(64), 
	is_group BOOLEAN NOT NULL, 
	title VARCHAR(120), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (pair_key)
);

CREATE TABLE users (
	id SERIAL NOT NULL, 
	username VARCHAR(32) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	display_name VARCHAR(80) NOT NULL, 
	profile_image VARCHAR(255), 
	bio VARCHAR(280) NOT NULL, 
	is_online BOOLEAN NOT NULL, 
	last_seen TIMESTAMP WITH TIME ZONE, 
	show_online_status BOOLEAN NOT NULL, 
	show_last_seen BOOLEAN NOT NULL, 
	read_receipts BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_username ON users (username);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE attachments (
	id SERIAL NOT NULL, 
	filename VARCHAR(160) NOT NULL, 
	stored_name VARCHAR(80) NOT NULL, 
	file_size INTEGER NOT NULL, 
	mime_type VARCHAR(120) NOT NULL, 
	sender_id INTEGER NOT NULL, 
	receiver_id INTEGER NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(sender_id) REFERENCES users (id), 
	FOREIGN KEY(receiver_id) REFERENCES users (id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id)
);

CREATE INDEX ix_attachments_conversation_id ON attachments (conversation_id);

CREATE INDEX ix_attachments_sender_id ON attachments (sender_id);

CREATE INDEX ix_attachments_receiver_id ON attachments (receiver_id);

CREATE TABLE conversation_members (
	id SERIAL NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	joined_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_member UNIQUE (conversation_id, user_id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_conversation_members_user_id ON conversation_members (user_id);

CREATE INDEX ix_conversation_members_conversation_id ON conversation_members (conversation_id);

CREATE TABLE refresh_sessions (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	token_hash VARCHAR(64) NOT NULL, 
	user_agent VARCHAR(255) NOT NULL, 
	ip VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	last_used_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	expires_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	revoked BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_refresh_sessions_token_hash ON refresh_sessions (token_hash);

CREATE INDEX ix_refresh_sessions_user_id ON refresh_sessions (user_id);

CREATE TABLE messages (
	id SERIAL NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	sender_id INTEGER NOT NULL, 
	receiver_id INTEGER NOT NULL, 
	client_id VARCHAR(64), 
	content TEXT NOT NULL, 
	message_type VARCHAR(16) NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	attachment_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	delivered_at TIMESTAMP WITH TIME ZONE, 
	read_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_message_client_id UNIQUE (sender_id, client_id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
	FOREIGN KEY(sender_id) REFERENCES users (id), 
	FOREIGN KEY(receiver_id) REFERENCES users (id), 
	FOREIGN KEY(attachment_id) REFERENCES attachments (id)
);

CREATE INDEX ix_messages_recv_status ON messages (receiver_id, status);

CREATE INDEX ix_messages_conv_id ON messages (conversation_id, id);
