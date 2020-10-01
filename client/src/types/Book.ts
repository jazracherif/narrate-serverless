export interface Book {
  bookId: string
  createdAt: string
  title: string
  author: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}
