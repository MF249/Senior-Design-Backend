const express = require('express');
const router = express.Router();
const cors = require('cors');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const {authenticate} = require('@google-cloud/local-auth');
require('dotenv').config();


const TOKEN_PATH = path.join(process.cwd(), 'token.json');
//const CREDENTIALS_PATH = path.join(process.cwd(), 'google-credentials.json');
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS;

router.get('/runDrive', async (req, res) => { 
    try{
        const auth = new google.auth.GoogleAuth({
            keyFilename: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/drive'],
        })

        //console.log("Test");

        const driveService = google.drive({
            version: 'v3',
            auth
        })

        console.log(auth);

        const response = await driveService.files.list({
            fields: 'nextPageToken, files(thumbnailLink)',
        });

        /*const response = await driveService.files.list({
            pageSize: 150,
            q: `'${'1p23yB9WoIpIhsSCf0KS2rYSlEdSrnRXN'}' in parents and trashed=false`
        });*/

        //res = await driveService.files.list()
        console.log(res.data)

        //res.send('check');
        res.json(response.data);
        //return response.data;

        //console.log(response.data);

    }catch(err){
        console.log('Upload file error', err)
    }
});
    
/*async function loadSavedCredentialsIfExist() {
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }
  
  async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }
  
  async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }
  
  async function listFiles(authClient) {
    const drive = google.drive({version: 'v3', auth: authClient});
    const res = await drive.files.list({
      fields: 'nextPageToken, files(thumbnailLink)',
    });
  
    const files = res.data.files;
    if (files.length === 0) {
      console.log('No files found.');
      return;
    }
    console.log(files);
    return files;
  }*/
  module.exports = router;