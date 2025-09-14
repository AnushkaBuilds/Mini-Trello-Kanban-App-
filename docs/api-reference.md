# API Reference

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-backend-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Validation failed
- `409` - User already exists
- `500` - Internal server error

### Login User
**POST** `/auth/login`

Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Codes:**
- `200` - Login successful
- `400` - Validation failed
- `401` - Invalid credentials
- `500` - Internal server error

### Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": null
    }
  }
}
```

**Status Codes:**
- `200` - User found
- `401` - Invalid or missing token
- `404` - User not found

## Workspace Endpoints

### Get User Workspaces
**GET** `/workspaces`

Get all workspaces accessible to the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "workspace123",
        "name": "Acme Corp",
        "description": "Main workspace for Acme Corporation",
        "created_at": "2023-01-01T00:00:00.000Z",
        "updated_at": "2023-01-01T00:00:00.000Z",
        "owner": {
          "id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "members": [
          {
            "id": "member123",
            "role": "owner",
            "user": {
              "id": "user123",
              "name": "John Doe",
              "email": "john@example.com"
            }
          }
        ],
        "boards": [
          {
            "id": "board123",
            "title": "Product Development"
          }
        ]
      }
    ]
  }
}
```

### Create Workspace
**POST** `/workspaces`

Create a new workspace.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Description of the workspace"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "workspace123",
      "name": "New Workspace",
      "description": "Description of the workspace",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "owner": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": "member123",
          "role": "owner",
          "user": {
            "id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      ]
    }
  }
}
```

### Get Workspace by ID
**GET** `/workspaces/:id`

Get detailed information about a specific workspace.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "workspace123",
      "name": "Acme Corp",
      "description": "Main workspace for Acme Corporation",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "owner": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": "member123",
          "role": "owner",
          "user": {
            "id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      ],
      "boards": [
        {
          "id": "board123",
          "title": "Product Development",
          "description": "Main board for product development",
          "visibility": "workspace",
          "position": 1000,
          "created_at": "2023-01-01T00:00:00.000Z",
          "updated_at": "2023-01-01T00:00:00.000Z",
          "owner": {
            "id": "user123",
            "name": "John Doe"
          },
          "members": [
            {
              "id": "member123",
              "role": "owner",
              "user": {
                "id": "user123",
                "name": "John Doe"
              }
            }
          ]
        }
      ]
    }
  }
}
```

## Board Endpoints

### Get User Boards
**GET** `/boards`

Get all boards accessible to the current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "boards": [
      {
        "id": "board123",
        "title": "Product Development",
        "description": "Main board for product development",
        "visibility": "workspace",
        "position": 1000,
        "created_at": "2023-01-01T00:00:00.000Z",
        "updated_at": "2023-01-01T00:00:00.000Z",
        "owner": {
          "id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "workspace": {
          "id": "workspace123",
          "name": "Acme Corp"
        },
        "members": [
          {
            "id": "member123",
            "role": "owner",
            "user": {
              "id": "user123",
              "name": "John Doe"
            }
          }
        ],
        "lists": [
          {
            "id": "list123",
            "title": "To Do",
            "position": 1000,
            "cards": [
              {
                "id": "card123",
                "title": "Implement authentication",
                "position": 1000,
                "labels": [
                  {
                    "id": "label123",
                    "label": {
                      "id": "label123",
                      "name": "Feature",
                      "color": "#2ecc71"
                    }
                  }
                ],
                "assignments": [
                  {
                    "id": "assignment123",
                    "user": {
                      "id": "user123",
                      "name": "John Doe"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Create Board
**POST** `/boards`

Create a new board.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Board",
  "description": "Description of the board",
  "visibility": "private",
  "workspace_id": "workspace123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": {
      "id": "board123",
      "title": "New Board",
      "description": "Description of the board",
      "visibility": "private",
      "position": 1000,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "owner": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "workspace": {
        "id": "workspace123",
        "name": "Acme Corp"
      }
    }
  }
}
```

### Get Board by ID
**GET** `/boards/:id`

Get detailed information about a specific board including all lists and cards.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "board": {
      "id": "board123",
      "title": "Product Development",
      "description": "Main board for product development",
      "visibility": "workspace",
      "position": 1000,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "owner": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "workspace": {
        "id": "workspace123",
        "name": "Acme Corp"
      },
      "members": [
        {
          "id": "member123",
          "role": "owner",
          "user": {
            "id": "user123",
            "name": "John Doe"
          }
        }
      ],
      "lists": [
        {
          "id": "list123",
          "title": "To Do",
          "position": 1000,
          "created_at": "2023-01-01T00:00:00.000Z",
          "updated_at": "2023-01-01T00:00:00.000Z",
          "cards": [
            {
              "id": "card123",
              "title": "Implement authentication",
              "description": "Set up JWT-based authentication system",
              "position": 1000,
              "due_date": "2023-01-15T00:00:00.000Z",
              "created_at": "2023-01-01T00:00:00.000Z",
              "updated_at": "2023-01-01T00:00:00.000Z",
              "labels": [
                {
                  "id": "label123",
                  "label": {
                    "id": "label123",
                    "name": "Feature",
                    "color": "#2ecc71"
                  }
                }
              ],
              "assignments": [
                {
                  "id": "assignment123",
                  "user": {
                    "id": "user123",
                    "name": "John Doe"
                  }
                }
              ],
              "comments": [
                {
                  "id": "comment123",
                  "text": "This looks good!",
                  "created_at": "2023-01-01T00:00:00.000Z",
                  "author": {
                    "id": "user123",
                    "name": "John Doe"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Search Cards in Board
**GET** `/boards/:id/search`

Search for cards within a specific board.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string, optional): Search query for title and description
- `label` (string, optional): Filter by label name
- `assignee` (string, optional): Filter by assignee name
- `dueDate` (string, optional): Filter by due date (YYYY-MM-DD format)

**Example Request:**
```
GET /boards/board123/search?q=authentication&label=Feature&assignee=John
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "card123",
        "title": "Implement authentication",
        "description": "Set up JWT-based authentication system",
        "due_date": "2023-01-15T00:00:00.000Z",
        "list": {
          "id": "list123",
          "title": "To Do"
        },
        "labels": [
          {
            "id": "label123",
            "label": {
              "id": "label123",
              "name": "Feature",
              "color": "#2ecc71"
            }
          }
        ],
        "assignments": [
          {
            "id": "assignment123",
            "user": {
              "id": "user123",
              "name": "John Doe"
            }
          }
        ]
      }
    ]
  }
}
```

## List Endpoints

### Create List
**POST** `/lists`

Create a new list within a board.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New List",
  "board_id": "board123",
  "position": 2000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "list": {
      "id": "list123",
      "title": "New List",
      "position": 2000,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "cards": []
    }
  }
}
```

### Update List
**PUT** `/lists/:id`

Update an existing list.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated List Title",
  "position": 1500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "list": {
      "id": "list123",
      "title": "Updated List Title",
      "position": 1500,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "cards": []
    }
  }
}
```

### Reorder Lists
**PUT** `/lists/reorder`

Reorder multiple lists within a board.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "list_ids": ["list1", "list2", "list3"],
  "board_id": "board123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lists reordered successfully"
}
```

## Card Endpoints

### Create Card
**POST** `/cards`

Create a new card within a list.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Card",
  "description": "Description of the card",
  "list_id": "list123",
  "position": 1000,
  "due_date": "2023-01-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "card123",
      "title": "New Card",
      "description": "Description of the card",
      "position": 1000,
      "due_date": "2023-01-15T00:00:00.000Z",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "list": {
        "id": "list123",
        "title": "To Do"
      },
      "labels": [],
      "assignments": [],
      "comments": []
    }
  }
}
```

### Get Card by ID
**GET** `/cards/:id`

Get detailed information about a specific card.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "card123",
      "title": "Implement authentication",
      "description": "Set up JWT-based authentication system",
      "position": 1000,
      "due_date": "2023-01-15T00:00:00.000Z",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "list": {
        "id": "list123",
        "title": "To Do"
      },
      "labels": [
        {
          "id": "label123",
          "label": {
            "id": "label123",
            "name": "Feature",
            "color": "#2ecc71"
          }
        }
      ],
      "assignments": [
        {
          "id": "assignment123",
          "user": {
            "id": "user123",
            "name": "John Doe"
          }
        }
      ],
      "comments": [
        {
          "id": "comment123",
          "text": "This looks good!",
          "created_at": "2023-01-01T00:00:00.000Z",
          "author": {
            "id": "user123",
            "name": "John Doe"
          }
        }
      ]
    }
  }
}
```

### Move Card
**PUT** `/cards/:id/move`

Move a card to a different list or position.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "list_id": "list456",
  "position": 1500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "card123",
      "title": "Implement authentication",
      "position": 1500,
      "list_id": "list456",
      "list": {
        "id": "list456",
        "title": "In Progress"
      }
    }
  }
}
```

### Add Label to Card
**POST** `/cards/:id/labels`

Add a label to a card.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "label_id": "label123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Label added to card"
}
```

### Remove Label from Card
**DELETE** `/cards/:id/labels/:labelId`

Remove a label from a card.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Label removed from card"
}
```

### Assign User to Card
**POST** `/cards/:id/assignments`

Assign a user to a card.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_id": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User assigned to card"
}
```

### Remove User Assignment from Card
**DELETE** `/cards/:id/assignments/:userId`

Remove a user assignment from a card.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User assignment removed from card"
}
```

## Comment Endpoints

### Create Comment
**POST** `/comments`

Add a comment to a card.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "This is a comment",
  "card_id": "card123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment123",
      "text": "This is a comment",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "author": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

### Update Comment
**PUT** `/comments/:id`

Update an existing comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "text": "Updated comment text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment123",
      "text": "Updated comment text",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z",
      "author": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

### Delete Comment
**DELETE** `/comments/:id`

Delete a comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

## Activity Endpoints

### Get Board Activities
**GET** `/activities/board/:boardId`

Get activity log for a specific board.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional): Number of activities to return (default: 20)
- `offset` (number, optional): Number of activities to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity123",
        "type": "card_created",
        "data": {
          "cardId": "card123",
          "cardTitle": "Implement authentication"
        },
        "created_at": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "card": {
          "id": "card123",
          "title": "Implement authentication"
        }
      }
    ]
  }
}
```

### Get Card Activities
**GET** `/activities/card/:cardId`

Get activity log for a specific card.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (number, optional): Number of activities to return (default: 20)
- `offset` (number, optional): Number of activities to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity123",
        "type": "card_updated",
        "data": {
          "cardId": "card123",
          "changes": {
            "title": "Updated card title"
          }
        },
        "created_at": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "card": {
          "id": "card123",
          "title": "Updated card title"
        }
      }
    ]
  }
}
```

## User Endpoints

### Get User Profile
**GET** `/users/profile`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": null,
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update User Profile
**PUT** `/users/profile`

Update current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Smith",
      "avatar": "https://example.com/avatar.jpg",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Search Users
**GET** `/users/search`

Search for users by name or email.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": null
      }
    ]
  }
}
```

## WebSocket Events

### Connection
Connect to the WebSocket server:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Join Board Room
```javascript
socket.emit('join-board', 'board123');
```

### Leave Board Room
```javascript
socket.emit('leave-board', 'board123');
```

### Listen for Events

#### Card Moved
```javascript
socket.on('card-moved', (data) => {
  console.log('Card moved:', data);
  // data: { cardId, boardId, fromListId, toListId, position, movedBy }
});
```

#### Card Updated
```javascript
socket.on('card-updated', (data) => {
  console.log('Card updated:', data);
  // data: { cardId, boardId, updates, updatedBy }
});
```

#### Comment Added
```javascript
socket.on('comment-added', (data) => {
  console.log('Comment added:', data);
  // data: { cardId, boardId, comment, addedBy }
});
```

#### List Updated
```javascript
socket.on('list-updated', (data) => {
  console.log('List updated:', data);
  // data: { listId, boardId, updates, updatedBy }
});
```

#### Lists Reordered
```javascript
socket.on('lists-reordered', (data) => {
  console.log('Lists reordered:', data);
  // data: { boardId, listIds, reorderedBy }
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Request limit per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page-Size`: Number of items per page
- `X-Page-Offset`: Current offset

## Health Check

### API Health
**GET** `/health`

Check API server health.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize API client
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create a board
const createBoard = async (boardData: any) => {
  const response = await api.post('/boards', boardData);
  return response.data;
};

// Get boards
const getBoards = async () => {
  const response = await api.get('/boards');
  return response.data.data.boards;
};

// Move a card
const moveCard = async (cardId: string, listId: string, position: number) => {
  const response = await api.put(`/cards/${cardId}/move`, {
    list_id: listId,
    position
  });
  return response.data;
};
```

### Python

```python
import requests

class TrelloAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def create_board(self, title, description=None, visibility='private'):
        data = {'title': title, 'description': description, 'visibility': visibility}
        response = requests.post(f'{self.base_url}/boards', json=data, headers=self.headers)
        return response.json()
    
    def get_boards(self):
        response = requests.get(f'{self.base_url}/boards', headers=self.headers)
        return response.json()['data']['boards']
    
    def move_card(self, card_id, list_id, position):
        data = {'list_id': list_id, 'position': position}
        response = requests.put(f'{self.base_url}/cards/{card_id}/move', json=data, headers=self.headers)
        return response.json()
```

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- Board, list, and card management
- Real-time WebSocket support
- Search and filtering capabilities
- Activity logging
- User management
