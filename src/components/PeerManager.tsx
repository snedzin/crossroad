
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { peerService } from "@/lib/peerService";
import { usePeerStore } from "@/stores/peerStore";
import { useUserStore } from "@/stores/userStore";
import { useListingStore } from "@/stores/listingStore";
import { useDealStore } from "@/stores/dealStore";
import { 
  MessageType, 
  HelloMessage, 
  ListingBroadcastMessage,
  UserInfoMessage,
  DealProposalMessage,
  ChatMessage,
  DealResponseMessage,
  PeerListMessage,
} from "@/lib/types";

// Hidden component that manages P2P connections and message handling
const PeerManager = () => {
  const { toast } = useToast();
  const { currentUser, addOrUpdateUser } = useUserStore();
  const { listings, addExternalListing } = useListingStore();
  const { deals, addExternalDeal, addExternalMessage } = useDealStore();
  
  // Set up message handlers when the component mounts
  useEffect(() => {
    // Handle hello messages
    peerService.addMessageHandler<HelloMessage>(MessageType.HELLO, (message, connection) => {
      console.log("Received hello from:", message.senderId);
      
      // Add the user to our store
      if (message.userData) {
        addOrUpdateUser(message.userData);
        
        // Toast notification
        toast({
          title: "New Peer Connected",
          description: `${message.userData.name || "Anonymous"} has connected`,
        });
        
        // If we have user data, send it back
        if (currentUser) {
          peerService.sendHello(message.senderId, currentUser);
          
          // Share our listings with the new peer
          listings.forEach(listing => {
            peerService.sendToPeer(message.senderId, {
              type: MessageType.LISTING_BROADCAST,
              senderId: peerService.getPeerId() || '',
              timestamp: Date.now(),
              messageId: `listing-sync-${listing.id}`,
              listing
            });
          });
          
          // Share our deals with the new peer that they should know about
          deals.forEach(deal => {
            // Only share deals where the new peer is involved
            if (deal.initiatorId === message.userData.id || deal.recipientId === message.userData.id) {
              peerService.sendToPeer(message.senderId, {
                type: MessageType.DEAL_PROPOSAL,
                senderId: peerService.getPeerId() || '',
                timestamp: Date.now(),
                messageId: `deal-sync-${deal.id}`,
                deal
              });
            }
          });
          
          // Share our known peers
          peerService.sharePeers(message.senderId);
        }
      }
    });
    
    // Handle listing broadcasts
    peerService.addMessageHandler<ListingBroadcastMessage>(
      MessageType.LISTING_BROADCAST, 
      (message) => {
        console.log("Received listing broadcast:", message.listing.title);
        addExternalListing(message.listing);
      }
    );
    
    // Handle user info updates
    peerService.addMessageHandler<UserInfoMessage>(
      MessageType.USER_INFO, 
      (message) => {
        console.log("Received user info:", message.user.name);
        addOrUpdateUser(message.user);
      }
    );
    
    // Handle deal proposals
    peerService.addMessageHandler<DealProposalMessage>(
      MessageType.DEAL_PROPOSAL, 
      (message) => {
        console.log("Received deal proposal:", message.deal.id);
        addExternalDeal(message.deal);
        
        toast({
          title: "New Deal Proposal",
          description: "You have received a new deal proposal",
        });
      }
    );
    
    // Handle chat messages
    peerService.addMessageHandler<ChatMessage>(
      MessageType.CHAT_MESSAGE, 
      (message) => {
        console.log("Received chat message for deal:", message.dealId);
        addExternalMessage(message.message);
      }
    );
    
    // Handle deal responses
    peerService.addMessageHandler<DealResponseMessage>(
      MessageType.DEAL_RESPONSE, 
      (message) => {
        console.log("Received deal response:", message.dealId);
        
        toast({
          title: "Deal Update",
          description: message.accepted 
            ? "Your deal proposal has been accepted" 
            : "Your deal proposal has been declined",
          variant: message.accepted ? "default" : "destructive",
        });
      }
    );
    
    // Handle peer list messages
    peerService.addMessageHandler<PeerListMessage>(
      MessageType.PEER_LIST,
      (message) => {
        console.log("Received peer list with", message.peers.length, "peers");
        
        // Try to connect to each peer in the list
        if (currentUser) {
          message.peers.forEach(peerId => {
            peerService.connectToPeer(peerId);
          });
        }
      }
    );
    
    // Clean up on component unmount
    return () => {
      // No need to remove handlers as the component is never unmounted
    };
  }, [toast, addOrUpdateUser, addExternalListing, addExternalDeal, addExternalMessage, currentUser, listings, deals]);
  
  return null; // This component doesn't render anything
};

export default PeerManager;
