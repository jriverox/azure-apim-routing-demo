# azure-apim-routing-demo

Azure API Mnagement es el API Gateway de Azure.

Esta es una demostración sobre cómo crear un Azure Api Management con una política de enrutamiento (routing policy) que enruta a una URL destino diferente en función de un campo en el body del request http.

## Antes de Configurar el Azure API Management

Asegúrate de desplegar la API demo desde este repositorio, que expone un endpoint POST api/messages con el payload que tiene la estructura que configuraremos en la política de enrutamiento de Azure API Management.

## Desplegar en Azure

1. Iniciar sesión en Azure CLI (si no lo has hecho aún):

```bash
az login
```

2. Opcional: Crear un Resource Group (esto para aislar los recursos del demo)

```bash
az group create --name messenger-resource-group --location eastus
```

3. Crear un Azure Container Registry (ACR)

```bash
az acr create --resource-group messenger-resource-group --name jrxcontainerregistry --sku Basic --admin-enabled true
```

4. Autenticarse en el Azure Container Registry (ACR)

```bash
az acr login --name jrxcontainerregistry
```

5. Construir y etiquetar la imagen de Docker (en mi caso uso --platform linux/amd64 porque estoy generando desde un mac con m1)

```bash
docker build --platform linux/amd64 -t jrxcontainerregistry.azurecr.io/messenger-simulator .
```

6. Subir la imagen a ACR

```bash
docker push jrxcontainerregistry.azurecr.io/messenger-simulator
```

7. Crear un entorno de Azure Container Apps

```bash
az containerapp env create --name messengerEnv --resource-group messenger-resource-group --location eastus
```

8. Desplegar la aplicación en Azure Container Apps

```bash
az containerapp create \
  --name messenger-simulator-app \
  --resource-group messenger-resource-group \
  --environment messengerEnv \
  --image jrxcontainerregistry.azurecr.io/messenger-simulator \
  --target-port 8080 \
  --ingress 'external' \
  --registry-server jrxcontainerregistry.azurecr.io \
  --query configuration.ingress.fqdn
  ```

*Nota*: La opción --query configuration.ingress.fqdn devolverá la URL de acceso público del API

## Eliminar los recursos creados en Azure

```bash
az group delete --name messenger-resource-group --yes --no-wait
```

Esto eliminará el grupo de recursos y todos los recursos asociados, incluidos el ACR, la aplicación en Azure Container Apps, y cualquier otro recurso creado dentro de ese grupo.

## Despliegue en GCP Cloud Run

1. Optional, configura tu cuenta GCP

```bash
gcloud config set account [ACCOUNT]
```

2. Optional, configura el proyecto en GCP que vas a usar.

```bash
gcloud config set project [PROJECT-ID]
```

3. Autenticarte en GCP y configurar Docker para usar GCR

```bash
gcloud auth configure-docker
```

4. Construye y sube la imagen a GCR.

```bash
gcloud builds submit --tag gcr.io/[PROJECT-ID]/messenger-simulator
```

5. Para desplegar la imagen en Cloud Run, usa el siguiente comando:

```bash
gcloud run deploy messenger-simulator \
    --image gcr.io/[PROJECT-ID]/messenger-simulator \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

Si todo salió bien copia la URL de tu Cloud Run desde el campo Service URL que generó el comando anterior.

6. Probar la API desplegada

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

7. Tambien puedes ejecutar este comando para obtener la URL del Servicio desplegado:

```bash
gcloud run services describe messenger-simulator --platform managed --region us-central1 --format 'value(status.url)'

```

## Eliminar recursos creados de GCP

1. Eliminar el Servicio
    Primero lista las imágenes en tu proyecto para identificar la imagen que quieres eliminar:

```bash
gcloud run services delete messenger-simulator --platform managed --region us-central1
```

2. Eliminar la imagen de Google Container Registry

```bash
gcloud container images list --repository=gcr.io/[PROJECT-ID]
```

Eliminar la imagen

```bash
gcloud container images delete gcr.io/[PROJECT-ID]/messenger-simulator --force-delete-tags
```
