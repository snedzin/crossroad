
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useDealStore } from "@/stores/dealStore";
import { useUserStore } from "@/stores/userStore";
import { formatDate, getInitials } from "@/lib/utils";
import { Message } from "@/lib/types";

interface ChatDialogProps {
  dealId: string;
  recipientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatDialog = ({ dealId, recipientId, open, onOpenChange }: ChatDialogProps) => {
  const { toast } = useToast();
  const { getMessagesForDeal, addMessage } = useDealStore();
  const { getUserById, currentUser } = useUserStore();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = getMessagesForDeal(dealId);
  const recipient = getUserById(recipientId);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !recipient?.peerId) return;
    
    setLoading(true);
    try {
      await addMessage(dealId, message, recipient.peerId);
      setMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-board-card text-gray-800 max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <span>{getInitials(recipient?.name || "Unknown")}</span>
            </Avatar>
            <span>Chat with {recipient?.name || "User"}</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4 my-2 border border-gray-200 rounded-md bg-gray-50">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 my-4">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg: Message) => {
                const isCurrentUser = currentUser?.peerId === msg.fromPeerId;
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-board-primary text-white rounded-tr-none' 
                          : 'bg-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatDate(msg.timestamp, true)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none"
            rows={2}
            disabled={loading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || loading}
            className="h-auto bg-board-primary hover:bg-indigo-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
