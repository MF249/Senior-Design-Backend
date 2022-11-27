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
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

var response;

const serviceInfo = {
  "type": "service_account",
  "project_id": "charming-module-368617",
  "private_key_id": "9bd5fa1066b686b035f8394ee6dd719cb3520d3c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDE4HR+wUj0OhAl\n/JszmD0Umr1FiFf480uDlAXBiUvNNUg1OjFZZ/WJMIuu7KUZrq14nVfIZpZSPVix\nN3iTPIoCKu15auBT2VwYlAWRCM0/8i2B+mDYiS2C5aUlSoFfnMEZYu2fv3jRktq7\nayCyWjuqjJxYlaCvtnHa9BayWD8aoa4685RyZbrHMafU85wbvnJ1U6/jcIVK0a9A\n2gyHq7bS01eXPwavZHf3fYGv9g1QikL7vhWVlVYlo53w5WOfYGyFGhI8k6pRxt92\nEpj8d5EujHAmyKzpM6iWPt6mlI7ebpmAsDHvLrdiyg53EPb2tg2a/uR7+pgdB3oS\nHLc+gTJdAgMBAAECggEAL3SwN/6UvIQDcPilG4hyjrUm8uwE0pYoqWiEg6x52Fbj\n1yq2CwhHVACe5vUVbe2gVG7O4lgyG1Q8vQjzOEBzPscEs4v601NVQvppJhbiTKvu\nYsKM1h0o2oDK8ER3j2m8VQd24lcXwyKcNWmC+eLMt5VJuYOltj0q0B2em/IwEdWj\nQifQA+u/fzyFdRVJfdvUySNC1NvmcmvfJ4wv3DPAfSr43c9ky41vVutwOc9RFrnP\n8vF6/AvKndIilCYNzj4F4vLa8Re/EqKbUTX8rYCRdCEJnOX5AEUM7p7ksg61TWfQ\n1OwLcA95GvrukVy2x5ceTnd2+Xu2cy9luPc1adwkUQKBgQDtMURDG1eee3tJGCDS\nCJMIfvMb82bDvUk4MshfgAHUB1vP1C/OotFyhaMVA9UEYXki4kbLEaXtEvtufKvQ\nSzd89sKQhkwKGFhHQTWSqdFH3gxnCZqp4zGEu8jEpndCZ7dHc05xxccia1zD+LvK\nC4x3onbtvqTWENAy6Pr0h8eZ7QKBgQDUfNOmw0Y06XR52PKn7YcFOv53lZ3ZB3or\ns411OoW1WzWCWEQZbxx8I58WFEB1bprIcMonfbpmbO/c/x91D3nunM4jxkV77SBO\nqVWcS6MCcwWQVBP5ucw83yS5rkEyINFVmO6jYBIdwbOWyqfFl6djv8JlsLyBS/2S\nfEEZgzgsMQKBgQDovaYAvyybqwjPMWjLD3TPKlp8e7rDqNHW3iW1Z9LjbZEOfmOm\nvCcO28ipT0hPcyG9NBFJI3kQBsdGo/ine5bn/O3viIfGhBrjWD4sOovLnDvJQyhL\nOU6WsviO1dVCCKlT5/X6N5pt0LGG7mO+HtTncziFksMF9huFSQ0usqkOBQKBgHIw\nXsFogUsgBkMQzl5mLEAoUuXK1pfyB7qCdEuCVqZ+TIQukPImHuWrcuu3mGhDNxTu\nYATW8RvoAQL/a1VKKtmLFNBu1ZpidREwuNwUXZaMX3oPZOi360TvGdpbBZg9wKFC\nXUQY9cNd+/fWElECTacyPvLNBpBpWOymr4lZVg+RAoGAb5uy8n2XLRWdsiSfGQ7A\ntbqjXwVwFIZcyh6Ja+WXGSZ7nfbvB7Rm22LCxmeZE4K2Emsd9c9s+xtSkltSJxUp\nezFOiRJqUjote+aaPQDJ3OPK0Xej6d+GQ///DnV8WaQAVemb39RQT/kwG12d/2FF\nwJTXz9GBuMW9tH/dGwnSF78=\n-----END PRIVATE KEY-----\n",
  "client_email": "liveboltphotos@charming-module-368617.iam.gserviceaccount.com",
  "client_id": "108510764715350671591",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/liveboltphotos%40charming-module-368617.iam.gserviceaccount.com"
}

router.get('/runDrive', async (req, res) => { 
    try{
        const auth = new google.auth.GoogleAuth({
            //keyFilename: CREDENTIALS_PATH,
            credentials: serviceInfo,
            scopes: ['https://www.googleapis.com/auth/drive']
        })

        //console.log("Test");

        const driveService = await google.drive({
            version: 'v3',
            auth
        })

        //console.log(auth);

        response = await driveService.files.list({
            fields: 'nextPageToken, files(thumbnailLink)',
        })

        console.log(response.data);

        res.send(response.data);

    }catch(err){
        console.log('Upload file error', err);
        console.log(response);
    }
});
  module.exports = router;