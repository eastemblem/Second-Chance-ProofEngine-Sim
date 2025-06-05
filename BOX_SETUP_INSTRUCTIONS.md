# Box.com Integration Setup Instructions

## Current Status
The Box OAuth2 integration is fully implemented but requires proper Box application configuration.

## Required Setup Steps

### 1. Box Developer Console Configuration
1. Log into [Box Developer Console](https://app.box.com/developers/console)
2. Navigate to your Box application
3. Go to "Configuration" → "OAuth 2.0 Redirect URI"
4. Add this exact redirect URI:
   ```
   https://2df41432-5e86-452b-b216-302b6c880e1c-00-thglvaquedpzm.riker.replit.dev/api/box/callback
   ```
5. Save the configuration

### 2. Application Scopes
Ensure your Box application has these scopes enabled:
- Read and write all files and folders stored in Box
- Manage users
- Manage groups

### 3. Credentials Update
After configuring the redirect URI, update the environment variables:
- `BOX_CLIENT_ID`: Your Box application's client ID
- `BOX_CLIENT_SECRET`: Your Box application's client secret

## How the Integration Works

1. **Authentication Flow**: Users click "Connect Box" to initiate OAuth2
2. **Token Storage**: Authentication tokens are stored in the database
3. **File Upload**: Files upload directly to Box.com in ProofVault_[StartupName] folders
4. **Shareable Links**: System generates shareable links for investor access

## Current Error
```
Box connection test failed: Error: No valid Box access token available. Please authenticate with Box.
```

This indicates the OAuth2 flow cannot complete due to redirect URI mismatch.

## File Structure Created
- ProofVault_[StartupName]/ (root folder for each startup)
- All documents uploaded directly to Box.com
- Shareable links stored in database for investor access