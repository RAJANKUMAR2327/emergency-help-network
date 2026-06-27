const fs = require('fs');
let c = fs.readFileSync('src/services/emailService.js', 'utf8');
c = c.replace(
  `return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });`,
  `return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });`
);
fs.writeFileSync('src/services/emailService.js', c, 'utf8');
console.log('Fixed: forced IPv4 for Gmail SMTP');
