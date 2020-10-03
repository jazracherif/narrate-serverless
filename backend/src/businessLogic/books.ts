import * as uuid from 'uuid'

import { BookItem } from '../models/BookItem'
import { BookUpdate } from '../models/BookUpdate'
import { BookAccess } from '../dataLayer/BookAccess'

const bookAccess = new BookAccess()

export async function getUserBooks(userId: string): Promise<BookItem[]> {
    return bookAccess.getUserBooks(userId)
  }
  
export async function updateBook(bookId: string, userId: string, bookUpdate: BookUpdate) {
    return bookAccess.updateBook(bookId, userId, bookUpdate)
  }

export async function deleteBook(bookId: string, userId: string) {
    return bookAccess.deleteBook(bookId, userId)
  }

export async function generateAndUploadUrl(bookId: string, userId: string) {
    const url = bookAccess.getSignedUrl(bookId)

    await bookAccess.updateBookUrl(bookId, userId)

    return url
}

export async function generateAndUploadLibraryUrl(userId: string) {
    const url = bookAccess.getSignedLibraryUrl(userId)
    return url
}


export async function createBook(userId: string,
                                 title: string, 
                                 author: string,
                                 rating: number,
                                 review: string,
                                 done: boolean): Promise<BookItem>{

    const bookId = uuid.v4()
    const createdAt = new Date().toISOString()

    const bookItem: BookItem = {
        userId: userId,
        bookId: bookId,
        createdAt: createdAt,
        title: title,
        author: author,
        rating: rating,
        done: done,
        attachmentUrl: '',
        review: review
    }

    return bookAccess.createBook(bookItem)
}
