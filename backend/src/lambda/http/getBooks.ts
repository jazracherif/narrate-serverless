import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { parseUserId } from '../../auth/utils'
import { getUserBooks } from '../../businessLogic/books'


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event)

    try {
        const items = await getUserBooks(userId)

        return {
                statusCode: 200,
                body: JSON.stringify({
                            items: items
                        })
            }
    } catch(e) {
        console.log(e)

        return {
            statusCode: 400,
            body: JSON.stringify({
                items: []
            })
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