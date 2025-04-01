
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useListingStore } from "@/stores/listingStore";
import { ListingCategory } from "@/lib/types";
import { fileToBase64, validateListing } from "@/lib/utils";

interface CreateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateListingDialog = ({ open, onOpenChange }: CreateListingDialogProps) => {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<ListingCategory>(ListingCategory.OTHER);
  const [price, setPrice] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { createListing } = useListingStore();
  const { toast } = useToast();
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }
      
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const listingData = {
      title,
      description,
      category,
      price: price.trim() ? price : undefined,
      location: location.trim() ? location : undefined,
      tags: tags.trim() ? tags.split(',').map(tag => tag.trim()) : [],
      images,
    };
    
    const validationError = validateListing(listingData);
    
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createListing(listingData);
      
      toast({
        title: "Listing Created",
        description: "Your listing has been created and shared with the network.",
      });
      
      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setCategory(ListingCategory.OTHER);
      setPrice("");
      setLocation("");
      setTags("");
      setImages([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-board-card text-gray-800 max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Listing</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you listing?"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your listing..."
              className="min-h-[100px]"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(val: ListingCategory) => setCategory(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ListingCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. $100"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where is this listing available?"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. furniture, antique, wooden"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images">Images (optional)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-board-primary hover:bg-indigo-600"
            >
              {isSubmitting ? "Creating..." : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingDialog;
