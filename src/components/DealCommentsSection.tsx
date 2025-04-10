
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDealStore } from "@/stores/dealStore";
import { useUserStore } from "@/stores/userStore";
import { formatDate, getInitials } from "@/lib/utils";
import { Message } from "@/lib/types";

interface DealCommentsSectionProps {
  dealId: string;
  recipientId: string;
}

const DealCommentsSection = ({ dealId, recipientId }: DealCommentsSectionProps) => {
  const { toast } = useToast();
  const { getMessagesForDeal, addMessage } = useDealStore();
  const { getUserById, currentUser } = useUserStore();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  
  const messages = getMessagesForDeal(dealId);
  const recipient = getUserById(recipientId);
  
  const handleAddComment = async () => {
    if (!comment.trim() || !recipient?.peerId) return;
    
    setLoading(true);
    try {
      await addMessage(dealId, comment, recipient.peerId);
      setComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added to the deal",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Failed to add comment",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
      <h3 className="font-semibold text-lg">Comments</h3>
      
      <ScrollArea className="h-[200px] w-full p-4 rounded-md bg-gray-50 border border-gray-200">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 my-4">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: Message) => {
              const commenter = getUserById(msg.fromPeerId === currentUser?.peerId 
                ? currentUser.id : recipientId);
              
              return (
                <div key={msg.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <span>{getInitials(commenter?.name || "Unknown")}</span>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{commenter?.name || "Unknown User"}</p>
                      <span className="text-xs text-gray-500">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm mt-1">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      
      <div className="space-y-2">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="resize-none"
          rows={3}
          disabled={loading}
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleAddComment}
            disabled={!comment.trim() || loading}
            className="bg-board-primary hover:bg-indigo-600"
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DealCommentsSection;
