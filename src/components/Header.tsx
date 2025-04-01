
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Menu, Plus, MessageCircle } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { usePeerStore } from "@/stores/peerStore";
import { useListingStore } from "@/stores/listingStore";
import UserProfileDialog from "./UserProfileDialog";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  onCreateClick: () => void;
}

const Header = ({ onMenuClick, onCreateClick }: HeaderProps) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [profileOpen, setProfileOpen] = React.useState(false);
  
  const { currentUser } = useUserStore();
  const { myPeerId, connectedPeers } = usePeerStore();
  const { setFilter } = useListingStore();

  const peerCount = connectedPeers.size;
  const userName = currentUser?.name || "Anonymous";

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ search: searchTerm });
  };

  return (
    <header className="sticky top-0 z-10 bg-board-bg border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-bold text-white hidden md:block">P2P Bulletin Board</h1>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search listings..."
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </form>

        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
            <div className={`h-2 w-2 rounded-full mr-1.5 ${peerCount > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span>{peerCount} peer{peerCount !== 1 ? 's' : ''}</span>
          </div>
          
          <Button 
            onClick={onCreateClick}
            className="bg-board-primary hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-1" /> Post
          </Button>
          
          <Avatar 
            className="cursor-pointer bg-board-secondary hover:opacity-90 transition-opacity"
            onClick={() => setProfileOpen(true)}
          >
            <span>{getInitials(userName)}</span>
          </Avatar>
        </div>
      </div>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

export default Header;
