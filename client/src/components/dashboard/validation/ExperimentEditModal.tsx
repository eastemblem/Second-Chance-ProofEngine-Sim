import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Circle } from "lucide-react";

interface ExperimentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  experimentName: string;
  experimentId: string;
  isCompleted: boolean;
  fieldName: string;
  fieldLabel: string;
  fieldValue: string;
  fieldType?: "text" | "select";
  selectOptions?: { value: string; label: string }[];
  onSave: (value: string) => void;
}

export function ExperimentEditModal({
  isOpen,
  onClose,
  experimentName,
  experimentId,
  isCompleted,
  fieldName,
  fieldLabel,
  fieldValue,
  fieldType = "text",
  selectOptions = [],
  onSave,
}: ExperimentEditModalProps) {
  const [value, setValue] = useState(fieldValue);

  // Update value when fieldValue changes
  useEffect(() => {
    setValue(fieldValue);
  }, [fieldValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleCancel = () => {
    setValue(fieldValue); // Reset to original value
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {experimentName}
          </DialogTitle>
          
          {/* Current State */}
          <div className="flex items-center gap-2 mt-3">
            {isCompleted ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-400 text-sm font-medium">Completed</span>
              </>
            ) : (
              <>
                <Circle className="h-5 w-5 text-gray-600" />
                <span className="text-gray-400 text-sm font-medium">In Progress</span>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Field Label */}
          <label className="text-sm font-semibold text-gray-300 mb-3 block">
            {fieldLabel}
          </label>

          {/* Input Field */}
          {fieldType === "text" ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${fieldLabel.toLowerCase()}...`}
              className="bg-gray-800 border-gray-700 text-white min-h-[150px] resize-none focus:ring-purple-500 focus:border-purple-500"
              data-testid={`input-${fieldName}`}
            />
          ) : (
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-purple-500">
                <SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {selectOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Experiment ID */}
          <p className="text-xs text-gray-500 mt-3">
            Experiment ID: {experimentId}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="button-save"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
