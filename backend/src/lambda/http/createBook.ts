import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateBookRequest } from '../../requests/CreateBookRequest'
import { parseUserId } from '../../auth/utils'
import { createBook } from '../../businessLogic/books'


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newBook: CreateBookRequest = JSON.parse(event.body)
    const userId = getUserId(event)    
    
    try {
        const bookItem = await createBook(userId,
                                          newBook.title,
                                          newBook.author, 
                                          newBook.rating,
                                          newBook.review)

        return {
            statusCode: 201,
            body: JSON.stringify({
                item: {            
                    bookId: bookItem.bookId,
                    createdAt: bookItem.createdAt,
                    title: bookItem.title,
                    author: bookItem.author,
                    rating: bookItem.rating,
                    done: bookItem.done,            
                    attachmentUrl: bookItem.attachmentUrl,
                    review: bookItem.review
                    }
                })
        }
    } catch(e) {
        console.log(e)

        return {
            statusCode: 400,            
            body: ''
          }
     
    }
     
})


handler.use(
    cors({
      credentials: true
    })
  )


function getUserId(event): string {
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const userId = parseUserId(jwtToken)
    console.log("userId", userId)

    return userId
}