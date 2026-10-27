export type Presence = 'online' | 'offline' | 'away'
export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface User {
  id: number
  username: string
  display_name: string
  profile_image: string | null
  bio: string
  status: Presence
  last_seen: string | null
  email?: string
  show_online_status?: boolean
  show_last_seen?: boolean
  read_receipts?: boolean
  is_admin?: boolean
  created_at?: string
}

export interface Attachment {
  id: number
  filename: string
  file_size: number
  mime_type: string
  is_image: boolean
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  receiver_id: number
  client_id?: string | null
  content: string
  message_type: 'text' | 'image' | 'file'
  status: MessageStatus
  created_at: string
  delivered_at: string | null
  read_at: string | null
  attachment: Attachment | null
  local?: 'pending' | 'failed'
  preview_url?: string
}

export interface Conversation {
  id: number
  other_user: User
  last_message: Message | null
  unread_count: number
  updated_at: string
}

export interface SearchedMessage extends Message {
  other_user_id: number
  other_name: string
}

export interface Session {
  id: number
  user_agent: string
  ip: string | null
  created_at: string
  last_used_at: string
}

export type ConnState = 'connecting' | 'connected' | 'reconnecting'
