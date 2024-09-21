# azure-apim-routing-demo

Azure API Mnagement es el API Gateway de Azure.

Esta es una demostración sobre cómo crear un Azure Api Management con una política de enrutamiento (routing policy) que enruta a una URL destino diferente en función de un campo en el body del request http.

## Antes de Configurar el Azure API Management

Asegúrate de desplegar la API demo desde este repositorio, que expone un endpoint POST api/messages con el payload que tiene la estructura que configuraremos en la política de enrutamiento de Azure API Management.

### Despliegue en GCP

1; Optional, configura tu cuenta GCP

```bash
gcloud config set account [ACCOUNT]
```

2; Optional, configura el proyecto en GCP que vas a usar.

```bash
gcloud config set project [PROJECT-ID]
```

3; Autenticarte en GCP y configurar Docker para usar GCR

```bash
gcloud auth configure-docker
```

4; Construye y sube la imagen a GCR.

```bash
gcloud builds submit --tag gcr.io/[PROJECT-ID]/messenger-simulator
```

5; Para desplegar la imagen en Cloud Run, usa el siguiente comando:

```bash
gcloud run deploy messenger-simulator \
    --image gcr.io/[PROJECT-ID]/messenger-simulator \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

Si todo salió bien copia la URL de tu Cloud Run desde el campo Service URL que generó el comando anterior.

6; Probar la API desplegada

```bash
curl --location '[SERVICE-URL]/api/messages' \
--header 'Content-Type: application/json' \
--data '{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "309439052254254",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "22876546677",
              "phone_number_id": "3356688896666787"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "22876546677"
              }
            ],
            "messages": [
              {
                "from": "22876546677",
                "id": "wamid.HBgLNTE5Mzc4Mzc5NjEVAgASGBIwNDQ1MDE0QzQ3MjZGREFFQzcA",
                "timestamp": "1726592536",
                "type": "image",
                "image": {
                  "mime_type": "image/jpeg",
                  "sha256": "ZkvWl/LIyRjTp0gBWk5J3MJKivuXD89jM1vNFzHNdVw=",
                  "id": "825564873075569"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}'
```

7; Tambien puedes ejecutar este comando para obtener la URL del Servicio desplegado:

```bash
gcloud run services describe messenger-simulator --platform managed --region us-central1 --format 'value(status.url)'

```

### Eliminar recursos creados de GCP

1; Eliminar el Servicio
    Primero lista las imágenes en tu proyecto para identificar la imagen que quieres eliminar:

```bash
gcloud run services delete messenger-simulator --platform managed --region us-central1
```

2; Eliminar la imagen de Google Container Registry

```bash
gcloud container images list --repository=gcr.io/[PROJECT-ID]
```

Eliminar la imagen

```bash
gcloud container images delete gcr.io/[PROJECT-ID]/messenger-simulator --force-delete-tags
```
