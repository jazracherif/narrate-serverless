import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { parseUserId } from '../../auth/utils'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo } from '../../businessLogic/todos'


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

    try {
        await updateTodo(todoId, userId, updatedTodo)

        return {
            statusCode: 200,
            body: ''
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