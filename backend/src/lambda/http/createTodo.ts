import 'source-map-support/register'

import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { parseUserId } from '../../auth/utils'
import { createTodo } from '../../businessLogic/todos'


export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)    
    
    try {
        const todoItem = await createTodo(userId, newTodo.name, newTodo.dueDate)

        return {
            statusCode: 201,
            body: JSON.stringify({
                item: {            
                    todoId: todoItem.todoId,
                    createdAt: todoItem.createdAt,
                    name: todoItem.name,
                    dueDate: todoItem.dueDate,
                    done: todoItem.done,            
                    attachmentUrl: todoItem.attachmentUrl
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