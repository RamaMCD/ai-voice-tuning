const request = require('supertest');
const express = require('express');

// Set test environment before requiring app
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Mock logger to avoid file writes during tests
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

describe('Server Setup Tests', () => {
  let app;

  beforeAll(() => {
    app = require('../../src/server');
  });

  describe('Server Initialization', () => {
    test('should initialize Express app successfully', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    test('should respond to health check endpoint', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Middleware Configuration', () => {
    test('should have JSON parsing middleware configured', () => {
      // Test that the app has the json middleware by checking the stack
      const jsonMiddleware = app._router.stack.find(
        layer => layer.name === 'jsonParser'
      );
      expect(jsonMiddleware).toBeDefined();
    });

    test('should have static file middleware configured', () => {
      // Test that the app has the static middleware
      const staticMiddleware = app._router.stack.find(
        layer => layer.name === 'serveStatic'
      );
      expect(staticMiddleware).toBeDefined();
    });

    test('should have URL-encoded middleware configured', () => {
      // Test that the app has the urlencoded middleware
      const urlencodedMiddleware = app._router.stack.find(
        layer => layer.name === 'urlencodedParser'
      );
      expect(urlencodedMiddleware).toBeDefined();
    });

    test('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent-route');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint tidak ditemukan');
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle 404 errors for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint tidak ditemukan');
    });

    test('should have error handler middleware configured', () => {
      // Check that error handler is the last middleware
      const errorHandler = app._router.stack[app._router.stack.length - 1];
      expect(errorHandler.handle.length).toBe(4); // Error handlers have 4 params
    });
  });

  describe('Error Handler Functionality', () => {
    const errorHandler = require('../../src/middleware/errorHandler');
    const logger = require('../../src/utils/logger');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle generic errors', () => {
      const err = new Error('Test error');
      const req = { url: '/test', method: 'GET' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error'
      });
    });

    test('should handle Multer LIMIT_FILE_SIZE errors', () => {
      const multer = require('multer');
      const err = new multer.MulterError('LIMIT_FILE_SIZE');
      const req = { url: '/upload', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File terlalu besar. Maksimal 10MB'
      });
    });

    test('should handle ValidationError', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      const req = { url: '/test', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed'
      });
    });

    test('should handle ENOENT errors', () => {
      const err = new Error('File not found');
      err.code = 'ENOENT';
      const req = { url: '/file', method: 'GET' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File tidak ditemukan'
      });
    });

    test('should handle ENOSPC errors', () => {
      const err = new Error('No space left');
      err.code = 'ENOSPC';
      const req = { url: '/upload', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(507);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server kehabisan storage'
      });
    });
  });
});
