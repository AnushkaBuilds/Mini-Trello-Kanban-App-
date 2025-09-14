import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { getConfig } from './env';

export function setupSwagger(app: Express): void {
  const config = getConfig();

  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Mini Trello API',
      version: '1.0.0',
      description: 'A comprehensive API for a Trello-like Kanban board application',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
          required: ['success', 'error'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clh123456789' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            avatar: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'name'],
        },
        Board: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clh123456789' },
            title: { type: 'string', example: 'My Project' },
            description: { type: 'string', example: 'Project board for tracking tasks' },
            ownerId: { type: 'string', example: 'clh123456789' },
            workspaceId: { type: 'string', example: 'clh123456789' },
            background: { type: 'string', example: '#0079BF' },
            isPublic: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'ownerId'],
        },
        List: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clh123456789' },
            title: { type: 'string', example: 'To Do' },
            position: { type: 'number', example: 1 },
            boardId: { type: 'string', example: 'clh123456789' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'position', 'boardId'],
        },
        Card: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clh123456789' },
            title: { type: 'string', example: 'Complete project setup' },
            description: { type: 'string', example: 'Set up the initial project structure' },
            position: { type: 'number', example: 1 },
            listId: { type: 'string', example: 'clh123456789' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'position', 'listId'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  const options = {
    definition: swaggerDefinition,
    apis: ['./src/routes/**/*.ts'], // Path to the API files
  };

  const swaggerSpec = swaggerJSDoc(options);

  // Swagger JSON endpoint
  app.get('/api/v1/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI endpoint
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mini Trello API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));

  console.log(`📚 API Documentation available at http://localhost:${config.PORT}/api/v1/docs`);
}
