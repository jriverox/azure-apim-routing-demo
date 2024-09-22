# Demo de uso de Enrutamiento usando politicas de enrutamiento en Azure API Management (API Gateway)

Azure API Mnagement es el API Gateway de Azure.

Esta es una demostración sobre cómo crear un Azure Api Management con una política de enrutamiento (routing policy) a URLs distintas en función de un campo en el body del request http.

En este demo se despliega una API muy basico desarrollado en Express.js y para exponerlo como 2 servicios distintos uno en Azure Container Apps y otro en GCP Cloud Run.

El objetivo de tener un Api Gateway en esta demo es que se puedan configurar enrutamientos al backend 1 o al backend 2 dependiendo si el parametro phone_number_id de Body tiene el valor de "1111" o "2222".

Aunque se vea muy simple la implementación del código, este repo se ha creado con fines puramete de aprendizaje en mi camino por conocer soluciones de diferentes proveedores de Cloud.

## Despliegar la API de ejemplo

En las 2 siguientes secciones encontraás las instrucciones para desplegar el código de node.js y exponer la misma API tanto en GCP como en Azure.

### Desplegar la API en Azure Container Apps

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

### Eliminar los recursos creados en Azure Container Apps

```bash
az group delete --name messenger-resource-group --yes --no-wait
```

Esto eliminará el grupo de recursos y todos los recursos asociados, incluidos el ACR, la aplicación en Azure Container Apps, y cualquier otro recurso creado dentro de ese grupo.

### Despliegue API en GCP Cloud Run

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

### Eliminar recursos de API creados de GCP Cloud Run

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

## Configuración de Azure API Management (API Gateway)

1. Crear Grupo de Recursos en caso que no lo hayas creado al desplegar el Api en Azure Container Apps (seccion Desplegar la API en Azure Container Apps)

```bash
az group create --name messenger-resource-group --location eastus
```

2. Crear una instancia de Azure API Management

```bash
az apim create --name messengerApiGateway --resource-group messenger-resource-group --publisher-name MyCompany --publisher-email admin@mycompany.com --sku-name Consumption
```

3. Crear una API en API Management

```bash
az apim api create --resource-group messenger-resource-group --service-name messengerApiGateway --api-id webhook-api --path api --display-name "Webhook API" --protocols https
```

4. Crear una operación POST en la API

```bash
az apim api operation create --resource-group messenger-resource-group --service-name messengerApiGateway --api-id webhook-api --operation-id post-webhook --display-name "Post Webhook" --method POST --url-template /messages
```

### Configurar la politica de enrutamiento

Por alguna razón que no entiendo, el CLI de Azure (az apim) no tiene nunguna opción para crear y aplicar una politica de enrutamiento. Por esta razón, la crearemos desde la consola de Azure.

1. Navega hast la [consola de Azure](https://portal.azure.com/#home)
2. Selecciona la opción de Resource Groups y selecciona el que creamos en pasos anteriores (messenger-resource-group)
3. En la lista de recursos, selecciona messengerApiGateway.
4. En el menú izquierdo selecciona la opcion APIs.
5. Selecciona la api que creamos en pasos anteriores (Webhook API)
6. En la sección All Operations, selecciona Post Messages.
7. En la sección Inbound processing has clic en el botón **base**
8. Edita el contenido del archivo routing-policy.xml que encontrarás en el cpodigo fuente del repositorio. Dentro del elemnto **choose/when** del XML cambia los valores del atributo *base-url* del elemnto **set-backend-service**. Asegurate de tener a la mano las URLs de los 2 servicios que desplegaste en las secciones de despliegue del API en Azure Container Apps y en GCP Cloud Run. Deberas reemplazar el URL basse de cada uno de los valores para cada de base-url de cada set-backend-service. Por ejmplo: el URL del servicio desplegado en Azure Container Apps debe lucir como [https://messenger-simulator-app.greenbay-59055aea.eastus.azurecontainerapps.io/api], recuerda que solo debes reemplzar el URL base dejando /api.
9. Ahora has clic en el botón **Save**.
10. Si quieres probar o incluso hacer un debug puedes seleccionar la opción **Test** del menú superior, busca la sección Request body y pega el body (puedes apoyarte en el archivo payload-sample.json donde encontrarás un ejemplo del request).
11. Pega ese json en el campo Request body y has clic en el botón Send (o Trace). Una vez que termine la ejecución puedes bajar hasta el final de esa sección y revisar el resultado. Tambien puedes probar usando curl o Postman. Para encontrar el URL de tu API en API Management, puedes hacer clic en la opción Overview del menú izquierdo y copiar el valor de Gateway URL.
