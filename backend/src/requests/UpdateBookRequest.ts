/**
 * Fields in a request to update a single TODO item.
 */
export interface UpdateBookRequest {
  title: string
  author: string
  dueDate: string
  done: boolean
}