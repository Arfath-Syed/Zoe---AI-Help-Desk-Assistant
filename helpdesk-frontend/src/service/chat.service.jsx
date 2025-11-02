
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "http://localhost:8081/api/v1";

const http = axios.create({
  baseURL,
  timeout: 15000,
});

export async function sendMessagesToServer(message, conversationId, email) {
  
  const res = await http.post(
    "/helpdesk",
    message, 
    {
      headers: {
        "Content-Type": "text/plain", 
        ConversationId: conversationId,
        ...(email ? { "X-User-Email": email } : {}), 
      },
    }
  );
  return res.data; 
}


export async function getHistory(conversationId) {
  
  const res = await http.get(`/helpdesk/history/${conversationId}`);
  return res.data; 
}

export function openMessageStream(conversationId, onMessage, onError) {
  const url = `${baseURL}/helpdesk/stream/${conversationId}`
    
  const es = new EventSource(url);
  es.onmessage = (evt) => {
    try {
      const payload = JSON.parse(evt.data); 
      onMessage?.(payload);
    } catch (e) {
      console.warn("Bad SSE payload:", evt.data);
    }
  };
  es.onerror = (err) => onError?.(err);
  return es;
}
