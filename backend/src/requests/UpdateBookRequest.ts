/**
 * Fields in a request to update a single Book item.
 */
export interface UpdateBookRequest {
  title: string
  author: string
  rating: number
  done: boolean
  review: string
}