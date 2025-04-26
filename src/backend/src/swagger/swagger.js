const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MechBuild API',
      version: '1.0.0',
      description: 'API documentation for MechBuild application',
      contact: {
        name: 'API Support',
        email: 'support@mechbuild.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001/api/v1',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 