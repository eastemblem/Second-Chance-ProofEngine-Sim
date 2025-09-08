import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WishlistForm } from "./wishlist-form";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Join ProofScaling Cohort</DialogTitle>
        </DialogHeader>
        <WishlistForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}