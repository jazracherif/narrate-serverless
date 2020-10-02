import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { generateAndUploadLibraryUrl } from '../../businessLogic/books'
  
export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event)

  try {
    const url = await generateAndUploadLibraryUrl(userId)
    
    return {
        statusCode: 201,
        body: JSON.stringify({uploadUrl: url})
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