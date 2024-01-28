const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const expressSession = require('express-session');

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
//static Files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/img', express.static(__dirname + '/public/img'));

app.use(
  expressSession({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);
 //SET Views
 //app.set('views','./views')
 //app.set('view engine','ejs')

//app.get('', (req, res) => {
    //res.render('index'  ,{text:'This is a Backing up tool'});
//})

const callbackUrl = process.env.NODE_ENV === 'production'
  ? 'https://https://vaultifyx.vercel.app/oauth2callback'
  : 'http://localhost:3000/oauth2callback';

const oauth2Client = new OAuth2Client(
  '823321660170-nro1jium171pcm4djisec5m2nvjd6c2r.apps.googleusercontent.com',
  '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',
  callbackUrl
);


async function backupGmail(tokens) {
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({ userId: 'me' });
    const emailIds = response.data.messages;

    const emails = await Promise.all(emailIds.map(async email => {
      const message = await gmail.users.messages.get({ userId: 'me', id: email.id });
      const subject = message.data.payload.headers.find(header => header.name === 'Subject').value;
      const sender = message.data.payload.headers.find(header => header.name === 'From').value;
      const date = new Date(parseInt(message.data.internalDate)).toLocaleString();

      return {
        id: email.id,
        subject,
        sender,
        date,
      };
    }));

    return { success: true, emails };
  } catch (error) {
    throw new Error(`Backup failed: ${error.message}`);
  }
}

app.use(express.static('public'));

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  req.session.tokens = tokens;
  res.redirect('/');
});

app.get('', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get('/check-auth', (req, res) => {
  const isAuthenticated = req.session && req.session.tokens ? true : false;
  res.json({ isAuthenticated });
});

app.get('/backup-gmail', async (req, res) => {
  try {
    const backupData = await backupGmail(req.session.tokens);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ success: false, message: `Backup failed: ${error.message}` });
  }
});

app.get('/css/main.css',(req, res)=> {
    res.sendFile(path.join(__dirname, 'public','css','main.css'));
});

app.get('/download/:emailId', (req, res) => {
  const emailId = req.params.emailId;
  cores

  try {
    const emailContent = fs.readFileSync(emailPath, 'utf-8');
    res.setHeader('Content-disposition', `attachment; filename=email_${emailId}.txt`);
    res.setHeader('Content-type', 'text/plain');
    res.send(emailContent);
  } catch (error) {
    res.status(404).send('Email not found');
  }
});

app.get('/get-emails', async (req, res) => {
  try {
    const backupData = await backupGmail(req.session.tokens);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to fetch emails: ${error.message}` });
  }
});

app.get('/distinct-years-and-months', async (req, res) => {
  try {
    const backupData = await backupGmail(req.session.tokens);
    const distinctYears = Array.from(new Set(backupData.emails.map(email => new Date(email.date).getFullYear())));
    const distinctMonths = Array.from(new Set(backupData.emails.map(email => new Date(email.date).toLocaleString('default', { month: 'long' }))));

    res.json({ success: true, years: distinctYears, months: distinctMonths });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to fetch distinct years and months: ${error.message}` });
  }
});

app.get('/filter-emails', async (req, res) => {
  const { year, month, search } = req.query;

  try {
    const backupData = await backupGmail(req.session.tokens);

    let filteredEmails = backupData.emails;

    if (year && year !== 'All') {
      filteredEmails = filteredEmails.filter(email => new Date(email.date).getFullYear() == year);
    }

    if (month && month !== 'All') {
      filteredEmails = filteredEmails.filter(email => new Date(email.date).toLocaleString('default', { month: 'long' }) == month);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredEmails = filteredEmails.filter(email => email.subject.toLowerCase().includes(searchTerm) || email.sender.toLowerCase().includes(searchTerm));
    }

    res.json({ success: true, emails: filteredEmails });
  } catch (error) {
    res.status(500).json({ success: false, message: `Failed to fetch filtered emails: ${error.message}` });
  }
});

