export interface BookItem {
  userId: string
  bookId: string
  createdAt: string
  title: string
  author: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}
