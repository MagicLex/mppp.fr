// Direct test script for email sending
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

// Sample order data
const testOrder = {
  id: 'test_direct_' + Date.now().toString(),
  date: new Date().toLocaleDateString('fr-FR'),
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  customer_name: 'Client Test Direct',
  customer_email: 'test@example.com',
  customer_phone: '0612345678',
  pickup_time: process.argv[2] || 'ASAP',
  notes: 'Test direct via Node.js - Ne pas préparer',
  total: 28.50,
  items: '1x Poulet entier; 2x Coca-Cola; 1x Pommes de terre'
};

// Create a nodemailer transporter with OVH SMTP settings
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 465,
  secure: true, // true for SSL on port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Format pickup time in a readable format
let readablePickupTime = testOrder.pickup_time;
if (testOrder.pickup_time === 'ASAP') {
  readablePickupTime = 'Dès que possible';
} else if (testOrder.pickup_time === '15min') {
  readablePickupTime = 'Dans 15 minutes';
} else if (testOrder.pickup_time === '30min') {
  readablePickupTime = 'Dans 30 minutes';
} else if (testOrder.pickup_time === '45min') {
  readablePickupTime = 'Dans 45 minutes';
} else if (testOrder.pickup_time === '60min') {
  readablePickupTime = 'Dans 1 heure';
} else if (testOrder.pickup_time === '90min') {
  readablePickupTime = 'Dans 1h30';
} else if (testOrder.pickup_time === '120min') {
  readablePickupTime = 'Dans 2 heures';
}

// Calculate estimated ready time
const orderDateTime = new Date();
const minPreparationMinutes = 25;
let readyTimeEstimate = '';

if (testOrder.pickup_time === 'ASAP') {
  // Use minimum 25 minutes for ASAP orders
  const readyTime = new Date(orderDateTime.getTime() + minPreparationMinutes * 60000);
  readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
} else if (testOrder.pickup_time.endsWith('min')) {
  // Extract the number of minutes
  let minutes = parseInt(testOrder.pickup_time.replace('min', ''));
  
  // Enforce minimum preparation time
  minutes = Math.max(minutes, minPreparationMinutes);
  
  const readyTime = new Date(orderDateTime.getTime() + minutes * 60000);
  readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Format HTML email content
const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #F2B705; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
      .header h1 { margin: 0; color: #000; }
      .section { margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
      .items { background-color: #fff; padding: 15px; border-radius: 5px; }
      .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 30px; }
      .highlight { background-color: #FFF0C5; padding: 10px; border-radius: 5px; border-left: 4px solid #F2B705; margin-bottom: 15px; }
      .time-block { background-color: #F04D4E; color: white; font-size: 24px; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 15px; }
      .btn { display: inline-block; padding: 10px 20px; background-color: #F2B705; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }
      table { width: 100%; border-collapse: collapse; }
      table th, table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      table th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="time-block">
        🕒 À PRÉPARER POUR ${readyTimeEstimate}
      </div>
    
      <div class="header">
        <h1>Nouvelle Commande #${testOrder.id.substring(0, 8)}</h1>
        <p>${testOrder.date} à ${testOrder.time}</p>
      </div>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 16px;"><strong>Information:</strong> Le client a demandé un retrait ${readablePickupTime.toLowerCase()}</p>
      </div>
      
      <div class="section">
        <h2>Détails Client</h2>
        <p><strong>Client:</strong> ${testOrder.customer_name}</p>
        <p><strong>Email:</strong> ${testOrder.customer_email}</p>
        <p><strong>Téléphone:</strong> ${testOrder.customer_phone}</p>
        <a href="tel:${testOrder.customer_phone}" class="btn">📞 Appeler le client</a>
      </div>
      
      <div class="section">
        <h2>Informations Commande</h2>
        <p><strong>Heure de retrait:</strong> ${readablePickupTime}</p>
        <p><strong>Instructions:</strong> ${testOrder.notes || 'Aucune instruction particulière'}</p>
        <p><strong>Total:</strong> ${testOrder.total.toFixed(2)}€</p>
      </div>
      
      <div class="section">
        <h2>Articles Commandés</h2>
        <div class="items">
          <table style="width:100%">
            <tr>
              <th>Quantité</th>
              <th>Article</th>
            </tr>
            ${testOrder.items.split('; ').map(item => {
              const [quantity, name] = item.split('x ');
              return `<tr>
                <td>${quantity.trim()}</td>
                <td>${name.trim()}</td>
              </tr>`;
            }).join('')}
          </table>
        </div>
      </div>
      
      <div class="footer">
        <p>Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes</p>
        <p>Commande passée sur <a href="https://www.mppp.fr">www.mppp.fr</a></p>
      </div>
    </div>
  </body>
</html>
`;

// Format plain text content
const textContent = `
NOUVELLE COMMANDE #${testOrder.id.substring(0, 8)}
${testOrder.date} à ${testOrder.time}

⏰ COMMANDE À PRÉPARER POUR: ${readyTimeEstimate}
Note: Le client a demandé ${readablePickupTime.toLowerCase()}

DÉTAILS CLIENT
-------------
Client: ${testOrder.customer_name}
Email: ${testOrder.customer_email}
Téléphone: ${testOrder.customer_phone}

INFORMATIONS COMMANDE
--------------------
Heure de retrait: ${readablePickupTime}
Instructions: ${testOrder.notes || 'Aucune instruction particulière'}
Total: ${testOrder.total.toFixed(2)}€

ARTICLES COMMANDÉS
-----------------
${testOrder.items.split('; ').map(item => {
  const parts = item.split('x ');
  if (parts.length === 2) {
    return `${parts[0].trim()}x ${parts[1].trim()}`;
  }
  return item;
}).join('\n')}

--
Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes
Commande passée sur www.mppp.fr
`;

console.log(`Sending test email for pickup time: ${testOrder.pickup_time} (${readablePickupTime})`);
console.log(`Preparation time: ${readyTimeEstimate}`);

// Send email
transporter.sendMail({
  from: `"Mon P'tit Poulet - Test" <${process.env.EMAIL_USER}>`,
  to: process.env.ORDER_EMAIL || 'commandes@mppp.fr',
  subject: `🧾 [TEST] Nouvelle commande #${testOrder.id.substring(0, 8)}`,
  text: textContent,
  html: htmlContent
})
.then(info => {
  console.log('Email sent successfully:');
  console.log(`- Message ID: ${info.messageId}`);
  console.log(`- Recipient: ${info.envelope.to}`);
  console.log(`- Response: ${info.response}`);
  process.exit(0);
})
.catch(error => {
  console.error('Error sending email:', error);
  if (error.response) {
    console.error('SMTP Server Error:', error.response);
  }
  process.exit(1);
});