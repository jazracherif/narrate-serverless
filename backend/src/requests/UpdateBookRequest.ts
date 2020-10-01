/**
 * Fields in a request to update a single TODO item.
 */
export interface UpdateBookRequest {
  title: string
  author: string
  rating: number
  done: boolean
  review: string
}