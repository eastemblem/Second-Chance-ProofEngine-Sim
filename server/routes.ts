import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxService, upload } from "./box-service";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

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
      const tokens = await boxService.exchangeCodeForTokens(code as string);
      
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
      
      const tokens = await boxService.exchangeCodeForTokens(code as string);
      
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
      const accessToken = await boxService.getValidAccessToken();
      const isConnected = await boxService.testConnection(accessToken);
      res.json({ connected: isConnected });
    } catch (error) {
      console.log(`Box connection test failed: ${error}`);
      res.json({ connected: false, error: error instanceof Error ? error.message : String(error) });
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

      // Use local file storage for ProofVault structure
      try {
        
        // Create ProofVault directory structure
        const proofVaultDir = path.join(process.cwd(), 'proof_vault');
        const startupDir = path.join(proofVaultDir, `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
        
        // Ensure directories exist
        if (!fs.existsSync(proofVaultDir)) {
          fs.mkdirSync(proofVaultDir, { recursive: true });
        }
        if (!fs.existsSync(startupDir)) {
          fs.mkdirSync(startupDir, { recursive: true });
        }
        
        // Save file to ProofVault directory
        const fileName = req.file.originalname;
        const filePath = path.join(startupDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        
        console.log(`File saved to ProofVault: ${filePath}`);
        
        // Generate file ID and metadata
        const fileId = Math.random().toString(36).substr(2, 9);
        const sessionFolderId = `proofvault_${startupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        return res.json({
          success: true,
          storage: 'proofvault',
          file: {
            id: fileId,
            name: fileName,
            size: req.file.size,
            path: filePath,
            download_url: `/api/files/${sessionFolderId}/${fileName}`
          },
          sessionFolder: sessionFolderId
        });
      } catch (error) {
        console.log(`ProofVault storage failed: ${error}`);
        return res.status(500).json({ 
          error: "File storage failed",
          message: "Unable to save file to ProofVault storage"
        });
      }

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



  // Serve files from ProofVault storage
  app.get('/api/files/:folderId/:fileName', (req, res) => {
    try {
      const { folderId, fileName } = req.params;
      
      // Construct file path based on folder structure
      const startupName = folderId.replace('proofvault_', '').replace(/_/g, ' ');
      const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const filePath = path.join(process.cwd(), 'proof_vault', folderName, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Send file
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Failed to serve file' });
    }
  });

  // Generate shareable links for uploaded files
  app.post('/api/box/generate-links', async (req, res) => {
    try {
      const { sessionFolderId, uploadedFiles } = req.body;
      const result: any = {};

      // Generate folder shareable link for data room (ProofVault folder)
      if (sessionFolderId) {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
          : 'http://localhost:5000';
        result.dataRoomUrl = `${baseUrl}/api/vault/${sessionFolderId}`;
      }

      // Generate file shareable links for pitch deck
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (file.category === 'pitch-deck' && file.download_url) {
            const baseUrl = process.env.REPLIT_DEV_DOMAIN 
              ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
              : 'http://localhost:5000';
            result.pitchDeckUrl = `${baseUrl}${file.download_url}`;
            break; // Only need one pitch deck link
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating shareable links:', error);
      res.status(500).json({ error: 'Failed to generate shareable links', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Serve ProofVault folder contents (data room view)
  app.get('/api/vault/:folderId', (req, res) => {
    try {
      const { folderId } = req.params;
      
      // Construct folder path
      const startupName = folderId.replace('proofvault_', '').replace(/_/g, ' ');
      const folderName = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const folderPath = path.join(process.cwd(), 'proof_vault', folderName);
      
      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        return res.status(404).send(`
          <html>
            <head><title>ProofVault - ${startupName}</title></head>
            <body>
              <h1>ProofVault - ${startupName}</h1>
              <p>No documents found for this startup.</p>
            </body>
          </html>
        `);
      }
      
      // List files in folder
      const files = fs.readdirSync(folderPath);
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'http://localhost:5000';
      
      const fileListHtml = files.map((file: string) => {
        const fileUrl = `${baseUrl}/api/files/${folderId}/${encodeURIComponent(file)}`;
        return `<li><a href="${fileUrl}" target="_blank">${file}</a></li>`;
      }).join('');
      
      res.send(`
        <html>
          <head>
            <title>ProofVault - ${startupName}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
              ul { list-style: none; padding: 0; }
              li { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
              a { text-decoration: none; color: #007bff; font-weight: 500; }
              a:hover { text-decoration: underline; }
              .empty { color: #666; font-style: italic; }
            </style>
          </head>
          <body>
            <h1>ProofVault - ${startupName}</h1>
            <p>Secure document repository for investor access</p>
            ${files.length > 0 ? `<ul>${fileListHtml}</ul>` : '<p class="empty">No documents uploaded yet.</p>'}
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error serving vault folder:', error);
      res.status(500).json({ error: 'Failed to serve vault folder' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
