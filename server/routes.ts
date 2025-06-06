import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxService, upload } from "./box-service";
import { boxSDKService } from "./box-sdk-service";
import { boxEnterpriseService } from "./box-service-enterprise";
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

  // Box.com Integration Routes (Original OAuth2)
  
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

  // Box SDK Routes (New Implementation)
  
  // Test Box SDK connection
  app.get("/api/box/sdk/test", async (req, res) => {
    try {
      const connected = await boxSDKService.testConnection();
      res.json({ connected, service: 'box-sdk' });
    } catch (error) {
      console.log(`Box SDK connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        service: 'box-sdk',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Box Enterprise Routes (Automatic Authentication)
  
  // Test Box Enterprise connection
  app.get("/api/box/enterprise/test", async (req, res) => {
    try {
      const connected = await boxEnterpriseService.testConnection();
      res.json({ connected, service: 'box-enterprise' });
    } catch (error) {
      console.log(`Box Enterprise connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        service: 'box-enterprise',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Box Enterprise file upload endpoint (automatic authentication)
  app.post("/api/box/enterprise/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Processing Box Enterprise file upload...');
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { startupName, category } = req.body;
      if (!startupName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please complete the form before uploading files'
        });
      }

      // Create session folder for this startup using Enterprise service
      const sessionFolderId = await boxEnterpriseService.createSessionFolder(startupName);
      console.log(`Enterprise Session folder created/found: ${sessionFolderId} for startup: ${startupName}`);

      // Upload file using Enterprise service
      const uploadResult = await boxEnterpriseService.uploadFile(
        req.file.originalname,
        req.file.buffer,
        sessionFolderId
      );

      // Generate shareable link
      const shareableLink = await boxEnterpriseService.createShareableLink(uploadResult.id, 'file');

      return res.json({
        success: true,
        storage: 'box-enterprise',
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: shareableLink
        },
        sessionFolder: sessionFolderId
      });

    } catch (error) {
      console.log(`Box Enterprise upload failed: ${error}`);
      return res.status(503).json({ 
        error: "Box Enterprise integration error",
        message: "File upload failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate shareable links using Box Enterprise
  app.post('/api/box/enterprise/generate-links', async (req, res) => {
    try {
      const { sessionFolderId, uploadedFiles } = req.body;
      const result: any = {};

      // Generate folder shareable link for data room
      if (sessionFolderId) {
        try {
          result.dataRoomUrl = await boxEnterpriseService.createShareableLink(sessionFolderId, 'folder');
        } catch (error) {
          console.error('Error creating Enterprise folder shareable link:', error);
        }
      }

      // Generate file shareable links for pitch deck
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (file.category === 'pitch-deck' && file.id) {
            try {
              result.pitchDeckUrl = await boxEnterpriseService.createShareableLink(file.id, 'file');
              break;
            } catch (error) {
              console.error('Error creating Enterprise file shareable link:', error);
            }
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating Enterprise shareable links:', error);
      res.status(500).json({ error: 'Failed to generate shareable links', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get Box SDK OAuth URL for authentication
  app.get("/api/box/sdk/auth-url", async (req, res) => {
    try {
      const authUrl = boxSDKService.getAuthURL();
      res.json({ authUrl });
    } catch (error) {
      console.log(`Error generating Box SDK auth URL: ${error}`);
      res.status(500).json({ error: "Failed to generate authentication URL" });
    }
  });

  // Box SDK OAuth callback endpoint
  app.get("/api/box/sdk/callback", async (req, res) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.log(`Box SDK OAuth error: ${error}`);
        return res.status(400).send(`
          <html>
            <body>
              <h1>Authentication Failed</h1>
              <p>Error: ${error}</p>
              <script>
                window.opener.postMessage({
                  type: 'BOX_SDK_AUTH_ERROR',
                  error: '${error}'
                }, window.location.origin);
                window.close();
              </script>
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
              <script>
                window.opener.postMessage({
                  type: 'BOX_SDK_AUTH_ERROR',
                  error: 'No authorization code received'
                }, window.location.origin);
                window.close();
              </script>
            </body>
          </html>
        `);
      }

      const tokens = await boxSDKService.exchangeCodeForTokens(code as string);
      
      // Send success message back to parent window
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'BOX_SDK_AUTH_SUCCESS',
                message: 'Box SDK authentication successful'
              }, window.location.origin);
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.log(`Box SDK OAuth callback error: ${error}`);
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'BOX_SDK_AUTH_ERROR',
                error: 'Authentication failed'
              }, window.location.origin);
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  });

  // Box SDK file upload endpoint
  app.post("/api/box/sdk/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Processing Box SDK file upload...');
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { startupName, category } = req.body;
      if (!startupName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please complete the form before uploading files'
        });
      }

      // Create session folder for this startup using SDK
      const sessionFolderId = await boxSDKService.createSessionFolder(startupName);
      console.log(`SDK Session folder created/found: ${sessionFolderId} for startup: ${startupName}`);

      // Upload file using SDK
      const uploadResult = await boxSDKService.uploadFile(
        req.file.originalname,
        req.file.buffer,
        sessionFolderId
      );

      // Generate shareable link
      const shareableLink = await boxSDKService.createShareableLink(uploadResult.id, 'file');

      return res.json({
        success: true,
        storage: 'box-sdk',
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: shareableLink
        },
        sessionFolder: sessionFolderId
      });

    } catch (error) {
      console.log(`Box SDK upload failed: ${error}`);
      return res.status(503).json({ 
        error: "Box SDK integration required",
        message: "Please authenticate with Box SDK to enable file uploads",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate shareable links using Box SDK
  app.post('/api/box/sdk/generate-links', async (req, res) => {
    try {
      const { sessionFolderId, uploadedFiles } = req.body;
      const result: any = {};

      // Generate folder shareable link for data room
      if (sessionFolderId) {
        try {
          result.dataRoomUrl = await boxSDKService.createShareableLink(sessionFolderId, 'folder');
        } catch (error) {
          console.error('Error creating SDK folder shareable link:', error);
        }
      }

      // Generate file shareable links for pitch deck
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (file.category === 'pitch-deck' && file.id) {
            try {
              result.pitchDeckUrl = await boxSDKService.createShareableLink(file.id, 'file');
              break;
            } catch (error) {
              console.error('Error creating SDK file shareable link:', error);
            }
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating SDK shareable links:', error);
      res.status(500).json({ error: 'Failed to generate shareable links', details: error instanceof Error ? error.message : String(error) });
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
      
      // Store tokens in database for system-wide use
      await boxService.storeTokens(tokens);
      
      // Send success message back to parent window
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({
                type: 'BOX_AUTH_SUCCESS',
                message: 'Box authentication successful'
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

      // Upload directly to Box.com only
      try {
        const accessToken = await boxService.getValidAccessToken();
        
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
        console.log(`Box upload failed: ${boxError}`);
        return res.status(503).json({ 
          error: "Box integration required",
          message: "Please authenticate with Box to enable file uploads",
          details: boxError instanceof Error ? boxError.message : String(boxError)
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
      const accessToken = await boxService.getValidAccessToken();
      const result: any = {};

      // Generate folder shareable link for data room
      if (sessionFolderId) {
        try {
          result.dataRoomUrl = await boxService.createFolderShareableLink(accessToken, sessionFolderId);
        } catch (error) {
          console.error('Error creating folder shareable link:', error);
        }
      }

      // Generate file shareable links for pitch deck (only for Box files)
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (file.category === 'pitch-deck' && file.id) {
            try {
              result.pitchDeckUrl = await boxService.createFileShareableLink(accessToken, file.id);
              break; // Only need one pitch deck link
            } catch (error) {
              console.error('Error creating file shareable link:', error);
            }
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
