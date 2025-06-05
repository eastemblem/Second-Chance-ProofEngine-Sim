import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxService, upload } from "./box-service";
import { Readable } from "stream";

// Validation schemas
const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

const createVentureSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  ownerId: z.string().uuid("Invalid user ID format"),
  teamSize: z.number().min(1).default(1),
  category: z.string().optional(),
  description: z.string().optional(),
  stage: z.string().optional(),
  industry: z.string().optional(),
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Create user endpoint
  app.post("/api/users", async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.log(`Error creating user: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get user by email endpoint
  app.get("/api/users/by-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.log(`Error fetching user: ${error}`);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create venture endpoint
  app.post("/api/ventures", async (req, res) => {
    try {
      const ventureData = createVentureSchema.parse(req.body);
      
      // Verify user exists
      const user = await storage.getUser(ventureData.ownerId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const venture = await storage.createVenture(ventureData);
      res.json(venture);
    } catch (error) {
      console.log(`Error creating venture: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create venture" });
    }
  });

  // Get user's ventures endpoint
  app.get("/api/users/:userId/ventures", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      const ventures = await storage.getVenturesByUserId(userId);
      res.json(ventures);
    } catch (error) {
      console.log(`Error fetching user ventures: ${error}`);
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  // Update venture endpoint
  app.patch("/api/ventures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: "Invalid venture ID format" });
      }
      
      const updateData = req.body;
      const venture = await storage.updateVenture(id, updateData);
      res.json(venture);
    } catch (error) {
      console.log(`Error updating venture: ${error}`);
      res.status(500).json({ error: "Failed to update venture" });
    }
  });

  // Update user completion status
  app.patch("/api/users/:id/complete-second-chance", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      const user = await storage.updateUser(id, { isSecondChanceDone: true });
      res.json(user);
    } catch (error) {
      console.log(`Error updating user completion status: ${error}`);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Box.com Integration Routes
  
  // Get Box OAuth URL for authentication
  app.get("/api/box/auth-url", async (req, res) => {
    try {
      const authUrl = boxService.getAuthURL();
      res.json({ authUrl });
    } catch (error) {
      console.log(`Error generating Box auth URL: ${error}`);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  // Box OAuth callback endpoint
  app.get("/api/box/callback", async (req, res) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.log(`Box OAuth error: ${error}`);
        return res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>Error: ${error}</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
      }

      if (!code) {
        return res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>No authorization code received</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
      }

      // Exchange code for tokens
      const tokens = await boxService.getTokensFromCode(code as string);
      
      // Return success page with tokens (in a real app, you'd store these securely)
      res.send(`
        <html>
          <body>
            <h1>Box Authentication Successful!</h1>
            <p>You can now close this window and return to the application.</p>
            <script>
              // Send tokens to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'BOX_AUTH_SUCCESS',
                  tokens: ${JSON.stringify(tokens)}
                }, '*');
              }
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.log(`Error in Box OAuth callback: ${error}`);
      res.status(500).send(`
        <html>
          <body>
            <h1>Authentication Error</h1>
            <p>Failed to complete authentication. Please try again.</p>
            <script>window.close();</script>
          </body>
        </html>
      `);
    }
  });

  // Get Box user info for connection status
  app.get("/api/box/user", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let accessToken;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      } else {
        // Use default access token for testing
        accessToken = boxService.getDefaultAccessToken();
      }

      if (!accessToken) {
        return res.status(401).json({ error: 'No access token available' });
      }

      const response = await fetch('https://api.box.com/2.0/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Box API error ${response.status}: ${errorText}`);
        return res.status(response.status).json({ error: 'Failed to get user info' });
      }

      const userData = await response.json();
      res.json(userData);
    } catch (error) {
      console.log(`Error getting Box user info: ${error}`);
      res.status(500).json({ error: "Failed to get user information" });
    }
  });

  // Handle OAuth callback
  app.get("/api/box/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).send(`
          <html>
            <body>
              <script>
                window.opener.postMessage({
                  type: 'BOX_AUTH_ERROR',
                  error: 'Authorization code missing'
                }, window.location.origin);
                window.close();
              </script>
            </body>
          </html>
        `);
      }
      
      const tokens = await boxService.getTokensFromCode(code as string);
      
      // Send tokens back to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'BOX_AUTH_SUCCESS',
                tokens: {
                  access_token: '${tokens.access_token}',
                  refresh_token: '${tokens.refresh_token}',
                  expires_in: ${tokens.expires_in}
                }
              }, window.location.origin);
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.log(`Box OAuth callback error: ${error}`);
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'BOX_AUTH_ERROR',
                error: 'Authentication failed'
              }, window.location.origin);
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  });

  // Test Box connection
  app.get("/api/box/test", async (req, res) => {
    try {
      const isConnected = await boxService.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      console.log(`Box connection test failed: ${error}`);
      res.status(500).json({ error: "Box connection failed" });
    }
  });

  // Upload document with Box integration
  app.post("/api/box/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { startupName } = req.body;
      
      if (!startupName) {
        return res.status(400).json({ 
          error: 'Startup name is required for file uploads',
          message: 'Please complete the form before uploading files'
        });
      }

      // Check if Box access token is available
      const accessToken = boxService.getDefaultAccessToken();
      
      if (accessToken) {
        try {
          // Create session folder for this startup
          const sessionFolderId = await boxService.createSessionFolder(accessToken, startupName);
          console.log(`Session folder created/found: ${sessionFolderId} for startup: ${startupName}`);

          const uploadResult = await boxService.uploadFile(
            accessToken,
            req.file.originalname,
            req.file.buffer,
            sessionFolderId
          );

          return res.json({
            success: true,
            storage: 'box',
            file: {
              id: uploadResult.id,
              name: uploadResult.name,
              size: uploadResult.size,
              download_url: uploadResult.download_url
            },
            sessionFolder: sessionFolderId
          });
        } catch (boxError) {
          console.log(`Box upload failed, using local storage: ${boxError}`);
        }
      }

      // Fallback to local storage simulation for demo
      const mockFileId = Math.random().toString(36).substr(2, 9);
      
      res.json({
        success: true,
        storage: 'local',
        file: {
          id: mockFileId,
          name: req.file.originalname,
          size: req.file.size,
          download_url: null
        }
      });

    } catch (error) {
      console.log(`Error uploading file: ${error}`);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get user's documents from Box
  app.get("/api/box/documents/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!accessToken) {
        return res.status(401).json({ error: "Box access token required" });
      }

      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get documents from Box root folder
      const documents = await boxService.listFolderContents(accessToken, '0');
      res.json({ documents });

    } catch (error) {
      console.log(`Error getting user documents: ${error}`);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
