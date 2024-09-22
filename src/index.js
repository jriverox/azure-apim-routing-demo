const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

const getBaseURL = (req) => {
    const { protocol, hostname} = req;
    return `${protocol}://${hostname}:${PORT}`;
}

app.get('/api/health', (req, res) => {
    const baseURL = getBaseURL(req);
    console.log(`Health check, base URL: ${baseURL}`);
    res.status(200)
        .json({ 
            status: 'success', 
            baseURL,  
            message: 'Everything is running' 
        });
});

app.post('/api/messages', (req, res) => {
    const { body } = req
    console.log(JSON.stringify(body));
    const baseURL = getBaseURL(req);
    console.log(`Health check, base URL: ${baseURL}`);
    // Extraer el phone_number_id del payload
    const phoneNumberId = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  
    // Validar que el phone_number_id exista y sea numérico
    if (!phoneNumberId || isNaN(phoneNumberId)) {
      return res.status(400)
        .json({ 
            error: 'Invalid or missing phone_number_id',
            baseURL,
            details: 'phone_number_id must be present and numeric'
      });
    }
  
    // Procesar el mensaje (aquí puedes agregar lógica adicional si es necesario)
    console.log('Received message from phone number ID:', phoneNumberId);
  
    // Si todas las validaciones pasan, devolver respuesta exitosa
    res.status(200)
        .json({ 
            status: 'success',
            baseURL,
            message: 'Message received' 
        });
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});