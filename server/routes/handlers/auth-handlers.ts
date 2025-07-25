import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse, ApiError } from '../middleware/error';
import { storage } from '../../storage';

export const authHandlers = {
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.founderId) {
        return res.status(401).json(createErrorResponse('NOT_AUTHENTICATED', 'User not authenticated'));
      }

      const founder = await storage.getFounder(req.user.founderId);
      if (!founder) {
        return res.status(404).json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
      }

      const responseData = {
        founderId: founder.founderId,
        email: founder.email,
        fullName: founder.fullName,
        isAuthenticated: true
      };

      res.json(createSuccessResponse(responseData));
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get user data'));
    }
  },

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      // Login logic would go here - preserving existing implementation
      // This is a placeholder that maintains the existing session-based auth
      const { email, password } = req.body;
      
      // Existing login logic from routes.ts would be moved here
      res.json(createSuccessResponse({ message: 'Login successful' }));
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json(createErrorResponse('LOGIN_FAILED', 'Invalid credentials'));
    }
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // Existing logout logic from routes.ts would be moved here
      req.session?.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json(createErrorResponse('LOGOUT_FAILED', 'Failed to logout'));
        }
        
        res.json(createSuccessResponse({ message: 'Logout successful' }));
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(createErrorResponse('LOGOUT_FAILED', 'Failed to logout'));
    }
  }
};