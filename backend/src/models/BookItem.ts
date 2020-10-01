export interface BookItem {
  userId: string
  bookId: string
  createdAt: string
  title: string
  author: string
  rating: number
  done: boolean
  attachmentUrl?: string
  review: string
}
