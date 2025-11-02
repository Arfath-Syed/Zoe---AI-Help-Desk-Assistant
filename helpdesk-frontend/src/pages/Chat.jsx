
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, MoreVertical, Send, Plus, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import MessageBubble from "../components/MessageBubble";
import { sendMessagesToServer } from "../service/chat.service";
import { v4 as uuidv4 } from "uuid";
import { Spinner } from "../components/ui/spinner";
import { useNavigate, useLocation } from "react-router-dom";


const greet = () => ({
  id: "seed-" + Date.now(),
  author: "bot",
  text: "Hello! I’m Zoe. How can I assist you today?",
  at: new Date().toLocaleTimeString(),
});

function initials(str = "") {
  const s = (str || "").trim();
  if (!s) return "Z";
  const parts = s.includes("@")
    ? s.split("@")[0].split(/[._\-+]/) 
    : s.split(/\s+/);
  const letters = parts.filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase());
  return letters.join("") || "Z";
}

function shortId(id = "") {
  return id ? id.slice(0, 8) : "";
}

function makeConversation({ id, name, email }) {
  const title = name?.trim() || email?.trim() || "Guest";
  return {
    id, 
    title, 
    email: email || "",
    name: name || "",
    lastMessage: "Say hi to get started",
    unread: 0,
  };
}


export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();

  
  const didInit = useRef(false);

 
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem("conversations");
    return saved ? JSON.parse(saved) : [];
  });


  const [messagesById, setMessagesById] = useState(() => {
    const saved = localStorage.getItem("messagesById");
    return saved ? JSON.parse(saved) : {};
  });


  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");


  const [activeCid, setActiveCid] = useState("");


  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);


  useEffect(() => {
    if (didInit.current) return;             
    didInit.current = true;                   

    const params = new URLSearchParams(location.search);
    const qCid = params.get("cid");
    const qEmail = params.get("email");
    const qName = params.get("name");

    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedName = localStorage.getItem("userName") || "";
    const storedCid = localStorage.getItem("conversationId") || "";

    const email = (qEmail || storedEmail || "").trim();
    const name = (qName || storedName || "").trim();

    if (email) localStorage.setItem("userEmail", email);
    if (name) localStorage.setItem("userName", name);

    const findByEmail = (list, e) => (e ? list.find((c) => c.email === e) : null);

    let cid = "";

    if (qCid) {
      
      cid = qCid;
      setConversations((prev) =>
        prev.some((c) => c.id === cid)
          ? prev
          : [makeConversation({ id: cid, name, email }), ...prev]
      );
      setMessagesById((prev) => (prev[cid] ? prev : { ...prev, [cid]: [greet()] }));
    } else if (email) {
      
      const existing = findByEmail(conversations, email) || findByEmail(JSON.parse(localStorage.getItem("conversations") || "[]"), email);
      if (existing) {
        cid = existing.id;
      } else {
        cid = uuidv4();
        setConversations((prev) => [makeConversation({ id: cid, name, email }), ...prev]);
        setMessagesById((prev) => ({ ...prev, [cid]: [greet()] }));
      }
    } else if (storedCid) {
     
      cid = storedCid;
      setConversations((prev) =>
        prev.some((c) => c.id === cid)
          ? prev
          : [makeConversation({ id: cid, name: "", email: "" }), ...prev]
      );
      setMessagesById((prev) => (prev[cid] ? prev : { ...prev, [cid]: [greet()] }));
    } else {
      
      cid = uuidv4();
      setConversations((prev) => [makeConversation({ id: cid, name: "", email: "" }), ...prev]);
      setMessagesById((prev) => ({ ...prev, [cid]: [greet()] }));
    }

    setActiveCid(cid);
    localStorage.setItem("conversationId", cid);
    setUserEmail(email);
    setUserName(name);
    inputRef.current?.focus();
    
  }, []); 

  
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem("messagesById", JSON.stringify(messagesById));
  }, [messagesById]);

  useEffect(() => {
    if (activeCid) localStorage.setItem("conversationId", activeCid);
  }, [activeCid]);

  const messages = messagesById[activeCid] || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeCid]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeCid]);

  const canSend = useMemo(() => draft.trim().length > 0 && !sending, [draft, sending]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !activeCid) return;

    setSending(true);


    const optimistic = {
      id: uuidv4(),
      author: "user",
      text,
      at: new Date().toLocaleTimeString(),
    };

    setMessagesById((prev) => ({
      ...prev,
      [activeCid]: [...(prev[activeCid] || []), optimistic],
    }));

  
    setConversations((prev) =>
      prev.map((c) => (c.id === activeCid ? { ...c, lastMessage: text } : c))
    );

    setDraft("");

    try {
      const reply = await sendMessagesToServer(text, activeCid);
      const botMsg =
        typeof reply === "string"
          ? { id: uuidv4(), author: "bot", text: reply, at: new Date().toLocaleTimeString() }
          : reply;

      setMessagesById((prev) => ({
        ...prev,
        [activeCid]: [...(prev[activeCid] || []), botMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeCid ? { ...c, lastMessage: botMsg.text || "Reply received" } : c
        )
      );
    } catch (e) {
      console.error("Send failed:", e);
      const errMsg = {
        id: uuidv4(),
        author: "system",
        text: "Sorry—couldn’t send. Please try again.",
        at: new Date().toLocaleTimeString(),
      };
      setMessagesById((prev) => ({
        ...prev,
        [activeCid]: [...(prev[activeCid] || []), errMsg],
      }));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleNewForIdentity() {
   
    const email = (userEmail || "").trim();
    const name = (userName || "").trim();

    const existing = email ? conversations.find((c) => c.email === email) : null;
    if (existing) {
      setActiveCid(existing.id);
      return;
    }

    const cid = uuidv4();
    const conv = makeConversation({ id: cid, name, email });
    setConversations((prev) => [conv, ...prev]);
    setMessagesById((prev) => ({ ...prev, [cid]: [greet()] }));
    setActiveCid(cid);
  }

  function handleSelectConversation(cid) {
    if (cid === activeCid) return;
    setActiveCid(cid);
    setConversations((prev) => prev.map((c) => (c.id === cid ? { ...c, unread: 0 } : c)));
  }

  const identityTitle = (userName || userEmail || "Guest").trim();
  const identityInitials = initials(identityTitle);

  return (
    <div className="fixed top-0 left-0 right-0 mx-auto min-h-screen max-w-7xl grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] border-x">
     
      <div>
        <aside className="hidden md:flex md:flex-col border-r">
          <div className="p-3 flex items-center gap-2">
            
           
            <div className="relative w-full">
              <input
                placeholder="Search chats (coming soon)…"
                type="text"
                className="h-9 w-full pl-8 border rounded"
                disabled
              />
              <Search className="h-4 w-4 pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <ul className="p-2 space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleSelectConversation(c.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left hover:bg-accent transition ${
                      activeCid === c.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt={c.title} />
                        <AvatarFallback className="text-xs">
                          {initials(c.title)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{c.title}</span>
                          {c.unread ? (
                            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold text-primary">
                              {c.unread}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {shortId(c.id)} • {c.lastMessage || "—"}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
              {conversations.length === 0 && (
                <li className="px-3 text-xs text-muted-foreground">No conversations yet.</li>
              )}
            </ul>
          </ScrollArea>
        </aside>
      </div>

      
      <section className="h-full border-l">
      
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">{identityInitials}</AvatarFallback>
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-medium">Zoe Support</div>
              <div className="text-xs text-muted-foreground">
                {identityTitle} • {activeCid ? shortId(activeCid) : ""}
              </div>
            </div>
          </div>

          <div>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Home"
            >
              <LogOut className="h-4 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Menu">
              <MoreVertical className="h-4 w-3" />
            </Button>
          </div>
        </div>

       
        <ScrollArea className="flex-1 h-[calc(100vh-150px)]">
          <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
            {(messagesById[activeCid] || []).map((m) => (
              <MessageBubble key={m.id} author={m.author} at={m.at}>
                {m.text}
              </MessageBubble>
            ))}
          </div>
          <div ref={endRef} />
        </ScrollArea>

        
        <div className="border-t p-3">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 rounded-3xl"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
            />
            <Button disabled={!canSend} onClick={handleSend} className="rounded-2xl px-5">
              {sending ? <Spinner /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
