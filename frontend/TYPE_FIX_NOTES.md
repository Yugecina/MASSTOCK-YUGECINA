# Type Fix Notes

## Issue Identified
The axios interceptor at `api.ts:38` does `(response: AxiosResponse) => response.data`, which automatically unwraps ALL responses.

This means:
- Backend sends: `{ success: true, data: {...} }`
- Axios interceptor returns: The full response object (which is already `{ success: true, data: {...} }`)
- Services receive: `{ success: true, data: {...} }` directly, NOT wrapped again

## Solution
Services should return `Promise<any>` or specific unwrapped types, not `Promise<ApiResponse<T>>`.

The `ApiResponse<T>` type is only used for defining the shape of what the backend sends, but after the interceptor, we get that shape directly.

## Pattern
```typescript
// WRONG (double wrapping)
getUsers: (): Promise<ApiResponse<User[]>> => api.get('/users')

// CORRECT (single layer - already unwrapped by interceptor)
getUsers: (): Promise<any> => api.get('/users')
// Or if we know the exact backend response shape:
getUsers: (): Promise<{ success: boolean; data: User[] }> => api.get('/users')
```
