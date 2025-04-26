# MechBuild Backend

A robust backend service for the MechBuild application, providing authentication, chat, and file upload functionality.

## Features

- RESTful API with Express.js
- MongoDB database integration
- JWT authentication
- Real-time chat with Socket.IO
- File upload handling
- Swagger API documentation
- Comprehensive test coverage
- Rate limiting and security features

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mechbuild.git
cd mechbuild/src/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration.

## Development

Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3001` with hot-reload enabled.

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## Testing

Run tests:
```bash
npm test
```

Generate coverage report:
```bash
npm run test:coverage
```

## API Documentation

Access the Swagger documentation at:
```
http://localhost:3001/api-docs
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── models/         # Mongoose models
├── routes/         # API routes
├── socket/         # Socket.IO handlers
├── tests/          # Test files
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

## Security Features

- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- XSS protection
- HPP protection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 