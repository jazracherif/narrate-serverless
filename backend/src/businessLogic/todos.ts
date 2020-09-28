import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { TodoAccess } from '../dataLayer/todoAccess'

const todoAccess = new TodoAccess()

export async function getUserTodos(userId: string): Promise<TodoItem[]> {
    return todoAccess.getUserTodos(userId)
  }
  
export async function updateTodo(todoId: string, userId: string, todoUpdate: TodoUpdate) {
    return todoAccess.updateTodo(todoId, userId, todoUpdate)
  }

export async function deleteTodo(todoId: string, userId: string) {
    return todoAccess.deleteTodo(todoId, userId)
  }

export async function generateAndUploadUrl(todoId: string, userId: string) {
    const url = todoAccess.getSignedUrl(todoId)

    await todoAccess.updateTodoUrl(todoId, userId)

    return url
}


export async function createTodo(userId: string, name: string, dueDate: string): Promise<TodoItem>{

    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()

    const todoItem: TodoItem = {
        userId: userId,
        todoId: todoId,
        createdAt: createdAt,
        name: name,
        dueDate: dueDate,
        done: false,
        attachmentUrl: ''
    }

    return todoAccess.createTodo(todoItem)
}
