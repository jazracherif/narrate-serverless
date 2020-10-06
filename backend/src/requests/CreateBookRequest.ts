/**
 * Fields in a request to create a single Book item.
 */
export interface CreateBookRequest {
  title: string
  author: string
  rating: number
  review: string
}
