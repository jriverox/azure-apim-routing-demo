const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Everything is running' });
});

app.post('/api/messages', (req, res) => {
    // Extraer el phone_number_id del payload
    const phoneNumberId = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  
    // Validar que el phone_number_id exista y sea numérico
    if (!phoneNumberId || isNaN(phoneNumberId)) {
      return res.status(400).json({ 
        error: 'Invalid or missing phone_number_id',
        details: 'phone_number_id must be present and numeric'
      });
    }
  
    // Procesar el mensaje (aquí puedes agregar lógica adicional si es necesario)
    console.log('Received message from phone number ID:', phoneNumberId);
  
    // Si todas las validaciones pasan, devolver respuesta exitosa
    res.status(200).json({ status: 'success', message: 'Message received' });
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});