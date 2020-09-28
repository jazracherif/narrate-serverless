import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({signatureVersion: 'v4'})

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly toDoTable = process.env.TODO_TABLE,
    private readonly toDoIndexTable = process.env.USER_ID_INDEX,
    private readonly urlExpiration = process.env.URL_EXPIRATION,
    private readonly imagesS3Bucket = process.env.IMAGES_S3_BUCKET

    ) { }

  async getUserTodos(userId: String): Promise<TodoItem[]> {
    console.log('Getting all Todos for user', userId)

    const result = await this.docClient.query({
        TableName: this.toDoTable,
        IndexName: this.toDoIndexTable,
        ProjectionExpression: "todoId, createdAt, #na, dueDate, done, attachmentUrl",
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false,
        ExpressionAttributeNames: {
            "#na": "name"
        }
    }).promise()


    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    console.log('Create Todo Item ', todoItem)

    await this.docClient.put({
        TableName: this.toDoTable,
        Item: todoItem
        }).promise()

    return todoItem
    }

    async updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate){
        console.log('Update Todo Item ', todoId, todoUpdate)

        const param = {
            TableName: this.toDoTable,
            Key: { 
                "todoId": todoId, 
                "userId": userId 
            },
            UpdateExpression: "set #na = :todoName, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
                ":todoName": todoUpdate.name,
                ":dueDate": todoUpdate.dueDate,
                ":done": todoUpdate.done
            },
            ExpressionAttributeNames: {
                "#na": "name"
            },
            ReturnValues: "UPDATED_NEW"
        }

        return await this.docClient.update(param).promise()
    }

    async updateTodoUrl(todoId: string, userId: string){
        const attachmentUrl = `https://${this.imagesS3Bucket}.s3.amazonaws.com/${todoId}`
    
        console.log('Update Todo Url ', todoId, userId, attachmentUrl)

        const param = {
            TableName: this.toDoTable,
            Key: { 
                "todoId": todoId, 
                "userId": userId 
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": attachmentUrl,
            },
            ReturnValues: "UPDATED_NEW"
        }

        return await this.docClient.update(param).promise()
    }

    async deleteTodo(todoId: string, userId: string){
        console.log('Delete Todo Item ', todoId)

        return await this.docClient.delete({
            TableName: this.toDoTable,
            Key: { 
                "todoId": todoId, 
                "userId": userId 
            },
            }).promise()
    }

    getSignedUrl(todoId: string){
        console.log('Get Signed URL for Todo Item ', todoId)

        return s3.getSignedUrl('putObject', {
                    Bucket: this.imagesS3Bucket,
                    Key: todoId,
                    Expires: Number(this.urlExpiration)
                    })
                }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
