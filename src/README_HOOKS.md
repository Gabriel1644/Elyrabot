# 🚀 Super Hooks — ElyraBot Event Streamer

O sistema de **Super Hooks** permite que você transforme seu bot em uma central de eventos. Ele "escuta" todas as mensagens e eventos do WhatsApp e os envia em tempo real para qualquer URL ou porta que você configurar.

## 🛠️ Como usar
1. Acesse o **Dashboard** do bot.
2. Vá na aba **Webhooks**.
3. Adicione um novo Hook informando um nome e a **URL de destino**.
   - Exemplo: `http://seu-servidor.com/webhook` ou `http://localhost:3000/discord-bridge`.

## 📡 Formato do Payload (JSON)
Sempre que uma mensagem for recebida, o bot enviará um POST para sua URL com este formato:

```json
{
  "event": "message",
  "timestamp": 1711824000000,
  "data": {
    "from": "123456789@g.us",
    "pushName": "João",
    "text": "Olá bot!",
    "isGrupo": true,
    "userId": "5511999999999@s.whatsapp.net",
    "key": { ... }
  }
}
```

## 💡 Ideias de Integração
- **Discord/Telegram Bridge**: Crie um script simples que recebe esse JSON e reposta no Discord usando Webhooks do próprio Discord.
- **Logs Externos**: Salve todas as conversas em um banco de dados externo (MySQL/PostgreSQL).
- **Comandos Remotos**: Processe mensagens em outra linguagem (Python, PHP) e use a API do bot para responder.

---
*ElyraBot v27 — Potência máxima no seu Termux.*
